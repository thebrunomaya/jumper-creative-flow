import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Send, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ValidationOverride } from '@/types/validation';

interface FinalSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onGoBackAndFix: () => void;
  bypassedWarnings: ValidationOverride[];
  isSubmitting?: boolean;
}

const STEP_NAMES = {
  1: "Configuração",
  2: "Upload de Mídia", 
  3: "Textos e CTAs",
  4: "Revisão"
};

export function FinalSubmissionModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  onGoBackAndFix,
  bypassedWarnings,
  isSubmitting = false
}: FinalSubmissionModalProps) {
  
  const hasWarnings = bypassedWarnings.length > 0;
  const warningsByStep = bypassedWarnings.reduce((acc, warning) => {
    if (!acc[warning.step]) acc[warning.step] = [];
    acc[warning.step].push(warning);
    return acc;
  }, {} as Record<number, ValidationOverride[]>);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasWarnings ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {hasWarnings ? 'Confirmar Envio com Problemas' : 'Pronto para Envio'}
          </DialogTitle>
          <DialogDescription>
            {hasWarnings 
              ? `Você optou por continuar com ${bypassedWarnings.length} problema(s) detectado(s). Deseja mesmo enviar assim?`
              : 'Todos os campos estão corretos. Confirme o envio do criativo.'
            }
          </DialogDescription>
        </DialogHeader>

        {hasWarnings && (
          <div className="py-4 max-h-64 overflow-y-auto">
            <div className="mb-3">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                ⚠️ Problemas Ignorados
              </Badge>
            </div>

            <div className="space-y-3">
              {Object.entries(warningsByStep).map(([stepStr, warnings]) => {
                const step = parseInt(stepStr);
                const stepName = STEP_NAMES[step as keyof typeof STEP_NAMES] || `Step ${step}`;
                
                return (
                  <div key={step} className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                    <div className="font-medium text-yellow-800 text-sm mb-2">
                      📍 {stepName}
                    </div>
                    <ul className="space-y-1">
                      {warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                          <span className="text-yellow-500 mt-0.5">•</span>
                          {warning.warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-xs text-amber-700">
                <strong>📝 Registro:</strong> Estes problemas serão registrados nos logs para 
                análise pelos gestores e não afetarão o funcionamento do sistema.
              </p>
            </div>
          </div>
        )}

        {!hasWarnings && (
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">
                <strong>Tudo certo!</strong> Seu criativo passou por todas as validações.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onGoBackAndFix} disabled={isSubmitting}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar e Corrigir
          </Button>
          
          <Button 
            onClick={onSubmit}
            disabled={isSubmitting}
            variant={hasWarnings ? "destructive" : "default"}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                {hasWarnings ? 'Enviar Mesmo Assim' : 'Confirmar Envio'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}