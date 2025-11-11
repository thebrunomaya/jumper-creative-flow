import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Presentation,
  TrendingUp,
  Edit,
  Share2,
  Trash2,
  MoreVertical,
  Globe,
  Lock,
  Building2,
  Calendar,
} from "lucide-react";
import { DeckWithDetails } from "@/hooks/useMyDecks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DeckCardProps {
  deck: DeckWithDetails;
  onEdit?: (deckId: string) => void;
  onShare?: (deckId: string) => void;
  onDelete?: (deckId: string) => void;
  canEdit?: boolean; // Staff can edit, clients can only view
  canDelete?: boolean; // Only admins or deck owners
}

export function DeckCard({
  deck,
  onEdit,
  onShare,
  onDelete,
  canEdit = false,
  canDelete = false,
}: DeckCardProps) {
  // Deck type icon mapping
  const typeIcons = {
    report: FileText,
    plan: TrendingUp,
    pitch: Presentation,
  };

  const TypeIcon = typeIcons[deck.type] || FileText;

  // Deck type label mapping
  const typeLabels = {
    report: "Relatório",
    plan: "Planejamento",
    pitch: "Pitch",
  };

  // Brand identity colors
  const identityColors = {
    jumper: "bg-orange-100 text-orange-700 border-orange-300",
    koko: "bg-purple-100 text-purple-700 border-purple-300",
  };

  // Type badge colors
  const typeBadgeColors = {
    report: "bg-blue-100 text-blue-700 border-blue-300",
    plan: "bg-green-100 text-green-700 border-green-300",
    pitch: "bg-amber-100 text-amber-700 border-amber-300",
  };

  const formattedDate = format(new Date(deck.created_at), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {/* Title and type */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <TypeIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold text-lg truncate">{deck.title}</h3>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={`${typeBadgeColors[deck.type]} text-xs font-medium`}
              >
                {typeLabels[deck.type]}
              </Badge>

              <Badge
                variant="outline"
                className={`${identityColors[deck.brand_identity]} text-xs font-medium`}
              >
                {deck.brand_identity === "jumper" ? "Jumper" : "Koko"}
              </Badge>

              {/* Version badge */}
              <Badge
                variant="outline"
                className={`${
                  deck.is_refined
                    ? "bg-amber-100 text-amber-700 border-amber-300"
                    : "bg-gray-100 text-gray-600 border-gray-300"
                } text-xs font-medium`}
              >
                v{deck.current_version}
                {deck.is_refined && " ✨"}
              </Badge>

              {deck.is_public && (
                <Badge variant="outline" className="text-xs font-medium">
                  {deck.slug ? (
                    <>
                      <Globe className="h-3 w-3 mr-1" />
                      Público
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 mr-1" />
                      Protegido
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(deck.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}

              {onShare && (
                <DropdownMenuItem onClick={() => onShare(deck.id)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar
                </DropdownMenuItem>
              )}

              {canDelete && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(deck.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Account info */}
        {deck.account_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{deck.account_name}</span>
          </div>
        )}

        {/* Template info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Presentation className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Template: {deck.template_id}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formattedDate}</span>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            {canEdit && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(deck.id)}
                className="h-8 px-2"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
