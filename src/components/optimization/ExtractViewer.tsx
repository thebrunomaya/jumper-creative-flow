/**
 * ExtractViewer - Displays extracted optimization actions (Step 3)
 * Supports both RADAR format (structured report) and Legacy format (bullet list)
 */

import { DollarSign, Image, Layers, Type } from "lucide-react";

interface ExtractViewerProps {
  content: string;
  format?: 'radar' | 'legacy'; // Optional format hint
}

// Map category names to icons
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  VERBA: DollarSign,
  CRIATIVOS: Image,
  CONJUNTOS: Layers,
  COPY: Type,
};

// Map category names to colors
const CATEGORY_COLORS: Record<string, string> = {
  VERBA: "text-green-600 dark:text-green-400",
  CRIATIVOS: "text-blue-600 dark:text-blue-400",
  CONJUNTOS: "text-purple-600 dark:text-purple-400",
  COPY: "text-orange-600 dark:text-orange-400",
};

export function ExtractViewer({ content, format }: ExtractViewerProps) {
  if (!content || content.trim().length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum extrato disponível
      </div>
    );
  }

  // Auto-detect RADAR format if not explicitly provided
  const isRadarFormat = format === 'radar' || content.includes('┌─') || content.includes('│');

  // Render RADAR format (preserve box characters and formatting)
  if (isRadarFormat) {
    return (
      <div className="space-y-4">
        <pre className="font-mono text-sm bg-muted/30 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {content}
        </pre>
      </div>
    );
  }

  // Legacy format: Parse bullet lines
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('•'));

  if (lines.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma ação identificada
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lines.map((line, idx) => {
        // Extract category and description
        const match = line.match(/•\s*\[(\w+)\]\s*(.+)/);
        if (!match) {
          // Fallback for lines without category
          return (
            <div key={idx} className="flex items-start gap-3 text-sm">
              <span className="text-muted-foreground">•</span>
              <span className="text-foreground leading-relaxed">{line.replace('•', '').trim()}</span>
            </div>
          );
        }

        const [, category, description] = match;
        const Icon = CATEGORY_ICONS[category] || Type;
        const colorClass = CATEGORY_COLORS[category] || "text-muted-foreground";

        return (
          <div key={idx} className="flex items-start gap-3">
            {/* Category Icon */}
            <div className={`flex-shrink-0 mt-0.5 ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>

            {/* Action Description */}
            <div className="flex-1">
              <span className={`font-semibold ${colorClass}`}>[{category}]</span>{' '}
              <span className="text-foreground leading-relaxed">{description}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
