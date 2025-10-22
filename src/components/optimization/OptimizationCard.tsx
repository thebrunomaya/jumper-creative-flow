/**
 * OptimizationCard - Card view for optimization in executive panel
 *
 * Displays: Account, Manager, Date, Tags, Action Buttons
 * Used in: Optimization.tsx (main panel)
 */

import { Card, CardContent } from "@/components/ui/card";
import { JumperButton } from "@/components/ui/jumper-button";
import { TagBadgeList } from "@/components/optimization/TagBadge";
import { RadarTags } from "@/types/radarTags";
import { Eye, ExternalLink, Calendar, User, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OptimizationCardProps {
  recordingId: string;
  accountName: string;
  recordedBy: string;
  recordedAt: string; // ISO timestamp
  tags: RadarTags | null;
  hasExtract: boolean;
  onOpenDrawer: () => void;
  onOpenFull: () => void;
}

export function OptimizationCard({
  recordingId,
  accountName,
  recordedBy,
  recordedAt,
  tags,
  hasExtract,
  onOpenDrawer,
  onOpenFull,
}: OptimizationCardProps) {
  // Parse tags for display (Panorama + Top 2 Actions)
  const displayTags = [];

  if (tags) {
    // Add Panorama tag
    if (tags.registro?.panorama) {
      displayTags.push({
        section: 'registro',
        category: 'panorama',
        value: tags.registro.panorama,
      });
    }

    // Add top 2 actions
    const actions = tags.acao?.acoes_executadas || [];
    actions.slice(0, 2).forEach((action) => {
      displayTags.push({
        section: 'acao',
        category: 'acoes_executadas',
        value: action,
      });
    });
  }

  // Calculate remaining actions for "+X more" badge
  const totalActions = tags?.acao?.acoes_executadas?.length || 0;
  const remainingActions = totalActions > 2 ? totalActions - 2 : 0;

  // Format date
  const relativeTime = formatDistanceToNow(new Date(recordedAt), {
    addSuffix: true,
    locale: ptBR,
  });

  const absoluteDate = new Date(recordedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="hover:border-primary/50 transition-all">
      <CardContent className="p-4 space-y-3">
        {/* Header: Account, Manager, Date */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            {/* Account Name */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold text-base truncate">{accountName}</h3>
            </div>

            {/* Manager */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{recordedBy}</span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span title={absoluteDate}>{relativeTime}</span>
            </div>
          </div>
        </div>

        {/* Tags Section */}
        {hasExtract && displayTags.length > 0 ? (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1.5">Tags:</p>
            <div className="flex flex-wrap gap-1.5">
              <TagBadgeList
                tags={displayTags}
                size="sm"
                variant="outline"
              />
              {remainingActions > 0 && (
                <span className="text-xs text-muted-foreground self-center">
                  +{remainingActions} ações
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground italic">
              {hasExtract ? 'Sem tags atribuídas' : 'Extrato não gerado'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <JumperButton
            variant="outline"
            size="sm"
            onClick={onOpenDrawer}
            disabled={!hasExtract}
            className="flex-1"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Ver RADAR
          </JumperButton>

          <JumperButton
            variant="default"
            size="sm"
            onClick={onOpenFull}
            className="flex-1"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Abrir Completo
          </JumperButton>
        </div>
      </CardContent>
    </Card>
  );
}
