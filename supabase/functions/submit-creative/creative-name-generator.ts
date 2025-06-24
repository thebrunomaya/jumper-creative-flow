
// Creative name generation functions
export function generateAccountCode(accountName: string, accountId: string): string {
  const cleanName = accountName.toUpperCase().replace(/[\s\-\_\.\,]/g, '');
  
  const firstLetter = cleanName[0] || 'X';
  const remainingChars = cleanName.slice(1);
  
  let consonants = remainingChars.replace(/[AEIOU]/g, '');
  
  if (consonants.length < 3) {
    consonants = remainingChars;
  }
  
  const finalChars = consonants.slice(0, 3).padEnd(3, 'X');
  
  return `${firstLetter}${finalChars}#${accountId.slice(-3)}`;
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
