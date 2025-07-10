import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NOTION_API_KEY = Deno.env.get('NOTION_API_KEY');
const NOTION_DB_GERENTES = '75ac94aa6e614b0db4dcf89aee99a7d5';

// Helper function to extract text from Notion property
const extractTextFromProperty = (property: any): string => {
  if (!property) return '';
  
  // Handle title property
  if (property.title && Array.isArray(property.title) && property.title.length > 0) {
    return property.title[0].plain_text || '';
  }
  
  // Handle rich_text property
  if (property.rich_text && Array.isArray(property.rich_text) && property.rich_text.length > 0) {
    return property.rich_text[0].plain_text || '';
  }
  
  // Handle email property
  if (property.email) {
    return property.email;
  }
  
  // Handle plain_text property
  if (property.plain_text) {
    return property.plain_text;
  }
  
  return '';
};

// Helper function to extract account IDs from relation property
const extractAccountIds = (property: any): string[] => {
  if (!property || !property.relation || !Array.isArray(property.relation)) {
    return [];
  }
  
  return property.relation.map((item: any) => item.id).filter(Boolean);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email e senha são obrigatórios' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!NOTION_API_KEY) {
      console.error('NOTION_API_KEY not found');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Configuração do Notion não encontrada' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Validating manager login via Notion...');

    // Query Notion database for managers
    const notionResponse = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_GERENTES}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter: {
          property: 'E-Mail',
          email: {
            equals: email.toLowerCase()
          }
        }
      }),
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error('Notion API error:', errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro ao conectar com o Notion' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const notionData = await notionResponse.json();
    console.log('Notion response for login:', notionData);

    if (!notionData.results || notionData.results.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Gestor não encontrado' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const manager = notionData.results[0];
    const storedPassword = extractTextFromProperty(manager.properties['Senha']);
    
    if (storedPassword !== password) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Credenciais inválidas' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract manager data
    let name = 'Sem nome';
    let managerEmail = '';
    let accounts: string[] = [];
    
    // Try to find name in various properties
    const possibleNameProperties = ['Nome', 'Name', 'Gerente', 'Manager', 'Title', 'Título'];
    for (const propName of possibleNameProperties) {
      if (manager.properties[propName]) {
        const extractedName = extractTextFromProperty(manager.properties[propName]);
        if (extractedName) {
          name = extractedName;
          break;
        }
      }
    }
    
    // Extract email
    if (manager.properties['E-Mail']) {
      managerEmail = extractTextFromProperty(manager.properties['E-Mail']);
    }
    
    // Extract accounts from "Contas" property
    if (manager.properties['Contas']) {
      accounts = extractAccountIds(manager.properties['Contas']);
    }

    const authenticatedManager = {
      id: manager.id,
      name,
      email: managerEmail,
      username: managerEmail,
      accounts,
      loginType: 'notion'
    };

    console.log('Manager authenticated successfully:', authenticatedManager);

    return new Response(JSON.stringify({ 
      success: true, 
      manager: authenticatedManager 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in notion-login function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});