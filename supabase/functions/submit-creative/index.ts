import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreativeSubmissionData {
  client: string;
  managerId?: string;
  partner: string;
  platform: string;
  campaignObjective?: string;
  creativeType?: string;
  objective?: string;
  creativeName: string; // New field
  mainTexts: string[];
  titles: string[];
  description: string;
  destination?: string;
  cta?: string;
  destinationUrl: string;
  callToAction: string;
  observations: string;
  filesInfo: Array<{
    name: string;
    type: string;
    size: number;
    format?: string;
    variationIndex?: number;
    base64Data?: string;
  }>;
}

// Creative name generation functions
function generateAccountCode(accountName: string, accountId: string): string {
  const cleanName = accountName.toUpperCase().replace(/[\s\-\_\.\,]/g, '');
  
  const firstLetter = cleanName[0] || 'X';
  const remainingChars = cleanName.slice(1);
  
  let consonants = remainingChars.replace(/[AEIOU]/g, '');
  
  if (consonants.length < 3) {
    consonants = remainingChars;
  }
  
  const finalChars = consonants.slice(0, 3).padEnd(3, 'X');
  
  return `${firstLetter}${finalChars}#${accountId.slice(-3)}`;
}

function getObjectiveCode(objective: string): string {
  const codes: Record<string, string> = {
    "Conversions": "CONV",
    "Traffic": "TRAF",
    "Engagement": "ENGA",
    "Lead Generation": "LEAD",
    "Brand Awareness": "BRAN",
    "App Installs": "APPS",
    "Reach": "RECH",
    "Video Views": "VIDE",
    "Messages": "MSGS",
    "Store Traffic": "STOR",
    "Catalog Sales": "CATA"
  };
  return codes[objective] || "UNKN";
}

function getTypeCode(type: string): string {
  const codes: Record<string, string> = {
    "single": "SING",
    "carousel": "CARR",
    "collection": "COLL",
    "existing-post": "POST"
  };
  return codes[type] || "UNKN";
}

function generateCreativeName(
  crtId: string,
  managerInput: string,
  campaignObjective: string,
  creativeType: string,
  accountName: string,
  accountId: string
): string {
  const accountCode = generateAccountCode(accountName, accountId);
  const objCode = getObjectiveCode(campaignObjective);
  const typeCode = getTypeCode(creativeType);
  
  return `${crtId}_${managerInput}_${objCode}_${typeCode}_${accountCode}`;
}

const uploadFileToSupabase = async (
  fileName: string,
  base64Data: string,
  mimeType: string,
  supabase: any
): Promise<string> => {
  console.log(`🔄 Starting upload for file: ${fileName}, type: ${mimeType}, size: ${base64Data.length} chars`);
  
  // Convert base64 to blob
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create unique filename with timestamp
  const timestamp = Date.now();
  const fileExtension = fileName.split('.').pop();
  const uniqueFileName = `${timestamp}-${fileName}`;

  console.log(`📤 Uploading to Supabase with filename: ${uniqueFileName}`);

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('creative-files')
    .upload(uniqueFileName, bytes, {
      contentType: mimeType,
      upsert: false
    });

  if (error) {
    console.error('❌ Supabase storage error:', error);
    throw new Error(`Failed to upload file to storage: ${error.message}`);
  }

  console.log(`✅ File uploaded successfully:`, data);

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('creative-files')
    .getPublicUrl(uniqueFileName);

  console.log(`🔗 Generated public URL: ${urlData.publicUrl}`);
  return urlData.publicUrl;
};

const createNotionCreative = async (
  creativeData: CreativeSubmissionData,
  variationFiles: Array<{ name: string; url: string; format?: string }>,
  variationIndex: number,
  totalVariations: number,
  NOTION_TOKEN: string,
  DB_CRIATIVOS_ID: string,
  clientData: any // Add client data parameter
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
  
  // Extract the creative ID from Notion's unique_id property
  const creativeId = `CRT-${notionResult.properties.ID.unique_id.number}`;
  console.log(`🆔 Generated creative ID for variation ${variationIndex}:`, creativeId);
  
  // Generate full creative name using the formula
  const fullCreativeName = generateCreativeName(
    creativeId,
    creativeData.creativeName,
    creativeData.campaignObjective || '',
    creativeData.creativeType || '',
    clientData.name,
    clientData.id
  );
  
  console.log(`📝 Generated full creative name: ${fullCreativeName}`);
  
  // Update the page with the generated name as title
  const updateResponse = await fetch(`https://api.notion.com/v1/pages/${notionResult.id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify({
      properties: {
        "Nome": {
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
    console.error('❌ Failed to update creative name in Notion');
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const NOTION_TOKEN = Deno.env.get('NOTION_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const DB_CRIATIVOS_ID = "20edb6094968807eac5fe7920c517077"
    const DB_CONTAS_ID = "162db6094968808bbcbed40fef7370d1"
    
    console.log('=== CREATIVE SUBMISSION ===')
    console.log('Submitting creative at:', new Date().toISOString())
    
    if (!NOTION_TOKEN) {
      console.error('NOTION_API_KEY not found in environment variables')
      throw new Error('NOTION_API_KEY not configured')
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase configuration missing')
      throw new Error('Supabase configuration not found')
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const creativeData: CreativeSubmissionData = await req.json()
    console.log('🔍 Creative data received:')
    console.log('- creativeName:', creativeData.creativeName)
    console.log('- managerId:', creativeData.managerId)
    console.log('- destinationUrl:', creativeData.destinationUrl)
    console.log('- cta:', creativeData.cta)
    console.log('- callToAction:', creativeData.callToAction)
    console.log('- observations:', creativeData.observations)

    // Fetch client data from Notion to get account name and ID
    console.log('🔍 Fetching client data from Notion...');
    const clientResponse = await fetch(`https://api.notion.com/v1/pages/${creativeData.client}`, {
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

    // Group files by variation index
    const filesByVariation = new Map<number, Array<{name: string; type: string; size: number; format?: string; base64Data?: string}>>();
    
    if (creativeData.filesInfo && creativeData.filesInfo.length > 0) {
      console.log(`📁 Processing ${creativeData.filesInfo.length} files for upload...`);
      
      creativeData.filesInfo.forEach(fileInfo => {
        const variationIndex = fileInfo.variationIndex || 1;
        if (!filesByVariation.has(variationIndex)) {
          filesByVariation.set(variationIndex, []);
        }
        filesByVariation.get(variationIndex)!.push(fileInfo);
      });
      
      console.log(`📊 Files grouped into ${filesByVariation.size} variations`);
    }

    const totalVariations = filesByVariation.size;
    const createdCreatives: Array<{
      creativeId: string;
      notionPageId: string;
      variationIndex: number;
      uploadedFiles: Array<{ name: string; url: string; format?: string }>;
      fullCreativeName: string;
    }> = [];

    // Process each variation
    for (const [variationIndex, files] of filesByVariation.entries()) {
      console.log(`🔄 Processing variation ${variationIndex} with ${files.length} files`);
      
      const uploadedFiles: Array<{ name: string; url: string; format?: string }> = [];
      
      // Upload files for this variation
      for (const fileInfo of files) {
        console.log(`🔍 Processing file: ${fileInfo.name} for variation ${variationIndex}, has base64: ${!!fileInfo.base64Data}`);
        
        if (fileInfo.base64Data) {
          try {
            const fileUrl = await uploadFileToSupabase(
              fileInfo.name,
              fileInfo.base64Data,
              fileInfo.type,
              supabase
            );
            
            uploadedFiles.push({
              name: fileInfo.name,
              url: fileUrl,
              format: fileInfo.format
            });
            
            console.log(`✅ File uploaded to Supabase for variation ${variationIndex}: ${fileInfo.name} -> ${fileUrl}`);
          } catch (uploadError) {
            console.error(`❌ Failed to upload ${fileInfo.name} for variation ${variationIndex}:`, uploadError);
            // Continue with other files, don't fail the entire submission
          }
        } else {
          console.log(`⚠️ Skipping ${fileInfo.name} for variation ${variationIndex} - no base64 data found`);
        }
      }
      
      // Create Notion creative for this variation
      try {
        const creativeResult = await createNotionCreative(
          creativeData,
          uploadedFiles,
          variationIndex,
          totalVariations,
          NOTION_TOKEN,
          DB_CRIATIVOS_ID,
          { name: clientName, id: creativeData.client }
        );
        
        createdCreatives.push({
          ...creativeResult,
          uploadedFiles
        });
        
        console.log(`✅ Created creative ${creativeResult.creativeId} for variation ${variationIndex}`);
        console.log(`📝 Full creative name: ${creativeResult.fullCreativeName}`);
      } catch (notionError) {
        console.error(`❌ Failed to create Notion creative for variation ${variationIndex}:`, notionError);
        throw notionError; // Fail the entire submission if any variation fails
      }
    }

    console.log(`🎉 Successfully created ${createdCreatives.length} creatives!`);
    
    return new Response(
      JSON.stringify({
        success: true,
        createdCreatives: createdCreatives.map(c => ({
          creativeId: c.creativeId,
          notionPageId: c.notionPageId,
          variationIndex: c.variationIndex,
          uploadedFiles: c.uploadedFiles.length,
          fullCreativeName: c.fullCreativeName
        })),
        totalCreatives: createdCreatives.length,
        creativeIds: createdCreatives.map(c => c.creativeId),
        creativeNames: createdCreatives.map(c => c.fullCreativeName),
        message: `${createdCreatives.length} criativo(s) enviado(s) com sucesso para o Notion!`
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      },
    )
  } catch (error) {
    console.error('❌ Error in submit-creative function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      },
    )
  }
})
