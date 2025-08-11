
import { useState, useEffect } from 'react';
import { Client, Partner } from '@/types/creative';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMyNotionAccounts } from '@/hooks/useMyNotionAccounts';

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
  const { currentUser } = useAuth();
  const { accountIds } = useMyNotionAccounts();

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
          // Look specifically for the "Conta" property first
          let name = 'Sem nome';
          
          if (item.properties['Conta']) {
            const extractedName = extractTextFromProperty(item.properties['Conta']);
            if (extractedName !== 'Sem nome') {
              name = extractedName;
            }
          }
          
          // If "Conta" doesn't work, try other common property names as fallback
          if (name === 'Sem nome') {
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
          }

          // Extract objectives from "Objetivos" property
          let objectives: string[] = [];
          if (item.properties['Objetivos']) {
            const objectivesProperty = item.properties['Objetivos'];
            if (objectivesProperty.multi_select && Array.isArray(objectivesProperty.multi_select)) {
              objectives = objectivesProperty.multi_select.map((option: any) => option.name).filter(Boolean);
            }
          }
          
          return {
            id: item.id,
            name: name,
            objectives: objectives
          };
        });
        
        // Filtrar clientes baseado nas contas do gerente logado (via Notion)
        let filteredClients = formattedClients;
        if (accountIds && accountIds.length > 0) {
          filteredClients = formattedClients.filter(client => 
            accountIds.includes(client.id)
          );
          console.log('Filtered clients for manager:', filteredClients);
        }
        
        console.log('Formatted clients:', filteredClients);
        setClients(filteredClients);
        setError(null);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Erro ao carregar clientes do Notion');
        // Fallback para dados hardcoded se a API falhar
        setClients([
          { id: "fallback-1", name: "Almeida Prado B2B", objectives: ["Vendas", "Tráfego"] },
          { id: "fallback-2", name: "Almeida Prado Ecommerce", objectives: ["Conversões", "Leads"] },
          { id: "fallback-3", name: "LEAP Lab", objectives: ["Reconhecimento", "Engajamento"] },
          { id: "fallback-4", name: "Koko Educação", objectives: ["Leads", "Tráfego"] },
          { id: "fallback-5", name: "Supermercadistas", objectives: ["Vendas", "Tráfego"] }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [accountIds]); // Refetch quando contas vinculadas mudarem

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
