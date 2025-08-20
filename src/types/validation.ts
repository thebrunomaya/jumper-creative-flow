export interface ValidationError {
  field: string;
  message: string;
  type: 'critical' | 'warning';
}

export interface ValidationResult {
  canProceed: boolean;           // Só FALSE para erros CRÍTICOS que impedem funcionamento
  criticalErrors: string[];      // Erros que impedem funcionamento (cliente, plataforma, etc.)
  warnings: string[];            // Problemas que permitem continuar (CTA, títulos vazios, etc.)
  hasIssues: boolean;           // Tem qualquer tipo de problema
  step: number;                 // Qual step foi validado
}

export interface ValidationLog {
  step: number;
  timestamp: string;
  criticalErrors: string[];
  warnings: string[];
  bypassedWarnings: string[];   // Warnings que o gerente optou por ignorar
  userAction: 'proceeded' | 'corrected' | 'blocked';
}

export interface ValidationOverride {
  step: number;
  warning: string;
  timestamp: string;
  userEmail?: string;
}

// Configuração de quais validações são críticas vs warnings
export interface ValidationConfig {
  step1: {
    critical: string[];  // ['client', 'platform']
    warnings: string[];  // ['campaignObjective', 'creativeType', 'creativeName']
  };
  step2: {
    critical: string[];  // ['files']
    warnings: string[];  // ['invalidFiles', 'incompletePositioning']
  };
  step3: {
    critical: string[];  // ['destinationUrl']
    warnings: string[];  // ['titles', 'mainTexts', 'cta', 'description']
  };
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  step1: {
    critical: ['client', 'platform'],
    warnings: ['campaignObjective', 'creativeType', 'creativeName']
  },
  step2: {
    critical: ['files'],
    warnings: ['invalidFiles', 'incompletePositioning']
  },
  step3: {
    critical: ['destinationUrl'],
    warnings: ['titles', 'mainTexts', 'cta', 'description']
  }
};