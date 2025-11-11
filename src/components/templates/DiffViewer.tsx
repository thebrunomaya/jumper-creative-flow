import { useMemo } from "react";
import * as Diff from "diff";

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  oldLabel?: string;
  newLabel?: string;
}

export function DiffViewer({
  oldContent,
  newContent,
  oldLabel = "Template A",
  newLabel = "Template B",
}: DiffViewerProps) {
  const diffResult = useMemo(() => {
    return Diff.diffLines(oldContent, newContent);
  }, [oldContent, newContent]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let unchanged = 0;

    diffResult.forEach((part) => {
      const lineCount = part.count || 0;
      if (part.added) {
        added += lineCount;
      } else if (part.removed) {
        removed += lineCount;
      } else {
        unchanged += lineCount;
      }
    });

    return { added, removed, unchanged };
  }, [diffResult]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with stats */}
      <div className="border-b bg-muted/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="font-medium">{oldLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="font-medium">{newLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              <span className="font-medium text-green-600">+{stats.added}</span> adicionadas
            </span>
            <span>
              <span className="font-medium text-red-600">-{stats.removed}</span> removidas
            </span>
            <span>
              <span className="font-medium">{stats.unchanged}</span> inalteradas
            </span>
          </div>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-sm font-mono leading-relaxed">
          {diffResult.map((part, index) => {
            let bgColor = "";
            let textColor = "";
            let prefix = " ";

            if (part.added) {
              bgColor = "bg-green-50";
              textColor = "text-green-900";
              prefix = "+";
            } else if (part.removed) {
              bgColor = "bg-red-50";
              textColor = "text-red-900";
              prefix = "-";
            }

            return (
              <span
                key={index}
                className={`${bgColor} ${textColor} block`}
              >
                {part.value.split("\n").map((line, lineIndex) => {
                  if (lineIndex === part.value.split("\n").length - 1 && line === "") {
                    return null;
                  }
                  return (
                    <span key={lineIndex} className="block">
                      <span className="inline-block w-4 text-muted-foreground select-none">
                        {prefix}
                      </span>
                      {line}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </pre>
      </div>
    </div>
  );
}
