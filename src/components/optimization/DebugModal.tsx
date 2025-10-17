/**
 * DebugModal - Shows AI API logs for debugging (Admin only)
 * Displays prompts, responses, tokens, latency for each step
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { JumperButton } from "@/components/ui/jumper-button";
import { Bug, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface DebugModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordingId: string;
  step: 'transcribe' | 'process' | 'analyze' | 'improve_transcript' | 'improve_processed';
}

interface APILog {
  id: string;
  recording_id: string;
  step: string;
  prompt_sent: string | null;
  model_used: string | null;
  input_preview: string | null;
  output_preview: string | null;
  tokens_used: number | null;
  latency_ms: number | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

const stepLabels = {
  transcribe: 'Passo 1: Transcrição (Whisper)',
  process: 'Passo 2: Processamento (Claude Bullets)',
  analyze: 'Passo 3: Análise (IA)',
  improve_transcript: 'Ajuste de Transcrição com IA (Claude)',
  improve_processed: 'Ajuste de Bullets com IA (Claude)',
};

export function DebugModal({ open, onOpenChange, recordingId, step }: DebugModalProps) {
  const [logs, setLogs] = useState<APILog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, step, recordingId]);

  const toggleExpand = (logId: string, field: string) => {
    setExpandedFields(prev => ({
      ...prev,
      [logId]: {
        ...prev[logId],
        [field]: !prev[logId]?.[field]
      }
    }));
  };

  const isExpanded = (logId: string, field: string) => {
    return expandedFields[logId]?.[field] || false;
  };

  async function fetchLogs() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('j_hub_optimization_api_logs')
        .select('*')
        .eq('recording_id', recordingId)
        .eq('step', step)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching logs:', error);
        throw error;
      }

      setLogs((data || []) as APILog[]);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debug - {stepLabels[step]}
          </DialogTitle>
        </DialogHeader>

        <div className="pr-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Carregando logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bug className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">Nenhum log encontrado para esta etapa</p>
              <p className="text-xs mt-2">
                Logs serão criados quando a função for executada
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <Card key={log.id} className={log.success ? '' : 'border-destructive'}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-mono">
                        {new Date(log.created_at).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'medium'
                        })}
                      </CardTitle>
                      {log.success ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          ✓ Sucesso
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          ✗ Erro
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Input Preview */}
                    {log.input_preview && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            📥 Input (preview)
                          </Label>
                          <JumperButton
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(log.id, 'input')}
                            className="h-6 text-xs"
                          >
                            {isExpanded(log.id, 'input') ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Colapsar
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Expandir
                              </>
                            )}
                          </JumperButton>
                        </div>
                        <Textarea
                          readOnly
                          value={log.input_preview}
                          className="mt-1 font-mono text-xs resize-none"
                          rows={isExpanded(log.id, 'input') ? 20 : 3}
                        />
                      </div>
                    )}

                    {/* Prompt Sent */}
                    {log.prompt_sent && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            💬 Prompt Enviado para API
                          </Label>
                          <JumperButton
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(log.id, 'prompt')}
                            className="h-6 text-xs"
                          >
                            {isExpanded(log.id, 'prompt') ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Colapsar
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Expandir
                              </>
                            )}
                          </JumperButton>
                        </div>
                        <Textarea
                          readOnly
                          value={log.prompt_sent}
                          className="mt-1 font-mono text-xs resize-none"
                          rows={isExpanded(log.id, 'prompt') ? 30 : 8}
                        />
                      </div>
                    )}

                    {/* Output Preview */}
                    {log.output_preview && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            📤 Output (preview)
                          </Label>
                          <JumperButton
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(log.id, 'output')}
                            className="h-6 text-xs"
                          >
                            {isExpanded(log.id, 'output') ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Colapsar
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Expandir
                              </>
                            )}
                          </JumperButton>
                        </div>
                        <Textarea
                          readOnly
                          value={log.output_preview}
                          className="mt-1 font-mono text-xs resize-none"
                          rows={isExpanded(log.id, 'output') ? 25 : 6}
                        />
                      </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-4 gap-3 pt-2 border-t">
                      <div>
                        <Label className="text-xs text-muted-foreground">Modelo</Label>
                        <p className="font-mono text-sm font-medium truncate" title={log.model_used || 'N/A'}>
                          {log.model_used || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Tokens</Label>
                        <p className="font-mono text-sm font-medium">
                          {log.tokens_used !== null ? log.tokens_used.toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Latência</Label>
                        <p className="font-mono text-sm font-medium">
                          {log.latency_ms !== null ? `${log.latency_ms}ms` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">ID</Label>
                        <p className="font-mono text-xs truncate" title={log.id}>
                          {log.id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>

                    {/* Error Message */}
                    {log.error_message && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {log.error_message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
