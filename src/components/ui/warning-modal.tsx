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
import { AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  onGoBack: () => void;
  step: number;
  warnings: string[];
  criticalErrors?: string[];
}

const STEP_NAMES = {
  1: "Configuração",
  2: "Upload de Mídia", 
  3: "Textos e CTAs",
  4: "Revisão"
};

export function WarningModal({ 
  isOpen, 
  onClose, 
  onProceed, 
  onGoBack,
  step,
  warnings,
  criticalErrors = []
}: WarningModalProps) {
  const stepName = STEP_NAMES[step as keyof typeof STEP_NAMES] || `Step ${step}`;
  const hasCriticalErrors = criticalErrors.length > 0;
  const hasWarnings = warnings.length > 0;
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${hasCriticalErrors ? 'text-red-500' : 'text-yellow-500'}`} />
            {hasCriticalErrors ? 'Erros Encontrados' : 'Problemas Detectados'}
          </DialogTitle>
          <DialogDescription>
            {hasCriticalErrors 
              ? `Encontramos erros que impedem o prosseguimento em "${stepName}".`
              : `Detectamos alguns problemas em "${stepName}" que você pode corrigir ou prosseguir mesmo assim.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Critical Errors */}
          {hasCriticalErrors && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="destructive">Crítico</Badge>
                <span className="text-sm font-medium text-red-700">Corrija antes de continuar</span>
              </div>
              <ul className="space-y-1 text-sm">
                {criticalErrors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2 text-red-600">
                    <span className="text-red-500 mt-1">•</span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Opcional
                </Badge>
                <span className="text-sm font-medium text-yellow-700">
                  Pode continuar ou corrigir
                </span>
              </div>
              <ul className="space-y-1 text-sm">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2 text-yellow-600">
                    <span className="text-yellow-500 mt-1">⚠</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!hasCriticalErrors && hasWarnings && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs text-yellow-700">
                💡 <strong>Dica:</strong> Estes problemas não impedem o envio, mas corrigi-los pode melhorar 
                a performance do seu anúncio.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onGoBack} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Voltar e Corrigir
          </Button>
          
          {!hasCriticalErrors && (
            <Button 
              onClick={onProceed} 
              variant="secondary"
              className="flex items-center gap-1"
            >
              Continuar Mesmo Assim
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}