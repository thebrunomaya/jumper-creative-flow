
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
  // Mapeamento de objetivos em português para códigos
  const codesPortuguese: Record<string, string> = {
    "Vendas": "CONV",
    "Conversões": "CONV", 
    "Tráfego": "TRAF",
    "Interações": "ENGA",
    "Engajamento": "ENGA",
    "Conversas": "MSGS",
    "Mensagens": "MSGS",
    "Cadastros": "LEAD",
    "Geração de leads": "LEAD",
    "Seguidores": "BRAN",
    "Reconhecimento da marca": "BRAN",
    "Divulgação": "RECH",
    "Alcance": "RECH",
    "Direções": "STOR",
    "Tráfego na loja": "STOR",
    "Aplicativo": "APPS",
    "Instalações do app": "APPS",
    "Visualizações de vídeo": "VIDE",
    "Vendas do catálogo": "CATA"
  };
  
  // Mapeamento de objetivos em inglês (mantido para compatibilidade)
  const codesEnglish: Record<string, string> = {
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
  
  return codesPortuguese[objective] || codesEnglish[objective] || "UNKN";
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
  jscId: string,
  managerInput: string,
  campaignObjective: string,
  creativeType: string,
  accountName: string,
  accountId: string
): string {
  const accountCode = generateAccountCode(accountName, accountId);
  const objCode = getObjectiveCode(campaignObjective);
  const typeCode = getTypeCode(creativeType);
  
  return `${jscId}_${managerInput}_${objCode}_${typeCode}_${accountCode}`;
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
    "JSC-XXX", // Mudado de CRT para JSC
    managerInput,
    campaignObjective,
    creativeType,
    accountName,
    accountId.substring(0, 3) + "..." // Mostra só os primeiros caracteres do ID
  );
}

// Nova função para preview detalhado sem número da conta
export function previewCreativeNameDetailed(
  managerInput: string,
  campaignObjective: string,
  creativeType: string,
  accountName: string
): string {
  const cleanName = accountName.toUpperCase().replace(/[\s\-\_\.\,]/g, '');
  const firstLetter = cleanName[0] || 'X';
  const remainingChars = cleanName.slice(1);
  
  let consonants = remainingChars.replace(/[AEIOU]/g, '');
  if (consonants.length < 3) {
    consonants = remainingChars;
  }
  
  const finalChars = consonants.slice(0, 3).padEnd(3, 'X');
  const accountCodeWithoutNumber = `${firstLetter}${finalChars}`;
  
  const objCode = getObjectiveCode(campaignObjective);
  const typeCode = getTypeCode(creativeType);
  
  return `JSC-XXX_${managerInput}_${objCode}_${typeCode}_${accountCodeWithoutNumber}#XXX`;
}
