/**
 * OptimizationCard - Horizontal table-like layout with inline collapsible RADAR
 *
 * Layout:
 * Row 1: [Chevron] [Icon] Nome da conta - Gestor                    Data Hora
 * Row 2:                  REGISTRO tags (Panorama + Gasto)      Abrir
 * Row 3 (collapsed):      Full RADAR extract + all tags
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { JumperButton } from "@/components/ui/jumper-button";
import { TagBadgeList } from "@/components/optimization/TagBadge";
import { RadarTags } from "@/types/radarTags";
import { CheckCircle2, Clock, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OptimizationCardProps {
  recordingId: string;
  accountName: string;
  recordedBy: string;
  recordedAt: string; // ISO timestamp
  tags: RadarTags | null;
  hasExtract: boolean;
  extractText: string | null;
  onOpenFull: () => void;
}

export function OptimizationCard({
  recordingId,
  accountName,
  recordedBy,
  recordedAt,
  tags,
  hasExtract,
  extractText,
  onOpenFull,
}: OptimizationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse REGISTRO tags (always visible: Panorama + Gasto Atual)
  const registroTags = [];
  if (tags?.registro) {
    if (tags.registro.panorama) {
      registroTags.push({
        section: 'registro',
        category: 'panorama',
        value: tags.registro.panorama,
      });
    }
    if (tags.registro.gasto_atual) {
      registroTags.push({
        section: 'registro',
        category: 'gasto_atual',
        value: tags.registro.gasto_atual,
      });
    }
  }

  // Parse ALL tags for expanded view
  const allTags = [];
  if (tags) {
    // Registro
    if (tags.registro?.panorama) {
      allTags.push({ section: 'registro', category: 'panorama', value: tags.registro.panorama });
    }
    if (tags.registro?.gasto_atual) {
      allTags.push({ section: 'registro', category: 'gasto_atual', value: tags.registro.gasto_atual });
    }

    // Anomalia
    if (tags.anomalia?.metricas_principais) {
      tags.anomalia.metricas_principais.forEach((m) => {
        allTags.push({ section: 'anomalia', category: 'metricas_principais', value: m });
      });
    }

    // Diagnóstico
    if (tags.diagnostico?.hipoteses) {
      tags.diagnostico.hipoteses.forEach((h) => {
        allTags.push({ section: 'diagnostico', category: 'hipoteses', value: h });
      });
    }

    // Ação
    if (tags.acao?.acoes_executadas) {
      tags.acao.acoes_executadas.forEach((a) => {
        allTags.push({ section: 'acao', category: 'acoes_executadas', value: a });
      });
    }

    // Resultado Esperado
    if (tags.resultado_esperado?.resultados_esperados) {
      tags.resultado_esperado.resultados_esperados.forEach((r) => {
        allTags.push({ section: 'resultado_esperado', category: 'resultados_esperados', value: r });
      });
    }
  }

  // Status icon
  const StatusIcon = hasExtract ? CheckCircle2 : Clock;
  const statusColor = hasExtract ? "text-success" : "text-muted-foreground";

  // Format date and time
  const formattedDate = format(new Date(recordedAt), "dd/MM/yyyy", { locale: ptBR });
  const formattedTime = format(new Date(recordedAt), "HH:mm", { locale: ptBR });

  // Chevron icon
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <Card className="transition-all hover:border-primary/50">
      <CardContent className="p-3 space-y-2">
        {/* Header Section (always visible) */}
        <div className="flex items-start gap-3">
          {/* Chevron - Collapse/Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={!hasExtract}
            className="flex-shrink-0 pt-1 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isExpanded ? "Fechar extrato" : "Abrir extrato"}
          >
            <ChevronIcon className="h-4 w-4" />
          </button>

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

            {/* Row 2: REGISTRO tags (always visible)                Abrir */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                {hasExtract && registroTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 items-center">
                    <TagBadgeList
                      tags={registroTags}
                      size="sm"
                      variant="outline"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {hasExtract ? 'Sem tags de registro' : 'Extrato pendente'}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-shrink-0">
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

        {/* Expanded Section (collapsible) */}
        {isExpanded && hasExtract && (
          <div className="pl-10 space-y-4 border-t pt-4 mt-2">
            {/* Full Extract */}
            {extractText && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Extrato da Otimização</h4>
                <pre className="font-mono text-xs bg-muted/30 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {extractText}
                </pre>
              </div>
            )}

            {/* All Tags Organized */}
            {allTags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Todas as Tags</h4>
                <div className="flex flex-wrap gap-1">
                  <TagBadgeList
                    tags={allTags}
                    size="sm"
                    variant="outline"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
