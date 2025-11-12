# DeckEditor Feature Mapping - Component Integration Guide

## Visual Feature Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   DeckEditor.tsx (OLD - Reference)                      │
│                         Complete Implementation                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Header Row (Lines 240-307):                                            │
│  ┌─ Back Button                                                          │
│  │  ┌─ View Fullscreen (handleFullScreen)                        ✅     │
│  │  ├─ Version History (DeckVersionHistory)                      ✅     │
│  │  ├─ AI Refinement (DeckRefineModal)                           ✅     │
│  │  ├─ Share (DeckShareModal)                                    ✅     │
│  │  ├─ Download (handleDownload)                                 ✅     │
│  │  └─ Delete (handleDelete)                                     ✅     │
│                                                                          │
│  Deck Info Card (Lines 311-354):                                        │
│  └─ Title, Date, Account, Badges                                        │
│                                                                          │
│  Tabs (Lines 357-443):                                                  │
│  ├─ Preview Tab (html_output + file_url fallback)               ✅     │
│  ├─ Markdown Tab (MarkdownEditor component)                      ✅     │
│  └─ Versions Tab (DeckVersionHistory - same as button)           ✅     │
│                                                                          │
│  Share Modal (Lines 448-455):                                           │
│  └─ DeckShareModal (open={shareModalOpen})                       ✅     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                   DeckEditorPage.tsx (NEW - To Extend)                  │
│                    3-Stage Interactive Editor                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Header (Lines 209-229):                                                │
│  ├─ Back Button                                                         │
│  ├─ Title                                                               │
│  └─ Badges (type, brand, template)                                      │
│  ⚠️  MISSING: Fullscreen, Share, Delete, History buttons               │
│                                                                          │
│  Stage 3: Deck Preview (Lines 236-318):                        📊      │
│  ├─ ✅ Preview iframe (file_url based)                                  │
│  ├─ ✅ Download button                                                  │
│  ├─ ✅ Open in new tab button                                           │
│  ├─ ✅ Regenerate button                                                │
│  ⚠️  MISSING: Fullscreen button                                        │
│  ⚠️  MISSING: html_output fallback                                      │
│                                                                          │
│  Stage 2: Slide Plan (Lines 321-369):                          📄      │
│  ├─ Total slides count                                                  │
│  ├─ Pattern diversity score                                             │
│  └─ Slide breakdown with patterns                                       │
│  ✅ AUTO-APPROVED (review_status auto-completes)                        │
│                                                                          │
│  Stage 1: Content Analysis (Lines 372-424):                     🔍      │
│  ├─ Markdown source preview                                             │
│  └─ Analyze button                                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Feature Integration Plan

### 1️⃣ FULLSCREEN MODE
```
OLD LOCATION:  DeckEditor.tsx line 155-159
OLD CODE:      const handleFullScreen = () => {
                 window.open(`/decks/${deck.id}/preview`, "_blank");
               };

NEW LOCATION:  DeckEditorPage.tsx Stage 3 (after Download button)
NEW CODE:      <JumperButton
                 onClick={() => window.open(`/decks/${deck.id}/preview`, "_blank")}
                 variant="outline"
                 size="sm"
               >
                 <Maximize2 className="h-4 w-4 mr-2" />
                 Ver em Tela Cheia
               </JumperButton>

TARGET ROUTE:  /decks/{id}/preview
TARGET FILE:   DeckPreview.tsx (already exists and fully working)
```

---

### 2️⃣ SHARE FUNCTIONALITY
```
OLD LOCATION:  DeckEditor.tsx lines 62, 289-292
OLD CODE:      const [shareModalOpen, setShareModalOpen] = useState(false);
               
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

NEW LOCATION:  DeckEditorPage.tsx header (after Back button row)
NEW CODE:      STATE:
               const [shareModalOpen, setShareModalOpen] = useState(false);
               
               BUTTON:
               <JumperButton
                 onClick={() => setShareModalOpen(true)}
                 variant="outline"
               >
                 <Share2 className="h-4 w-4 mr-2" />
                 Compartilhar
               </JumperButton>
               
               MODAL:
               <DeckShareModal
                 open={shareModalOpen}
                 onOpenChange={setShareModalOpen}
                 deckId={deck.id}
                 deckTitle={deck.title}
                 currentSlug={deck.slug}
                 isPublic={deck.is_public}
               />

COMPONENT:     /src/components/decks/DeckShareModal.tsx
EDGE FN:       j_hub_deck_create_share
FIELDS USED:   deck.slug, deck.is_public, deck.password_hash
```

---

### 3️⃣ MARKDOWN EDITING & REGENERATION
```
OLD LOCATION:  DeckEditor.tsx lines 63, 161-183, 415-428
OLD CODE:      STATE:
               const [activeTab, setActiveTab] = useState("preview");
               
               HANDLER:
               const handleRegenerate = async (newMarkdown: string) => {
                 try {
                   toast.info("Regenerando deck com novo markdown...");
                   const { data, error } = await supabase.functions.invoke(
                     "j_hub_deck_regenerate",
                     { body: { deck_id: deck.id, markdown_source: newMarkdown } }
                   );
                   if (error) throw error;
                   window.location.reload();
                 } catch (err: any) {
                   throw new Error(err.message || "Falha ao regenerar deck");
                 }
               };
               
               COMPONENT:
               <MarkdownEditor
                 deckId={deck.id}
                 initialMarkdown={deck.markdown_source}
                 onRegenerate={handleRegenerate}
               />

NEW LOCATION:  DeckEditorPage.tsx - new collapsible section or tab
NEW CODE:      IMPORT:
               import { MarkdownEditor } from "@/components/decks/MarkdownEditor";
               
               STATE:
               const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);
               
               HANDLER:
               const handleRegenerate = async (newMarkdown: string) => {
                 try {
                   toast.info("Regenerando deck com novo markdown...");
                   const { data, error } = await supabase.functions.invoke(
                     "j_hub_deck_regenerate",
                     { body: { deck_id: deck.id, markdown_source: newMarkdown } }
                   );
                   if (error) throw error;
                   await loadDeck();
                 } catch (err: any) {
                   toast.error("Erro ao regenerar: " + err.message);
                 }
               };
               
               UI:
               <DeckEditorStepCard
                 step={0}
                 title="Markdown Editor"
                 icon={FileText}
                 isOpen={showMarkdownEditor}
                 onToggle={() => setShowMarkdownEditor(!showMarkdownEditor)}
               >
                 <MarkdownEditor
                   deckId={deck.id}
                   initialMarkdown={deck.markdown_source}
                   onRegenerate={handleRegenerate}
                 />
               </DeckEditorStepCard>

COMPONENT:     /src/components/decks/MarkdownEditor.tsx
EDGE FN:       j_hub_deck_regenerate
FIELDS USED:   deck.markdown_source
AUTO-SAVE:     LocalStorage (deck-markdown-draft-{deckId})
MAX LENGTH:    15,000 characters
```

---

### 4️⃣ VERSION HISTORY & ROLLBACK
```
OLD LOCATION:  DeckEditor.tsx lines 255-268, 433-441
OLD CODE:      <DeckVersionHistory
                 deckId={deck.id}
                 currentVersion={deck.current_version || 1}
                 onVersionRestore={(versionNumber) => {
                   window.location.reload();
                 }}
                 trigger={
                   <Button variant="outline">
                     <History className="mr-2 h-4 w-4" />
                     Histórico
                   </Button>
                 }
               />

NEW LOCATION:  DeckEditorPage.tsx header or new tab
NEW CODE:      <DeckVersionHistory
                 deckId={deck.id}
                 currentVersion={deck.current_version || 1}
                 onVersionRestore={(versionNumber) => {
                   await loadDeck();
                 }}
                 trigger={
                   <JumperButton variant="outline">
                     <History className="h-4 w-4 mr-2" />
                     Histórico
                   </JumperButton>
                 }
               />

COMPONENT:     /src/components/decks/DeckVersionHistory.tsx
DATABASE:      j_hub_deck_versions table
FIELDS USED:   deck.current_version
VERSION TYPES: 'original', 'refined', 'regenerated'
```

---

### 5️⃣ AI REFINEMENT (BONUS)
```
OLD LOCATION:  DeckEditor.tsx lines 271-287
OLD CODE:      <DeckRefineModal
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

NEW LOCATION:  DeckEditorPage.tsx Stage 3 (top of controls)
NEW CODE:      {canEdit && (
                 <DeckRefineModal
                   deckId={deck.id}
                   currentVersion={deck.current_version || 1}
                   onRefineComplete={(newVersion, changesSummary) => {
                     toast.success(`Versão ${newVersion} criada com sucesso!`);
                     await loadDeck();
                   }}
                   trigger={
                     <JumperButton variant="default" size="sm">
                       <Sparkles className="h-4 w-4 mr-2" />
                       Refinar com IA
                     </JumperButton>
                   }
                 />
               )}

COMPONENT:     /src/components/decks/DeckRefineModal.tsx
EDGE FN:       j_hub_deck_refine
PERMISSIONS:   Editors only (check canEdit)
PROCESSING:    30-60 seconds
CREATES:       New version in j_hub_deck_versions
```

---

### 6️⃣ DELETE BUTTON (MISSING)
```
OLD LOCATION:  DeckEditor.tsx lines 301-304
OLD CODE:      {canEdit && (
                 <Button variant="destructive" onClick={handleDelete}>
                   <Trash2 className="mr-2 h-4 w-4" />
                   Excluir
                 </Button>
               )}
               
               const handleDelete = async () => {
                 const confirmed = window.confirm(
                   "Tem certeza que deseja excluir este deck?"
                 );
                 if (!confirmed) return;
                 
                 try {
                   const { error } = await supabase
                     .from("j_hub_decks")
                     .delete()
                     .eq("id", deck.id);
                   if (error) throw error;
                   toast.success("Deck excluído com sucesso!");
                   navigate("/decks");
                 } catch (err: any) {
                   toast.error("Erro ao excluir deck", { description: err.message });
                 }
               };

NEW LOCATION:  DeckEditorPage.tsx header (with other actions)
NEW CODE:      const handleDelete = async () => {
                 const confirmed = window.confirm(
                   "Tem certeza que deseja excluir este deck? Esta ação não pode ser desfeita."
                 );
                 if (!confirmed) return;
                 
                 try {
                   const { error } = await supabase
                     .from("j_hub_decks")
                     .delete()
                     .eq("id", deck.id);
                   if (error) throw error;
                   toast.success("Deck excluído com sucesso!");
                   navigate("/decks");
                 } catch (err: any) {
                   toast.error("Erro ao excluir deck", { description: err.message });
                 }
               };
               
               {canEdit && (
                 <JumperButton
                   variant="destructive"
                   onClick={handleDelete}
                 >
                   <Trash2 className="h-4 w-4 mr-2" />
                   Excluir
                 </JumperButton>
               )}

PERMISSIONS:   Editors only (check canEdit)
```

---

### 7️⃣ PREVIEW ENHANCEMENT
```
OLD LOCATION:  DeckEditor.tsx lines 373-411
OLD CODE:      {deck.html_output ? (
                 <iframe srcDoc={deck.html_output} ... />
               ) : deck.file_url ? (
                 <iframe src={deck.file_url} ... />
               ) : (
                 <Alert>...</Alert>
               )}

NEW LOCATION:  DeckEditorPage.tsx Stage 3
CURRENT CODE:  <iframe src={deck.file_url} ... />

ENHANCEMENT:   Add html_output fallback:
               {deck.html_output ? (
                 <iframe
                   srcDoc={deck.html_output}
                   className="w-full h-full"
                   title="Deck Preview"
                   sandbox="allow-scripts allow-same-origin allow-forms"
                 />
               ) : deck.file_url ? (
                 <iframe
                   src={deck.file_url}
                   className="w-full h-full"
                   title="Deck Preview"
                   sandbox="allow-scripts allow-same-origin allow-forms"
                 />
               ) : (
                 <Alert>
                   <AlertDescription>
                     HTML não disponível. O deck pode ainda estar sendo processado.
                   </AlertDescription>
                 </Alert>
               )}
```

---

## File Import Checklist

```typescript
// ADD THESE IMPORTS TO DeckEditorPage.tsx

import { useState } from "react";
import { DeckShareModal } from "@/components/decks/DeckShareModal";
import { DeckVersionHistory } from "@/components/decks/DeckVersionHistory";
import { MarkdownEditor } from "@/components/decks/MarkdownEditor";
import { DeckRefineModal } from "@/components/decks/DeckRefineModal";
import {
  Maximize2,
  Share2,
  Trash2,
  // ... existing imports
} from "lucide-react";
import { toast } from "sonner";
```

---

## State Management Additions

```typescript
// ADD THESE STATES TO DeckEditorPage.tsx

const [shareModalOpen, setShareModalOpen] = useState(false);
const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);
const [userRole, setUserRole] = useState<"admin" | "staff" | "client" | null>(null);

// Add to loadDeck() effect or useEffect:
useEffect(() => {
  const { data: userData } = await supabase
    .from("j_hub_users")
    .select("role")
    .eq("id", user.id)
    .single();
  setUserRole(userData?.role || null);
}, [user?.id]);

const canEdit = 
  userRole === "admin" || 
  userRole === "staff" || 
  deck?.user_id === user?.id;
```

---

## Event Handler Additions

```typescript
// ADD THESE HANDLERS TO DeckEditorPage.tsx

const handleFullScreen = () => {
  if (!deck) return;
  window.open(`/decks/${deck.id}/preview`, "_blank");
};

const handleRegenerate = async (newMarkdown: string) => {
  try {
    toast.info("Regenerando deck com novo markdown...");
    const { data, error } = await supabase.functions.invoke(
      "j_hub_deck_regenerate",
      { body: { deck_id: deck.id, markdown_source: newMarkdown } }
    );
    if (error) throw error;
    await loadDeck();
    toast.success("Deck regenerado com sucesso!");
  } catch (err: any) {
    toast.error("Erro ao regenerar: " + err.message);
  }
};

const handleDelete = async () => {
  const confirmed = window.confirm(
    "Tem certeza que deseja excluir este deck? Esta ação não pode ser desfeita."
  );
  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from("j_hub_decks")
      .delete()
      .eq("id", deck.id);
    if (error) throw error;
    toast.success("Deck excluído com sucesso!");
    navigate("/decks");
  } catch (err: any) {
    toast.error("Erro ao excluir deck", { description: err.message });
  }
};
```

---

## Summary

**Total Features to Integrate:** 7
- 4 Complete components ready to import
- 2 Partial features to enhance  
- 1 Missing feature to implement

**Estimated Work:**
- 30 min: Import components + state
- 30 min: Add buttons/UI elements
- 30 min: Wire up event handlers
- 30 min: Testing & bug fixes
- **Total: 2 hours**

**No Backend Changes Needed!**
All Edge Functions already exist and tested.

