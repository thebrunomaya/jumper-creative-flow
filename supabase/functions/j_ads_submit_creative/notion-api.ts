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
  
  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Failed to create Notion page for variation ${variationIndex}:`, errorText);
    throw new Error(`Failed to create Notion page: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`✅ Notion page created successfully for variation ${variationIndex}. Page ID: ${result.id}`);
  return result;
};

// Update the title of a Notion page
export const updateNotionPageTitle = async (pageId: string, title: string, NOTION_TOKEN: string) => {
  console.log(`✏️ Updating Notion page title: ${pageId} -> ${title}`);
  
  const updatePayload = {
    properties: {
      "Name": {
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

  console.log('📝 Update payload:', JSON.stringify(updatePayload, null, 2));

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