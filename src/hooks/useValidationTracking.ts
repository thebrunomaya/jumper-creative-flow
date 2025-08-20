import { useState, useCallback } from 'react';
import { ValidationLog, ValidationResult, ValidationOverride } from '@/types/validation';
import { useAuth } from '@/contexts/AuthContext';

export const useValidationTracking = () => {
  const [validationHistory, setValidationHistory] = useState<ValidationLog[]>([]);
  const { currentUser } = useAuth();

  const logValidation = useCallback((
    validationResult: ValidationResult, 
    userAction: 'proceeded' | 'corrected' | 'blocked'
  ) => {
    const log: ValidationLog = {
      step: validationResult.step,
      timestamp: new Date().toISOString(),
      criticalErrors: validationResult.criticalErrors,
      warnings: validationResult.warnings,
      bypassedWarnings: userAction === 'proceeded' ? validationResult.warnings : [],
      userAction
    };

    setValidationHistory(prev => [...prev, log]);

    // Log para debug
    console.log('📝 Validation tracked:', {
      step: log.step,
      action: userAction,
      hadWarnings: log.warnings.length > 0,
      bypassedCount: log.bypassedWarnings.length
    });
  }, []);

  const getSubmissionWarnings = useCallback((): ValidationOverride[] => {
    return validationHistory
      .filter(log => log.bypassedWarnings.length > 0)
      .flatMap(log => 
        log.bypassedWarnings.map(warning => ({
          step: log.step,
          warning,
          timestamp: log.timestamp,
          userEmail: currentUser?.email
        }))
      );
  }, [validationHistory, currentUser]);

  const getValidationSummary = useCallback(() => {
    const bypassedWarnings = getSubmissionWarnings();
    const stepsWithIssues = [...new Set(validationHistory.map(log => log.step))];
    const totalWarningsBypassed = bypassedWarnings.length;
    const totalCriticalErrorsFixed = validationHistory
      .filter(log => log.criticalErrors.length > 0)
      .reduce((sum, log) => sum + log.criticalErrors.length, 0);

    return {
      bypassedWarnings,
      stepsWithIssues,
      totalWarningsBypassed,
      totalCriticalErrorsFixed,
      hasAnyBypassedWarnings: totalWarningsBypassed > 0
    };
  }, [validationHistory, getSubmissionWarnings]);

  const clearHistory = useCallback(() => {
    setValidationHistory([]);
  }, []);

  return {
    validationHistory,
    logValidation,
    getSubmissionWarnings,
    getValidationSummary,
    clearHistory
  };
};