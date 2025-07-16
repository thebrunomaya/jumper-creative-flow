import { FormData, GoogleAdsConfig, GOOGLE_ADS_TEXT_LIMITS, GOOGLE_ADS_SPECS } from '@/types/creative';
import googleAdsConfig from '@/config/google-ads-objectives.json';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FieldValidationResult {
  field: string;
  isValid: boolean;
  error?: string;
  warning?: string;
  count?: number;
  limit?: number;
  recommended?: number;
}

// Load Google Ads configuration
const config = googleAdsConfig as GoogleAdsConfig;

/**
 * Validates Google Ads form data based on campaign type
 */
export function validateGoogleAdsForm(formData: FormData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (formData.platform !== 'google' || !formData.googleCampaignType) {
    return { isValid: true, errors: [], warnings: [] };
  }

  const campaignType = formData.googleCampaignType;
  const typeConfig = config.typeConfigurations[campaignType];

  if (!typeConfig) {
    errors.push(`Configuração não encontrada para o tipo de campanha: ${campaignType}`);
    return { isValid: false, errors, warnings };
  }

  // Validate headlines
  const headlineValidation = validateHeadlines(formData, campaignType);
  if (!headlineValidation.isValid) {
    errors.push(...headlineValidation.errors);
  }
  warnings.push(...headlineValidation.warnings);

  // Validate descriptions
  const descriptionValidation = validateDescriptions(formData, campaignType);
  if (!descriptionValidation.isValid) {
    errors.push(...descriptionValidation.errors);
  }
  warnings.push(...descriptionValidation.warnings);

  // Validate campaign-specific requirements
  const specificValidation = validateCampaignSpecificRequirements(formData, campaignType, typeConfig);
  if (!specificValidation.isValid) {
    errors.push(...specificValidation.errors);
  }
  warnings.push(...specificValidation.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates headlines for Google Ads campaigns
 */
export function validateHeadlines(formData: FormData, campaignType: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!formData.headlines || !Array.isArray(formData.headlines)) {
    if (requiresHeadlines(campaignType)) {
      errors.push('Headlines são obrigatórios para este tipo de campanha');
    }
    return { isValid: errors.length === 0, errors, warnings };
  }

  const limits = GOOGLE_ADS_TEXT_LIMITS.headlines[campaignType as keyof typeof GOOGLE_ADS_TEXT_LIMITS.headlines];
  if (!limits) {
    return { isValid: true, errors: [], warnings: [] };
  }

  const validHeadlines = formData.headlines.filter(h => h && h.trim().length > 0);

  // Check minimum count
  if (validHeadlines.length < limits.min) {
    errors.push(`Mínimo de ${limits.min} headlines necessários (você tem ${validHeadlines.length})`);
  }

  // Check maximum count
  if (validHeadlines.length > limits.max) {
    errors.push(`Máximo de ${limits.max} headlines permitidos (você tem ${validHeadlines.length})`);
  }

  // Check character limits
  validHeadlines.forEach((headline, index) => {
    if (headline.length > limits.charLimit) {
      errors.push(`Headline ${index + 1} excede ${limits.charLimit} caracteres (${headline.length} caracteres)`);
    }
  });

  // Check recommended count
  if (validHeadlines.length < limits.recommended && validHeadlines.length >= limits.min) {
    warnings.push(`Recomendado ter ${limits.recommended} headlines para melhor performance (você tem ${validHeadlines.length})`);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates descriptions for Google Ads campaigns
 */
export function validateDescriptions(formData: FormData, campaignType: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!formData.descriptions || !Array.isArray(formData.descriptions)) {
    if (requiresDescriptions(campaignType)) {
      errors.push('Descriptions são obrigatórios para este tipo de campanha');
    }
    return { isValid: errors.length === 0, errors, warnings };
  }

  const limits = GOOGLE_ADS_TEXT_LIMITS.descriptions[campaignType as keyof typeof GOOGLE_ADS_TEXT_LIMITS.descriptions];
  if (!limits) {
    return { isValid: true, errors: [], warnings: [] };
  }

  const validDescriptions = formData.descriptions.filter(d => d && d.trim().length > 0);

  // Check minimum count
  if (validDescriptions.length < limits.min) {
    errors.push(`Mínimo de ${limits.min} descriptions necessários (você tem ${validDescriptions.length})`);
  }

  // Check maximum count
  if (validDescriptions.length > limits.max) {
    errors.push(`Máximo de ${limits.max} descriptions permitidos (você tem ${validDescriptions.length})`);
  }

  // Check character limits
  validDescriptions.forEach((description, index) => {
    if (description.length > limits.charLimit) {
      errors.push(`Description ${index + 1} excede ${limits.charLimit} caracteres (${description.length} caracteres)`);
    }
  });

  // Check recommended count
  if (validDescriptions.length < limits.recommended && validDescriptions.length >= limits.min) {
    warnings.push(`Recomendado ter ${limits.recommended} descriptions para melhor performance (você tem ${validDescriptions.length})`);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates campaign-specific requirements
 */
function validateCampaignSpecificRequirements(
  formData: FormData,
  campaignType: string,
  typeConfig: any
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (campaignType) {
    case 'search':
      // Validate paths
      if (formData.path1 && formData.path1.length > 15) {
        errors.push('Path 1 deve ter no máximo 15 caracteres');
      }
      if (formData.path2 && formData.path2.length > 15) {
        errors.push('Path 2 deve ter no máximo 15 caracteres');
      }
      break;

    case 'performance-max':
      // Business name is required
      if (!formData.businessName || formData.businessName.trim().length === 0) {
        errors.push('Nome da empresa é obrigatório para Performance Max');
      }
      
      // Logos are required
      if (!formData.logos || formData.logos.length === 0) {
        errors.push('Logos são obrigatórios para Performance Max');
      }
      
      // Images are required
      if (!formData.files || formData.files.length === 0) {
        errors.push('Imagens são obrigatórias para Performance Max');
      }
      break;

    case 'shopping':
      // Product feed is required
      if (!formData.productFeed) {
        errors.push('Feed de produtos é obrigatório para Shopping campaigns');
      }
      
      // Images are required
      if (!formData.files || formData.files.length === 0) {
        errors.push('Imagens de produtos são obrigatórias para Shopping campaigns');
      }
      break;

    case 'video':
      // Videos are required
      if (!formData.videos || formData.videos.length === 0) {
        errors.push('Vídeos são obrigatórios para Video campaigns');
      }
      break;

    case 'display':
    case 'demand-gen':
      // Images are required
      if (!formData.files || formData.files.length === 0) {
        errors.push('Imagens são obrigatórias para este tipo de campanha');
      }
      break;

    case 'app':
      // App store URL should be provided
      if (!formData.appStoreUrl || formData.appStoreUrl.trim().length === 0) {
        warnings.push('URL da App Store recomendada para melhor performance');
      }
      break;
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validates file uploads for Google Ads
 */
export function validateGoogleAdsFiles(files: File[], campaignType: string, fileType: 'image' | 'logo' | 'video' | 'productFeed'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!files || files.length === 0) {
    return { isValid: true, errors: [], warnings: [] };
  }

  const specs = GOOGLE_ADS_SPECS[fileType === 'productFeed' ? 'image' : fileType];
  
  files.forEach((file, index) => {
    // Check file format
    const fileExtension = file.name.split('.').pop()?.toUpperCase();
    if (fileExtension && !specs.formats.includes(fileExtension)) {
      errors.push(`Arquivo ${index + 1}: Formato ${fileExtension} não suportado. Use: ${specs.formats.join(', ')}`);
    }

    // Check file size
    if (file.size > specs.maxSize) {
      const maxSizeMB = Math.round(specs.maxSize / (1024 * 1024));
      const fileSizeMB = Math.round(file.size / (1024 * 1024));
      errors.push(`Arquivo ${index + 1}: Tamanho ${fileSizeMB}MB excede o limite de ${maxSizeMB}MB`);
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Get field validation details for real-time feedback
 */
export function getFieldValidation(
  formData: FormData,
  field: 'headlines' | 'descriptions' | 'path1' | 'path2' | 'businessName'
): FieldValidationResult {
  if (formData.platform !== 'google' || !formData.googleCampaignType) {
    return { field, isValid: true };
  }

  const campaignType = formData.googleCampaignType;

  switch (field) {
    case 'headlines':
      const headlineValidation = validateHeadlines(formData, campaignType);
      const headlineCount = formData.headlines?.filter(h => h && h.trim().length > 0).length || 0;
      const headlineLimits = GOOGLE_ADS_TEXT_LIMITS.headlines[campaignType as keyof typeof GOOGLE_ADS_TEXT_LIMITS.headlines];
      
      return {
        field,
        isValid: headlineValidation.isValid,
        error: headlineValidation.errors[0],
        warning: headlineValidation.warnings[0],
        count: headlineCount,
        limit: headlineLimits?.max,
        recommended: headlineLimits?.recommended
      };

    case 'descriptions':
      const descValidation = validateDescriptions(formData, campaignType);
      const descCount = formData.descriptions?.filter(d => d && d.trim().length > 0).length || 0;
      const descLimits = GOOGLE_ADS_TEXT_LIMITS.descriptions[campaignType as keyof typeof GOOGLE_ADS_TEXT_LIMITS.descriptions];
      
      return {
        field,
        isValid: descValidation.isValid,
        error: descValidation.errors[0],
        warning: descValidation.warnings[0],
        count: descCount,
        limit: descLimits?.max,
        recommended: descLimits?.recommended
      };

    case 'path1':
    case 'path2':
      const pathValue = formData[field] || '';
      const pathLimit = GOOGLE_ADS_TEXT_LIMITS.paths.search.charLimit;
      
      return {
        field,
        isValid: pathValue.length <= pathLimit,
        error: pathValue.length > pathLimit ? `Máximo ${pathLimit} caracteres` : undefined,
        count: pathValue.length,
        limit: pathLimit
      };

    case 'businessName':
      const businessName = formData.businessName || '';
      const isRequired = campaignType === 'performance-max';
      
      return {
        field,
        isValid: !isRequired || businessName.trim().length > 0,
        error: isRequired && businessName.trim().length === 0 ? 'Nome da empresa é obrigatório' : undefined
      };

    default:
      return { field, isValid: true };
  }
}

/**
 * Helper functions
 */
function requiresHeadlines(campaignType: string): boolean {
  return ['search', 'display', 'performance-max', 'demand-gen', 'app'].includes(campaignType);
}

function requiresDescriptions(campaignType: string): boolean {
  return ['search', 'display', 'performance-max', 'demand-gen', 'app'].includes(campaignType);
}

/**
 * Get available destinations for a campaign type
 */
export function getAvailableDestinations(campaignType: string) {
  const typeConfig = config.typeConfigurations[campaignType];
  return typeConfig?.destinations || [];
}

/**
 * Get available CTAs for a campaign type and destination
 */
export function getAvailableCTAs(campaignType: string, destination?: string) {
  const typeConfig = config.typeConfigurations[campaignType];
  if (!typeConfig || !destination) return [];
  
  const destinationConfig = typeConfig.destinations.find(d => d.value === destination);
  return destinationConfig?.ctas || [];
}

/**
 * Get asset requirements for a campaign type
 */
export function getAssetRequirements(campaignType: string) {
  const typeConfig = config.typeConfigurations[campaignType];
  return typeConfig?.assetRequirements || {};
}