# DeckEditorPage Integration - Copy-Paste Code Snippets

## 1. IMPORTS (Add to top of file)

```typescript
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { JumperButton } from "@/components/ui/jumper-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import { DeckEditorStepCard } from "@/components/decks/DeckEditorStepCard";
// ⭐ NEW IMPORTS
import { DeckShareModal } from "@/components/decks/DeckShareModal";
import { DeckVersionHistory } from "@/components/decks/DeckVersionHistory";
import { MarkdownEditor } from "@/components/decks/MarkdownEditor";
import { DeckRefineModal } from "@/components/decks/DeckRefineModal";
import {
  ChevronLeft,
  FileText,
  Search,
  Sparkles,
  Loader2,
  Download,
  ExternalLink,
  // ⭐ NEW ICONS
  Maximize2,
  Share2,
  Trash2,
  History,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
```

---

## 2. TYPE DEFINITIONS (Update Deck interface)

```typescript
type DeckStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface Deck {
  id: string;
  title: string;
  type: string;
  template_id: string;
  brand_identity: string;
  markdown_source: string;      // ⭐ NEEDED for MarkdownEditor
  generation_plan: any;
  html_output: string | null;
  file_url: string | null;
  analysis_status: DeckStatus;
  review_status: DeckStatus;
  generation_status: DeckStatus;
  user_id: string;              // ⭐ NEEDED for permission checks
  slug: string | null;          // ⭐ NEEDED for sharing
  is_public: boolean;           // ⭐ NEEDED for sharing
  password_hash: string | null; // ⭐ NEEDED for sharing
  current_version: number;      // ⭐ NEEDED for version history
  created_at: string;
  updated_at: string;
}
```

---

## 3. STATE ADDITIONS (Inside component)

```typescript
export default function DeckEditorPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data state
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Stage loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // UI states
  const [openStep, setOpenStep] = useState<number | null>(null);
  
  // ⭐ NEW STATES
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "staff" | "client" | null>(null);
  
  // ⭐ PERMISSION GUARD
  const canEdit = 
    userRole === "admin" || 
    userRole === "staff" || 
    (deck && user && deck.user_id === user.id);
```

---

## 4. LOAD USER ROLE (Add to loadDeck or useEffect)

```typescript
const loadDeck = async () => {
  try {
    setIsLoadingData(true);

    const { data, error } = await supabase
      .from('j_hub_decks')
      .select('*')
      .eq('id', deckId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Deck not found');

    setDeck(data as Deck);

    // ⭐ LOAD USER ROLE
    if (user) {
      const { data: userData } = await supabase
        .from("j_hub_users")
        .select("role")
        .eq("id", user.id)
        .single();
      
      setUserRole((userData?.role as "admin" | "staff" | "client") || null);
    }

    const defaultOpen = getDefaultOpenStep(data as Deck);
    if (openStep === null) {
      setOpenStep(defaultOpen);
    }

  } catch (error: any) {
    console.error('Error loading deck:', error);
    toast.error('Erro ao carregar deck: ' + error.message);
  } finally {
    setIsLoadingData(false);
  }
};
```

---

## 5. EVENT HANDLERS (Add before render)

```typescript
// ⭐ FULLSCREEN HANDLER
const handleFullScreen = () => {
  if (!deck) return;
  window.open(`/decks/${deck.id}/preview`, "_blank");
};

// ⭐ MARKDOWN REGENERATE HANDLER
const handleRegenerate = async (newMarkdown: string) => {
  try {
    toast.info("Regenerando deck com novo markdown...");
    const { data, error } = await supabase.functions.invoke(
      "j_hub_deck_regenerate",
      { 
        body: { 
          deck_id: deck.id, 
          markdown_source: newMarkdown 
        } 
      }
    );

    if (error) throw error;
    
    await loadDeck();
    toast.success("Deck regenerado com sucesso!");
  } catch (err: any) {
    toast.error("Erro ao regenerar: " + err.message);
  }
};

// ⭐ DELETE HANDLER
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

## 6. HEADER BUTTONS (Add after "Back" button)

```tsx
{/* Header Actions */}
<div className="flex gap-2 flex-wrap">
  {/* Fullscreen Button */}
  <JumperButton 
    onClick={handleFullScreen}
    variant="outline"
    size="sm"
  >
    <Maximize2 className="h-4 w-4 mr-2" />
    Ver em Tela Cheia
  </JumperButton>

  {/* Version History */}
  <DeckVersionHistory
    deckId={deck.id}
    currentVersion={deck.current_version || 1}
    onVersionRestore={(versionNumber) => {
      loadDeck();
    }}
    trigger={
      <JumperButton variant="outline" size="sm">
        <History className="h-4 w-4 mr-2" />
        Histórico
      </JumperButton>
    }
  />

  {/* Share Button */}
  <JumperButton 
    onClick={() => setShareModalOpen(true)}
    variant="outline"
    size="sm"
  >
    <Share2 className="h-4 w-4 mr-2" />
    Compartilhar
  </JumperButton>

  {/* Delete Button (Editors Only) */}
  {canEdit && (
    <JumperButton 
      onClick={handleDelete}
      variant="destructive"
      size="sm"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Excluir
    </JumperButton>
  )}
</div>

{/* Share Modal */}
<DeckShareModal
  open={shareModalOpen}
  onOpenChange={setShareModalOpen}
  deckId={deck.id}
  deckTitle={deck.title}
  currentSlug={deck.slug || null}
  isPublic={deck.is_public}
/>
```

---

## 7. STAGE 3: ENHANCED PREVIEW

```tsx
{/* STAGE 3: DECK PREVIEW (Top - Most Refined) */}
<DeckEditorStepCard
  step={3}
  title="Deck Preview"
  subtitle="Apresentação final gerada"
  icon={Sparkles}
  status={deck.generation_status}
  isOpen={openStep === 3}
  onToggle={() => setOpenStep(openStep === 3 ? null : 3)}
  isLocked={deck.review_status !== 'completed'}
>
  {deck.generation_status === 'completed' && (deck.file_url || deck.html_output) ? (
    <div className="space-y-4">
      {/* Preview */}
      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
        {deck.html_output ? (
          // ⭐ NEW: html_output inline rendering
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
        ) : null}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <JumperButton
          onClick={() => window.open(deck.file_url!, '_blank')}
          variant="outline"
          size="sm"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir em Nova Aba
        </JumperButton>

        <JumperButton
          onClick={() => {
            const a = document.createElement('a');
            a.href = deck.file_url!;
            a.download = `${deck.title}.html`;
            a.click();
          }}
          variant="outline"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Download HTML
        </JumperButton>

        {/* ⭐ NEW: AI Refinement Button */}
        {canEdit && (
          <DeckRefineModal
            deckId={deck.id}
            currentVersion={deck.current_version || 1}
            onRefineComplete={(newVersion, changesSummary) => {
              toast.success(`Versão ${newVersion} criada com sucesso!`);
              loadDeck();
            }}
            trigger={
              <JumperButton variant="default" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Refinar com IA
              </JumperButton>
            }
          />
        )}

        <JumperButton
          onClick={handleGenerate}
          disabled={isGenerating}
          variant="outline"
          size="sm"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Regenerar
        </JumperButton>
      </div>
    </div>
  ) : deck.generation_status === 'processing' ? (
    <div className="text-center py-8">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-jumper-primary" />
      <p className="text-gray-600">Gerando apresentação...</p>
      <p className="text-sm text-gray-500 mt-2">Isso pode levar 2-3 minutos</p>
    </div>
  ) : deck.generation_status === 'failed' ? (
    <div className="text-center py-8">
      <p className="text-red-600 mb-4">Geração falhou. Tente novamente.</p>
      <JumperButton onClick={handleGenerate} disabled={isGenerating}>
        Tentar Novamente
      </JumperButton>
    </div>
  ) : (
    <div className="text-center py-8">
      <p className="text-gray-600 mb-4">Clique no botão abaixo para gerar a apresentação HTML</p>
      <JumperButton onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        Gerar Apresentação
      </JumperButton>
    </div>
  )}
</DeckEditorStepCard>
```

---

## 8. MARKDOWN EDITOR SECTION (Add before Stages)

```tsx
{/* ⭐ NEW: MARKDOWN EDITOR SECTION */}
{canEdit && (
  <DeckEditorStepCard
    step={0}
    title="Markdown Source"
    subtitle="Edite o markdown para regenerar o deck"
    icon={FileText}
    status={deck.generation_status === 'completed' ? 'completed' : 'pending'}
    isOpen={showMarkdownEditor}
    onToggle={() => setShowMarkdownEditor(!showMarkdownEditor)}
    isLocked={false}
  >
    <MarkdownEditor
      deckId={deck.id}
      initialMarkdown={deck.markdown_source}
      onRegenerate={handleRegenerate}
    />
  </DeckEditorStepCard>
)}
```

---

## 9. PERMISSIONS EXAMPLE

```typescript
// Check before rendering editor-only features
if (canEdit) {
  // Show edit buttons, markdown editor, delete button
} else {
  // Show view-only elements
}

// Example:
{canEdit && (
  <JumperButton onClick={handleDelete} variant="destructive">
    <Trash2 className="h-4 w-4 mr-2" />
    Excluir
  </JumperButton>
)}
```

---

## 10. TESTING CHECKLIST

```typescript
// Test each feature:
// 1. Preview renders correctly (html_output first, file_url fallback)
// 2. Fullscreen button opens /decks/{id}/preview in new window
// 3. Share modal opens, generates link, can copy and revoke
// 4. Download button saves file to disk
// 5. Markdown editor saves drafts, regenerates deck
// 6. Version history shows all versions, can restore
// 7. AI refinement creates new versions
// 8. Delete button with confirmation removes deck
// 9. Permission checks prevent editing for non-owners
// 10. All modals/dialogs close properly
```

---

## QUICK REFERENCE

| Feature | Component | File | Time |
|---------|-----------|------|------|
| Fullscreen | Window.open | - | 5 min |
| Share | DeckShareModal | decks/DeckShareModal.tsx | 15 min |
| Version History | DeckVersionHistory | decks/DeckVersionHistory.tsx | 15 min |
| Markdown Edit | MarkdownEditor | decks/MarkdownEditor.tsx | 20 min |
| AI Refinement | DeckRefineModal | decks/DeckRefineModal.tsx | 15 min |
| Delete | Custom handler | - | 10 min |
| Preview enhancement | Updated iframe | - | 5 min |
| **TOTAL** | | | **85 minutes** |

