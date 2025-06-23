export interface FormData {
  // Step 1
  client: string;
  partner: string;
  platform: 'meta' | 'google' | '';
  campaignObjective?: string; // New field for campaign objective from account
  creativeType?: 'single' | 'carousel' | 'collection' | 'existing-post'; // Add existing-post
  objective?: 'sales' | 'traffic' | 'awareness' | 'leads' | 'engagement';
  
  // Step 2
  files: File[];
  validatedFiles: ValidatedFile[];
  mediaVariations?: MediaVariation[]; // New field for multiple media sets
  existingPost?: ExistingPostData; // New field for existing post
  
  // Carousel specific fields
  carouselAspectRatio?: '1:1' | '4:5'; // Toggle de proporção no topo
  carouselCards?: CarouselCard[]; // Array de cartões do carrossel
  
  // Step 3 - Updated for multiple titles and main texts + new conditional fields
  mainTexts: string[]; // Changed from single mainText to array
  titles: string[]; // Changed from single headline to array of titles
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
  postType?: 'post' | 'reel' | 'igtv';
  detectedAspectRatio?: '1:1' | '4:5' | '9:16' | '16:9';
  valid: boolean;
  preview?: string;
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
    maximum: 500
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
