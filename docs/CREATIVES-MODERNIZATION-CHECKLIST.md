# Creatives V2 - Technical Modernization Checklist

> **Purpose:** Detailed technical checklist for modernizing the Creatives system
> **Format:** Each item has file path, line numbers, and exact changes needed

---

## 🔧 Phase 1: Setup & Infrastructure

### **1.1 Feature Toggle**

**File:** `src/config/features.ts` (NEW FILE)
```typescript
/**
 * Feature flags for gradual rollout
 */
export const FEATURES = {
  /** Enable Creatives V2 (new modernized system) */
  CREATIVES_V2_ENABLED: import.meta.env.VITE_CREATIVES_V2_ENABLED === 'true',

  /** Show both V1 and V2 in navigation (admin only) */
  CREATIVES_DUAL_NAVIGATION: import.meta.env.VITE_CREATIVES_DUAL_NAV === 'true',
};
```

**File:** `.env.local`
```bash
# Add these flags
VITE_CREATIVES_V2_ENABLED=true
VITE_CREATIVES_DUAL_NAV=true
```

**File:** `.env.example`
```bash
# Add documentation
VITE_CREATIVES_V2_ENABLED=false # Enable new Creatives V2 system
VITE_CREATIVES_DUAL_NAV=false # Show both old and new systems in nav
```

**Checklist:**
- [ ] Create `src/config/features.ts`
- [ ] Add flags to `.env.local`
- [ ] Add flags to `.env.example`
- [ ] Document flags in `CLAUDE.md`

---

### **1.2 Dual Routes Setup**

**File:** `src/App.tsx` (modify existing routes)

**Current (lines ~62-101):**
```typescript
// OLD ROUTE
<Route path="/creatives" element={<Creatives />} />
```

**NEW (add these routes):**
```typescript
import { FEATURES } from '@/config/features';

// OLD SYSTEM (keep for now)
<Route path="/creatives" element={<Creatives />} />

// NEW SYSTEM (v2)
{FEATURES.CREATIVES_V2_ENABLED && (
  <>
    <Route path="/creatives-v2" element={<CreativesV2 />} />
    <Route path="/creatives-v2/new" element={<CreativesV2New />} />
    <Route path="/creatives-v2/:id" element={<CreativesV2Edit />} />
  </>
)}
```

**Checklist:**
- [ ] Import FEATURES config
- [ ] Add conditional routes for V2
- [ ] Keep old routes intact
- [ ] Test route navigation

---

### **1.3 Navigation Update**

**File:** `src/components/Header.tsx` (modify navigation)

**Find this section (lines with navigation items):**
```typescript
// Look for NavigationItem components
```

**ADD after existing Creatives link:**
```typescript
{FEATURES.CREATIVES_DUAL_NAVIGATION && userRole !== 'client' && (
  <NavigationItem to="/creatives-v2">
    <span className="flex items-center gap-2">
      Criativos V2
      <span className="text-xs bg-orange-hero text-white px-2 py-0.5 rounded">BETA</span>
    </span>
  </NavigationItem>
)}
```

**Checklist:**
- [ ] Import FEATURES config
- [ ] Import useUserRole hook
- [ ] Add conditional V2 navigation
- [ ] Add beta badge
- [ ] Test with admin/staff/client roles

---

### **1.4 Directory Structure**

**Create new directories:**
```bash
mkdir -p src/pages/CreativesV2
mkdir -p src/components/creatives
mkdir -p src/hooks/creatives
```

**New Files to Create:**

```
src/pages/CreativesV2/
  ├── CreativesV2.tsx              # Panel list view
  ├── CreativesV2New.tsx           # Creation flow
  └── CreativesV2Edit.tsx          # Edit existing creative

src/components/creatives/
  ├── CreativesPanelList.tsx       # List/grid view (like DecksPanelList)
  ├── CreativeCard.tsx             # Card component (like DeckCard)
  ├── CreativeConfigForm.tsx       # Step 1: Basic info
  ├── CreativeMediaUpload.tsx      # Step 2: File uploads
  ├── CreativeContentForm.tsx      # Step 3: Texts/CTAs
  ├── CreativeReview.tsx           # Step 4: Review & submit
  ├── CreativeFilters.tsx          # Filter bar (type, platform, status)
  └── CreativeShareModal.tsx       # Future: sharing feature

src/hooks/creatives/
  ├── useMyCreatives.ts            # Fetch user creatives with RLS
  ├── useCreativeGeneration.ts     # Submission workflow
  ├── useCreativeDraft.ts          # Draft management
  └── useCreativeValidation.ts     # Validation logic
```

**Checklist:**
- [ ] Create directory structure
- [ ] Create placeholder files
- [ ] Add TypeScript types
- [ ] Export from index files

---

## 🗄️ Phase 2: Database Migration

### **2.1 Create New Tables Migration**

**File:** `supabase/migrations/YYYYMMDDHHMMSS_creatives_v2_modern_tables.sql`

```sql
-- =====================================================
-- CREATIVES V2 - MODERN TABLES WITH UUID REFERENCES
-- =====================================================

-- Drop old enum if exists and create new one
DROP TYPE IF EXISTS creative_status CASCADE;
CREATE TYPE creative_status AS ENUM ('draft', 'pending', 'published', 'rejected');

-- =====================================================
-- SUBMISSIONS TABLE (modernized)
-- =====================================================
CREATE TABLE j_hub_creative_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  account_id UUID NOT NULL, -- ✅ NEW: UUID reference to j_hub_notion_db_accounts
  user_id UUID NOT NULL REFERENCES j_hub_users(id),

  -- Status & Type
  status creative_status DEFAULT 'draft',
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
  creative_type TEXT NOT NULL CHECK (creative_type IN ('single', 'carousel', 'existing-post')),
  campaign_objective TEXT NOT NULL,

  -- Data
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  validation_overrides JSONB,

  -- Draft system
  is_draft BOOLEAN DEFAULT true,
  draft_data JSONB,

  -- Period (optional)
  date_range_start DATE,
  date_range_end DATE,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  -- Notion integration
  notion_page_id TEXT,
  notion_creative_id TEXT
);

-- =====================================================
-- FILES TABLE (modernized)
-- =====================================================
CREATE TABLE j_hub_creative_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES j_hub_creative_submissions(id) ON DELETE CASCADE,

  -- File info
  variation_index INT NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size BIGINT NOT NULL,
  format TEXT NOT NULL CHECK (format IN (
    'square', 'vertical', 'horizontal',
    'carousel-1:1', 'carousel-4:5'
  )),

  -- Storage
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- VARIATIONS TABLE (modernized)
-- =====================================================
CREATE TABLE j_hub_creative_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES j_hub_creative_submissions(id) ON DELETE CASCADE,

  -- Variation info
  variation_index INT NOT NULL,
  notion_page_id TEXT,
  creative_id TEXT,
  full_creative_name TEXT NOT NULL,
  cta TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_creative_submissions_account ON j_hub_creative_submissions(account_id);
CREATE INDEX idx_creative_submissions_user ON j_hub_creative_submissions(user_id);
CREATE INDEX idx_creative_submissions_status ON j_hub_creative_submissions(status);
CREATE INDEX idx_creative_submissions_created ON j_hub_creative_submissions(created_at DESC);
CREATE INDEX idx_creative_files_submission ON j_hub_creative_files(submission_id);
CREATE INDEX idx_creative_variations_submission ON j_hub_creative_variations(submission_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE j_hub_creative_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE j_hub_creative_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE j_hub_creative_variations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUBMISSIONS POLICIES
-- =====================================================

-- Users can INSERT their own submissions
CREATE POLICY "Users create own submissions"
ON j_hub_creative_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can SELECT own submissions
CREATE POLICY "Users view own submissions"
ON j_hub_creative_submissions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can UPDATE own submissions
CREATE POLICY "Users update own submissions"
ON j_hub_creative_submissions
FOR UPDATE
USING (auth.uid() = user_id);

-- Admin can SELECT all submissions
CREATE POLICY "Admin view all submissions"
ON j_hub_creative_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM j_hub_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Staff can SELECT submissions from managed accounts
CREATE POLICY "Staff view managed submissions"
ON j_hub_creative_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM j_hub_users u
    WHERE u.id = auth.uid()
    AND u.role = 'staff'
    AND EXISTS (
      SELECT 1 FROM j_hub_notion_db_accounts a
      WHERE a.id = account_id
      AND (
        u.email = ANY(string_to_array(a.gestor_email, ', '))
        OR u.email = ANY(string_to_array(a.atendimento_email, ', '))
      )
    )
  )
);

-- =====================================================
-- FILES POLICIES
-- =====================================================

-- Users can view files from their submissions
CREATE POLICY "Users view own files"
ON j_hub_creative_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM j_hub_creative_submissions
    WHERE id = submission_id AND user_id = auth.uid()
  )
);

-- Users can insert files to their submissions
CREATE POLICY "Users create own files"
ON j_hub_creative_files
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM j_hub_creative_submissions
    WHERE id = submission_id AND user_id = auth.uid()
  )
);

-- Admin can view all files
CREATE POLICY "Admin view all files"
ON j_hub_creative_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM j_hub_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- VARIATIONS POLICIES
-- =====================================================

-- Users can view variations from their submissions
CREATE POLICY "Users view own variations"
ON j_hub_creative_variations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM j_hub_creative_submissions
    WHERE id = submission_id AND user_id = auth.uid()
  )
);

-- Service role can manage variations (for edge functions)
CREATE POLICY "Service role manage variations"
ON j_hub_creative_variations
FOR ALL
USING (auth.role() = 'service_role');

-- Admin can view all variations
CREATE POLICY "Admin view all variations"
ON j_hub_creative_variations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM j_hub_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_creative_submissions_updated_at
BEFORE UPDATE ON j_hub_creative_submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creative_variations_updated_at
BEFORE UPDATE ON j_hub_creative_variations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE j_hub_creative_submissions IS 'Modern creative submissions table with UUID references';
COMMENT ON TABLE j_hub_creative_files IS 'Files attached to creative submissions';
COMMENT ON TABLE j_hub_creative_variations IS 'Published variations in Notion';
COMMENT ON COLUMN j_hub_creative_submissions.account_id IS 'UUID reference to j_hub_notion_db_accounts.id';
COMMENT ON COLUMN j_hub_creative_submissions.payload IS 'Complete form data (texts, objectives, etc)';
COMMENT ON COLUMN j_hub_creative_submissions.draft_data IS 'Auto-saved draft state (for recovery)';
COMMENT ON COLUMN j_hub_creative_submissions.validation_overrides IS 'Warnings that were bypassed by user';
```

**Checklist:**
- [ ] Create migration file
- [ ] Test migration locally (`npx supabase db reset`)
- [ ] Verify all indexes created
- [ ] Test RLS policies with different roles
- [ ] Check foreign key constraints
- [ ] Verify triggers work

---

### **2.2 Data Migration Script**

**File:** `supabase/migrations/YYYYMMDDHHMMSS_migrate_creatives_v1_to_v2.sql`

```sql
-- =====================================================
-- MIGRATE OLD CREATIVES DATA TO V2 TABLES
-- =====================================================

-- ⚠️ IMPORTANT: Run this AFTER creating V2 tables
-- ⚠️ This migration is SAFE - does not delete old data

-- =====================================================
-- MIGRATE SUBMISSIONS
-- =====================================================

INSERT INTO j_hub_creative_submissions (
  id,
  account_id,
  user_id,
  status,
  platform,
  creative_type,
  campaign_objective,
  payload,
  result,
  validation_overrides,
  is_draft,
  created_at,
  updated_at,
  published_at,
  notion_page_id
)
SELECT
  old_s.id,
  -- ✅ CRITICAL: Resolve UUID from notion_id
  acc.id AS account_id,
  old_s.user_id,
  old_s.status::creative_status,
  old_s.platform,
  old_s.creative_type,
  old_s.campaign_objective,
  old_s.payload,
  old_s.result,
  old_s.validation_overrides,
  -- Determine draft status
  CASE
    WHEN old_s.status = 'pending' THEN false
    WHEN old_s.status = 'published' THEN false
    ELSE true
  END AS is_draft,
  old_s.created_at,
  old_s.updated_at,
  old_s.processed_at AS published_at,
  -- Extract Notion page ID from result (if exists)
  (old_s.result->>'notion_page_id')::TEXT AS notion_page_id
FROM j_ads_creative_submissions old_s
LEFT JOIN j_hub_notion_db_accounts acc ON acc.notion_id = old_s.client
WHERE acc.id IS NOT NULL -- Only migrate records with valid account mapping
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- MIGRATE FILES
-- =====================================================

INSERT INTO j_hub_creative_files (
  id,
  submission_id,
  variation_index,
  name,
  type,
  size,
  format,
  storage_path,
  public_url,
  created_at
)
SELECT
  old_f.id,
  old_f.submission_id,
  old_f.variation_index,
  old_f.name,
  old_f.type,
  old_f.size,
  old_f.format,
  old_f.storage_path,
  old_f.public_url,
  old_f.created_at
FROM j_ads_creative_files old_f
WHERE EXISTS (
  SELECT 1 FROM j_hub_creative_submissions new_s
  WHERE new_s.id = old_f.submission_id
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- MIGRATE VARIATIONS
-- =====================================================

INSERT INTO j_hub_creative_variations (
  id,
  submission_id,
  variation_index,
  notion_page_id,
  creative_id,
  full_creative_name,
  cta,
  created_at,
  updated_at
)
SELECT
  old_v.id,
  old_v.submission_id,
  old_v.variation_index,
  old_v.notion_page_id,
  old_v.creative_id,
  old_v.full_creative_name,
  old_v.cta,
  old_v.created_at,
  old_v.updated_at
FROM j_ads_creative_variations old_v
WHERE EXISTS (
  SELECT 1 FROM j_hub_creative_submissions new_s
  WHERE new_s.id = old_v.submission_id
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VALIDATION REPORT
-- =====================================================

-- Log migration statistics
DO $$
DECLARE
  old_submissions_count INT;
  new_submissions_count INT;
  unmigrated_count INT;
BEGIN
  SELECT COUNT(*) INTO old_submissions_count FROM j_ads_creative_submissions;
  SELECT COUNT(*) INTO new_submissions_count FROM j_hub_creative_submissions;
  unmigrated_count := old_submissions_count - new_submissions_count;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'CREATIVES V2 MIGRATION REPORT';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Old submissions: %', old_submissions_count;
  RAISE NOTICE 'Migrated submissions: %', new_submissions_count;
  RAISE NOTICE 'Unmigrated: %', unmigrated_count;
  RAISE NOTICE '===========================================';

  IF unmigrated_count > 0 THEN
    RAISE WARNING 'Some submissions could not be migrated (likely missing account mapping)';
  END IF;
END $$;
```

**Checklist:**
- [ ] Create migration script
- [ ] Test locally with sample data
- [ ] Verify all records migrated
- [ ] Check foreign key relationships
- [ ] Review migration report output
- [ ] Document unmigrated records (if any)

---

## 🎨 Phase 3: Frontend Modernization

### **3.1 Create Panel List Page**

**File:** `src/pages/CreativesV2/CreativesV2.tsx` (NEW)

```typescript
/**
 * CreativesV2 - Modern panel view for creative submissions
 *
 * Follows pattern from Decks.tsx
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { JumperBackground } from "@/components/ui/jumper-background";
import { CreativesPanelList } from "@/components/creatives/CreativesPanelList";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function CreativesV2() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (!roleLoading && !currentUser) {
      navigate("/login");
    }
  }, [currentUser, roleLoading, navigate]);

  // Loading state
  if (roleLoading) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </main>
      </JumperBackground>
    );
  }

  // Error state
  if (error) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
      </JumperBackground>
    );
  }

  // User role not loaded
  if (!userRole) {
    return (
      <JumperBackground overlay={false}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível determinar suas permissões.
            </AlertDescription>
          </Alert>
        </main>
      </JumperBackground>
    );
  }

  return (
    <JumperBackground overlay={false}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreativesPanelList userRole={userRole} />
      </main>
    </JumperBackground>
  );
}
```

**Checklist:**
- [ ] Create file
- [ ] Add proper imports
- [ ] Handle auth/loading/error states
- [ ] Test with all roles
- [ ] Add proper TypeScript types

---

### **3.2 Create Creation Flow Page**

**File:** `src/pages/CreativesV2/CreativesV2New.tsx` (NEW)

```typescript
/**
 * CreativesV2New - Create new creative submission
 *
 * Multi-step flow:
 * 1. Select account & configure basics
 * 2. Upload media files
 * 3. Add texts/CTAs
 * 4. Review & submit
 *
 * Follows pattern from OptimizationNew.tsx
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMyNotionAccounts } from "@/hooks/useMyNotionAccounts";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { useCreativeDraft } from "@/hooks/creatives/useCreativeDraft";
import Header from "@/components/Header";
import { JumperBackground } from "@/components/ui/jumper-background";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { JumperButton } from "@/components/ui/jumper-button";
import { PrioritizedAccountSelect } from "@/components/shared/PrioritizedAccountSelect";
import { CreativeConfigForm } from "@/components/creatives/CreativeConfigForm";
import { CreativeMediaUpload } from "@/components/creatives/CreativeMediaUpload";
import { CreativeContentForm } from "@/components/creatives/CreativeContentForm";
import { CreativeReview } from "@/components/creatives/CreativeReview";
import {
  AlertCircle,
  ChevronRight,
  Home,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CreativesV2New() {
  const navigate = useNavigate();
  const { accounts, loading: accountsLoading, error: accountsError } = useMyNotionAccounts();
  const { userRole } = useUserRole();
  const { currentUser } = useAuth();
  const { loadDraft, saveDraft, clearDraft, hasDraft, markDirty, startAutoSave } = useCreativeDraft();

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [platform, setPlatform] = useState<"meta" | "google">("meta");
  const [creativeType, setCreativeType] = useState<"single" | "carousel" | "existing-post">("single");
  const [campaignObjective, setCampaignObjective] = useState<string>("");

  // UI state
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);

  // Check for existing draft on mount
  useEffect(() => {
    if (hasDraft()) {
      setShowDraftRecovery(true);
    }
  }, [hasDraft]);

  // Auto-save draft when form changes
  useEffect(() => {
    if (selectedAccountId) {
      markDirty();
      const draft = {
        accountId: selectedAccountId,
        platform,
        creativeType,
        campaignObjective,
        step: currentStep,
      };
      startAutoSave(draft);
    }
  }, [selectedAccountId, platform, creativeType, campaignObjective, currentStep, markDirty, startAutoSave]);

  const handleAccountChange = (accountId: string) => {
    // accountId is UUID from PrioritizedAccountSelect
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      // ✅ For j_hub_creative_submissions.account_id (UUID reference)
      setSelectedAccountId(account.id);
    }
  };

  const handleRecoverDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setSelectedAccountId(draft.accountId);
      setPlatform(draft.platform);
      setCreativeType(draft.creativeType);
      setCampaignObjective(draft.campaignObjective);
      setCurrentStep(draft.step || 1);
    }
    setShowDraftRecovery(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftRecovery(false);
  };

  const handleSubmitComplete = () => {
    clearDraft();
    navigate("/creatives-v2");
  };

  const canProceed = selectedAccountId && platform && creativeType && campaignObjective;

  // ... (loading and error states similar to OptimizationNew)

  return (
    <JumperBackground overlay={false}>
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
          <button
            onClick={() => navigate("/creatives-v2")}
            className="hover:text-foreground transition-colors"
          >
            Criativos V2
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Novo Criativo</span>
        </div>

        {/* Page Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[hsl(var(--orange-subtle))]">
              <Plus className="h-6 w-6 text-[hsl(var(--orange-hero))]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Novo Criativo
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Envie criativos para publicação nas plataformas de anúncios
              </p>
            </div>
          </div>
        </header>

        {/* Multi-step form components here */}
        {/* Step 1: CreativeConfigForm */}
        {/* Step 2: CreativeMediaUpload */}
        {/* Step 3: CreativeContentForm */}
        {/* Step 4: CreativeReview */}

        {/* Draft Recovery Modal */}
        <Dialog open={showDraftRecovery} onOpenChange={setShowDraftRecovery}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rascunho Encontrado</DialogTitle>
              <DialogDescription>
                Você tem um rascunho de criativo não finalizado. Deseja continuar de onde parou?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-4">
              <JumperButton variant="outline" onClick={handleDiscardDraft}>
                Descartar
              </JumperButton>
              <JumperButton onClick={handleRecoverDraft}>
                Continuar Rascunho
              </JumperButton>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </JumperBackground>
  );
}
```

**Checklist:**
- [ ] Create file
- [ ] Implement multi-step flow
- [ ] Add draft recovery
- [ ] Add auto-save
- [ ] Test with all creative types
- [ ] Add proper validation

---

### **3.3 Replace useNotionClients Hook**

**ALL files using `useNotionClients` need to be updated:**

**Files to modify:**
- `src/components/CreativeSystem.tsx:42`
- `src/components/steps/Step4.tsx`
- `src/components/dashboards/DashboardAccessControl.tsx`
- `src/components/dashboards/AccountSelectorModal.tsx`

**Search & Replace Pattern:**

**FIND:**
```typescript
const { clients, loading, error, isAdmin, userAccessibleAccounts } = useNotionClients();
```

**REPLACE WITH:**
```typescript
const { accounts, loading, error } = useMyNotionAccounts();
const { userRole } = useUserRole();
const isAdmin = userRole === 'admin';
```

**FIND (in JSX):**
```typescript
<Select>
  {clients.map(client => (
    <SelectItem key={client.id} value={client.id}>
      {client.name}
    </SelectItem>
  ))}
</Select>
```

**REPLACE WITH:**
```typescript
<PrioritizedAccountSelect
  accounts={accounts}
  loading={loading}
  value={selectedAccountId}
  onChange={setSelectedAccountId}
  userEmail={currentUser?.email}
  userRole={userRole}
  placeholder="Selecione uma conta"
/>
```

**Checklist:**
- [ ] Update CreativeSystem.tsx
- [ ] Update Step4.tsx
- [ ] Update DashboardAccessControl.tsx
- [ ] Update AccountSelectorModal.tsx
- [ ] Test account selection
- [ ] Test with all roles (admin/staff/client)

---

### **3.4 Add Zod Validation**

**File:** `src/schemas/creativeSchema.ts` (NEW)

```typescript
import { z } from "zod";

/**
 * Creative form validation schema
 */
export const creativeFormSchema = z.object({
  // Step 1: Basic Config
  account_id: z.string().uuid("Selecione uma conta válida"),
  platform: z.enum(["meta", "google"], {
    required_error: "Selecione uma plataforma",
  }),
  creative_type: z.enum(["single", "carousel", "existing-post"], {
    required_error: "Selecione um tipo de criativo",
  }),
  campaign_objective: z.string().min(1, "Selecione um objetivo"),

  // Step 2: Media (validated separately per type)
  media: z.object({
    files: z.array(z.any()).optional(),
    instagram_url: z.string().url().optional(),
  }).optional(),

  // Step 3: Content
  titles: z.array(z.string().max(255, "Título muito longo")).min(1, "Adicione pelo menos um título"),
  main_texts: z.array(z.string().max(500, "Texto muito longo")).min(1, "Adicione pelo menos um texto principal"),
  description: z.string().max(1000, "Descrição muito longa").optional(),
  cta: z.string().optional(),
  destination_url: z.string().url("URL inválida").optional(),
  observations: z.string().optional(),
});

export type CreativeFormValues = z.infer<typeof creativeFormSchema>;
```

**Checklist:**
- [ ] Create schema file
- [ ] Add all field validations
- [ ] Test with react-hook-form
- [ ] Add custom error messages
- [ ] Document schema structure

---

### **3.5 Replace Button with JumperButton**

**Files to update:** (search for `<Button` in creatives-related files)

**Pattern:**
```typescript
// ❌ OLD
import { Button } from "@/components/ui/button";
<Button variant="default" onClick={handleClick}>
  Submit
</Button>

// ✅ NEW
import { JumperButton } from "@/components/ui/jumper-button";
<JumperButton onClick={handleClick}>
  <Save className="h-4 w-4 mr-2" />
  Enviar Criativo
</JumperButton>
```

**Checklist:**
- [ ] Replace all Button imports
- [ ] Add icons to buttons
- [ ] Test button styles
- [ ] Verify disabled states
- [ ] Check loading states

---

## 🔌 Phase 4: Backend Modernization

### **4.1 Create New Edge Function: j_hub_creative_submit**

**File:** `supabase/functions/j_hub_creative_submit/index.ts` (NEW)

```typescript
/**
 * j_hub_creative_submit - Modern creative submission with permissions
 *
 * Replaces: j_ads_submit_ad
 *
 * Features:
 * - Permission checks via j_hub_user_accounts
 * - Resilience system (circuit breaker, retry, fallback)
 * - UUID-based references
 * - Structured error responses
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Import resilience utilities (keep existing system!)
import { resilientNotionCall, CircuitBreaker } from "../_shared/resilience-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // 3. Get user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Parse request body
    const body = await req.json();
    const { account_id, platform, creative_type, campaign_objective, payload } = body;

    // 5. Validate required fields
    if (!account_id || !platform || !creative_type || !campaign_objective) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Check account access via j_hub_user_accounts
    const { data: userAccountsData, error: accountsError } = await supabase.functions.invoke(
      "j_hub_user_accounts",
      { headers: { Authorization: authHeader } }
    );

    if (accountsError || !userAccountsData.success) {
      return new Response(
        JSON.stringify({ error: "Failed to verify account access" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Verify user has access to this account (by UUID)
    const hasAccess = userAccountsData.accounts.some((acc: any) => acc.id === account_id);
    if (!hasAccess && !userAccountsData.is_admin) {
      return new Response(
        JSON.stringify({ error: "Access denied to this account" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from("j_hub_creative_submissions")
      .insert({
        account_id, // ✅ UUID reference
        user_id: user.id,
        platform,
        creative_type,
        campaign_objective,
        payload,
        status: "pending",
        is_draft: false,
      })
      .select()
      .single();

    if (submissionError) {
      console.error("Submission error:", submissionError);
      return new Response(
        JSON.stringify({ error: "Failed to create submission" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 9. Publish to Notion with resilience system
    let notionResult = null;
    try {
      notionResult = await resilientNotionCall(
        () => publishCreativeToNotion(submission),
        "creative_submission",
        { fallback: true } // Enable fallback mode
      );
    } catch (notionError) {
      // Fallback: Save to queue for later retry
      console.error("Notion publish failed, using fallback:", notionError);
      await supabase.from("j_hub_creative_queue").insert({
        submission_id: submission.id,
        retry_count: 0,
        error: String(notionError),
      });
    }

    // 10. Update submission with result
    if (notionResult) {
      await supabase
        .from("j_hub_creative_submissions")
        .update({
          status: "published",
          result: notionResult,
          published_at: new Date().toISOString(),
        })
        .eq("id", submission.id);
    }

    // 11. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        submission_id: submission.id,
        status: notionResult ? "published" : "pending_notion_sync",
        notion_result: notionResult,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Publish creative to Notion
 * (Implementation from existing j_ads_submit_ad)
 */
async function publishCreativeToNotion(submission: any) {
  // TODO: Implement Notion API integration
  // This should use the existing logic from j_ads_submit_ad
  return { notion_page_id: "placeholder" };
}
```

**Checklist:**
- [ ] Create edge function file
- [ ] Add permission checks
- [ ] Integrate resilience system
- [ ] Add proper error handling
- [ ] Test with all roles
- [ ] Test Notion integration
- [ ] Test fallback mode
- [ ] Deploy function

---

### **4.2 Create Edge Function: j_hub_creative_list**

**File:** `supabase/functions/j_hub_creative_list/index.ts` (NEW)

```typescript
/**
 * j_hub_creative_list - List creatives with RLS filtering
 *
 * Features:
 * - Permission-based filtering
 * - Pagination support
 * - Search & filters
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create Supabase client with user context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    // 3. Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const accountId = url.searchParams.get("account_id");
    const status = url.searchParams.get("status");
    const platform = url.searchParams.get("platform");
    const search = url.searchParams.get("search");

    // 4. Build query with RLS (automatically filters by user permissions)
    let query = supabase
      .from("j_hub_creative_submissions")
      .select(`
        *,
        j_hub_notion_db_accounts!account_id (
          id,
          name,
          tier,
          status
        )
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply filters
    if (accountId) query = query.eq("account_id", accountId);
    if (status) query = query.eq("status", status);
    if (platform) query = query.eq("platform", platform);
    if (search) {
      query = query.or(`
        payload->>title.ilike.%${search}%,
        payload->>description.ilike.%${search}%
      `);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // 5. Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error("Query error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch creatives" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Return results
    return new Response(
      JSON.stringify({
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

**Checklist:**
- [ ] Create edge function file
- [ ] Add pagination logic
- [ ] Add search/filter support
- [ ] Test RLS filtering
- [ ] Test with different roles
- [ ] Deploy function

---

## ✅ Testing Checklist

### **Unit Tests**

- [ ] Test validation functions
- [ ] Test file upload utilities
- [ ] Test creative name generator
- [ ] Test resilience utilities

### **Integration Tests**

- [ ] Test form submission flow
- [ ] Test draft save/recover
- [ ] Test file rehydration
- [ ] Test account filtering

### **E2E Tests**

- [ ] Test complete creation flow (single)
- [ ] Test carousel upload
- [ ] Test existing post scraper
- [ ] Test permissions (admin/staff/client)
- [ ] Test error scenarios
- [ ] Test on mobile devices

### **Performance Tests**

- [ ] Test with large files (>10MB)
- [ ] Test with slow network (3G)
- [ ] Test concurrent uploads
- [ ] Measure bundle size

---

## 📚 Documentation Updates

### **Files to Update**

- [ ] `CLAUDE.md` - Add Creatives V2 section
- [ ] `ARCHITECTURE.md` - Document new tables and patterns
- [ ] `CHANGELOG.md` - Log modernization session
- [ ] `README.md` - Update feature list

### **New Documentation**

- [ ] Create user guide for new UI
- [ ] Document API changes for edge functions
- [ ] Create migration guide (V1 → V2)
- [ ] Document rollback procedure

---

**Last Updated:** 2024-11-07
**Status:** 🚧 Draft
**Progress:** 0% Complete
