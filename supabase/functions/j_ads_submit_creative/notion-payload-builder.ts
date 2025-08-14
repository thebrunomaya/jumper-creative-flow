import { CreativeSubmissionData } from './types.ts';

// Helper functions for formatting text arrays
function formatTitleVariations(textArray: string[]): string {
  return textArray.map((text, index) => `🔹 ${index + 1}. ${text}`).join('\n');
}

function formatMainTextVariations(textArray: string[]): string {
  return textArray.map((text, index) => `🔸 ${index + 1}. ${text}`).join('\n');
}

export const buildNotionPayload = (
  creativeData: CreativeSubmissionData,
  variationFiles: Array<{ name: string; url: string; format?: string }>,
  variationIndex: number,
  totalVariations: number,
  DB_CRIATIVOS_DATABASE_ID: string
) => {
  console.log(`🏗️ Building Notion payload for variation ${variationIndex}`);

  // Validate and format destinationUrl and cta
  let ctaValue = creativeData.cta || creativeData.callToAction || '';
  if (!ctaValue) {
    console.warn('⚠️ No CTA provided, using empty string');
    ctaValue = '';
  }

  // Add variation indicator to observations if there are multiple variations
  let observationsText = creativeData.observations || '';
  if (totalVariations > 1) {
    observationsText = `[Variação ${variationIndex + 1}/${totalVariations}]\n\n${observationsText}`;
  }

  // Handle property limits (2000 characters) by creating page blocks for overflow content
  const pageBlocks = [];
  
  // Format main texts with variation numbering
  const mainTextsFormatted = formatMainTextVariations(creativeData.mainTexts || []);
  let mainTextProperty = mainTextsFormatted;
  let mainTextBlock = null;
  
  if (mainTextsFormatted.length > 2000) {
    mainTextProperty = mainTextsFormatted.slice(0, 1997) + '...';
    mainTextBlock = {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: 'Texto Principal (Completo)' } }]
      }
    };
    pageBlocks.push(mainTextBlock, {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: mainTextsFormatted } }]
      }
    });
  }

  // Format titles with variation numbering
  const titlesFormatted = formatTitleVariations(creativeData.titles || []);
  let titleProperty = titlesFormatted;
  let titleBlock = null;
  
  if (titlesFormatted.length > 2000) {
    titleProperty = titlesFormatted.slice(0, 1997) + '...';
    titleBlock = {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: 'Títulos (Completo)' } }]
      }
    };
    pageBlocks.push(titleBlock, {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: titlesFormatted } }]
      }
    });
  }

  // Handle description overflow
  let descriptionProperty = creativeData.description || '';
  let descriptionBlock = null;
  
  if (descriptionProperty.length > 2000) {
    const truncatedDescription = descriptionProperty.slice(0, 1997) + '...';
    descriptionProperty = truncatedDescription;
    descriptionBlock = {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: 'Descrição (Completa)' } }]
      }
    };
    pageBlocks.push(descriptionBlock, {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: creativeData.description || '' } }]
      }
    });
  }

  // Build the main Notion payload using correct property names from working function
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
              content: creativeData.campaignObjective || ''
            }
          }
        ]
      },
      "Texto principal": {
        rich_text: [
          {
            text: {
              content: mainTextProperty
            }
          }
        ]
      },
      "Título": {
        rich_text: [
          {
            text: {
              content: titleProperty
            }
          }
        ]
      },
      "Descrição": {
        rich_text: [
          {
            text: {
              content: descriptionProperty
            }
          }
        ]
      },
      "Destino": {
        rich_text: [
          {
            text: {
              content: creativeData.destinationUrl || ''
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

  // Add Instagram post URL if it's an existing post
  if (creativeData.creativeType === 'existing-post' && creativeData.existingPost?.instagramUrl) {
    notionPayload.properties["Publicação"] = {
      url: creativeData.existingPost.instagramUrl
    };
  }

  // Add uploaded files to the Arquivos property
  if (variationFiles && variationFiles.length > 0) {
    notionPayload.properties["Arquivos"] = {
      files: variationFiles.map(file => ({
        name: file.name,
        external: {
          url: file.url
        }
      }))
    };
  }

  console.log('📋 Notion payload built successfully');
  
  return {
    notionPayload,
    ctaValue,
    pageBlocks
  };
};