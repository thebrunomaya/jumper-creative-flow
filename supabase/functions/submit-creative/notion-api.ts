
export const fetchNotionPage = async (pageId: string, NOTION_TOKEN: string) => {
  console.log('🔍 Fetching client data from Notion...');
  const clientResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    }
  });

  if (!clientResponse.ok) {
    throw new Error(`Failed to fetch client data: ${clientResponse.status}`);
  }

  const clientData = await clientResponse.json();
  const clientName = clientData.properties.Conta?.title?.[0]?.plain_text || 'Unknown Client';
  console.log('✅ Client data fetched:', clientName);
  console.log('🔍 Client data structure:', JSON.stringify(clientData.properties, null, 2));
  
  return clientData;
};

export const createNotionPage = async (
  payload: any,
  NOTION_TOKEN: string,
  variationIndex: number
) => {
  console.log(`📤 Sending variation ${variationIndex} to Notion`);

  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify(payload)
  });

  console.log(`📨 Notion response status for variation ${variationIndex}:`, response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Notion API error for variation ${variationIndex}:`, {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Notion API error for variation ${variationIndex}: ${response.status} - ${errorText}`);
  }

  const notionResult = await response.json();
  console.log(`✅ Creative variation ${variationIndex} successfully created in Notion!`);
  console.log(`📄 Notion page ID for variation ${variationIndex}:`, notionResult.id);
  
  return notionResult;
};

export const updateNotionPageTitle = async (
  pageId: string,
  title: string,
  NOTION_TOKEN: string
) => {
  const updateResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify({
      properties: {
        "Nome do Criativo": {
          title: [
            {
              text: {
                content: title
              }
            }
          ]
        }
      }
    })
  });

  if (!updateResponse.ok) {
    const updateErrorText = await updateResponse.text();
    console.error('❌ Failed to update creative name in Notion:', {
      status: updateResponse.status,
      statusText: updateResponse.statusText,
      body: updateErrorText
    });
    console.error('❌ Update payload was:', JSON.stringify({
      properties: {
        "Nome do Criativo": {
          title: [
            {
              text: {
                content: title
              }
            }
          ]
        }
      }
    }, null, 2));
  } else {
    console.log('✅ Creative name updated successfully in Notion');
  }
};

export const addBlocksToNotionPage = async (
  pageId: string,
  blocks: any[],
  NOTION_TOKEN: string
) => {
  try {
    console.log(`📝 Adding ${blocks.length} blocks to Notion page ${pageId}`);
    
    const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        children: blocks
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to add blocks to Notion page:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to add blocks to Notion page: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Blocks successfully added to Notion page');
    return result;
  } catch (error) {
    console.error('❌ Error adding blocks to Notion page:', error);
    throw error;
  }
};
