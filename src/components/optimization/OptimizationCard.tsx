/**
 * OptimizationCard - Horizontal compact card for optimization panel
 *
 * Layout: [Account | Manager | Tags | Date/Time | Buttons]
 */

import { JumperButton } from "@/components/ui/jumper-button";
import { TagBadgeList } from "@/components/optimization/TagBadge";
import { RadarTags } from "@/types/radarTags";
import { Eye, ExternalLink, AlertCircle } from "lucide-react";

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

  // Format date/time
  const date = new Date(recordedAt);
  const dateFormatted = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
  const timeFormatted = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Status icon based on extract
  const StatusIcon = hasExtract ? Eye : AlertCircle;
  const statusColor = hasExtract ? "text-green-600" : "text-orange-500";

  return (
    <div className="border-b border-border py-3 px-4 hover:bg-muted/30 transition-colors flex items-center gap-4">
      {/* Status Icon */}
      <div className="flex-shrink-0">
        <StatusIcon className={`h-5 w-5 ${statusColor}`} />
      </div>

      {/* Account Name */}
      <div className="flex-shrink-0 w-32 lg:w-40">
        <p className="font-medium text-sm truncate" title={accountName}>
          {accountName}
        </p>
      </div>

      {/* Manager */}
      <div className="flex-shrink-0 w-32 lg:w-40 hidden sm:block">
        <p className="text-sm text-muted-foreground truncate" title={recordedBy}>
          {recordedBy.split('@')[0]}
        </p>
      </div>

      {/* Tags */}
      <div className="flex-1 min-w-0">
        {hasExtract && displayTags.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <TagBadgeList tags={displayTags} size="sm" variant="outline" />
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

      {/* Date/Time */}
      <div className="flex-shrink-0 w-20 hidden md:block">
        <p className="text-xs text-muted-foreground">
          {dateFormatted}
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          {timeFormatted}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex gap-2">
        <JumperButton
          variant="ghost"
          size="sm"
          onClick={onOpenDrawer}
          disabled={!hasExtract}
          className="text-xs"
        >
          Ver Extrato
        </JumperButton>

        <JumperButton
          variant="outline"
          size="sm"
          onClick={onOpenFull}
          className="text-xs"
        >
          <ExternalLink className="h-3 w-3" />
        </JumperButton>
      </div>
    </div>
  );
}
