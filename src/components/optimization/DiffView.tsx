import { diffWords } from 'diff';

interface DiffViewProps {
  oldText: string;
  newText: string;
}

/**
 * Component to display text differences with color-coded additions and removals
 */
export function DiffView({ oldText, newText }: DiffViewProps) {
  const diff = diffWords(oldText, newText);

  return (
    <div className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
      {diff.map((part, index) => {
        if (part.added) {
          return (
            <span
              key={index}
              className="bg-green-500/20 text-green-700 dark:text-green-300 px-0.5 rounded"
            >
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span
              key={index}
              className="bg-red-500/20 text-red-700 dark:text-red-300 line-through px-0.5 rounded"
            >
              {part.value}
            </span>
          );
        }
        return <span key={index}>{part.value}</span>;
      })}
    </div>
  );
}
