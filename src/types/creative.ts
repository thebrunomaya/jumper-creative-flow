export interface FormData {
  // Step 1 - Basic Info
  client: string;
  managerId?: string;
  partner: string;
  platform: 'meta' | 'google';
  campaignObjective?: string; // New field for campaign objective from account
  creativeType?: 'single' | 'carousel' | 'collection' | 'existing-post'; // For Meta Ads
  googleCampaignType?: 'search' | 'display' | 'performance-max' | 'shopping' | 'video' | 'demand-gen' | 'app'; // For Google Ads
  objective?: 'sales' | 'traffic' | 'awareness' | 'leads' | 'engagement';
  creativeName: string; // New field for creative name

  // Step 2
  files: File[];
  validatedFiles: ValidatedFile[];
  mediaVariations?: MediaVariation[]; // New field for multiple media sets
  existingPost?: ExistingPostData; // New field for existing post
  
  // Carousel specific fields (Meta Ads)
  carouselAspectRatio?: '1:1' | '4:5'; // Toggle de proporção no topo
  carouselCards?: CarouselCard[]; // Array de cartões do carrossel
  
  // Google Ads specific fields
  headlines?: string[]; // For Search, Display, Performance Max, Demand Gen, App
  descriptions?: string[]; // For all Google Ads types
  path1?: string; // Search only (15 char limit)
  path2?: string; // Search only (15 char limit)
  businessName?: string; // Performance Max (required)
  logos?: File[]; // Performance Max (required)
  videos?: File[]; // Video campaigns (required)
  productFeed?: File; // Shopping campaigns (required)
  merchantId?: string; // Shopping (optional)
  appStoreUrl?: string; // App campaigns
  
  // Step 3 - Updated for multiple titles and main texts + new conditional fields
  mainTexts: string[]; // Changed from single mainText to array (Meta Ads)
  titles: string[]; // Changed from single headline to array of titles (Meta Ads)
  description: string;
  destination?: string; // New field for destination type
  cta?: string; // New field for CTA (conditional)
  destinationUrl: string;
  callToAction: string; // Keep existing for backward compatibility
  observations: string;
}

export interface ValidatedFile {
  file: File;
  valid: boolean;
  dimensions?: { width: number; height: number };
  duration?: number;
  errors: string[];
  preview?: string;
  format?: 'square' | 'vertical' | 'horizontal' | 'carousel-1:1' | 'carousel-4:5'; // Add carousel formats
}

export interface MediaVariation {
  id: number;
  squareFile?: ValidatedFile;
  verticalFile?: ValidatedFile;
  horizontalFile?: ValidatedFile;
  squareEnabled?: boolean; // New field to control if square position is enabled
  verticalEnabled?: boolean; // New field to control if vertical position is enabled
  horizontalEnabled?: boolean; // New field to control if horizontal position is enabled
}

export interface CarouselCard {
  id: number;
  file?: ValidatedFile; // Um arquivo por card na proporção selecionada
  // Campos individualizáveis (quando toggle ativo)
  customTitle?: string;
  customDescription?: string;
  customDestinationUrl?: string;
  customCta?: string;
}

// Enhanced interface for existing post data
export interface ExistingPostData {
  instagramUrl: string;
  postId?: string;
  username?: string; // New field for extracted username
  contentType?: 'post' | 'reel' | 'igtv'; // New field for content type
  valid: boolean;
  errors: string[];
}

export interface Client {
  id: string;
  name: string;
  objectives?: string[]; // Add objectives array
}

export interface Partner {
  id: string;
  name: string;
}

// Dados removidos - agora são buscados do Notion via API
export const CLIENTS: Client[] = [];
export const PARTNERS: Partner[] = [];

export const VALID_CTAS = [
  'Compre Agora', 'Saiba Mais', 'Cadastre-se', 'Baixe Agora',
  'Entre em Contato', 'Ligar Agora', 'Enviar Mensagem', 
  'Ver Mais', 'Obter Oferta', 'Instalar Agora'
];

export const META_SPECS = {
  image: {
    square: { width: 1080, height: 1080, maxSize: 30 * 1024 * 1024 },
    vertical: { width: 1080, height: 1920, maxSize: 30 * 1024 * 1024 },
    horizontal: { width: 1200, height: 628, maxSize: 30 * 1024 * 1024 }
  },
  video: {
    feed: { width: 1080, height: 1080, maxSize: 4 * 1024 * 1024 * 1024, duration: [15, 60] },
    stories: { width: 1080, height: 1920, maxSize: 4 * 1024 * 1024 * 1024, duration: [15, 60] }
  },
  // Carousel specifications
  carousel: {
    '1:1': { width: 1080, height: 1080, maxSize: 30 * 1024 * 1024, safeZone: 80 },
    '4:5': { width: 1080, height: 1350, maxSize: 30 * 1024 * 1024, topMargin: 250, bottomMargin: 250 }
  }
};

// Updated text limits with recommended and maximum values
export const TEXT_LIMITS = {
  mainText: {
    recommended: 80, // Updated for carousel
    maximum: 5000
  },
  title: {
    recommended: 45, // Updated for carousel
    maximum: 255
  },
  description: {
    recommended: 18, // Updated for carousel
    maximum: 200
  }
};

// Maximum number of variations for Meta Ads
export const META_TEXT_VARIATIONS = {
  maxTitles: 5,
  maxMainTexts: 5
};

// Carousel limits
export const CAROUSEL_LIMITS = {
  minCards: 2,
  maxCards: 10
};

// Google Ads types and interfaces
export interface GoogleAdsObjectiveConfig {
  availableTypes: GoogleAdsCampaignTypeConfig[];
}

export interface GoogleAdsCampaignTypeConfig {
  value: string;
  label: string;
  description: string;
  recommended: boolean;
}

export interface GoogleAdsDestination {
  value: string;
  label: string;
  ctas: string[];
  fieldType: 'url' | 'phone';
}

export interface GoogleAdsAssetRequirement {
  min?: number;
  max?: number;
  charLimit?: number;
  recommended?: number;
  required?: boolean;
  formats?: string[];
  maxSize?: number;
  minSize?: string;
}

export interface GoogleAdsTypeConfiguration {
  destinations: GoogleAdsDestination[];
  assetRequirements: Record<string, GoogleAdsAssetRequirement>;
}

export interface GoogleAdsConfig {
  objectiveToTypes: Record<string, GoogleAdsObjectiveConfig>;
  typeConfigurations: Record<string, GoogleAdsTypeConfiguration>;
}

// Google Ads text limits for different campaign types
export const GOOGLE_ADS_TEXT_LIMITS = {
  headlines: {
    search: { min: 3, max: 15, charLimit: 30, recommended: 10 },
    display: { min: 1, max: 5, charLimit: 30, recommended: 3 },
    'performance-max': { min: 3, max: 15, charLimit: 30, recommended: 10 },
    'demand-gen': { min: 1, max: 5, charLimit: 30, recommended: 3 },
    app: { min: 2, max: 5, charLimit: 30, recommended: 3 }
  },
  descriptions: {
    search: { min: 2, max: 4, charLimit: 90, recommended: 4 },
    display: { min: 1, max: 5, charLimit: 90, recommended: 3 },
    'performance-max': { min: 1, max: 5, charLimit: 90, recommended: 4 },
    'demand-gen': { min: 1, max: 5, charLimit: 90, recommended: 3 },
    app: { min: 1, max: 5, charLimit: 90, recommended: 3 }
  },
  paths: {
    search: { charLimit: 15 }
  }
};

// Google Ads file specifications
export const GOOGLE_ADS_SPECS = {
  image: {
    formats: ['JPG', 'PNG'],
    maxSize: 5 * 1024 * 1024, // 5MB
    recommended: {
      square: { width: 1200, height: 1200 },
      landscape: { width: 1200, height: 628 },
      portrait: { width: 960, height: 1200 }
    }
  },
  logo: {
    formats: ['JPG', 'PNG'],
    maxSize: 5 * 1024 * 1024, // 5MB
    recommended: {
      square: { width: 1200, height: 1200 },
      landscape: { width: 1200, height: 300 }
    }
  },
  video: {
    formats: ['MP4', 'MOV', 'WEBM'],
    maxSize: 256 * 1024 * 1024, // 256MB for regular videos
    youtube: {
      maxSize: 128 * 1024 * 1024 * 1024, // 128GB for YouTube
      duration: { min: 1, max: 21600 } // 1 second to 6 hours
    }
  }
};
