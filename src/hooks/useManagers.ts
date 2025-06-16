
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Manager {
  id: string;
  name: string;
  email?: string;
  username?: string;
}

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

export const useManagers = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchManagers = useCallback(async () => {
    try {
      console.log('Fetching managers from Notion DB_Gerentes...');
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('notion-managers');
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      console.log('Raw Notion managers data:', data);
      
      if (!data || !data.success) {
        throw new Error(data?.error || 'Invalid response format from Notion');
      }
      
      if (!data.results || !Array.isArray(data.results)) {
        console.warn('No results found in Notion response');
        setManagers([]);
        setError(null);
        return;
      }
      
      const formattedManagers: Manager[] = data.results.map((item: any) => {
        let name = 'Sem nome';
        let email = '';
        
        // Try to find name in various properties
        const possibleNameProperties = ['Nome', 'Name', 'Gerente', 'Manager', 'Title', 'Título'];
        for (const propName of possibleNameProperties) {
          if (item.properties[propName]) {
            const extractedName = extractTextFromProperty(item.properties[propName]);
            if (extractedName) {
              name = extractedName;
              break;
            }
          }
        }
        
        // Focus specifically on E-Mail property from Notion
        if (item.properties['E-Mail']) {
          email = extractTextFromProperty(item.properties['E-Mail']);
        }
        
        return {
          id: item.id,
          name,
          email,
          username: email // Use email as username for login validation
        };
      });
      
      console.log('Formatted managers:', formattedManagers);
      setManagers(formattedManagers);
      setError(null);
    } catch (err) {
      console.error('Error fetching managers:', err);
      setError('Erro ao carregar gerentes do Notion');
      // Fallback para dados de teste
      setManagers([
        { id: "test-1", name: "Gerente Teste", email: "teste@jumper.com", username: "teste@jumper.com" }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const validateLogin = (email: string, password: string): Manager | null => {
    // Validação usando e-mail
    const manager = managers.find(m => 
      m.email?.toLowerCase() === email.toLowerCase()
    );
    
    if (manager && password === "123456") { // Senha padrão temporária
      return manager;
    }
    
    return null;
  };

  return { managers, loading, error, validateLogin, refetch: fetchManagers };
};
