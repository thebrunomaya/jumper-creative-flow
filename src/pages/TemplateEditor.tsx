import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTemplateRead } from "@/hooks/useTemplateRead";
import { MonacoEditor } from "@/components/templates/MonacoEditor";
import { TemplatePreview } from "@/components/templates/TemplatePreview";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Eye, EyeOff, Loader2, FileCode } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

export default function TemplateEditor() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { userRole, isLoading: roleLoading } = useUserRole();
  const { data: template, isLoading, error } = useTemplateRead(templateId);

  const [editedContent, setEditedContent] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize edited content when template loads (MUST be before conditional returns)
  useEffect(() => {
    if (template?.html_content) {
      setEditedContent(template.html_content);
    }
  }, [template]);

  // Track unsaved changes (MUST be before conditional returns)
  useEffect(() => {
    if (template?.html_content && editedContent !== template.html_content) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [editedContent, template]);

  // Check if user is admin
  const isAdmin = userRole === "admin";

  // Redirect non-admins
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Acesso negado", {
        description: "Apenas administradores podem acessar esta página",
      });
      navigate("/decks/templates");
    }
  }, [roleLoading, isAdmin, navigate]);

  // Show loading while checking role
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  // Save template to Storage
  const handleSave = async () => {
    if (!templateId || !editedContent) return;

    setSaving(true);

    try {
      // Convert string to Blob with explicit UTF-8 encoding
      const encoder = new TextEncoder();
      const bytes = encoder.encode(editedContent);
      const blob = new Blob([bytes], { type: "text/html; charset=utf-8" });

      // Upload to Storage (overwrites existing file)
      const { error: uploadError } = await supabase.storage
        .from("decks")
        .upload(`templates/${templateId}.html`, blob, {
          cacheControl: "3600",
          upsert: true, // Overwrite existing file
          contentType: "text/html; charset=utf-8",
        });

      if (uploadError) throw uploadError;

      toast.success("Template salvo com sucesso!", {
        description: "As alterações foram aplicadas ao template",
      });

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Erro ao salvar template", {
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Carregando template...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 text-center">
          <FileCode className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Erro ao carregar template
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              {error instanceof Error ? error.message : "Erro desconhecido"}
            </p>
            <Button onClick={() => navigate("/decks/templates")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Templates
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/decks/templates")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{templateId}</h1>
              <p className="text-sm text-muted-foreground">
                {template.size.toLocaleString()} bytes
                {hasUnsavedChanges && " • Alterações não salvas"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Ocultar Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Mostrar Preview
                </>
              )}
            </Button>

            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              size="sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Monaco Editor */}
        <div
          className={`${
            showPreview ? "w-1/2" : "w-full"
          } border-r transition-all duration-300`}
        >
          <MonacoEditor
            value={editedContent}
            onChange={setEditedContent}
            readOnly={false}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2">
            <TemplatePreview htmlContent={editedContent} />
          </div>
        )}
      </div>
    </div>
  );
}
