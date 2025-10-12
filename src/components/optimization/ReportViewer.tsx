/**
 * ReportViewer - Renders oracle report with markdown formatting
 * Displays generated report with proper styling and metadata
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { OracleType } from './OracleCard';

interface ReportViewerProps {
  report: string;
  oracle: OracleType;
  generatedAt?: string;
  cached?: boolean;
}

const oracleConfig = {
  delfos: {
    icon: '🏛️',
    name: 'DELFOS',
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
  orfeu: {
    icon: '🎵',
    name: 'ORFEU',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  nostradamus: {
    icon: '📜',
    name: 'NOSTRADAMUS',
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  },
};

export function ReportViewer({
  report,
  oracle,
  generatedAt,
  cached = false,
}: ReportViewerProps) {
  const config = oracleConfig[oracle];

  return (
    <Card className="border-2">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={config.color}>
              {config.icon} {config.name}
            </Badge>
            {cached && (
              <Badge variant="secondary" className="text-xs">
                Do cache
              </Badge>
            )}
          </div>
          {generatedAt && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(generatedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              // Custom rendering for better styling
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold mb-4 text-foreground">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold mt-6 mb-3 text-foreground">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed text-foreground/90">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-foreground/90 leading-relaxed">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-foreground/90">{children}</em>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-4 text-muted-foreground">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
                  {children}
                </pre>
              ),
              hr: () => <hr className="my-6 border-border" />,
            }}
          >
            {report}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
