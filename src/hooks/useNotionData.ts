
import { useState, useEffect } from 'react';
import { Client, Partner } from '@/types/creative';
import { supabase } from '@/integrations/supabase/client';

interface NotionClient {
  id: string;
  properties: {
    Name: {
      title: Array<{ plain_text: string }>;
    };
  };
}

interface NotionPartner {
  id: string;
  properties: {
    Name: {
      title: Array<{ plain_text: string }>;
    };
  };
}

export const useNotionClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        console.log('Fetching clients from Notion...');
        const { data, error } = await supabase.functions.invoke('notion-clients');
        
        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }
        
        console.log('Raw Notion clients data:', data);
        
        if (!data || !data.results) {
          throw new Error('Invalid response format from Notion');
        }
        
        const formattedClients: Client[] = data.results.map((item: NotionClient) => ({
          id: item.id,
          name: item.properties.Name?.title?.[0]?.plain_text || 'Sem nome'
        }));
        
        console.log('Formatted clients:', formattedClients);
        setClients(formattedClients);
        setError(null);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Erro ao carregar clientes do Notion');
        // Fallback para dados hardcoded se a API falhar
        setClients([
          { id: "18bdb609-4968-8021-bb17-eacb9298e804", name: "Almeida Prado B2B" },
          { id: "162db609-4968-8059-8ca5-d71ff12660ab", name: "Almeida Prado Ecommerce" },
          { id: "163db609-4968-80bb-8113-f8381aace362", name: "LEAP Lab" },
          { id: "164db609-4968-80dc-befd-d2cb83532f3b", name: "Koko Educação" },
          { id: "165db609-4968-80fe-a1c7-e8df90125678", name: "Supermercadistas" }
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
        console.log('Fetching partners from Notion...');
        const { data, error } = await supabase.functions.invoke('notion-partners');
        
        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }
        
        console.log('Raw Notion partners data:', data);
        
        if (!data || !data.results) {
          throw new Error('Invalid response format from Notion');
        }
        
        const formattedPartners: Partner[] = data.results.map((item: NotionPartner) => ({
          id: item.id,
          name: item.properties.Name?.title?.[0]?.plain_text || 'Sem nome'
        }));
        
        console.log('Formatted partners:', formattedPartners);
        setPartners(formattedPartners);
        setError(null);
      } catch (err) {
        console.error('Error fetching partners:', err);
        setError('Erro ao carregar parceiros do Notion');
        // Fallback para dados hardcoded se a API falhar
        setPartners([
          { id: "163db609-4968-80bb-8113-f8381aace362", name: "Roberta - LEAP Lab" },
          { id: "163db609-4968-80dc-befd-d2cb83532f3b", name: "Murilo - Agência Koko" },
          { id: "164db609-4968-80fe-a1c7-e8df90123456", name: "Carlos - Almeida Prado" },
          { id: "165db609-4968-8021-bb17-eacb92987890", name: "Ana - Supermercadistas" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  return { partners, loading, error };
};
