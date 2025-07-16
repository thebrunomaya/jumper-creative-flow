
import { CreativeSubmissionData } from './types.ts';

// Função para títulos com losango azul pequeno (SEM ###)
const formatTitleVariations = (textArray: string[]): string => {
  return textArray
    .map((text, index) => `🔹 #${String(index + 1).padStart(2, '0')}:\n${text}`)
    .join('\n\n');
};

// Função para textos principais com losango laranja pequeno (SEM ###)
const formatMainTextVariations = (textArray: string[]): string => {
  return textArray
    .map((text, index) => `🔸 #${String(index + 1).padStart(2, '0')}:\n${text}`)
    .join('\n\n');
};

// Função para headlines do Google Ads
const formatHeadlineVariations = (textArray: string[]): string => {
  return textArray
    .map((text, index) => `🔹 #${String(index + 1).padStart(2, '0')}:\n${text}`)
    .join('\n\n');
};

// Função para descriptions do Google Ads
const formatDescriptionVariations = (textArray: string[]): string => {
  return textArray
    .map((text, index) => `🔸 #${String(index + 1).padStart(2, '0')}:\n${text}`)
    .join('\n\n');
};

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
  
  // Add Google Ads specific information to observations
  if (creativeData.platform === 'google') {
    const googleDetails = [];
    
    if (creativeData.businessName) {
      googleDetails.push(`🏢 Nome da Empresa: ${creativeData.businessName}`);
    }
    
    if (creativeData.path1 || creativeData.path2) {
      const paths = [];
      if (creativeData.path1) paths.push(creativeData.path1);
      if (creativeData.path2) paths.push(creativeData.path2);
      googleDetails.push(`🛤️ Paths: ${paths.join(', ')}`);
    }
    
    if (creativeData.merchantId) {
      googleDetails.push(`🛍️ Merchant ID: ${creativeData.merchantId}`);
    }
    
    if (creativeData.appStoreUrl) {
      googleDetails.push(`📱 App Store URL: ${creativeData.appStoreUrl}`);
    }
    
    if (googleDetails.length > 0) {
      const googleSection = `\n\n=== Configurações Google Ads ===\n${googleDetails.join('\n')}`;
      observationsText = observationsText + googleSection;
    }
  }
  
  // Add variation indicator if there are multiple variations
  if (totalVariations > 1) {
    const variationSuffix = ` (Variação ${variationIndex})`;
    observationsText = observationsText + variationSuffix;
  }

  // Check which fields exceed Notion property limits and prepare page content
  let mainTextContent = '';
  let titleContent = '';
  let descriptionContent = creativeData.description || '';
  
  // Handle different platforms
  if (creativeData.platform === 'google') {
    // Google Ads uses headlines and descriptions
    const headlineContent = formatHeadlineVariations(creativeData.headlines || []);
    const googleDescContent = formatDescriptionVariations(creativeData.descriptions || []);
    
    mainTextContent = googleDescContent; // Map Google descriptions to main text
    titleContent = headlineContent; // Map Google headlines to title
  } else {
    // Meta Ads uses mainTexts and titles
    mainTextContent = formatMainTextVariations(creativeData.mainTexts);
    titleContent = formatTitleVariations(creativeData.titles);
  }
  
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
            name: creativeData.platform === 'google' 
              ? (creativeData.googleCampaignType === 'search' ? 'Search' :
                 creativeData.googleCampaignType === 'display' ? 'Display' :
                 creativeData.googleCampaignType === 'performance-max' ? 'Performance Max' :
                 creativeData.googleCampaignType === 'shopping' ? 'Shopping' :
                 creativeData.googleCampaignType === 'video' ? 'Video' :
                 creativeData.googleCampaignType === 'demand-gen' ? 'Demand Gen' :
                 creativeData.googleCampaignType === 'app' ? 'App' : 'Google Ads')
              : (creativeData.creativeType === 'single' ? 'Imagem' : 
                 creativeData.creativeType === 'carousel' ? 'Carrossel' : 
                 creativeData.creativeType === 'existing-post' ? 'Publicação Existente' : 'Imagem')
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
