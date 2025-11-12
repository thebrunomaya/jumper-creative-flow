# Old DeckEditor.tsx - Feature Analysis & Migration Guide

## Executive Summary

The old `DeckEditor.tsx` is a comprehensive deck management interface with 6 critical features that must be preserved when migrating to the new 3-stage `DeckEditorPage.tsx`:

1. **Preview Functionality** - Inline HTML preview with iframe
2. **Fullscreen Mode** - Opens `/decks/{id}/preview` in new window
3. **Share Functionality** - Creates public/password-protected shares
4. **Download Functionality** - Direct file download to browser
5. **Markdown Editing** - Edit and regenerate markdown source
6. **Version History** - View/restore previous versions

The new `DeckEditorPage.tsx` has partial implementations but **MUST be extended** to include all missing features.

---

## Feature Breakdown

### 1. PREVIEW FUNCTIONALITY

**Location:** `DeckEditor.tsx` lines 373-411
**UI:** "Preview" tab in TabsList

#### Current Implementation (OLD):
```tsx
// Option A: HTML inline (preferred)
<iframe
  srcDoc={deck.html_output}
  className="w-full h-[600px]"
  title={`Preview: ${deck.title}`}
  sandbox="allow-scripts allow-same-origin allow-forms"
/>

// Option B: Fallback to file_url
<iframe
  src={deck.file_url}
  className="w-full h-[600px]"
  title={`Preview: ${deck.title}`}
  sandbox="allow-scripts allow-same-origin allow-forms"
/>
```

#### In DeckEditorPage:
- Stage 3 shows preview at lines 248-254
- Uses `iframe src={deck.file_url}` (file_url based)
- Height: `aspect-video` (responsive)
- **MISSING:** Inline `html_output` fallback support
- **MISSING:** Full height iframe option for better preview

#### Data Dependencies:
- `deck.html_output` - Direct HTML string stored in database
- `deck.file_url` - Supabase Storage URL (file_url)

#### Status:
- ✅ Basic preview exists in DeckEditorPage Stage 3
- ❌ Missing `html_output` inline rendering option
- ❌ No fullscreen button in new editor

---

### 2. FULLSCREEN MODE

**Location:** `DeckEditor.tsx` lines 155-159
**UI Button:** "Ver em Tela Cheia" (View Fullscreen)

#### Current Implementation (OLD):
```tsx
const handleFullScreen = () => {
  if (!deck) return;
  window.open(`/decks/${deck.id}/preview`, "_blank");
};
```

#### Route Target:
- **URL:** `/decks/{id}/preview`
- **Component:** `DeckPreview.tsx`
- **Behavior:** 
  - Full screen (min-h-screen bg-black)
  - Viewport size validation warning
  - Admin override for viewport warnings
  - Renders either:
    - `html_output` via srcDoc (preferred)
    - `file_url` via src (fallback)

#### Data Flow:
1. User clicks "Ver em Tela Cheia"
2. Opens `/decks/{deckId}/preview` in new window
3. DeckPreview component loads
4. Fetches deck with minimal fields: `id, title, html_output, file_url`
5. Validates viewport size (shows ViewportWarning for mobile)
6. Renders full screen iframe

#### Status:
- ✅ Route exists and works
- ✅ DeckPreview component fully implemented
- ❌ NOT integrated into DeckEditorPage
- **ACTION:** Add "Fullscreen" button to DeckEditorPage Stage 3

---

### 3. SHARE FUNCTIONALITY

**Location:** `DeckShareModal.tsx` (complete)
**UI Button:** "Compartilhar" (Share)

#### Current Implementation (OLD):

**Modal Trigger:**
```tsx
<Button variant="outline" onClick={() => setShareModalOpen(true)}>
  <Share2 className="mr-2 h-4 w-4" />
  Compartilhar
</Button>

<DeckShareModal
  open={shareModalOpen}
  onOpenChange={setShareModalOpen}
  deckId={deck.id}
  deckTitle={deck.title}
  currentSlug={deck.slug}
  isPublic={deck.is_public}
/>
```

#### Modal Features:

**1. Password-Protected Sharing:**
- Toggle: "Proteger com senha"
- Input field: Min 6 characters
- Backend validation in Edge Function

**2. Share Link Generation:**
- Calls Edge Function: `j_hub_deck_create_share`
- Body: `{ deck_id, password (optional) }`
- Returns: `{ success, url, error }`
- URL format: `{window.location.origin}/decks/share/{slug}`

**3. Share Link Management:**
- Copy to clipboard with visual feedback
- Open in new window
- Revoke sharing (sets `slug=null, is_public=false`)
- Display current slug if already shared

#### Database Fields Used:
```typescript
deck.slug           // Unique share slug
deck.is_public      // Boolean share flag
deck.password_hash  // bcrypt hash (not plaintext password)
```

#### Edge Function:
- **Function:** `j_hub_deck_create_share`
- **Input:** `deck_id`, `password` (optional)
- **Output:** `{ success: boolean, url: string, error: string }`
- **Side Effects:**
  - Generates unique slug
  - Hashes password if provided
  - Updates deck record with slug, is_public, password_hash

#### Status:
- ✅ Complete modal implementation
- ✅ Edge Function integration tested
- ✅ Password protection working
- ❌ NOT integrated into DeckEditorPage
- **ACTION:** Add Share button + modal to DeckEditorPage

---

### 4. DOWNLOAD FUNCTIONALITY

**Location:** `DeckEditor.tsx` lines 146-153
**UI Button:** "Baixar" (Download)

#### Current Implementation (OLD):
```tsx
const handleDownload = () => {
  if (!deck || !deck.file_url) {
    toast.error("URL do deck não disponível");
    return;
  }

  window.open(deck.file_url, "_blank");
};
```

#### What It Does:
- Opens deck file in new browser tab (via Supabase Storage)
- Not a true "download-to-disk" operation
- Depends on `deck.file_url` being present

#### Data Dependency:
- `deck.file_url` - Must be valid Supabase Storage URL

#### Enhanced Version (Also in DeckEditorPage Stage 3):
```tsx
// Download HTML file to disk
const handleDownload = () => {
  const a = document.createElement('a');
  a.href = deck.file_url!;
  a.download = `${deck.title}.html`;
  a.click();
};
```

**OR** if using `html_output`:
```tsx
const handleDownload = () => {
  const blob = new Blob([deck.html_output!], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${deck.title}.html`;
  a.click();
  URL.revokeObjectURL(url);
};
```

#### Status:
- ✅ Open in new tab implemented in DeckEditor
- ✅ Enhanced download-to-disk in DeckEditorPage (lines 265-276)
- ✅ Both implementations are present
- **ACTION:** Ensure DeckEditorPage download button is always accessible

---

### 5. MARKDOWN EDITING & REGENERATION

**Location:** `MarkdownEditor.tsx` (complete component)
**UI Tab:** "Markdown" tab (only for editors)

#### Current Implementation:

**Component Props:**
```typescript
interface MarkdownEditorProps {
  deckId: string;
  initialMarkdown: string;
  onRegenerate: (newMarkdown: string) => Promise<void>;
  disabled?: boolean;
}
```

**Key Features:**

1. **Draft Auto-Save:**
   - LocalStorage key: `deck-markdown-draft-{deckId}`
   - Auto-saves every 1000ms (debounced)
   - Prompts restore on page load if draft differs from saved
   - Max length: 15,000 characters

2. **Regeneration:**
   - Calls `onRegenerate()` handler
   - Creates new version via `j_hub_deck_regenerate` Edge Function
   - Body: `{ deck_id, markdown_source: newMarkdown }`
   - Page reloads after success

3. **Change Tracking:**
   - Detects unsaved changes
   - Shows visual indicators
   - "Reverter Original" button to reset

4. **Safety Guards:**
   - Max markdown length enforcement
   - Character count display
   - Warning at 90% limit
   - Block regeneration if over limit

#### Usage in OLD Editor:
```tsx
<MarkdownEditor
  deckId={deck.id}
  initialMarkdown={deck.markdown_source}
  onRegenerate={handleRegenerate}
/>
```

#### Handler Implementation:
```tsx
const handleRegenerate = async (newMarkdown: string) => {
  try {
    toast.info("Regenerando deck com novo markdown...");

    const { data, error } = await supabase.functions.invoke(
      "j_hub_deck_regenerate",
      {
        body: {
          deck_id: deck.id,
          markdown_source: newMarkdown,
        },
      }
    );

    if (error) throw error;
    window.location.reload(); // Reload to show new version
  } catch (err: any) {
    throw new Error(err.message || "Falha ao regenerar deck");
  }
};
```

#### Status:
- ✅ Complete standalone component
- ✅ Draft persistence working
- ✅ Edge Function integration ready
- ❌ NOT integrated into DeckEditorPage
- **ACTION:** Add Markdown tab to DeckEditorPage (or link to old editor)

---

### 6. VERSION HISTORY & ROLLBACK

**Location:** `DeckVersionHistory.tsx` (complete component)
**UI Button:** "Histórico" (History) + Tab

#### Current Implementation:

**Component Props:**
```typescript
interface DeckVersionHistoryProps {
  deckId: string;
  currentVersion: number;
  onVersionRestore?: (versionNumber: number) => void;
  onVersionView?: (version: DeckVersion) => void;
  trigger?: React.ReactNode; // Custom trigger button
}
```

**UI Rendering:**
- Sheet (side panel) with all versions
- Displays in reverse order (newest first)
- Version badges: Original, Refined, Regenerated
- Current version marked with green "ATUAL" badge

**Key Features:**

1. **Version List:**
   - Fetches from `j_hub_deck_versions` table
   - Shows version number, type, timestamp, changes summary
   - Shows refinement prompt (what user asked AI to change)

2. **Version Restore:**
   - Updates `j_hub_decks.current_version` to target version
   - Updates `html_output` from stored version snapshot
   - Updates `updated_at` timestamp
   - Page reloads to show restored version

3. **Version Types:**
   - `original` - Initial generation
   - `refined` - AI refinement (Refinar com IA)
   - `regenerated` - Markdown regeneration

#### Data Model:

**j_hub_deck_versions table:**
```sql
CREATE TABLE j_hub_deck_versions (
  id UUID PRIMARY KEY,
  deck_id UUID REFERENCES j_hub_decks(id),
  version_number INTEGER,
  html_output TEXT,              -- Snapshot
  refinement_prompt TEXT,         -- What user asked
  changes_summary TEXT,           -- What AI did
  version_type 'original'|'refined'|'regenerated',
  created_at TIMESTAMPTZ,
  UNIQUE(deck_id, version_number)
);
```

#### Database Fields in j_hub_decks:
```typescript
deck.current_version: number  // Which version to display
```

#### Status:
- ✅ Complete version history component
- ✅ Version restore working
- ✅ Database schema supports versioning
- ❌ NOT integrated into DeckEditorPage
- **ACTION:** Add Version History tab/button to DeckEditorPage

---

## AI REFINEMENT SYSTEM (Bonus Feature)

**Location:** `DeckRefineModal.tsx` (complete)
**UI Button:** "Refinar com IA" (Refine with AI)

#### Current Implementation:

**Modal Trigger:**
```tsx
<DeckRefineModal
  deckId={deck.id}
  currentVersion={deck.current_version || 1}
  onRefineComplete={(newVersion, changesSummary) => {
    toast.success(`Versão ${newVersion} criada com sucesso!`);
    window.location.reload();
  }}
  trigger={
    <Button variant="default">
      <Sparkles className="mr-2 h-4 w-4" />
      Refinar com IA
    </Button>
  }
/>
```

**Features:**

1. **Refinement Prompt Input:**
   - User describes desired changes
   - Examples provided for inspiration
   - Min requirement: non-empty

2. **Edge Function:**
   - Function: `j_hub_deck_refine`
   - Input: `{ deck_id, refinement_prompt }`
   - Output: `{ success, new_version, changes_summary, error }`

3. **Version Creation:**
   - Creates new version in `j_hub_deck_versions`
   - Stores refinement_prompt
   - Stores AI-generated changes_summary
   - Sets version_type: 'refined'

4. **Processing:**
   - ~30-60 seconds for large decks
   - Shows toast with changes summary
   - Creates new version automatically

#### Status:
- ✅ Complete refinement modal
- ✅ Edge Function integration
- ✅ Version creation working
- ❌ NOT integrated into DeckEditorPage
- **ACTION:** Add to DeckEditorPage (editors only)

---

## PERMISSIONS & ACCESS CONTROL

**Role-Based Permissions:**

```typescript
enum UserRole {
  admin = "admin",      // Full access + management
  staff = "staff",      // Can edit all decks
  client = "client",    // Can only view/edit own
}
```

**Permission Rules:**

```typescript
const canEdit = 
  userRole === "admin" || 
  userRole === "staff" || 
  deckData.user_id === currentUser.id;
```

**UI Implications:**
- ✅ Download button: Both admins + editors
- ✅ Delete button: Editors only
- ✅ Markdown edit: Editors only
- ✅ AI Refinement: Editors only
- ✅ Share button: Available to all (public links viewable by anyone)

#### In DeckEditorPage:
- Currently missing permission checks for:
  - Download button (should be always visible)
  - Edit markdown (should check canEdit)
  - Delete button (should check canEdit)

---

## DATABASE SCHEMA SUMMARY

### j_hub_decks Table:
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL
account_id UUID
type TEXT ('report', 'mediaplan', 'pitch')
brand_identity TEXT ('jumper', 'koko', 'tyaro')
template_id TEXT
title TEXT NOT NULL
markdown_source TEXT NOT NULL
html_output TEXT (cached HTML)
file_url TEXT (Supabase Storage URL)
slug TEXT UNIQUE (for sharing)
is_public BOOLEAN
password_hash TEXT (optional)
current_version INTEGER (which version to display)
generation_plan JSONB (Stage 1 output)
analysis_status TEXT ('pending'|'processing'|'completed'|'failed')
review_status TEXT ('pending'|'processing'|'completed'|'failed')
generation_status TEXT ('pending'|'processing'|'completed'|'failed')
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### j_hub_deck_versions Table:
```sql
id UUID PRIMARY KEY
deck_id UUID NOT NULL
version_number INTEGER
html_output TEXT (snapshot)
refinement_prompt TEXT (what user asked)
changes_summary TEXT (what AI did)
version_type TEXT ('original'|'refined'|'regenerated')
created_at TIMESTAMPTZ
UNIQUE(deck_id, version_number)
```

---

## EDGE FUNCTIONS REFERENCE

| Function | Stage | Input | Output | Purpose |
|----------|-------|-------|--------|---------|
| j_hub_deck_analyze | 1 | deck_id, markdown, type, template | generation_plan JSONB | Content analysis & slide planning |
| j_hub_deck_generate | 3 | deck_id | html_output, file_url | HTML generation from plan |
| j_hub_deck_regenerate | - | deck_id, markdown_source | new version | Regenerate from new markdown |
| j_hub_deck_refine | - | deck_id, refinement_prompt | new_version, changes_summary | AI refinement |
| j_hub_deck_create_share | - | deck_id, password | slug, url | Create share link |

---

## CRITICAL MISSING FEATURES IN DeckEditorPage

### 1. ❌ Fullscreen Button
- **Location:** Should be in Stage 3 header
- **Action:** Add button that opens `/decks/{id}/preview` in new window
- **Icon:** Maximize2

### 2. ❌ Share Functionality
- **Location:** Should be in header or Stage 3
- **Component:** DeckShareModal
- **Icon:** Share2
- **Permissions:** Available to all users

### 3. ❌ Markdown Editor Tab
- **Location:** Should be a new tab/section
- **Component:** MarkdownEditor
- **Permissions:** Editors only
- **Note:** Can be in collapsible tab or link to old editor

### 4. ❌ Version History
- **Location:** Should be in header or new tab
- **Component:** DeckVersionHistory
- **Icon:** History
- **Permissions:** Available to all

### 5. ❌ AI Refinement
- **Location:** Should be in Stage 3 (or upper)
- **Component:** DeckRefineModal
- **Icon:** Sparkles
- **Permissions:** Editors only

### 6. ❌ Delete Button
- **Location:** Should be in header with confirmation
- **Icon:** Trash2
- **Permissions:** Editors only
- **Current Missing:** Not in DeckEditorPage at all

---

## RECOMMENDED MIGRATION PATH

### Phase 1: Core Features
1. ✅ Add Fullscreen button (simple)
2. ✅ Add Download button (already exists)
3. ✅ Add Share button + DeckShareModal
4. ✅ Add Version History access

### Phase 2: Advanced Features
5. ✅ Add Markdown Editor tab/section
6. ✅ Add AI Refinement modal
7. ✅ Add Delete button

### Phase 3: Polish
8. ✅ Permission checks for all buttons
9. ✅ User role display
10. ✅ Navigation/breadcrumbs

---

## FILE LOCATIONS

### Components (reusable):
- `/src/components/decks/DeckShareModal.tsx` - Share functionality
- `/src/components/decks/DeckVersionHistory.tsx` - Version history
- `/src/components/decks/MarkdownEditor.tsx` - Markdown editing
- `/src/components/decks/DeckRefineModal.tsx` - AI refinement
- `/src/components/decks/DeckEditorStepCard.tsx` - Stage card wrapper

### Pages (routes):
- `/src/pages/DeckEditor.tsx` - **OLD** complete editor (reference)
- `/src/pages/DeckEditorPage.tsx` - **NEW** 3-stage editor (needs extension)
- `/src/pages/DeckPreview.tsx` - Fullscreen preview (working)

### Database:
- `supabase/migrations/20241102200000_create_decks_table.sql`
- `supabase/migrations/20251111103740_create_deck_versions.sql`
- `supabase/migrations/20251112170000_add_deck_stage_status.sql`
- `supabase/migrations/20251112125349_add_generation_plan.sql`

---

## SUMMARY TABLE

| Feature | Component | Status | Action |
|---------|-----------|--------|--------|
| Preview | DeckEditorPage Stage 3 | ✅ Partial | Add html_output fallback |
| Fullscreen | DeckPreview.tsx | ✅ Ready | Add button to DeckEditorPage |
| Share | DeckShareModal.tsx | ✅ Ready | Add to DeckEditorPage header |
| Download | DeckEditorPage Stage 3 | ✅ Ready | Keep as-is |
| Markdown Edit | MarkdownEditor.tsx | ✅ Ready | Add tab to DeckEditorPage |
| Version History | DeckVersionHistory.tsx | ✅ Ready | Add button to DeckEditorPage |
| AI Refinement | DeckRefineModal.tsx | ✅ Ready | Add to DeckEditorPage |
| Delete | - | ❌ Missing | Implement in DeckEditorPage |

---

## IMPORTANT NOTES

1. **No Functionality Lost:** All components are standalone and reusable. Just integrate them into DeckEditorPage.

2. **State Management:** Each component manages its own state. No complex Redux needed.

3. **Edge Functions:** All operations are handled by existing Edge Functions. No new backend work needed.

4. **Permissions:** Check user role before showing editor-only buttons.

5. **Polling:** DeckEditorPage already polls for status updates every 3 seconds. Perfect for long-running Edge Functions.

6. **Draft Safety:** MarkdownEditor saves drafts to localStorage. User won't lose work.

7. **Version Tracking:** Versions are automatically created by Edge Functions. Just display them.

