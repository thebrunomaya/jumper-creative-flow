

export interface FormData {
  // Step 1
  client: string;
  partner: string;
  platform: 'meta' | 'google' | '';
  campaignObjective?: string; // New field for campaign objective from account
  creativeType?: 'single' | 'carousel' | 'collection';
  objective?: 'sales' | 'traffic' | 'awareness' | 'leads' | 'engagement';
  
  // Step 2
  files: File[];
  validatedFiles: ValidatedFile[];
  mediaVariations?: MediaVariation[]; // New field for multiple media sets
  
  // Step 3
  mainText: string;
  headline: string;
  description: string;
  destinationUrl: string;
  callToAction: string;
  observations: string;
}

export interface ValidatedFile {
  file: File;
  valid: boolean;
  dimensions?: { width: number; height: number };
  duration?: number;
  errors: string[];
  preview?: string;
  format?: 'square' | 'vertical' | 'horizontal'; // Add format for image ads
}

export interface MediaVariation {
  id: number;
  squareFile?: ValidatedFile;
  verticalFile?: ValidatedFile;
  horizontalFile?: ValidatedFile;
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
  }
};

export const TEXT_LIMITS = {
  mainText: 125,
  headline: 40,
  description: 90
};

