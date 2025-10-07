/**
 * MarkdownPreviewModal - Preview Markdown content before copying
 */

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JumperButton } from "@/components/ui/jumper-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface MarkdownPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  markdown: string;
  title: string;
}

export function MarkdownPreviewModal({
  open,
  onOpenChange,
  markdown,
  title,
}: MarkdownPreviewModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast.success("Markdown copiado com sucesso!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar Markdown");
      console.error("Copy error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Visualize o conteúdo antes de copiar para a área de transferência
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Visualização</TabsTrigger>
            <TabsTrigger value="raw">Markdown (Raw)</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <ScrollArea className="h-[50vh] border rounded-lg p-6">
              <article className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown}
                </ReactMarkdown>
              </article>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="raw" className="mt-4">
            <ScrollArea className="h-[50vh]">
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                <code>{markdown}</code>
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <JumperButton
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </JumperButton>
          <JumperButton
            variant="primary"
            onClick={handleCopy}
            disabled={copied}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Markdown
              </>
            )}
          </JumperButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
