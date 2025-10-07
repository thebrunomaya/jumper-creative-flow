import { OptimizationContext, OptimizationAction, OptimizationStrategy, OptimizationTimeline } from "@/types/optimization";

/**
 * Parse Markdown back to OptimizationContext
 * Inverse of generateAnalysisMarkdown()
 */
export function parseMarkdownToContext(markdown: string): Partial<OptimizationContext> {
  const lines = markdown.split('\n');
  const context: Partial<OptimizationContext> = {
    actions_taken: [],
    metrics_mentioned: {},
    strategy: undefined,
    timeline: undefined,
  };

  let currentSection: 'summary' | 'actions' | 'metrics' | 'strategy' | 'timeline' | null = null;
  let summaryLines: string[] = [];
  let currentAction: Partial<OptimizationAction> | null = null;
  let strategyLines: { [key: string]: string } = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect sections
    if (line.startsWith('## 📋') || line.includes('Resumo')) {
      currentSection = 'summary';
      continue;
    } else if (line.startsWith('## 🎯') || line.includes('Ações')) {
      currentSection = 'actions';
      continue;
    } else if (line.startsWith('## 📊') || line.includes('Métricas')) {
      currentSection = 'metrics';
      continue;
    } else if (line.startsWith('## 🎲') || line.includes('Estratégia')) {
      currentSection = 'strategy';
      continue;
    } else if (line.startsWith('## 📅') || line.includes('Próximos')) {
      currentSection = 'timeline';
      continue;
    }

    // Skip headers, separators, and footers
    if (!line || line.startsWith('#') || line.startsWith('---') || line.startsWith('_Gerado')) continue;

    // Parse content based on current section
    switch (currentSection) {
      case 'summary':
        if (!line.startsWith('**') && !line.includes('Conta:') && !line.includes('Data:')) {
          summaryLines.push(line);
        }
        break;

      case 'actions':
        // Detect new action (###)
        if (line.startsWith('###')) {
          // Save previous action
          if (currentAction && currentAction.target && currentAction.reason) {
            context.actions_taken?.push(currentAction as OptimizationAction);
          }
          // Start new action
          currentAction = {
            type: 'other',
            target: '',
            reason: '',
          };
        } else if (currentAction && line.startsWith('-')) {
          // Parse action fields
          const fieldMatch = line.match(/^-\s*\*\*([^:]+):\*\*\s*(.+)/);
          if (fieldMatch) {
            const [, field, value] = fieldMatch;
            if (field.includes('Alvo')) {
              currentAction.target = value.trim();
            } else if (field.includes('Motivo')) {
              currentAction.reason = value.trim();
            } else if (field.includes('Impacto')) {
              currentAction.expected_impact = value.trim();
            }
          }
        }
        break;

      case 'metrics':
        // Skip table headers
        if (line.startsWith('|') && !line.includes('---')) {
          const cells = line.split('|').map(c => c.trim()).filter(c => c);
          if (cells.length === 2 && cells[0] !== 'Métrica') {
            const [metric, value] = cells;
            const numericMatch = value.match(/[\d.,]+/);
            if (numericMatch) {
              const numericValue = parseFloat(numericMatch[0].replace(',', '.'));
              context.metrics_mentioned![metric] = numericValue;
            } else {
              context.metrics_mentioned![metric] = value as any;
            }
          }
        }
        break;

      case 'strategy':
        if (line.startsWith('-')) {
          const fieldMatch = line.match(/^-\s*\*\*([^:]+):\*\*\s*(.+)/);
          if (fieldMatch) {
            const [, field, value] = fieldMatch;
            strategyLines[field] = value.trim();
          }
        }
        break;

      case 'timeline':
        // Parse reevaluate date
        if (line.includes('Reavaliar em:')) {
          const dateText = line.replace(/\*\*Reavaliar em:\*\*/, '').trim();
          // Simple date parsing - could be improved
          if (!context.timeline) {
            context.timeline = {
              reevaluate_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              milestones: [],
            };
          }
        } else if (line.match(/^\d+\./)) {
          // Parse milestone
          const milestoneMatch = line.match(/^\d+\.\s*\*\*(.+?):\*\*\s*(.+)/);
          if (milestoneMatch && context.timeline) {
            const [, dateText, description] = milestoneMatch;
            context.timeline.milestones?.push({
              date: new Date(),
              description: description.trim(),
            });
          }
        }
        break;
    }
  }

  // Save last action if exists
  if (currentAction && currentAction.target && currentAction.reason) {
    context.actions_taken?.push(currentAction as OptimizationAction);
  }

  // Build strategy object from collected lines
  if (Object.keys(strategyLines).length > 0) {
    const durationMatch = strategyLines['Duração']?.match(/(\d+)/);
    context.strategy = {
      type: 'optimize',
      duration_days: durationMatch ? parseInt(durationMatch[1]) : 7,
      success_criteria: strategyLines['Critério de sucesso'] || '',
      hypothesis: strategyLines['Hipótese'],
      target_metric: strategyLines['Métrica alvo'],
    };
  }

  // Join summary lines
  if (summaryLines.length > 0) {
    context.summary = summaryLines.join(' ').trim();
  }

  return context;
}
