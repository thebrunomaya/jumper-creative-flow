
export interface FormData {
  // Step 1
  client: string;
  partner: string;
  platform: 'meta' | 'google' | '';
  creativeType?: 'image' | 'carousel' | 'video';
  objective?: 'sales' | 'traffic' | 'awareness' | 'leads' | 'engagement';
  
  // Step 2
  files: File[];
  validatedFiles: ValidatedFile[];
  
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
}

export interface Client {
  id: string;
  name: string;
}

export interface Partner {
  id: string;
  name: string;
}

export const CLIENTS: Client[] = [
  { id: "18bdb609-4968-8021-bb17-eacb9298e804", name: "Almeida Prado B2B" },
  { id: "162db609-4968-8059-8ca5-d71ff12660ab", name: "Almeida Prado Ecommerce" },
  { id: "163db609-4968-80bb-8113-f8381aace362", name: "LEAP Lab" },
  { id: "164db609-4968-80dc-befd-d2cb83532f3b", name: "Koko Educação" },
  { id: "165db609-4968-80fe-a1c7-e8df90125678", name: "Supermercadistas" }
];

export const PARTNERS: Partner[] = [
  { id: "163db609-4968-80bb-8113-f8381aace362", name: "Roberta - LEAP Lab" },
  { id: "163db609-4968-80dc-befd-d2cb83532f3b", name: "Murilo - Agência Koko" },
  { id: "164db609-4968-80fe-a1c7-e8df90123456", name: "Carlos - Almeida Prado" },
  { id: "165db609-4968-8021-bb17-eacb92987890", name: "Ana - Supermercadistas" }
];

export const VALID_CTAS = [
  'Compre Agora', 'Saiba Mais', 'Cadastre-se', 'Baixe Agora',
  'Entre em Contato', 'Ligar Agora', 'Enviar Mensagem', 
  'Ver Mais', 'Obter Oferta', 'Instalar Agora'
];

export const META_SPECS = {
  image: {
    feed: { width: 1080, height: 1080, maxSize: 30 * 1024 * 1024 },
    stories: { width: 1080, height: 1920, maxSize: 30 * 1024 * 1024 }
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
