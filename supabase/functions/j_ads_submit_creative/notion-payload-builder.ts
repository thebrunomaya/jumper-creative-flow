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
  DB_CRIATIVOS_ID: string
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

  // Build the main Notion payload
  const notionPayload = {
    parent: {
      type: 'database_id',
      database_id: DB_CRIATIVOS_ID
    },
    properties: {
      "Name": {
        title: [
          {
            text: {
              content: "Processando..."
            }
          }
        ]
      },
      "Cliente": {
        relation: [
          {
            id: creativeData.client
          }
        ]
      },
      "Parceiro": {
        relation: creativeData.partner ? [
          {
            id: creativeData.partner
          }
        ] : []
      },
      "Plataforma": {
        select: {
          name: creativeData.platform || "Meta"
        }
      },
      "Objetivo da campanha": {
        select: creativeData.campaignObjective ? {
          name: creativeData.campaignObjective
        } : null
      },
      "Tipo de criativo": {
        select: creativeData.creativeType ? {
          name: creativeData.creativeType
        } : null
      },
      "Nome do criativo": {
        rich_text: [
          {
            text: {
              content: creativeData.creativeName || ''
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
              content: creativeData.destination || ''
            }
          }
        ]
      },
      "CTA": {
        rich_text: [
          {
            text: {
              content: ctaValue
            }
          }
        ]
      },
      "URL de destino": {
        url: creativeData.destinationUrl || null
      },
      "Observações": {
        rich_text: [
          {
            text: {
              content: observationsText
            }
          }
        ]
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