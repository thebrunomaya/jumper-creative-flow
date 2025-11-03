import { useEffect, useState } from "react";
import { DecksPanelList } from "@/components/decks/DecksPanelList";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

export default function Decks() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<"admin" | "staff" | "client" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
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

        // Fetch user role from j_hub_users
        const { data: userData, error: userError } = await supabase
          .from("j_hub_users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError) throw userError;

        if (!userData || !userData.role) {
          throw new Error("Usuário sem role definido");
        }

        setUserRole(userData.role as "admin" | "staff" | "client");
      } catch (err: any) {
        console.error("Error fetching user role:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar informações do usuário: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // User role not loaded
  if (!userRole) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>Não foi possível determinar suas permissões.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <DecksPanelList userRole={userRole} />
    </div>
  );
}
