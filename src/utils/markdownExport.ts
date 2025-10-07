/**
 * Markdown Export Utility
 * Generates Markdown content for optimization recordings
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  OptimizationContext,
  getActionTypeLabel,
  getStrategyTypeLabel,
} from '@/types/optimization';

export function generateAnalysisMarkdown(
  context: OptimizationContext,
  accountName: string,
  recordedBy: string,
  recordedAt: Date,
  durationSeconds?: number
): string {
  let markdown = '';

  // Header
  markdown += `# Extrato de Otimização\n\n`;
  markdown += `**Conta:** ${accountName}\n\n`;
  markdown += `**Data:** ${format(recordedAt, "PPP 'às' HH:mm", { locale: ptBR })}\n\n`;
  markdown += `**Gravado por:** ${recordedBy}\n\n`;

  if (durationSeconds) {
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    markdown += `**Duração:** ${mins}:${secs.toString().padStart(2, '0')}\n\n`;
  }

  // Confidence Level
  if (context.confidence_level) {
    const confidenceLabels: Record<string, string> = {
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa',
    };
    markdown += `**Nível de Confiança:** ${confidenceLabels[context.confidence_level] || context.confidence_level}\n\n`;
  }

  markdown += `---\n\n`;

  // Summary
  if (context.summary) {
    markdown += `## 📋 Resumo Executivo\n\n`;
    markdown += `${context.summary}\n\n`;
  }

  // Actions Taken
  if (context.actions_taken && context.actions_taken.length > 0) {
    markdown += `## 🎯 Ações Realizadas\n\n`;
    context.actions_taken.forEach((action, index) => {
      markdown += `### ${index + 1}. ${getActionTypeLabel(action.type)}\n\n`;
      markdown += `- **Alvo:** ${action.target}\n`;
      markdown += `- **Motivo:** ${action.reason}\n`;
      if (action.expected_impact) {
        markdown += `- **Impacto esperado:** ${action.expected_impact}\n`;
      }
      markdown += `\n`;
    });
  }

  // Metrics Mentioned
  if (context.metrics_mentioned && Object.keys(context.metrics_mentioned).length > 0) {
    markdown += `## 📊 Métricas Mencionadas\n\n`;
    markdown += `| Métrica | Valor |\n`;
    markdown += `|---------|-------|\n`;
    Object.entries(context.metrics_mentioned).forEach(([metric, value]) => {
      markdown += `| ${metric} | ${value} |\n`;
    });
    markdown += `\n`;
  }

  // Strategy
  if (context.strategy) {
    markdown += `## 🎲 Estratégia\n\n`;
    markdown += `- **Tipo:** ${getStrategyTypeLabel(context.strategy.type)}\n`;
    markdown += `- **Duração:** ${context.strategy.duration_days} dias\n`;
    markdown += `- **Critério de sucesso:** ${context.strategy.success_criteria}\n`;
    
    if (context.strategy.hypothesis) {
      markdown += `- **Hipótese:** ${context.strategy.hypothesis}\n`;
    }
    
    if (context.strategy.target_metric) {
      markdown += `- **Métrica alvo:** ${context.strategy.target_metric}`;
      if (context.strategy.target_value) {
        markdown += ` (${context.strategy.target_value})`;
      }
      markdown += `\n`;
    }
    markdown += `\n`;
  }

  // Timeline
  if (context.timeline) {
    markdown += `## 📅 Próximos Passos\n\n`;
    markdown += `**Reavaliar em:** ${format(new Date(context.timeline.reevaluate_date), 'PPP', { locale: ptBR })}\n\n`;
    
    if (context.timeline.milestones && context.timeline.milestones.length > 0) {
      markdown += `### Marcos:\n\n`;
      context.timeline.milestones.forEach((milestone, index) => {
        markdown += `${index + 1}. **${format(new Date(milestone.date), 'PP', { locale: ptBR })}:** ${milestone.description}\n`;
      });
      markdown += `\n`;
    }
  }

  // Footer
  markdown += `---\n\n`;
  markdown += `_Gerado em ${format(new Date(), "PPP 'às' HH:mm", { locale: ptBR })}_\n`;

  return markdown;
}
