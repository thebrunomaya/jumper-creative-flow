/**
 * TranscriptViewer - Displays formatted transcription with paragraphs
 * Used in Step 1 (Transcrição) to show readable text with natural breaks
 */

interface TranscriptViewerProps {
  content: string;
}

export function TranscriptViewer({ content }: TranscriptViewerProps) {
  if (!content || content.trim().length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma transcrição disponível
      </div>
    );
  }

  // Split by double line breaks to identify paragraphs
  const paragraphs = content
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, idx) => {
        // Within each paragraph, preserve single line breaks
        const lines = paragraph.split('\n');

        return (
          <p key={idx} className="text-foreground leading-relaxed text-sm">
            {lines.map((line, lineIdx) => (
              <span key={lineIdx}>
                {line}
                {lineIdx < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
