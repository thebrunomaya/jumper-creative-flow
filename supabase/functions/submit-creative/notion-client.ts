
import { CreativeSubmissionData } from './types.ts';
import { generateCreativeName } from './creative-name-generator.ts';

export const createNotionCreative = async (
  creativeData: CreativeSubmissionData,
  variationFiles: Array<{ name: string; url: string; format?: string }>,
  variationIndex: number,
  totalVariations: number,
  NOTION_TOKEN: string,
  DB_CRIATIVOS_ID: string,
  clientData: any
) => {
  const notionUrl = `https://api.notion.com/v1/pages`;
  
  // Validate destinationUrl before sending to Notion
  if (!creativeData.destinationUrl || creativeData.destinationUrl.trim() === '') {
    console.error('❌ CRITICAL: destinationUrl is empty or missing!');
    throw new Error('Destino é obrigatório');
  }

  let destinationValue = creativeData.destinationUrl.trim();
  
  // For URL fields, ensure proper protocol (but don't validate format since it's now text)
  if (destinationValue.includes('.') && !destinationValue.startsWith('http://') && !destinationValue.startsWith('https://') && !destinationValue.startsWith('tel:') && !destinationValue.startsWith('mailto:')) {
    destinationValue = 'https://' + destinationValue;
    console.log('🔧 Added https:// protocol to URL:', destinationValue);
  }

  console.log('✅ Destination value prepared:', destinationValue);

  // Determine the correct CTA value - prioritize new cta field over legacy callToAction
  let ctaValue = '';
  if (creativeData.cta && creativeData.cta.trim() !== '') {
    ctaValue = creativeData.cta.trim();
    console.log('🎯 Using new CTA field:', ctaValue);
  } else if (creativeData.callToAction && creativeData.callToAction.trim() !== '') {
    ctaValue = creativeData.callToAction.trim();
    console.log('🎯 Using legacy callToAction field:', ctaValue);
  } else {
    console.error('❌ CRITICAL: No CTA value provided!');
    throw new Error('Call-to-Action é obrigatório');
  }

  // Build observations text with variation indicator
  let observationsText = creativeData.observations || '';
  
  // Add variation indicator if there are multiple variations
  if (totalVariations > 1) {
    const variationSuffix = ` (Variação ${variationIndex})`;
    observationsText = observationsText + variationSuffix;
  }

  const notionPayload = {
    parent: {
      database_id: DB_CRIATIVOS_ID
    },
    properties: {
      "Conta": {
        relation: [
          {
            id: creativeData.client
          }
        ]
      },
      "Gerente": {
        relation: [
          {
            id: creativeData.managerId || ""
          }
        ]
      },
      "Plataforma": {
        select: {
          name: creativeData.platform === 'meta' ? 'Meta Ads' : 'Google Ads'
        }
      },
      "Formato do Anúncio": {
        multi_select: [
          {
            name: creativeData.creativeType === 'single' ? 'Imagem' : 
                 creativeData.creativeType === 'carousel' ? 'Carrossel' : 
                 creativeData.creativeType === 'existing-post' ? 'Publicação Existente' : 'Imagem'
          }
        ]
      },
      "Objetivo do anúncio": {
        rich_text: [
          {
            text: {
              content: creativeData.campaignObjective || creativeData.objective || ''
            }
          }
        ]
      },
      "Texto principal": {
        rich_text: [
          {
            text: {
              content: creativeData.mainTexts.join(' | ')
            }
          }
        ]
      },
      "Título": {
        rich_text: [
          {
            text: {
              content: creativeData.titles.join(' | ')
            }
          }
        ]
      },
      "Descrição": {
        rich_text: [
          {
            text: {
              content: creativeData.description || ''
            }
          }
        ]
      },
      "Destino": {
        rich_text: [
          {
            text: {
              content: destinationValue
            }
          }
        ]
      },
      "Call-to-Action": {
        select: {
          name: ctaValue
        }
      },
      "Observações": {
        rich_text: [
          {
            text: {
              content: observationsText
            }
          }
        ]
      },
      "Status": {
        select: {
          name: "Pendente"
        }
      }
    }
  };

  // Add Instagram post URL to "Publicação" property for existing-post type
  if (creativeData.creativeType === 'existing-post' && creativeData.existingPost?.instagramUrl) {
    notionPayload.properties["Publicação"] = {
      url: creativeData.existingPost.instagramUrl
    };
    console.log(`📱 Added Instagram post URL to Publicação property: ${creativeData.existingPost.instagramUrl}`);
  }

  // Add uploaded files to the "Arquivos" property
  if (variationFiles.length > 0) {
    notionPayload.properties["Arquivos"] = {
      files: variationFiles.map(file => ({
        name: file.name,
        external: {
          url: file.url
        }
      }))
    };
    console.log(`📎 Added ${variationFiles.length} files to Arquivos property for variation ${variationIndex}`);
  }

  console.log(`📤 Sending variation ${variationIndex} to Notion with CTA: ${ctaValue}`);

  const response = await fetch(notionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify(notionPayload)
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
  
  // Extract the creative ID from Notion's unique_id property - CHANGED FROM CRT TO JSC
  const creativeId = `JSC-${notionResult.properties.ID.unique_id.number}`;
  console.log(`🆔 Generated creative ID for variation ${variationIndex}:`, creativeId);
  
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
  
  // Update the page with the generated name as title - CORRECTED PROPERTY NAME
  const updateResponse = await fetch(`https://api.notion.com/v1/pages/${notionResult.id}`, {
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
                content: fullCreativeName
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
                content: fullCreativeName
              }
            }
          ]
        }
      }
    }, null, 2));
  } else {
    console.log('✅ Creative name updated successfully in Notion');
  }
  
  return {
    creativeId,
    notionPageId: notionResult.id,
    variationIndex,
    fullCreativeName
  };
};
