
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Manager {
  id: string;
  name: string;
  email?: string;
  username?: string;
  password?: string;
  accounts?: string[]; // IDs das contas que o gerente tem acesso
  funcao?: string; // "Gerente", "Supervisor", "Gestor"
  organizacao?: string; // Para Supervisores acessarem contas da organização
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

// Helper function to extract account IDs from relation property
const extractAccountIds = (property: any): string[] => {
  if (!property || !property.relation || !Array.isArray(property.relation)) {
    return [];
  }
  
  return property.relation.map((item: any) => item.id).filter(Boolean);
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
        let password = '';
        let accounts: string[] = [];
        let funcao = '';
        let organizacao = '';
        
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
        
        // Extract password from "Senha" property
        if (item.properties['Senha']) {
          password = extractTextFromProperty(item.properties['Senha']);
        }
        
        // Extract accounts from "Contas" property
        if (item.properties['Contas']) {
          accounts = extractAccountIds(item.properties['Contas']);
        }
        
        // Extract função from "Função" property
        if (item.properties['Função']) {
          funcao = extractTextFromProperty(item.properties['Função']);
        }
        
        // Extract organização from "Organização" property
        if (item.properties['Organização']) {
          organizacao = extractTextFromProperty(item.properties['Organização']);
        }
        
        return {
          id: item.id,
          name,
          email,
          username: email, // Use email as username for login validation
          password,
          accounts,
          funcao,
          organizacao
        };
      });
      
      console.log('Formatted managers:', formattedManagers);
      setManagers(formattedManagers);
      setError(null);
    } catch (err) {
      console.error('Error fetching managers:', err);
      setError('Erro ao carregar gerentes do Notion');
      setManagers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const validateLogin = (email: string, password: string): Manager | null => {
    console.log('=== VALIDATING LOGIN ===');
    console.log('Email entered:', email);
    console.log('Password entered:', password);
    console.log('Available managers:', managers);
    
    // Validação usando e-mail e senha específica do gerente
    const manager = managers.find(m => 
      m.email?.toLowerCase() === email.toLowerCase()
    );
    
    console.log('Found manager:', manager);
    
    if (manager && manager.password && manager.password === password) {
      console.log('Login successful for manager:', manager);
      return manager;
    }
    
    console.log('Login failed - no matching credentials');
    return null;
  };

  return { managers, loading, error, validateLogin, refetch: fetchManagers };
};
