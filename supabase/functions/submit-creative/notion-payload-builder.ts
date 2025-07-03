
import { CreativeSubmissionData } from './types.ts';

export const buildNotionPayload = (
  creativeData: CreativeSubmissionData,
  variationFiles: Array<{ name: string; url: string; format?: string }>,
  variationIndex: number,
  totalVariations: number,
  DB_CRIATIVOS_ID: string
) => {
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

  // Check which fields exceed Notion property limits and prepare page content
  const mainTextContent = creativeData.mainTexts.join(' | ');
  const titleContent = creativeData.titles.join(' | ');
  const descriptionContent = creativeData.description || '';
  
  let pageBlocks = [];
  let mainTextForProperty = mainTextContent;
  let titleForProperty = titleContent;
  let descriptionForProperty = descriptionContent;
  
  // Handle main text
  if (mainTextContent.length > 2000) {
    mainTextForProperty = "⚠️ ATENÇÃO: Texto completo disponível no corpo desta página";
    pageBlocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ type: "text", text: { content: "📝 Texto Principal Completo" } }]
      }
    });
    
    // Split long text into chunks of 2000 characters
    const chunks = [];
    for (let i = 0; i < mainTextContent.length; i += 2000) {
      chunks.push(mainTextContent.substring(i, i + 2000));
    }
    
    chunks.forEach(chunk => {
      pageBlocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: chunk } }]
        }
      });
    });
  }
  
  // Handle title
  if (titleContent.length > 2000) {
    titleForProperty = "⚠️ ATENÇÃO: Título completo disponível no corpo desta página";
    pageBlocks.push({
      object: "block",
      type: "heading_2", 
      heading_2: {
        rich_text: [{ type: "text", text: { content: "🏷️ Título Completo" } }]
      }
    });
    
    // Split long text into chunks of 2000 characters
    const chunks = [];
    for (let i = 0; i < titleContent.length; i += 2000) {
      chunks.push(titleContent.substring(i, i + 2000));
    }
    
    chunks.forEach(chunk => {
      pageBlocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: chunk } }]
        }
      });
    });
  }
  
  // Handle description
  if (descriptionContent.length > 2000) {
    descriptionForProperty = "⚠️ ATENÇÃO: Descrição completa disponível no corpo desta página";
    pageBlocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ type: "text", text: { content: "📄 Descrição Completa" } }]
      }
    });
    
    // Split long text into chunks of 2000 characters
    const chunks = [];
    for (let i = 0; i < descriptionContent.length; i += 2000) {
      chunks.push(descriptionContent.substring(i, i + 2000));
    }
    
    chunks.forEach(chunk => {
      pageBlocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: chunk } }]
        }
      });
    });
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
              content: mainTextForProperty
            }
          }
        ]
      },
      "Título": {
        rich_text: [
          {
            text: {
              content: titleForProperty
            }
          }
        ]
      },
      "Descrição": {
        rich_text: [
          {
            text: {
              content: descriptionForProperty
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
              content: observationsText.substring(0, 2000)
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

  return { notionPayload, ctaValue, pageBlocks };
};
