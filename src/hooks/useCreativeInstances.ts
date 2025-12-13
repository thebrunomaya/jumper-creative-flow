import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

/**
 * Creative instance data (individual ad using the same creative)
 */
export interface CreativeInstance {
  ad_id: string;
  ad_name: string;
  campaign: string;
  adset_name: string;
  // Base metrics
  spend: number;
  impressions: number;
  clicks: number;
  link_clicks: number;
  reach: number;
  // Conversion metrics
  purchases: number;
  revenue: number;
  leads: number;
  // Derived metrics
  roas: number;
  ctr: number;
  cpc: number;
  cpa: number;
}

interface UseCreativeInstancesParams {
  /** Creative ID to fetch instances for */
  creativeId: string | null;
  /** Meta Ads account ID */
  accountId: string | null;
  /** Start date for data range */
  dateStart: Date;
  /** End date for data range */
  dateEnd: Date;
  /** Whether to fetch (only fetch when modal is open) */
  enabled?: boolean;
}

interface UseCreativeInstancesReturn {
  instances: CreativeInstance[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Raw row from database query
 */
interface BronzeRow {
  ad_id: string;
  ad_name: string | null;
  campaign: string | null;
  adset_name: string | null;
  spend: number | string | null;
  impressions: number | null;
  clicks: number | null;
  link_clicks: number | null;
  reach: number | null;
  actions_purchase: number | null;
  action_values_omni_purchase: number | string | null;
  actions_lead: number | null;
}

/**
 * Hook for fetching all ad instances that use a specific creative_id
 *
 * This allows seeing how the same creative performs across different
 * campaigns, adsets, and ads.
 */
export function useCreativeInstances({
  creativeId,
  accountId,
  dateStart,
  dateEnd,
  enabled = true,
}: UseCreativeInstancesParams): UseCreativeInstancesReturn {
  const [instances, setInstances] = useState<CreativeInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creativeId || !accountId || !enabled) {
      setInstances([]);
      return;
    }

    const fetchInstances = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: rawData, error: queryError } = await supabase
          .from('j_rep_metaads_bronze')
          .select('ad_id, ad_name, campaign, adset_name, spend, impressions, clicks, link_clicks, reach, actions_purchase, action_values_omni_purchase, actions_lead')
          .eq('account_id', accountId)
          .eq('creative_id', creativeId)
          .gte('date', format(dateStart, 'yyyy-MM-dd'))
          .lte('date', format(dateEnd, 'yyyy-MM-dd'));

        if (queryError) {
          throw new Error(queryError.message);
        }

        if (!rawData || rawData.length === 0) {
          setInstances([]);
          setIsLoading(false);
          return;
        }

        // Aggregate by ad_id (each ad instance)
        const aggregated = aggregateByAdId(rawData as BronzeRow[]);

        // Sort by spend descending
        aggregated.sort((a, b) => b.spend - a.spend);

        setInstances(aggregated);
      } catch (err) {
        console.error('Error fetching creative instances:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar instâncias');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstances();
  }, [creativeId, accountId, dateStart, dateEnd, enabled]);

  return { instances, isLoading, error };
}

/**
 * Aggregate raw rows by ad_id
 */
function aggregateByAdId(rows: BronzeRow[]): CreativeInstance[] {
  const adMap = new Map<string, CreativeInstance>();

  for (const row of rows) {
    const adId = row.ad_id;

    if (!adMap.has(adId)) {
      adMap.set(adId, {
        ad_id: adId,
        ad_name: row.ad_name || `Ad ${adId.slice(-6)}`,
        campaign: row.campaign || 'Campanha',
        adset_name: row.adset_name || '',
        spend: 0,
        impressions: 0,
        clicks: 0,
        link_clicks: 0,
        reach: 0,
        purchases: 0,
        revenue: 0,
        leads: 0,
        roas: 0,
        ctr: 0,
        cpc: 0,
        cpa: 0,
      });
    }

    const ad = adMap.get(adId)!;

    // Sum metrics
    ad.spend += parseFloat(String(row.spend || 0));
    ad.impressions += row.impressions || 0;
    ad.clicks += row.clicks || 0;
    ad.link_clicks += row.link_clicks || 0;
    ad.reach += row.reach || 0;
    ad.purchases += row.actions_purchase || 0;
    ad.revenue += parseFloat(String(row.action_values_omni_purchase || 0));
    ad.leads += row.actions_lead || 0;
  }

  // Calculate derived metrics
  for (const ad of adMap.values()) {
    ad.roas = ad.spend > 0 ? ad.revenue / ad.spend : 0;
    ad.ctr = ad.impressions > 0 ? (ad.link_clicks / ad.impressions) * 100 : 0;
    ad.cpc = ad.link_clicks > 0 ? ad.spend / ad.link_clicks : 0;
    ad.cpa = ad.purchases > 0 ? ad.spend / ad.purchases : Infinity;
  }

  return Array.from(adMap.values());
}
