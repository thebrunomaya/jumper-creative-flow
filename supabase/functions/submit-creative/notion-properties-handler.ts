
import { generateCreativeName } from './creative-name-generator.ts';

export const extractAccountData = (clientData: any, creativeData: any) => {
  // Extract the real account ID and name from client data with proper fallbacks
  let accountId = creativeData.client; // fallback to page ID
  let accountName = 'Unknown Account'; // default fallback
  
  // Extract account name from Notion properties
  if (clientData.properties && clientData.properties.Conta && clientData.properties.Conta.title && clientData.properties.Conta.title[0]) {
    accountName = clientData.properties.Conta.title[0].plain_text || 'Unknown Account';
    console.log(`📊 Extracted account name: ${accountName}`);
  } else {
    console.warn('⚠️ Could not extract account name from Notion properties, using fallback');
  }
  
  // Extract account ID from Notion properties
  if (clientData.properties && clientData.properties.ID && clientData.properties.ID.unique_id) {
    accountId = clientData.properties.ID.unique_id.number.toString();
    console.log(`📊 Extracted real account ID: ${accountId}`);
  } else {
    console.warn('⚠️ Could not extract real account ID, using page ID as fallback');
  }

  return { accountId, accountName };
};

export const generateFullCreativeName = (
  creativeId: string,
  creativeData: any,
  accountName: string,
  accountId: string
) => {
  // Generate full creative name using the formula
  const fullCreativeName = generateCreativeName(
    creativeId,
    creativeData.creativeName,
    creativeData.campaignObjective || '',
    creativeData.creativeType || '',
    accountName,
    accountId
  );
  
  console.log(`📝 Generated full creative name: ${fullCreativeName}`);
  return fullCreativeName;
};

export const generateCreativeId = (notionResult: any) => {
  // Extract the creative ID from Notion's unique_id property - CHANGED FROM CRT TO JSC
  const creativeId = `JSC-${notionResult.properties.ID.unique_id.number}`;
  console.log(`🆔 Generated creative ID:`, creativeId);
  return creativeId;
};
