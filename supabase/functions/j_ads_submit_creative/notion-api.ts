// Fetch a Notion page by ID
export const fetchNotionPage = async (pageId: string, NOTION_TOKEN: string) => {
  console.log(`🔍 Fetching Notion page: ${pageId}`);
  
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Notion page: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ Notion page fetched successfully');
  return data;
};

// Create a new Notion page
export const createNotionPage = async (payload: any, NOTION_TOKEN: string, variationIndex: number) => {
  console.log(`📤 Creating Notion page for variation ${variationIndex}`);
  console.log(`📤 Sending payload to Notion API:`, JSON.stringify(payload, null, 2));
  
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
    console.error(`❌ Original payload that caused error:`, JSON.stringify(payload, null, 2));
    throw new Error(`Failed to create Notion page: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`✅ Notion page created successfully for variation ${variationIndex}. Page ID: ${result.id}`);
  return result;
};

// Update the title of a Notion page
export const updateNotionPageTitle = async (pageId: string, title: string, NOTION_TOKEN: string) => {
  console.log(`✏️ Updating Notion page title: ${pageId} -> ${title}`);
  
  // First, try to fetch the page to understand its properties structure
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
      const titleProperty = Object.keys(properties).find(key => 
        properties[key]?.type === 'title'
      );
      
      console.log(`🔍 Found title property: ${titleProperty || 'none found'}`);
      console.log(`📊 Available properties: ${Object.keys(properties).join(', ')}`);
      
      if (titleProperty) {
        const updatePayload = {
          properties: {
            [titleProperty]: {
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
        
        console.log(`📝 Update payload using property "${titleProperty}":`, JSON.stringify(updatePayload, null, 2));
        
        const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Failed to update Notion page title:', errorText);
          throw new Error(`Failed to update Notion page title: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Notion page title updated successfully');
        return result;
      } else {
        console.warn('⚠️ No title property found, skipping title update');
        return { success: false, reason: 'No title property found' };
      }
    }
  } catch (error) {
    console.error('❌ Error fetching page structure, attempting with fallback approach:', error);
  }
  
  // Fallback: try common title property names
  const commonTitleNames = ['Name', 'Title', 'Título', 'Nome'];
  
  for (const titlePropertyName of commonTitleNames) {
    try {
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
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Failed with property "${titlePropertyName}": ${errorText}`);
      }
    } catch (error) {
      console.warn(`⚠️ Error with property "${titlePropertyName}":`, error);
    }
  }
  
  // If all attempts fail, log warning but don't throw error to avoid breaking the creative creation
  console.warn('⚠️ Could not update page title with any known property names. Continuing without title update.');
  return { success: false, reason: 'No valid title property found' };
};

// Add blocks to a Notion page
export const addBlocksToNotionPage = async (pageId: string, blocks: any[], NOTION_TOKEN: string) => {
  console.log(`📝 Adding ${blocks.length} blocks to Notion page: ${pageId}`);
  
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
    throw new Error(`Failed to add blocks to Notion page: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Blocks added to Notion page successfully');
  return result;
};