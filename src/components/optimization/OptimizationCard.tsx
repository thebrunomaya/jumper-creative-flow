/**
 * OptimizationCard - Card styled like OptimizationListCompact
 *
 * Layout: [Icon] [Account + Manager + Date] [RADAR Tags] [Buttons]
 */

import { Card, CardContent } from "@/components/ui/card";
import { JumperButton } from "@/components/ui/jumper-button";
import { TagBadgeList } from "@/components/optimization/TagBadge";
import { RadarTags } from "@/types/radarTags";
import { CheckCircle2, Clock, Eye, ExternalLink } from "lucide-react";
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

  // Calculate remaining actions
  const totalActions = tags?.acao?.acoes_executadas?.length || 0;
  const remainingActions = totalActions > 2 ? totalActions - 2 : 0;

  // Status icon
  const StatusIcon = hasExtract ? CheckCircle2 : Clock;
  const statusColor = hasExtract ? "text-success" : "text-muted-foreground";

  // Format date
  const relativeTime = formatDistanceToNow(new Date(recordedAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Card className="cursor-pointer transition-all hover:border-primary/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Status Icon */}
          <div className="flex-shrink-0">
            <StatusIcon className={`h-4 w-4 ${statusColor}`} />
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Account Name */}
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">
                {accountName}
              </p>
              <span className="text-xs text-muted-foreground">
                • {relativeTime}
              </span>
            </div>

            {/* Manager */}
            <p className="text-xs text-muted-foreground truncate">
              {recordedBy}
            </p>
          </div>

          {/* RADAR Tags (Right Side) */}
          <div className="flex flex-col gap-2 items-end flex-shrink-0 min-w-0">
            {hasExtract && displayTags.length > 0 ? (
              <div className="flex flex-wrap gap-1 justify-end">
                <TagBadgeList
                  tags={displayTags}
                  size="sm"
                  variant="outline"
                />
                {remainingActions > 0 && (
                  <span className="text-xs text-muted-foreground self-center">
                    +{remainingActions}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                {hasExtract ? 'Sem tags' : 'Extrato pendente'}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
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
      </CardContent>
    </Card>
  );
}
