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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect sections
    if (line.startsWith('## 📋') || line.startsWith('## Resumo')) {
      currentSection = 'summary';
      continue;
    } else if (line.startsWith('## ⚡') || line.startsWith('## Ações')) {
      currentSection = 'actions';
      continue;
    } else if (line.startsWith('## 📊') || line.startsWith('## Métricas')) {
      currentSection = 'metrics';
      continue;
    } else if (line.startsWith('## 🎯') || line.startsWith('## Estratégia')) {
      currentSection = 'strategy';
      continue;
    } else if (line.startsWith('## 📅') || line.startsWith('## Próximos') || line.startsWith('## Timeline')) {
      currentSection = 'timeline';
      continue;
    }

    // Skip empty lines and headers
    if (!line || line.startsWith('#')) continue;

    // Parse content based on current section
    switch (currentSection) {
      case 'summary':
        summaryLines.push(line);
        break;

      case 'actions':
        if (line.startsWith('-') || line.startsWith('•')) {
          const actionText = line.replace(/^[-•]\s*/, '').trim();
          // Simple action object
          const action: OptimizationAction = {
            type: 'other',
            target: actionText,
            reason: actionText,
          };
          context.actions_taken?.push(action);
        }
        break;

      case 'metrics':
        // Parse metric lines like "**CPA:** R$ 45,30" or "CPA: 45.30"
        const metricMatch = line.match(/\*?\*?([^:]+):\*?\*?\s*(.+)/);
        if (metricMatch) {
          const [, key, value] = metricMatch;
          const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
          
          // Try to extract numeric value
          const numericMatch = value.match(/[\d.,]+/);
          if (numericMatch) {
            const numericValue = numericMatch[0].replace(',', '.');
            context.metrics_mentioned![normalizedKey] = parseFloat(numericValue);
          } else {
            // Store as string if not numeric
            context.metrics_mentioned![normalizedKey] = value.trim() as any;
          }
        }
        break;

      case 'strategy':
        if (line.startsWith('-') || line.startsWith('•')) {
          const strategyText = line.replace(/^[-•]\s*/, '').trim();
          if (!context.strategy) {
            context.strategy = {
              type: 'optimize',
              duration_days: 7,
              success_criteria: strategyText,
            };
          } else {
            // Append to success criteria
            context.strategy.success_criteria += `\n${strategyText}`;
          }
        }
        break;

      case 'timeline':
        if (line.startsWith('-') || line.startsWith('•')) {
          const timelineText = line.replace(/^[-•]\s*/, '').trim();
          if (!context.timeline) {
            context.timeline = {
              reevaluate_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
              milestones: [{
                date: new Date(),
                description: timelineText,
              }],
            };
          } else {
            context.timeline.milestones?.push({
              date: new Date(),
              description: timelineText,
            });
          }
        }
        break;
    }
  }

  // Join summary lines
  if (summaryLines.length > 0) {
    context.summary = summaryLines.join(' ').trim();
  }

  return context;
}
