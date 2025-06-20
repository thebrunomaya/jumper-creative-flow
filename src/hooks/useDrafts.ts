
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Draft {
  id: string;
  creative_id: string;
  manager_id: string;
  client_id: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  platform?: string;
  campaign_objective?: string;
  creative_type?: string;
  form_data: any;
  created_at: string;
  updated_at: string;
  last_accessed: string;
}

export const useDrafts = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchDrafts = useCallback(async (status?: string) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const url = new URL(`${supabase.supabaseUrl}/functions/v1/get-user-drafts`);
      if (status) {
        url.searchParams.set('status', status);
      }

      const { data, error } = await supabase.functions.invoke('get-user-drafts', {
        body: { status }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch drafts');
      }

      setDrafts(data.drafts);
    } catch (err) {
      console.error('Error fetching drafts:', err);
      setError(err.message || 'Error fetching drafts');
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const createDraft = async (formData: any) => {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase.functions.invoke('create-draft-creative', {
        body: formData
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create draft');
      }

      return {
        creativeId: data.creativeId,
        draftId: data.draftId
      };
    } catch (err) {
      console.error('Error creating draft:', err);
      throw err;
    }
  };

  const updateDraft = async (creativeId: string, formData: any, status?: string) => {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase.functions.invoke('update-draft-creative', {
        body: {
          creativeId,
          formData,
          status
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to update draft');
      }

      return data.draft;
    } catch (err) {
      console.error('Error updating draft:', err);
      throw err;
    }
  };

  const deleteDraft = async (creativeId: string) => {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('creative_drafts')
        .delete()
        .eq('creative_id', creativeId)
        .eq('manager_id', currentUser.id);

      if (error) {
        throw error;
      }

      // Refresh the drafts list
      await fetchDrafts();
    } catch (err) {
      console.error('Error deleting draft:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  return {
    drafts,
    loading,
    error,
    fetchDrafts,
    createDraft,
    updateDraft,
    deleteDraft
  };
};
