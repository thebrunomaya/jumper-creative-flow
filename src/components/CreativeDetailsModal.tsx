import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreativeFile {
  name: string;
  type: string;
  size: number;
  public_url: string;
  variation_index: number;
}

interface CreativeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any;
}

export const CreativeDetailsModal: React.FC<CreativeDetailsModalProps> = ({
  isOpen,
  onClose,
  submission
}) => {
  if (!submission) return null;

  const payload = submission.payload || {};
  const files = submission.files || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Detalhes do Criativo</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-full">
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">ID:</span>
                    <p className="text-sm text-muted-foreground">{submission.id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Status:</span>
                    <p className="text-sm text-muted-foreground">{submission.status}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Cliente:</span>
                    <p className="text-sm text-muted-foreground">{submission.client || submission.client_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Gerente:</span>
                    <p className="text-sm text-muted-foreground">{submission.manager_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Criado em:</span>
                    <p className="text-sm text-muted-foreground">{formatDate(submission.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Atualizado em:</span>
                    <p className="text-sm text-muted-foreground">{submission.updated_at ? formatDate(submission.updated_at) : '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurações da Campanha */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Campanha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">Plataforma:</span>
                    <p className="text-sm text-muted-foreground">{submission.platform || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Objetivo:</span>
                    <p className="text-sm text-muted-foreground">{submission.campaign_objective || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Tipo:</span>
                    <p className="text-sm text-muted-foreground">{submission.creative_type || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Total de Variações:</span>
                    <p className="text-sm text-muted-foreground">{submission.total_variations || 1}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Textos e CTAs */}
            {payload.variations && payload.variations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Textos e CTAs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {payload.variations.map((variation: any, index: number) => (
                      <div key={index} className="border rounded p-3">
                        <h4 className="font-medium mb-2">Variação {index + 1}</h4>
                        <div className="space-y-2">
                          {variation.primaryText && (
                            <div>
                              <span className="text-sm font-medium">Texto Principal:</span>
                              <p className="text-sm text-muted-foreground">{variation.primaryText}</p>
                            </div>
                          )}
                          {variation.headline && (
                            <div>
                              <span className="text-sm font-medium">Título:</span>
                              <p className="text-sm text-muted-foreground">{variation.headline}</p>
                            </div>
                          )}
                          {variation.description && (
                            <div>
                              <span className="text-sm font-medium">Descrição:</span>
                              <p className="text-sm text-muted-foreground">{variation.description}</p>
                            </div>
                          )}
                          {variation.cta && (
                            <div>
                              <span className="text-sm font-medium">CTA:</span>
                              <Badge variant="outline">{variation.cta}</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Arquivos */}
            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Arquivos ({files.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {files.map((file: CreativeFile, index: number) => (
                      <div key={index} className="flex items-center justify-between border rounded p-3">
                        <div className="flex-1">
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {file.type} • {formatFileSize(file.size)} • Variação {file.variation_index + 1}
                          </p>
                        </div>
                        {file.public_url && (
                          <a 
                            href={file.public_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            Ver arquivo
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Erro (se houver) */}
            {submission.error && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Erro</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap">{submission.error}</pre>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};