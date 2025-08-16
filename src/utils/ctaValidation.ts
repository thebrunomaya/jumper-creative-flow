import { VALID_CTAS } from '@/types/creative';

export const validateCTA = (cta: string): { isValid: boolean; suggestion?: string } => {
  if (!cta || cta.trim() === '') {
    return { isValid: true }; // Empty CTA is valid (optional field)
  }

  const normalizedCta = cta.trim();
  
  // Check if CTA is in the valid list (case-insensitive)
  const exactMatch = VALID_CTAS.find(validCta => 
    validCta.toLowerCase() === normalizedCta.toLowerCase()
  );
  
  if (exactMatch) {
    return { isValid: true };
  }

  // Find closest match for suggestion
  const closestMatch = VALID_CTAS.find(validCta => 
    validCta.toLowerCase().includes(normalizedCta.toLowerCase()) ||
    normalizedCta.toLowerCase().includes(validCta.toLowerCase())
  );

  return {
    isValid: false,
    suggestion: closestMatch || VALID_CTAS[0]
  };
};

export const formatCTAForNotion = (cta: string): string => {
  if (!cta || cta.trim() === '') {
    return '';
  }
  
  return cta.trim();
};