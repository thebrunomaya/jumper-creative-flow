# Creatives System - Modernization Strategy

> **Created:** 2024-11-07
> **Status:** 🚧 Planning
> **Goal:** Isolate and modernize the Creatives system to match current app standards

---

## 📊 Current State Analysis

### **Problems Identified**

**🔴 Critical Issues:**
1. **Monolithic Component** - CreativeSystem.tsx has 900+ lines (should be split)
2. **Deprecated Hook** - `useNotionClients` duplicates logic from `useMyNotionAccounts`
3. **Old Edge Functions** - Still reference deprecated tables (notion_managers)
4. **Inconsistent Naming** - Mix of `j_ads_*` and modern `j_hub_*` prefixes
5. **No Account Standardization** - Doesn't use `PrioritizedAccountSelect` component

**🟡 Pattern Inconsistencies:**
1. **No useUserRole** - Uses direct RPC calls instead of centralized hook
2. **No JumperButton** - Uses vanilla shadcn Button
3. **No Breadcrumbs** - Missing navigation context
4. **Old Form Pattern** - No Zod validation, manual error handling
5. **Direct RPC Calls** - Bypasses edge function permissions (security risk!)

**🟢 What Works (Keep):**
1. ✅ **Resilience System** - Circuit breaker, retry, fallback (excellent!)
2. ✅ **File Upload System** - Storage integration with rehydration
3. ✅ **Draft System** - Auto-save with sessionStorage
4. ✅ **Multi-step Wizard** - Step 1-4 flow is intuitive
5. ✅ **Validation System** - Warnings vs blockers pattern

---

## 🎯 Modern Patterns (Target State)

Based on Decks and Optimization systems:

### **Architecture Standards**

**Hooks:**
- ✅ `useMyNotionAccounts` - Centralized account access with permissions
- ✅ `useUserRole` - Centralized role checking
- ✅ `useDraftManager` - Auto-save with localStorage
- ✅ Custom form hooks with validation

**Components:**
- ✅ `PrioritizedAccountSelect` - Standard account selector
- ✅ `JumperButton` - Branded button component
- ✅ `JumperBackground` - Standard page background
- ✅ Breadcrumbs with navigation
- ✅ Dialog/Modal from shadcn/ui
- ✅ Tabs for multi-section forms

**Validation:**
- ✅ Zod schemas for type safety
- ✅ react-hook-form with zodResolver
- ✅ Inline error messages

**Database:**
- ✅ Modern tables use UUID for `id`
- ✅ Prefix `j_hub_*` for hub tables
- ✅ Edge Functions handle ALL permission logic
- ✅ RLS policies for data isolation

**Edge Functions:**
- ✅ Prefix `j_hub_*` for standardization
- ✅ JWT verification
- ✅ Permission checks via `j_hub_user_accounts`
- ✅ Structured error responses

---

## 🛠️ Isolation Strategy

### **Phase 1: Create Isolated Environment (Week 1)**

**Branch Strategy:**
```bash
# Create feature branch from current claude/creative-section-feature-...
git checkout -b claude/creatives-v2-modernization-[SESSION_ID]
```

**Feature Toggle:**
```typescript
// src/config/features.ts
export const FEATURES = {
  CREATIVES_V2_ENABLED: import.meta.env.VITE_CREATIVES_V2_ENABLED === 'true'
};
```

**Dual Routes (temporary):**
- `/creatives` - OLD system (production)
- `/creatives-v2` - NEW system (development)
- `/creatives-v2/new` - NEW creation flow

**Header Navigation Update:**
```typescript
// Show both during development (admin/staff only)
{FEATURES.CREATIVES_V2_ENABLED && (
  <NavigationItem to="/creatives-v2">Criativos V2 (Beta)</NavigationItem>
)}
<NavigationItem to="/creatives">Criativos</NavigationItem>
```

### **Phase 2: Database Migration (Week 2)**

**New Tables (j_hub_* prefix):**

```sql
-- New standardized submissions table
CREATE TABLE j_hub_creative_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES j_hub_notion_db_accounts(id), -- ✅ UUID reference
  user_id UUID NOT NULL REFERENCES j_hub_users(id),
  status TEXT NOT NULL DEFAULT 'draft',
  platform TEXT NOT NULL, -- 'meta' | 'google'
  creative_type TEXT NOT NULL, -- 'single' | 'carousel' | 'existing-post'
  campaign_objective TEXT NOT NULL,
  payload JSONB NOT NULL,
  result JSONB,
  date_range_start DATE,
  date_range_end DATE,
  is_draft BOOLEAN DEFAULT true,
  draft_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- New files table with UUID references
CREATE TABLE j_hub_creative_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES j_hub_creative_submissions(id) ON DELETE CASCADE,
  variation_index INT NOT NULL,
  name TEXT,
  type TEXT,
  size INT,
  format TEXT,
  storage_path TEXT,
  public_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- New variations table
CREATE TABLE j_hub_creative_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES j_hub_creative_submissions(id) ON DELETE CASCADE,
  variation_index INT NOT NULL,
  notion_page_id TEXT,
  creative_id TEXT,
  full_creative_name TEXT,
  cta TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
```sql
-- Users can only access their own submissions
CREATE POLICY "Users manage own submissions"
ON j_hub_creative_submissions
FOR ALL
USING (auth.uid() = user_id);

-- Admin/Staff can view all
CREATE POLICY "Admin view all submissions"
ON j_hub_creative_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM j_hub_users
    WHERE id = auth.uid()
    AND role IN ('admin', 'staff')
  )
);
```

**Data Migration:**
```sql
-- Migrate old submissions to new table
INSERT INTO j_hub_creative_submissions (
  id, account_id, user_id, status, platform, creative_type,
  campaign_objective, payload, result, created_at, updated_at
)
SELECT
  s.id,
  a.id AS account_id, -- ✅ Resolve UUID from notion_id
  s.user_id,
  s.status,
  s.platform,
  s.creative_type,
  s.campaign_objective,
  s.payload,
  s.result,
  s.created_at,
  s.updated_at
FROM j_ads_creative_submissions s
LEFT JOIN j_hub_notion_db_accounts a ON a.notion_id = s.client;
```

### **Phase 3: Modernize Components (Week 3-4)**

**New Component Structure:**

```
src/pages/
  ├── Creatives.tsx (old - keep for now)
  └── CreativesV2/
      ├── CreativesV2.tsx (panel list)
      ├── CreativesV2New.tsx (creation flow)
      └── CreativesV2Edit.tsx (edit existing)

src/components/creatives/
  ├── CreativeConfigForm.tsx (Step 1 - Basic Info)
  ├── CreativeMediaUpload.tsx (Step 2 - Files)
  ├── CreativeContentForm.tsx (Step 3 - Texts)
  ├── CreativeReview.tsx (Step 4 - Review)
  ├── CreativeCard.tsx (panel view card)
  └── CreativeShareModal.tsx (future: sharing)

src/hooks/
  ├── useMyCreatives.ts (fetch user creatives with RLS)
  ├── useCreativeGeneration.ts (submission workflow)
  └── useCreativeDraft.ts (draft management)
```

**Key Modernizations:**

1. **Replace useNotionClients:**
```typescript
// ❌ OLD
const { clients, loading, isAdmin } = useNotionClients();

// ✅ NEW
const { accounts, loading } = useMyNotionAccounts();
const { userRole } = useUserRole();
const isAdmin = userRole === 'admin';
```

2. **Use PrioritizedAccountSelect:**
```typescript
// ❌ OLD
<Select onValueChange={handleAccountChange}>
  {clients.map(client => (
    <SelectItem value={client.id}>{client.name}</SelectItem>
  ))}
</Select>

// ✅ NEW
<PrioritizedAccountSelect
  accounts={accounts}
  loading={loading}
  value={selectedAccountId}
  onChange={handleAccountChange}
  userEmail={currentUser?.email}
  userRole={userRole}
/>
```

3. **Add Zod Validation:**
```typescript
const creativeFormSchema = z.object({
  account_id: z.string().uuid("Selecione uma conta"),
  platform: z.enum(["meta", "google"]),
  creative_type: z.enum(["single", "carousel", "existing-post"]),
  campaign_objective: z.string().min(1),
  // ... more fields
});
```

4. **Modernize UI Components:**
```typescript
// ❌ OLD
<Button onClick={handleSubmit}>Enviar</Button>

// ✅ NEW
<JumperButton onClick={handleSubmit}>
  <Save className="h-4 w-4 mr-2" />
  Enviar Criativo
</JumperButton>
```

### **Phase 4: Edge Functions (Week 5)**

**New Edge Functions:**

```
supabase/functions/
  ├── j_hub_creative_submit/ (replaces j_ads_submit_ad)
  ├── j_hub_creative_list/ (list with permissions)
  ├── j_hub_creative_get/ (get single with permissions)
  └── j_hub_creative_delete/ (delete with permissions)
```

**Standardized Pattern:**
```typescript
// j_hub_creative_submit/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  // 1. Verify JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  // 2. Get user accounts via j_hub_user_accounts
  const { data: userAccounts } = await supabase.functions.invoke('j_hub_user_accounts');

  // 3. Validate account access
  const { account_id } = await req.json();
  const hasAccess = userAccounts.account_ids.includes(account_id);
  if (!hasAccess) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  // 4. Process submission with resilience system
  const result = await resilientNotionCall(
    () => publishToNotion(payload),
    'creative_submission',
    fallbackValue
  );

  return new Response(JSON.stringify({ success: true, result }), { status: 200 });
});
```

---

## 🚦 Migration Phases (Detailed)

### **Phase 1: Setup (Week 1)**

**Tasks:**
- [ ] Create feature branch
- [ ] Add feature toggle config
- [ ] Create dual routes (/creatives + /creatives-v2)
- [ ] Add "V2 Beta" badge in Header (admin/staff only)
- [ ] Create new directory structure

### **Phase 2: Database (Week 2)**

**Tasks:**
- [ ] Create migration with new tables
- [ ] Add RLS policies
- [ ] Test RLS policies with different roles
- [ ] Create data migration script
- [ ] **IMPORTANT:** Do NOT drop old tables yet (keep for rollback)

### **Phase 3: Frontend (Week 3-4)**

**Tasks:**
- [ ] Create CreativesV2.tsx page (panel)
- [ ] Create CreativesV2New.tsx (creation flow)
- [ ] Extract Step components (Step1-4 → separate files)
- [ ] Add Zod validation schemas
- [ ] Replace useNotionClients with useMyNotionAccounts
- [ ] Use PrioritizedAccountSelect
- [ ] Add Breadcrumbs navigation
- [ ] Replace Button with JumperButton
- [ ] Add proper error boundaries

### **Phase 4: Backend (Week 5)**

**Tasks:**
- [ ] Create j_hub_creative_submit edge function
- [ ] Create j_hub_creative_list edge function
- [ ] Create j_hub_creative_get edge function
- [ ] Migrate resilience utils (keep existing!)
- [ ] Update permission checks to use j_hub_user_accounts
- [ ] Deploy edge functions with --no-verify-jwt where needed
- [ ] Test with admin/staff/client roles

### **Phase 5: Testing (Week 6)**

**Tasks:**
- [ ] Test creation flow (all creative types)
- [ ] Test file upload (single, carousel, existing-post)
- [ ] Test draft system (save, recover, discard)
- [ ] Test permissions (admin/staff/client)
- [ ] Test resilience (simulate Notion failures)
- [ ] Test on mobile devices
- [ ] Load testing with large files

### **Phase 6: Migration (Week 7)**

**Tasks:**
- [ ] Deploy to staging environment
- [ ] Migrate all production data to new tables
- [ ] Enable feature toggle for beta users
- [ ] Monitor for errors (Sentry/logging)
- [ ] Gather user feedback
- [ ] Fix critical bugs

### **Phase 7: Rollout (Week 8)**

**Tasks:**
- [ ] Switch default route from /creatives → /creatives-v2
- [ ] Keep old system available at /creatives-legacy (1 month)
- [ ] Update documentation
- [ ] Remove feature toggle
- [ ] Deprecate old edge functions
- [ ] **After 1 month stability:** Drop old tables

---

## 🔄 Rollback Strategy

**If V2 has critical bugs:**

```bash
# 1. Disable feature toggle
VITE_CREATIVES_V2_ENABLED=false

# 2. Revert routes in App.tsx
<Route path="/creatives" element={<Creatives />} /> # OLD

# 3. Keep new tables (for data integrity)
# Do NOT drop j_hub_creative_* tables

# 4. Investigate and fix issues
# 5. Re-enable when stable
```

**Data Safety:**
- New tables and old tables coexist during transition
- No data is deleted until 1 month after successful rollout
- All submissions have timestamps for audit trail

---

## 📋 Modernization Checklist

### **Code Quality**

- [ ] ESLint passes with 0 warnings
- [ ] TypeScript strict mode enabled
- [ ] All components have proper types
- [ ] No `any` types (use `unknown` or proper types)
- [ ] Error boundaries on all routes

### **Performance**

- [ ] Lazy load routes
- [ ] Optimize bundle size (<100KB for creatives chunk)
- [ ] Use React.memo for expensive components
- [ ] Debounce form inputs
- [ ] Optimize image uploads (compress before upload)

### **Accessibility**

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Proper ARIA labels
- [ ] Focus management in modals
- [ ] Color contrast meets WCAG AA

### **Testing**

- [ ] Unit tests for validation functions
- [ ] Integration tests for form flow
- [ ] E2E tests for submission
- [ ] Test error scenarios
- [ ] Test with slow network

### **Documentation**

- [ ] Update ARCHITECTURE.md with new tables
- [ ] Update CLAUDE.md with new patterns
- [ ] Add JSDoc comments to complex functions
- [ ] Create user guide for new features
- [ ] Document breaking changes

---

## 🎯 Success Criteria

**Minimum Requirements (before replacing old system):**

1. ✅ Feature parity with old system (all creative types work)
2. ✅ Zero data loss during migration
3. ✅ Permissions work correctly for all roles
4. ✅ Resilience system maintains "GERENTE NUNCA VERÁ ERRO!"
5. ✅ Performance equal or better than old system
6. ✅ Mobile responsive (tested on iOS/Android)
7. ✅ 1 week in production with <1% error rate

**Nice-to-Have (future enhancements):**

- 📊 Analytics dashboard for creative performance
- 🔗 Public sharing links (like Decks system)
- 📁 Bulk upload (multiple creatives at once)
- 🤖 AI-generated creative names/descriptions
- 📸 Instagram post scraper improvements
- 🎨 Preview generator (what it looks like on Meta/Google)

---

## 🚨 Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss during migration | Critical | Low | Keep old tables, test migration script thoroughly |
| Breaking changes in production | High | Medium | Feature toggle, dual routes, gradual rollout |
| Performance regression | Medium | Low | Load testing before rollout, monitor metrics |
| User resistance to new UI | Low | High | Keep old system available, gather feedback |
| Edge function deployment issues | High | Medium | Test in staging, deploy during low-traffic hours |

---

## 📅 Timeline

**Total Duration:** 8 weeks (2 months)

**Milestones:**
- Week 1: Environment setup ✅
- Week 2: Database ready ✅
- Week 4: Frontend complete ✅
- Week 5: Backend complete ✅
- Week 6: Testing complete ✅
- Week 7: Beta rollout ✅
- Week 8: Full production ✅

**Estimated Effort:** 160-200 hours

---

## 🤝 Stakeholder Communication

**Weekly Updates:**
- Progress report (what's done, what's next)
- Blockers and risks
- Demo of new features
- Feedback collection

**Beta User Group:**
- 5 admin users
- 10 staff users
- 5 client users
- Weekly feedback sessions

---

**Last Updated:** 2024-11-07
**Owner:** Claude Code Assistant
**Approved By:** Bruno (pending)
