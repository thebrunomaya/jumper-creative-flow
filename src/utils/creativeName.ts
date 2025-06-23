
/**
 * Gerador de Códigos de Conta - Jumper Studio
 * Fórmula: Primeira letra + 3 próximas consoantes + # + ID da conta
 */

export function generateAccountCode(accountName: string, accountId: string): string {
  const cleanName = accountName.toUpperCase().replace(/[\s\-\_\.\,]/g, '');
  
  // Primeira letra
  const firstLetter = cleanName[0] || 'X';
  
  // 3 próximas consoantes (após a primeira letra)
  const remainingChars = cleanName.slice(1);
  
  // Tenta pegar consoantes primeiro
  let consonants = remainingChars.replace(/[AEIOU]/g, '');
  
  // Se não tem consoantes suficientes, usa vogais também
  if (consonants.length < 3) {
    consonants = remainingChars; // Usa todos os caracteres
  }
  
  // Pega 3 primeiros e completa com X se necessário
  const finalChars = consonants.slice(0, 3).padEnd(3, 'X');
  
  // Adiciona # antes do ID da conta
  return `${firstLetter}${finalChars}#${accountId}`;
}

export function getObjectiveCode(objective: string): string {
  const codes: Record<string, string> = {
    "Conversions": "CONV",
    "Traffic": "TRAF",
    "Engagement": "ENGA",
    "Lead Generation": "LEAD",
    "Brand Awareness": "BRAN",
    "App Installs": "APPS",
    "Reach": "RECH",
    "Video Views": "VIDE",
    "Messages": "MSGS",
    "Store Traffic": "STOR",
    "Catalog Sales": "CATA"
  };
  return codes[objective] || "UNKN";
}

export function getTypeCode(type: string): string {
  const codes: Record<string, string> = {
    "single": "SING",
    "carousel": "CARR",
    "collection": "COLL",
    "existing-post": "POST"
  };
  return codes[type] || "UNKN";
}

export function generateCreativeName(
  crtId: string,
  managerInput: string,
  campaignObjective: string,
  creativeType: string,
  accountName: string,
  accountId: string
): string {
  const accountCode = generateAccountCode(accountName, accountId);
  const objCode = getObjectiveCode(campaignObjective);
  const typeCode = getTypeCode(creativeType);
  
  return `${crtId}_${managerInput}_${objCode}_${typeCode}_${accountCode}`;
}

export function validateCreativeName(input: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!input || input.trim().length === 0) {
    errors.push("Nome do criativo é obrigatório");
  }
  
  if (input.length > 20) {
    errors.push("Nome deve ter máximo 20 caracteres");
  }
  
  if (/\s/.test(input)) {
    errors.push("Nome não pode conter espaços (use _ se necessário)");
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(input)) {
    errors.push("Use apenas letras, números e underscore");
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

export function previewCreativeName(
  managerInput: string,
  campaignObjective: string,
  creativeType: string,
  accountName: string,
  accountId: string
): string {
  return generateCreativeName(
    "CRT-XXXX", // Placeholder para preview
    managerInput,
    campaignObjective,
    creativeType,
    accountName,
    accountId.substring(0, 3) + "..." // Mostra só os primeiros caracteres do ID
  );
}
