/**
 * OptimizationCard - Horizontal table-like layout
 *
 * Layout:
 * Row 1: [Icon] Nome da conta - Gestor                    Data Hora
 * Row 2:        Tags tags tags tags                Ver Extrato - Abrir
 */

import { Card, CardContent } from "@/components/ui/card";
import { JumperButton } from "@/components/ui/jumper-button";
import { TagBadgeList } from "@/components/optimization/TagBadge";
import { RadarTags } from "@/types/radarTags";
import { CheckCircle2, Clock, Eye, ExternalLink } from "lucide-react";
import { format } from "date-fns";
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

  // Debug: Log received tags
  console.log('[OptimizationCard] Recording:', recordingId.slice(0, 8), {
    hasTags: !!tags,
    tags: tags,
    panorama: tags?.registro?.panorama,
    gasto: tags?.registro?.gasto_atual,
    actions: tags?.acao?.acoes_executadas
  });

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

  console.log('[OptimizationCard] displayTags:', displayTags);

  // Calculate remaining actions
  const totalActions = tags?.acao?.acoes_executadas?.length || 0;
  const remainingActions = totalActions > 2 ? totalActions - 2 : 0;

  // Status icon
  const StatusIcon = hasExtract ? CheckCircle2 : Clock;
  const statusColor = hasExtract ? "text-success" : "text-muted-foreground";

  // Format date and time
  const formattedDate = format(new Date(recordedAt), "dd/MM/yyyy", { locale: ptBR });
  const formattedTime = format(new Date(recordedAt), "HH:mm", { locale: ptBR });

  return (
    <Card className="transition-all hover:border-primary/50">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="flex-shrink-0 pt-1">
            <StatusIcon className={`h-4 w-4 ${statusColor}`} />
          </div>

          {/* Main Content - 2 rows */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Row 1: Nome da conta - Gestor                    Data Hora */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-medium text-sm truncate">{accountName}</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-sm text-muted-foreground truncate">{recordedBy}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 text-sm text-muted-foreground">
                <span>{formattedDate}</span>
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* Row 2: Tags tags tags tags                Ver Extrato - Abrir */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                {hasExtract && displayTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 items-center">
                    <TagBadgeList
                      tags={displayTags}
                      size="sm"
                      variant="outline"
                    />
                    {remainingActions > 0 && (
                      <span className="text-xs text-muted-foreground">
                        +{remainingActions}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {hasExtract ? 'Sem tags' : 'Extrato pendente'}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-shrink-0">
                <JumperButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDrawer();
                  }}
                  disabled={!hasExtract}
                  className="text-xs h-7"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver Extrato
                </JumperButton>

                <JumperButton
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFull();
                  }}
                  className="text-xs h-7"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Abrir
                </JumperButton>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
