
import { CreativeSubmissionData } from './types.ts';
import { fetchNotionPage, createNotionPage, updateNotionPageTitle } from './notion-api.ts';
import { buildNotionPayload } from './notion-payload-builder.ts';
import { extractAccountData, generateFullCreativeName, generateCreativeId } from './notion-properties-handler.ts';

export const createNotionCreative = async (
  creativeData: CreativeSubmissionData,
  variationFiles: Array<{ name: string; url: string; format?: string }>,
  variationIndex: number,
  totalVariations: number,
  NOTION_TOKEN: string,
  DB_CRIATIVOS_ID: string,
  clientData: any
) => {
  // Build the Notion payload
  const { notionPayload, ctaValue } = buildNotionPayload(
    creativeData,
    variationFiles,
    variationIndex,
    totalVariations,
    DB_CRIATIVOS_ID
  );

  console.log(`📤 Sending variation ${variationIndex} to Notion with CTA: ${ctaValue}`);

  // Create the Notion page
  const notionResult = await createNotionPage(notionPayload, NOTION_TOKEN, variationIndex);
  
  // Generate creative ID
  const creativeId = generateCreativeId(notionResult);
  
  // Extract account data
  const { accountId, accountName } = extractAccountData(clientData, creativeData);
  
  // Generate full creative name
  const fullCreativeName = generateFullCreativeName(
    creativeId,
    creativeData,
    accountName,
    accountId
  );
  
  // Update the page with the generated name as title
  await updateNotionPageTitle(notionResult.id, fullCreativeName, NOTION_TOKEN);
  
  return {
    creativeId,
    notionPageId: notionResult.id,
    variationIndex,
    fullCreativeName
  };
};
