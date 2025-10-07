/**
 * ProcessingOverlay - Full-screen blocking overlay showing upload/transcription/analysis progress
 * Displays animated steps with real-time status updates
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JumperLoading } from "@/components/ui/jumper-loading";
import { ProgressFeedback, ErrorMessage } from "@/components/ui/feedback";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export type ProcessingStep = 'upload' | 'transcribe' | 'analyze' | 'complete' | 'error';

interface ProcessingOverlayProps {
  isOpen: boolean;
  currentStep: ProcessingStep;
  error?: string | null;
  onRetry?: () => void;
  onClose?: () => void;
}

export function ProcessingOverlay({ 
  isOpen, 
  currentStep, 
  error, 
  onRetry, 
  onClose 
}: ProcessingOverlayProps) {
  if (!isOpen) return null;

  const steps = [
    { key: 'upload', label: 'Upload do áudio' },
    { key: 'transcribe', label: 'Transcrevendo com Whisper' },
    { key: 'analyze', label: 'Analisando com IA' },
  ];

  const getStepStatus = (stepKey: string) => {
    const stepIndex = steps.findIndex(s => s.key === stepKey);
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    
    if (currentStep === 'error') {
      // Mark all steps as incomplete if error
      return stepIndex <= currentIndex ? 'error' : 'pending';
    }
    
    if (currentStep === 'complete') {
      return 'complete';
    }
    
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'processing';
    return 'pending';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  const progressPercentage = currentStep === 'complete' ? 100 
    : currentStep === 'error' ? 0
    : currentStep === 'upload' ? 33
    : currentStep === 'transcribe' ? 66
    : currentStep === 'analyze' ? 90
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-lg">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-primary/20">
        <CardContent className="p-8">
          {/* Logo animado */}
          <div className="flex justify-center mb-8">
            <JumperLoading size="lg" />
          </div>

          {currentStep === 'error' && error ? (
            // Error state
            <div className="space-y-6">
              <ErrorMessage
                title="Erro no processamento"
                description={error}
                className="mb-4"
              />
              <div className="flex gap-3">
                <Button 
                  onClick={onRetry} 
                  className="flex-1"
                  size="lg"
                >
                  Tentar Novamente
                </Button>
                <Button 
                  onClick={onClose} 
                  variant="outline"
                  size="lg"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : currentStep === 'complete' ? (
            // Success state
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-success mx-auto animate-in zoom-in duration-500" />
              <h3 className="text-xl font-semibold text-success">
                Processamento Concluído!
              </h3>
              <p className="text-sm text-muted-foreground">
                Sua otimização foi transcrita e analisada com sucesso.
              </p>
            </div>
          ) : (
            // Processing state
            <div className="space-y-6">
              {/* Progress bar */}
              <ProgressFeedback
                progress={progressPercentage}
                title="Processando otimização"
                description="Aguarde enquanto processamos seu áudio..."
                showPercentage
              />

              {/* Steps checklist */}
              <div className="space-y-3 mt-6">
                {steps.map((step) => {
                  const status = getStepStatus(step.key);
                  return (
                    <div 
                      key={step.key}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 transition-all"
                    >
                      {getStepIcon(status)}
                      <span className={`text-sm font-medium ${
                        status === 'complete' ? 'text-success' :
                        status === 'processing' ? 'text-primary' :
                        status === 'error' ? 'text-destructive' :
                        'text-muted-foreground'
                      }`}>
                        {step.label}
                      </span>
                      {status === 'processing' && (
                        <span className="ml-auto text-xs text-muted-foreground animate-pulse">
                          Em andamento...
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Current step message */}
              <div className="text-center mt-4">
                <p className="text-xs text-muted-foreground">
                  {currentStep === 'upload' && 'Enviando áudio para o servidor...'}
                  {currentStep === 'transcribe' && 'Convertendo áudio em texto com Whisper AI...'}
                  {currentStep === 'analyze' && 'Extraindo insights com GPT-4...'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
