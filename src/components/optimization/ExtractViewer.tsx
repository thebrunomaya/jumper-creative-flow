/**
 * ExtractViewer - Displays extracted optimization actions (Step 3)
 * RADAR methodology: Internal vs External actions with semantic colors
 */

import {
  Plus, Play, Pause, Trash2, Settings, TrendingUp, Beaker,
  Eye, MessageSquare, Clock, AlertCircle, Send
} from "lucide-react";

interface ExtractViewerProps {
  content: string;
}

// Map action verbs to icons (RADAR methodology)
const VERB_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  // Internal actions - Platform
  Criou: Plus,
  Publicou: Play,
  Duplicou: Plus,
  Pausou: Pause,
  Ativou: Play,
  Reativou: Play,
  Excluiu: Trash2,
  Ajustou: Settings,
  Realocou: Settings,
  Corrigiu: AlertCircle,
  Escalou: TrendingUp,
  Testou: Beaker,
  Observou: Eye,

  // External actions - Third-party
  Solicitou: MessageSquare,
  Informou: MessageSquare,
  Aguardando: Clock,
  Abriu: AlertCircle,
  Enviou: Send,
};

// Map action verbs to semantic colors
const VERB_COLORS: Record<string, string> = {
  // Creation actions - Blue
  Criou: "text-blue-600 dark:text-blue-400",
  Publicou: "text-blue-600 dark:text-blue-400",
  Duplicou: "text-blue-600 dark:text-blue-400",

  // Activation/Pause - Purple
  Pausou: "text-purple-600 dark:text-purple-400",
  Ativou: "text-purple-600 dark:text-purple-400",
  Reativou: "text-purple-600 dark:text-purple-400",

  // Deletion - Red
  Excluiu: "text-red-600 dark:text-red-400",

  // Budget/Settings - Green
  Ajustou: "text-green-600 dark:text-green-400",
  Realocou: "text-green-600 dark:text-green-400",
  Escalou: "text-green-600 dark:text-green-400",

  // Correction/Testing - Orange
  Corrigiu: "text-orange-600 dark:text-orange-400",
  Testou: "text-orange-600 dark:text-orange-400",

  // Observation - Amber
  Observou: "text-amber-600 dark:text-amber-400",

  // External actions - Gray (neutral)
  Solicitou: "text-gray-600 dark:text-gray-400",
  Informou: "text-gray-600 dark:text-gray-400",
  Aguardando: "text-gray-600 dark:text-gray-400",
  Abriu: "text-gray-600 dark:text-gray-400",
  Enviou: "text-gray-600 dark:text-gray-400",
};

export function ExtractViewer({ content }: ExtractViewerProps) {
  if (!content || content.trim().length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum extrato disponível
      </div>
    );
  }

  // Parse lines and group by internal/external
  const allLines = content.split('\n').map((line) => line.trim());
  const actionLines = allLines.filter((line) => line.startsWith('-'));

  if (actionLines.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma ação identificada
      </div>
    );
  }

  // Find separator (empty line) between internal and external actions
  const emptyLineIndex = allLines.findIndex((line, idx) => {
    return idx > 0 && line === '' && allLines[idx - 1].startsWith('-');
  });

  const internalActions = emptyLineIndex > 0
    ? actionLines.slice(0, actionLines.findIndex((_, idx) => allLines.indexOf(actionLines[idx]) >= emptyLineIndex))
    : actionLines;

  const externalActions = emptyLineIndex > 0
    ? actionLines.slice(internalActions.length)
    : [];

  const renderAction = (line: string, idx: number) => {
    // Extract verb and description: - [Verb]: description
    const match = line.match(/-\s*\[(\w+)\]:\s*(.+)/);
    if (!match) {
      // Fallback for lines without proper format
      return (
        <div key={idx} className="flex items-start gap-3 text-sm">
          <span className="text-muted-foreground">-</span>
          <span className="text-foreground leading-relaxed">{line.replace('-', '').trim()}</span>
        </div>
      );
    }

    const [, verb, description] = match;
    const Icon = VERB_ICONS[verb] || AlertCircle;
    const colorClass = VERB_COLORS[verb] || "text-muted-foreground";

    return (
      <div key={idx} className="flex items-start gap-3">
        {/* Verb Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Action Description */}
        <div className="flex-1">
          <span className={`font-semibold ${colorClass}`}>[{verb}]</span>{' '}
          <span className="text-foreground leading-relaxed">{description}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Internal Actions */}
      {internalActions.length > 0 && (
        <div className="space-y-3">
          {internalActions.map((line, idx) => renderAction(line, idx))}
        </div>
      )}

      {/* Separator between internal and external */}
      {externalActions.length > 0 && (
        <>
          <div className="border-t border-muted my-4" />
          <div className="space-y-3">
            {externalActions.map((line, idx) => renderAction(line, internalActions.length + idx))}
          </div>
        </>
      )}
    </div>
  );
}
