/**
 * TranscriptionCorrectionCard - Allows user to correct transcription errors
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";

interface TranscriptionCorrectionCardProps {
  transcription: string;
  recordingId: string;
  onRegenerateSuccess: () => void;
}

export function TranscriptionCorrectionCard({
  transcription,
  recordingId,
  onRegenerateSuccess,
}: TranscriptionCorrectionCardProps) {
  const [correctionPrompt, setCorrectionPrompt] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    if (!correctionPrompt.trim()) {
      setError("Digite um prompt de correção antes de regenerar");
      return;
    }

    setIsRegenerating(true);
    setError(null);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { error: functionError } = await supabase.functions.invoke(
        "j_hub_optimization_transcribe",
        {
          body: {
            recording_id: recordingId,
            correction_prompt: correctionPrompt,
          },
        }
      );

      if (functionError) throw functionError;

      onRegenerateSuccess();
      setCorrectionPrompt("");
    } catch (err: any) {
      console.error("Regeneration error:", err);
      setError(err.message || "Erro ao regenerar transcrição");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Card className="border-yellow-500/20 bg-yellow-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          Correção de Transcrição
        </CardTitle>
        <CardDescription className="text-xs">
          Se a transcrição estiver incorreta, descreva os erros e clique em regenerar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Exemplo: 'CPA' foi transcrito como 'sepa', corrija para 'CPA'. 'ROAS' apareceu como 'ruas', corrija para 'ROAS'..."
          value={correctionPrompt}
          onChange={(e) => setCorrectionPrompt(e.target.value)}
          rows={4}
          className="text-sm"
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleRegenerate}
          disabled={isRegenerating || !correctionPrompt.trim()}
          className="w-full"
          size="sm"
        >
          {isRegenerating ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Regenerando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-3 w-3" />
              Regenerar Transcrição
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
