
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

  // Check if any content will be truncated and add warning to observations
  const mainTextContent = creativeData.mainTexts.join(' | ');
  const titleContent = creativeData.titles.join(' | ');
  const descriptionContent = creativeData.description || '';
  
  let truncationWarnings = [];
  if (mainTextContent.length > 2000) {
    truncationWarnings.push(`Texto principal truncado de ${mainTextContent.length} para 2000 caracteres`);
  }
  if (titleContent.length > 2000) {
    truncationWarnings.push(`Título truncado de ${titleContent.length} para 2000 caracteres`);
  }
  if (descriptionContent.length > 2000) {
    truncationWarnings.push(`Descrição truncada de ${descriptionContent.length} para 2000 caracteres`);
  }
  
  if (truncationWarnings.length > 0) {
    const warningText = `\n\n⚠️ ATENÇÃO - Limites da API Notion: ${truncationWarnings.join(', ')}`;
    observationsText = (observationsText + warningText).substring(0, 2000);
    console.log('⚠️ Content truncated due to Notion API limits:', truncationWarnings);
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
              content: creativeData.mainTexts.join(' | ').substring(0, 2000)
            }
          }
        ]
      },
      "Título": {
        rich_text: [
          {
            text: {
              content: creativeData.titles.join(' | ').substring(0, 2000)
            }
          }
        ]
      },
      "Descrição": {
        rich_text: [
          {
            text: {
              content: (creativeData.description || '').substring(0, 2000)
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

  return { notionPayload, ctaValue };
};
