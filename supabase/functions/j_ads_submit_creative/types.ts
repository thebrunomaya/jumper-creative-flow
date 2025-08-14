export interface CreativeSubmissionData {
  client: string;
  managerId?: string;
  partner: string;
  platform: string;
  campaignObjective?: string;
  creativeType?: string;
  objective?: string;
  creativeName: string;
  mainTexts: string[];
  titles: string[];
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
  }>;
}

export interface CreativeResult {
  creativeId: string;
  notionPageId: string;
  variationIndex: number;
  fullCreativeName: string;
}