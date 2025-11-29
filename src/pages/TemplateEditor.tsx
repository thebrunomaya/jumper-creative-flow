import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTemplateRead } from "@/hooks/useTemplateRead";
import { MonacoEditor } from "@/components/templates/MonacoEditor";
import { TemplatePreview } from "@/components/templates/TemplatePreview";
import { TemplateVersionHistory } from "@/components/templates/TemplateVersionHistory";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2, FileCode, Eye, History } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";

export default function TemplateEditor() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { userRole, isLoading: roleLoading } = useUserRole();
  const { data: template, isLoading, error } = useTemplateRead(templateId);

  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Verificando permissões...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  // Save template to Storage + create version
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

      // Create version entry in database
      // Get next version number
      const { data: existingVersions } = await supabase
        .from("j_hub_template_versions")
        .select("version_number")
        .eq("template_id", templateId)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion = existingVersions && existingVersions.length > 0
        ? existingVersions[0].version_number + 1
        : 1;

      // Insert new version
      const { error: versionError } = await supabase
        .from("j_hub_template_versions")
        .insert({
          template_id: templateId,
          version_number: nextVersion,
          html_content: editedContent,
          description: `Versão ${nextVersion}`,
        });

      if (versionError) {
        console.warn("Failed to create version:", versionError);
        // Don't fail the save if versioning fails
      }

      toast.success("Template salvo com sucesso!", {
        description: `Salvo como versão ${nextVersion}`,
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Carregando template...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* App Header */}
      <Header />

      {/* Editor Header */}
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
              onClick={() => setShowVersionHistory(!showVersionHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              Histórico
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

      {/* Tabs: Editor / Preview */}
      <Tabs defaultValue="editor" className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-6">
          <TabsList className="h-12">
            <TabsTrigger value="editor" className="gap-2">
              <FileCode className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="editor" className="flex-1 m-0 data-[state=active]:flex">
          <MonacoEditor
            value={editedContent}
            onChange={setEditedContent}
            readOnly={false}
          />
        </TabsContent>

        <TabsContent value="preview" className="flex-1 m-0 data-[state=active]:flex">
          <TemplatePreview htmlContent={editedContent} />
        </TabsContent>
      </Tabs>

      {/* Version History Sheet */}
      <TemplateVersionHistory
        templateId={templateId || ""}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onVersionRestore={(htmlContent) => {
          setEditedContent(htmlContent);
          toast.success("Versão restaurada no editor");
        }}
      />
    </div>
  );
}
