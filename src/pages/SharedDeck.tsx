import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

interface SharedDeckData {
  id: string;
  title: string;
  type: string;
  brand_identity: string;
  account_name: string | null;
  html_output: string | null;
  file_url: string | null;
  created_at: string;
  created_by: string;
}

export default function SharedDeck() {
  const { slug } = useParams<{ slug: string }>();

  const [loading, setLoading] = useState(true);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deck, setDeck] = useState<SharedDeckData | null>(null);

  useEffect(() => {
    if (slug) {
      fetchSharedDeck();
    }
  }, [slug]);

  const fetchSharedDeck = async (passwordAttempt?: string) => {
    try {
      setLoading(true);
      setError(null);
      setIsSubmitting(true);

      // Use direct fetch to bypass automatic auth header injection
      // This allows anonymous users to access shared decks
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY =
        import.meta.env.VITE_SUPABASE_ANON_KEY ||
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        'sb_publishable_5CJI2QQt8Crz60Mh1TTcrw_w4sL2TpL'; // Fallback for production

      // Debug: Log environment variables (without exposing full key)
      console.log('🔍 Environment check:', {
        SUPABASE_URL: SUPABASE_URL || 'MISSING',
        SUPABASE_ANON_KEY_PREFIX: SUPABASE_ANON_KEY?.substring(0, 20) || 'MISSING',
        NODE_ENV: import.meta.env.MODE,
      });

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('❌ Missing environment variables:', {
          SUPABASE_URL: !!SUPABASE_URL,
          SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY,
        });
        throw new Error('Configuração incorreta. Entre em contato com o suporte.');
      }

      console.log('🔍 Fetching shared deck:', {
        url: `${SUPABASE_URL}/functions/v1/j_hub_deck_view_shared`,
        slug,
        hasPassword: !!passwordAttempt,
      });

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/j_hub_deck_view_shared`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            slug: slug,
            password: passwordAttempt,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data) {
        throw new Error("Resposta inválida do servidor");
      }

      // Check if password is required
      if (data.password_required) {
        setPasswordRequired(true);

        if (passwordAttempt) {
          // Password was incorrect
          setError("Senha incorreta. Tente novamente.");
        }
        return;
      }

      // Success - deck data received
      if (data.success && data.deck) {
        setDeck(data.deck);
        setPasswordRequired(false);
      } else {
        throw new Error(data.error || "Deck não encontrado");
      }
    } catch (err: any) {
      console.error("Error fetching shared deck:", err);
      setError(err.message || "Erro ao carregar deck");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      setError("Digite a senha");
      return;
    }

    fetchSharedDeck(password);
  };

  // Loading state
  if (loading && !passwordRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password required
  if (passwordRequired && !deck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Deck Protegido
            </CardTitle>
            <CardDescription>
              Este deck é protegido por senha. Digite a senha para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite a senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="pr-10"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Acessar Deck"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !passwordRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Deck not found
  if (!deck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Deck não encontrado</CardTitle>
            <CardDescription>
              O link pode estar incorreto ou o deck pode ter sido removido.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Render deck HTML
  return (
    <div className="min-h-screen bg-black">
      {/* Deck metadata banner (optional, can be removed for cleaner view) */}
      <div className="bg-white border-b py-2 px-4 text-sm text-muted-foreground flex items-center justify-between">
        <span className="truncate">
          {deck.title}
          {deck.account_name && ` • ${deck.account_name}`}
        </span>
        <span className="text-xs">Criado por {deck.created_by}</span>
      </div>

      {/* Deck HTML iframe */}
      {deck.html_output ? (
        <iframe
          srcDoc={deck.html_output}
          className="w-full h-[calc(100vh-40px)]"
          title={deck.title}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      ) : deck.file_url ? (
        <iframe
          src={deck.file_url}
          className="w-full h-[calc(100vh-40px)]"
          title={deck.title}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      ) : (
        <div className="flex items-center justify-center h-[calc(100vh-40px)] text-white">
          <Alert className="max-w-md">
            <AlertDescription>
              HTML do deck não disponível. Entre em contato com o criador do deck.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
