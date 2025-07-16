
export interface CreativeSubmissionData {
  client: string;
  managerId?: string;
  partner: string;
  platform: string;
  campaignObjective?: string;
  creativeType?: string; // For Meta Ads
  googleCampaignType?: string; // For Google Ads
  objective?: string;
  creativeName: string;
  
  // Meta Ads fields
  mainTexts: string[];
  titles: string[];
  
  // Google Ads fields
  headlines?: string[];
  descriptions?: string[];
  path1?: string;
  path2?: string;
  businessName?: string;
  merchantId?: string;
  appStoreUrl?: string;
  
  // Common fields
  description: string;
  destination?: string;
  cta?: string;
  destinationUrl: string;
  callToAction: string;
  observations: string;
  existingPost?: {
    instagramUrl: string;
    valid: boolean;
  };
  filesInfo: Array<{
    name: string;
    type: string;
    size: number;
    format?: string;
    variationIndex?: number;
    base64Data?: string;
    instagramUrl?: string;
    fileType?: 'image' | 'logo' | 'video' | 'productFeed'; // For Google Ads
  }>;
}

export interface CreativeResult {
  creativeId: string;
  notionPageId: string;
  variationIndex: number;
  fullCreativeName: string;
}
