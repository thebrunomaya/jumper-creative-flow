
import { useState, useEffect } from 'react';
import { Client, Partner } from '@/types/creative';
import { supabase } from '@/integrations/supabase/client';

interface NotionClient {
  id: string;
  properties: {
    [key: string]: any;
  };
}

interface NotionPartner {
  id: string;
  properties: {
    [key: string]: any;
  };
}

// Helper function to extract text from Notion property
const extractTextFromProperty = (property: any): string => {
  if (!property) return 'Sem nome';
  
  // Handle title property
  if (property.title && Array.isArray(property.title) && property.title.length > 0) {
    return property.title[0].plain_text || 'Sem nome';
  }
  
  // Handle rich_text property
  if (property.rich_text && Array.isArray(property.rich_text) && property.rich_text.length > 0) {
    return property.rich_text[0].plain_text || 'Sem nome';
  }
  
  // Handle plain_text property
  if (property.plain_text) {
    return property.plain_text;
  }
  
  return 'Sem nome';
};

export const useNotionClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        console.log('Fetching clients from Notion DB_Contas...');
        const { data, error } = await supabase.functions.invoke('notion-clients');
        
        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }
        
        console.log('Raw Notion clients data:', data);
        
        if (!data || !data.success) {
          throw new Error(data?.error || 'Invalid response format from Notion');
        }
        
        if (!data.results || !Array.isArray(data.results)) {
          console.warn('No results found in Notion response');
          setClients([]);
          setError(null);
          return;
        }
        
        const formattedClients: Client[] = data.results.map((item: NotionClient) => {
          // Try to find a name property - check common property names
          let name = 'Sem nome';
          
          // Check for common property names in order of preference
          const possibleNameProperties = ['Name', 'Nome', 'Client', 'Cliente', 'Title', 'Título'];
          
          for (const propName of possibleNameProperties) {
            if (item.properties[propName]) {
              const extractedName = extractTextFromProperty(item.properties[propName]);
              if (extractedName !== 'Sem nome') {
                name = extractedName;
                break;
              }
            }
          }
          
          // If no name found, try the first text property
          if (name === 'Sem nome') {
            for (const [key, value] of Object.entries(item.properties)) {
              const extractedName = extractTextFromProperty(value);
              if (extractedName !== 'Sem nome') {
                name = extractedName;
                break;
              }
            }
          }
          
          return {
            id: item.id,
            name: name
          };
        });
        
        console.log('Formatted clients:', formattedClients);
        setClients(formattedClients);
        setError(null);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Erro ao carregar clientes do Notion');
        // Fallback para dados hardcoded se a API falhar
        setClients([
          { id: "fallback-1", name: "Almeida Prado B2B" },
          { id: "fallback-2", name: "Almeida Prado Ecommerce" },
          { id: "fallback-3", name: "LEAP Lab" },
          { id: "fallback-4", name: "Koko Educação" },
          { id: "fallback-5", name: "Supermercadistas" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  return { clients, loading, error };
};

export const useNotionPartners = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        console.log('Fetching partners from Notion DB_Parceiros...');
        const { data, error } = await supabase.functions.invoke('notion-partners');
        
        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }
        
        console.log('Raw Notion partners data:', data);
        
        if (!data || !data.success) {
          throw new Error(data?.error || 'Invalid response format from Notion');
        }
        
        if (!data.results || !Array.isArray(data.results)) {
          console.warn('No results found in Notion response');
          setPartners([]);
          setError(null);
          return;
        }
        
        const formattedPartners: Partner[] = data.results.map((item: NotionPartner) => {
          // Try to find a name property - check common property names
          let name = 'Sem nome';
          
          // Check for common property names in order of preference
          const possibleNameProperties = ['Name', 'Nome', 'Partner', 'Parceiro', 'Title', 'Título'];
          
          for (const propName of possibleNameProperties) {
            if (item.properties[propName]) {
              const extractedName = extractTextFromProperty(item.properties[propName]);
              if (extractedName !== 'Sem nome') {
                name = extractedName;
                break;
              }
            }
          }
          
          // If no name found, try the first text property
          if (name === 'Sem nome') {
            for (const [key, value] of Object.entries(item.properties)) {
              const extractedName = extractTextFromProperty(value);
              if (extractedName !== 'Sem nome') {
                name = extractedName;
                break;
              }
            }
          }
          
          return {
            id: item.id,
            name: name
          };
        });
        
        console.log('Formatted partners:', formattedPartners);
        setPartners(formattedPartners);
        setError(null);
      } catch (err) {
        console.error('Error fetching partners:', err);
        setError('Erro ao carregar parceiros do Notion');
        // Fallback para dados hardcoded se a API falhar
        setPartners([
          { id: "fallback-1", name: "Roberta - LEAP Lab" },
          { id: "fallback-2", name: "Murilo - Agência Koko" },
          { id: "fallback-3", name: "Carlos - Almeida Prado" },
          { id: "fallback-4", name: "Ana - Supermercadistas" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  return { partners, loading, error };
};
