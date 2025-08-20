import { resilientNotionCall } from './resilience-utils.ts';

// Fetch a Notion page by ID with resilience
export const fetchNotionPage = async (pageId: string, NOTION_TOKEN: string) => {
  console.log(`🔍 Fetching Notion page: ${pageId}`);
  
  const result = await resilientNotionCall(
    async () => {
      const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = new Error(`Failed to fetch Notion page: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      return await response.json();
    },
    'fetchNotionPage'
  );

  if (!result.success) {
    // Even if Notion fails, we don't break the flow - log for admin
    console.warn('⚠️ Notion page fetch failed, continuing without it');
    return null;
  }

  console.log('✅ Notion page fetched successfully');
  return result.data;
};

// Create a new Notion page with resilience and fallback
export const createNotionPage = async (payload: any, NOTION_TOKEN: string, variationIndex: number) => {
  console.log(`📤 Creating Notion page for variation ${variationIndex}`);
  console.log(`📤 Sending payload to Notion API:`, JSON.stringify(payload, null, 2));
  
  const result = await resilientNotionCall(
    async () => {
      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log(`📡 Notion API response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to create Notion page for variation ${variationIndex}:`, response.status, response.statusText);
        console.error(`❌ Error response body:`, errorText);
        
        const error = new Error(`Failed to create Notion page: ${response.status} ${response.statusText} - ${errorText}`);
        (error as any).status = response.status;
        (error as any).payload = payload;
        throw error;
      }

      const result = await response.json();
      console.log(`✅ Notion page created successfully for variation ${variationIndex}. Page ID: ${result.id}`);
      return result;
    },
    `createNotionPage_variation_${variationIndex}`,
    // Fallback: create mock result for continued processing
    {
      id: `fallback_${Date.now()}_${variationIndex}`,
      url: `https://notion.so/fallback/${Date.now()}`,
      created_time: new Date().toISOString(),
      fallback: true
    }
  );

  if (!result.success) {
    console.warn(`⚠️ Notion page creation failed for variation ${variationIndex}, using fallback`);
    return result.data; // Returns fallback data to continue processing
  }

  return result.data;
};

// Update the title of a Notion page with resilience
export const updateNotionPageTitle = async (pageId: string, title: string, NOTION_TOKEN: string) => {
  console.log(`✏️ Updating Notion page title: ${pageId} -> ${title}`);
  
  // Skip title update for fallback pages
  if (pageId.startsWith('fallback_')) {
    console.log('🔄 Skipping title update for fallback page');
    return { success: true, skipped: true, reason: 'Fallback page' };
  }
  
  const result = await resilientNotionCall(
    async () => {
      // First, try to fetch the page to understand its properties structure
      let titleProperty: string | null = null;
      
      try {
        const pageResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
          headers: {
            'Authorization': `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          }
        });
        
        if (pageResponse.ok) {
          const pageData = await pageResponse.json();
          const properties = pageData.properties || {};
          
          // Find the title property dynamically
          titleProperty = Object.keys(properties).find(key => 
            properties[key]?.type === 'title'
          ) || null;
          
          console.log(`🔍 Found title property: ${titleProperty || 'none found'}`);
          console.log(`📊 Available properties: ${Object.keys(properties).join(', ')}`);
        }
      } catch (error) {
        console.error('❌ Error fetching page structure, using fallback approach:', error);
      }
      
      // Try with discovered title property first, then fallback to common names
      const titlePropertiesToTry = titleProperty 
        ? [titleProperty, ...['Name', 'Title', 'Título', 'Nome'].filter(name => name !== titleProperty)]
        : ['Name', 'Title', 'Título', 'Nome'];
      
      for (const titlePropertyName of titlePropertiesToTry) {
        console.log(`🔄 Trying title property: ${titlePropertyName}`);
        
        const updatePayload = {
          properties: {
            [titlePropertyName]: {
              title: [
                {
                  text: {
                    content: title
                  }
                }
              ]
            }
          }
        };

        const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Notion page title updated successfully using property: ${titlePropertyName}`);
          return result;
        } else if (response.status >= 400 && response.status < 500) {
          // Client error - try next property
          const errorText = await response.text();
          console.warn(`⚠️ Client error with property "${titlePropertyName}": ${errorText}`);
          continue;
        } else {
          // Server error - throw to trigger retry
          const errorText = await response.text();
          const error = new Error(`Failed to update title with property "${titlePropertyName}": ${response.statusText} - ${errorText}`);
          (error as any).status = response.status;
          throw error;
        }
      }
      
      // If we get here, all properties failed with client errors
      throw new Error('No valid title property found after trying all options');
    },
    'updateNotionPageTitle',
    // Fallback: success but with warning
    { success: false, reason: 'No valid title property found', fallback: true }
  );

  if (!result.success) {
    console.warn('⚠️ Could not update page title, continuing without title update');
    return result.data;
  }

  return result.data;
};

// Add blocks to a Notion page with resilience
export const addBlocksToNotionPage = async (pageId: string, blocks: any[], NOTION_TOKEN: string) => {
  console.log(`📝 Adding ${blocks.length} blocks to Notion page: ${pageId}`);
  
  // Skip block addition for fallback pages
  if (pageId.startsWith('fallback_')) {
    console.log('🔄 Skipping block addition for fallback page');
    return { success: true, skipped: true, reason: 'Fallback page' };
  }
  
  const result = await resilientNotionCall(
    async () => {
      const payload = {
        children: blocks
      };

      const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to add blocks to Notion page:', errorText);
        
        const error = new Error(`Failed to add blocks to Notion page: ${response.statusText} - ${errorText}`);
        (error as any).status = response.status;
        (error as any).blocks = blocks;
        throw error;
      }

      const result = await response.json();
      console.log('✅ Blocks added to Notion page successfully');
      return result;
    },
    'addBlocksToNotionPage',
    // Fallback: success but with warning
    { success: false, reason: 'Failed to add blocks', fallback: true }
  );

  if (!result.success) {
    console.warn('⚠️ Could not add blocks to Notion page, continuing without them');
    return result.data;
  }

  return result.data;
};