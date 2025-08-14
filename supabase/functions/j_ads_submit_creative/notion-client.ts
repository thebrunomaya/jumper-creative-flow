import { CreativeSubmissionData } from './types.ts';
import { fetchNotionPage, createNotionPage, updateNotionPageTitle, addBlocksToNotionPage } from './notion-api.ts';
import { buildNotionPayload } from './notion-payload-builder.ts';
import { extractAccountData, generateFullCreativeName, generateCreativeId } from './notion-properties-handler.ts';

export const createNotionCreative = async (
  creativeData: CreativeSubmissionData,
  variationFiles: Array<{ name: string; url: string; format?: string }>,
  variationIndex: number,
  totalVariations: number,
  NOTION_TOKEN: string,
  DB_CRIATIVOS_DATABASE_ID: string,
  clientData: any
) => {
  // Build the Notion payload
  const { notionPayload, ctaValue, pageBlocks } = buildNotionPayload(
    creativeData,
    variationFiles,
    variationIndex,
    totalVariations,
    DB_CRIATIVOS_DATABASE_ID
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
  
  // Add content blocks to the page if we have any
  if (pageBlocks && pageBlocks.length > 0) {
    console.log(`📝 Adding ${pageBlocks.length} content blocks to page for variation ${variationIndex}`);
    await addBlocksToNotionPage(notionResult.id, pageBlocks, NOTION_TOKEN);
  }
  
  return {
    creativeId,
    notionPageId: notionResult.id,
    variationIndex,
    fullCreativeName
  };
};