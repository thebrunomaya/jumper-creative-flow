import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DeckShareModal } from "@/components/decks/DeckShareModal";
import {
  ArrowLeft,
  Eye,
  Share2,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  Building2,
  Calendar,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Deck {
  id: string;
  user_id: string;
  account_id: string | null;
  title: string;
  type: "report" | "plan" | "pitch";
  brand_identity: "jumper" | "koko";
  template_id: string;
  file_url: string | null;
  html_output: string | null;
  slug: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export default function DeckEditor() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "staff" | "client" | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check authentication
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate("/login");
          return;
        }

        // Fetch user role
        const { data: userData, error: userError } = await supabase
          .from("j_hub_users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError) throw userError;

        const role = userData.role as "admin" | "staff" | "client";
        setUserRole(role);

        // Fetch deck
        const { data: deckData, error: deckError } = await supabase
          .from("j_hub_decks")
          .select("*")
          .eq("id", deckId!)
          .single();

        if (deckError) throw deckError;
        if (!deckData) throw new Error("Deck não encontrado");

        setDeck(deckData);

        // Check edit permissions (staff can edit all, clients only their own)
        const canUserEdit =
          role === "admin" || role === "staff" || deckData.user_id === user.id;
        setCanEdit(canUserEdit);
      } catch (err: any) {
        console.error("Error fetching deck:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (deckId) {
      fetchDeck();
    }
  }, [deckId, navigate]);

  const handleDelete = async () => {
    if (!deck) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este deck? Esta ação não pode ser desfeita."
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase.from("j_hub_decks").delete().eq("id", deck.id);

      if (error) throw error;

      toast.success("Deck excluído com sucesso!");
      navigate("/decks");
    } catch (err: any) {
      console.error("Error deleting deck:", err);
      toast.error("Erro ao excluir deck", {
        description: err.message,
      });
    }
  };

  const handleDownload = () => {
    if (!deck || !deck.file_url) {
      toast.error("URL do deck não disponível");
      return;
    }

    window.open(deck.file_url, "_blank");
  };

  const handleOpenPreview = () => {
    if (!deck || !deck.file_url) {
      toast.error("URL do deck não disponível");
      return;
    }

    window.open(deck.file_url, "_blank");
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Error state
  if (error || !deck) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/decks")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertDescription>{error || "Deck não encontrado"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const typeLabels = {
    report: "Relatório",
    plan: "Planejamento",
    pitch: "Pitch",
  };

  const identityColors = {
    jumper: "bg-orange-100 text-orange-700 border-orange-300",
    koko: "bg-purple-100 text-purple-700 border-purple-300",
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/decks")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleOpenPreview}>
            <Eye className="mr-2 h-4 w-4" />
            Visualizar
          </Button>

          <Button variant="outline" onClick={() => setShareModalOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>

          {canEdit && (
            <>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Baixar
              </Button>

              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Deck info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{deck.title}</CardTitle>
              <CardDescription className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(deck.created_at), "dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </div>

                {deck.account_id && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Conta: {deck.account_id}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Template: {deck.template_id}</span>
                </div>
              </CardDescription>
            </div>

            <div className="flex gap-2">
              <Badge variant="outline" className={identityColors[deck.brand_identity]}>
                {deck.brand_identity === "jumper" ? "Jumper" : "Koko"}
              </Badge>

              <Badge variant="outline">{typeLabels[deck.type]}</Badge>

              {deck.is_public && (
                <Badge variant="outline">
                  {deck.slug ? "Público" : "Compartilhado"}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* HTML Preview */}
          {deck.file_url ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Preview da apresentação
                </p>
                <Button variant="outline" size="sm" onClick={handleOpenPreview}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir em nova aba
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden bg-muted">
                <iframe
                  src={deck.file_url}
                  className="w-full h-[600px]"
                  title={`Preview: ${deck.title}`}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                HTML não disponível. O deck pode ainda estar sendo processado.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Share Modal */}
      <DeckShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        deckId={deck.id}
        deckTitle={deck.title}
        currentSlug={deck.slug}
        isPublic={deck.is_public}
      />
    </div>
  );
}
