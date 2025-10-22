/**
 * RadarDrawer - Drawer for quick RADAR visualization
 *
 * Shows RADAR extract + visual tags without full editor
 */

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { JumperButton } from "@/components/ui/jumper-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TagBadge } from "@/components/optimization/TagBadge";
import { RadarTags } from "@/types/radarTags";
import { ExternalLink, Share2, X, Building2, User, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface RadarDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordingId: string;
  accountName: string;
  recordedBy: string;
  recordedAt: string;
  radarText: string;
  tags: RadarTags | null;
  onOpenFull: () => void;
  onShare?: () => void;
}

export function RadarDrawer({
  open,
  onOpenChange,
  recordingId,
  accountName,
  recordedBy,
  recordedAt,
  radarText,
  tags,
  onOpenFull,
  onShare,
}: RadarDrawerProps) {
  // Parse tags for visual display
  const tagSections = [];

  if (tags) {
    // Registro
    if (tags.registro?.panorama || tags.registro?.gasto_atual) {
      tagSections.push({
        name: 'REGISTRO',
        tags: [
          tags.registro.panorama && { section: 'registro', category: 'panorama', value: tags.registro.panorama },
          tags.registro.gasto_atual && { section: 'registro', category: 'gasto_atual', value: tags.registro.gasto_atual },
        ].filter(Boolean) as any[],
      });
    }

    // Anomalia
    const anomaliaTags = [
      ...(tags.anomalia?.pontos_negativos || []).map((v) => ({ section: 'anomalia', category: 'pontos_negativos', value: v })),
      ...(tags.anomalia?.pontos_positivos || []).map((v) => ({ section: 'anomalia', category: 'pontos_positivos', value: v })),
    ];
    if (anomaliaTags.length > 0) {
      tagSections.push({ name: 'ANOMALIA', tags: anomaliaTags });
    }

    // Ação
    const acaoTags = (tags.acao?.acoes_executadas || []).map((v) => ({ section: 'acao', category: 'acoes_executadas', value: v }));
    if (acaoTags.length > 0) {
      tagSections.push({ name: 'AÇÃO', tags: acaoTags });
    }

    // Resultado Esperado
    const resultadoTags = [
      ...(tags.resultado_esperado?.proxima_acao || []).map((v) => ({ section: 'resultado_esperado', category: 'proxima_acao', value: v })),
      tags.resultado_esperado?.expectativa_impacto && { section: 'resultado_esperado', category: 'expectativa_impacto', value: tags.resultado_esperado.expectativa_impacto },
    ].filter(Boolean) as any[];
    if (resultadoTags.length > 0) {
      tagSections.push({ name: 'RESULTADO ESPERADO', tags: resultadoTags });
    }
  }

  // Format date
  const formattedDate = new Date(recordedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-xl font-bold">RADAR - Extrato Rápido</SheetTitle>
          <SheetDescription className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{accountName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{recordedBy}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
          </SheetDescription>
        </SheetHeader>

        {/* Content */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-6">
            {/* RADAR Text */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Extrato RADAR</h3>
              <pre className="text-sm font-mono bg-muted/30 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {radarText}
              </pre>
            </div>

            {/* Tags Section */}
            {tagSections.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Tags de Organização</h3>
                  <div className="space-y-4">
                    {tagSections.map((section) => (
                      <div key={section.name}>
                        <p className="text-xs font-medium text-muted-foreground mb-2">{section.name}</p>
                        <div className="flex flex-wrap gap-2">
                          {section.tags.map((tag, idx) => (
                            <TagBadge
                              key={idx}
                              sectionKey={tag.section}
                              categoryKey={tag.category}
                              value={tag.value}
                              size="md"
                              variant="outline"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-background space-y-2">
          <JumperButton
            onClick={onOpenFull}
            className="w-full"
            size="lg"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir Otimização Completa
          </JumperButton>

          {onShare && (
            <JumperButton
              onClick={onShare}
              variant="outline"
              className="w-full"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </JumperButton>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
