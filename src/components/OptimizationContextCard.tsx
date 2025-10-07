import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  CheckCircle2,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Pause,
  Play
} from "lucide-react";
import { OptimizationContext, getActionTypeLabel, getStrategyTypeLabel } from "@/types/optimization";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OptimizationContextCardProps {
  context: OptimizationContext;
}

export function OptimizationContextCard({ context }: OptimizationContextCardProps) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'pause_campaign':
      case 'pause_creative':
        return <Pause className="h-3 w-3" />;
      case 'activate_campaign':
        return <Play className="h-3 w-3" />;
      case 'increase_budget':
        return <ArrowUpCircle className="h-3 w-3" />;
      case 'decrease_budget':
        return <ArrowDownCircle className="h-3 w-3" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  const getConfidenceBadge = (level?: string) => {
    const variants = {
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    } as const;
    
    const labels = {
      high: 'Alta confiança',
      medium: 'Média confiança',
      low: 'Baixa confiança'
    };

    return (
      <Badge variant={variants[level as keyof typeof variants] || 'secondary'}>
        {labels[level as keyof typeof labels] || 'Média confiança'}
      </Badge>
    );
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Análise Concluída
            </h3>
            <p className="text-sm text-muted-foreground">
              {format(context.recorded_at, "PPP 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          {getConfidenceBadge(context.confidence_level)}
        </div>

        {/* Summary */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            Resumo Executivo
          </h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {context.summary}
          </p>
        </div>

        {/* Actions Taken */}
        {context.actions_taken && context.actions_taken.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Ações Realizadas ({context.actions_taken.length})
            </h4>
            <div className="space-y-2">
              {context.actions_taken.map((action, idx) => (
                <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-start gap-2 mb-2">
                    {getActionIcon(action.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {getActionTypeLabel(action.type)}
                        </Badge>
                        <span className="font-medium text-sm">{action.target}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{action.reason}</p>
                      {action.expected_impact && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="font-medium">Impacto esperado:</span> {action.expected_impact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metrics Mentioned */}
        {context.metrics_mentioned && Object.keys(context.metrics_mentioned).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Métricas Mencionadas
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(context.metrics_mentioned).map(([key, value]) => (
                <div key={key} className="p-2 bg-muted/30 rounded-lg text-center">
                  <div className="text-xs text-muted-foreground uppercase">{key}</div>
                  <div className="text-lg font-semibold">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategy */}
        {context.strategy && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Estratégia
            </h4>
            <div className="p-3 bg-muted/30 rounded-lg border border-border space-y-2">
              <div className="flex items-center gap-2">
                <Badge>{getStrategyTypeLabel(context.strategy.type)}</Badge>
                <span className="text-sm text-muted-foreground">
                  {context.strategy.duration_days} dias
                </span>
              </div>
              <p className="text-sm">
                <span className="font-medium">Critério de sucesso:</span>{' '}
                {context.strategy.success_criteria}
              </p>
              {context.strategy.hypothesis && (
                <p className="text-sm">
                  <span className="font-medium">Hipótese:</span>{' '}
                  {context.strategy.hypothesis}
                </p>
              )}
              {context.strategy.target_metric && (
                <p className="text-sm">
                  <span className="font-medium">Meta:</span>{' '}
                  {context.strategy.target_metric} = {context.strategy.target_value}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        {context.timeline && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Próximos Passos
            </h4>
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-sm">
                <span className="font-medium">Reavaliar em:</span>{' '}
                {format(new Date(context.timeline.reevaluate_date), "PPP", { locale: ptBR })}
              </p>
              {context.timeline.milestones && context.timeline.milestones.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Marcos:</p>
                  {context.timeline.milestones.map((milestone, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">
                        {format(new Date(milestone.date), "dd/MM", { locale: ptBR })}:
                      </span>{' '}
                      {milestone.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
