import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { DashboardObjective, getRankingConfig } from '@/utils/creativeRankingMetrics';
import { applyObjectiveFilter, DashboardType } from '@/utils/dashboardObjectives';

/**
 * Top Creative data structure with aggregated metrics
 */
export interface TopCreative {
  // Identification
  ad_id: string;
  ad_name: string;
  campaign: string;
  adset_name: string;
  creative_id: string | null;

  // Creative content (from Windsor)
  image_url: string | null;
  thumbnail_url: string | null;
  thumbnail_storage_url: string | null;
  body: string | null;
  title: string | null;
  link: string | null;
  media_type: string | null;
  ad_object_type: string | null;
  facebook_permalink_url: string | null;
  instagram_permalink_url: string | null;

  // Base metrics (aggregated across date range)
  spend: number;
  impressions: number;
  clicks: number;
  link_clicks: number;
  reach: number;
  frequency: number;

  // Conversion metrics
  purchases: number;
  revenue: number;
  leads: number;
  registrations: number;
  conversations: number;
  post_engagement: number;
  post_reaction: number;
  likes: number;

  // Video metrics
  thruplays: number;
  video_p75: number;
  video_p50: number;
  video_p25: number;
  video_plays: number;

  // Derived metrics (calculated)
  roas: number;
  ctr: number;
  cpc: number;
  cpl: number;
  cpa: number;
  cpm: number;
  costPerConversation: number;
  costPerRegistration: number;
  costPerLike: number;
  costPer1kReach: number;
  thruplayRate: number;
  engagementPerSpend: number;
  conversionRate: number;
}

interface UseTopCreativesParams {
  /** Meta Ads account ID */
  accountId: string | null;
  /** Dashboard objective for ranking logic */
  objective: DashboardObjective;
  /** Start date for data range */
  dateStart: Date;
  /** End date for data range */
  dateEnd: Date;
  /** Number of top creatives to return (default: 3) */
  limit?: number;
}

/**
 * Filter info metadata - explains the minimum spend threshold applied
 */
export interface FilterInfo {
  /** Total spend across all creatives in the period */
  totalSpend: number;
  /** Minimum spend threshold (10% of total) */
  minSpendThreshold: number;
  /** Number of creatives before filtering */
  totalCreatives: number;
  /** Number of creatives after filtering */
  filteredCreatives: number;
}

interface UseTopCreativesReturn {
  /** Top creatives sorted by objective metric */
  creatives: TopCreative[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refetch function */
  refetch: () => void;
  /** Filter metadata (threshold info) */
  filterInfo: FilterInfo | null;
}

/**
 * Raw row from j_rep_metaads_bronze table
 */
interface BronzeRow {
  ad_id: string;
  ad_name: string | null;
  campaign: string | null;
  adset_name: string | null;
  creative_id: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  thumbnail_storage_url: string | null;
  body: string | null;
  title: string | null;
  link: string | null;
  media_type: string | null;
  ad_object_type: string | null;
  facebook_permalink_url: string | null;
  instagram_permalink_url: string | null;
  spend: number | string | null;
  impressions: number | null;
  clicks: number | null;
  link_clicks: number | null;
  reach: number | null;
  frequency: number | string | null;
  actions_purchase: number | null;
  action_values_omni_purchase: number | string | null;
  actions_lead: number | null;
  actions_complete_registration: number | null;
  actions_onsite_conversion_messaging_conversation_started_7d: number | null;
  actions_post_engagement: number | null;
  actions_post_reaction: number | null;
  actions_like: number | null;
  video_thruplay_watched_actions_video_view: number | null;
  video_p75_watched_actions_video_view: number | null;
  video_p50_watched_actions_video_view: number | null;
  video_p25_watched_actions_video_view: number | null;
  video_play_actions_video_view: number | null;
}

/**
 * Hook for fetching and ranking top performing creatives by dashboard objective
 *
 * @example
 * ```tsx
 * const { creatives, isLoading, error } = useTopCreatives({
 *   accountId: 'act_123456',
 *   objective: 'vendas',
 *   dateStart: subDays(new Date(), 7),
 *   dateEnd: subDays(new Date(), 1),
 *   limit: 3,
 * });
 * ```
 */
/** Minimum spend percentage threshold (10% of total spend) */
const MIN_SPEND_PERCENTAGE = 0.10;

export function useTopCreatives({
  accountId,
  objective,
  dateStart,
  dateEnd,
  limit = 3,
}: UseTopCreativesParams): UseTopCreativesReturn {
  const [creatives, setCreatives] = useState<TopCreative[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterInfo, setFilterInfo] = useState<FilterInfo | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!accountId) {
      setCreatives([]);
      setFilterInfo(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query
        let query = supabase
          .from('j_rep_metaads_bronze')
          .select('*')
          .eq('account_id', accountId)
          .gte('date', format(dateStart, 'yyyy-MM-dd'))
          .lte('date', format(dateEnd, 'yyyy-MM-dd'));

        // Apply objective filter if applicable
        query = applyObjectiveFilter(query, objective as DashboardType);

        const { data: rawData, error: queryError } = await query;

        if (queryError) {
          throw new Error(queryError.message);
        }

        if (!rawData || rawData.length === 0) {
          setCreatives([]);
          setFilterInfo(null);
          setIsLoading(false);
          return;
        }

        // Aggregate by creative_id (groups all ad instances of the same creative)
        const aggregated = aggregateByCreativeId(rawData as BronzeRow[]);

        // Calculate derived metrics
        const withDerivedMetrics = aggregated.map(calculateDerivedMetrics);

        // Calculate total spend and minimum threshold (10%)
        const totalSpend = withDerivedMetrics.reduce((sum, c) => sum + c.spend, 0);
        const minSpendThreshold = totalSpend * MIN_SPEND_PERCENTAGE;

        // Filter creatives with minimum spend threshold
        const filteredByThreshold = withDerivedMetrics.filter((c) => c.spend >= minSpendThreshold);

        // Save filter info for UI display
        setFilterInfo({
          totalSpend,
          minSpendThreshold,
          totalCreatives: withDerivedMetrics.length,
          filteredCreatives: filteredByThreshold.length,
        });

        // Sort by objective metric and take top N
        const sorted = sortByObjective(filteredByThreshold, objective);
        const topN = sorted.slice(0, limit);

        setCreatives(topN);
      } catch (err) {
        console.error('Error fetching top creatives:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar criativos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [accountId, objective, dateStart, dateEnd, limit, refreshKey]);

  return { creatives, isLoading, error, refetch, filterInfo };
}

/**
 * Aggregate raw rows by creative_id, summing metrics across all ad instances
 * This groups all ads that use the same creative, giving true creative performance
 */
function aggregateByCreativeId(rows: BronzeRow[]): Omit<TopCreative, keyof DerivedMetrics>[] {
  const creativeMap = new Map<string, Omit<TopCreative, keyof DerivedMetrics>>();

  for (const row of rows) {
    // Use creative_id as key, fallback to ad_id if no creative_id
    const key = row.creative_id || row.ad_id;

    if (!creativeMap.has(key)) {
      // Initialize with creative content from first row
      creativeMap.set(key, {
        ad_id: row.ad_id, // Keep first ad_id for reference
        ad_name: row.ad_name || `Ad ${row.ad_id.slice(-6)}`,
        campaign: row.campaign || 'Campanha',
        adset_name: row.adset_name || '',
        creative_id: row.creative_id,
        image_url: row.image_url,
        thumbnail_url: row.thumbnail_url,
        thumbnail_storage_url: row.thumbnail_storage_url,
        body: row.body,
        title: row.title,
        link: row.link,
        media_type: row.media_type,
        ad_object_type: row.ad_object_type,
        facebook_permalink_url: row.facebook_permalink_url,
        instagram_permalink_url: row.instagram_permalink_url,
        // Initialize metrics at 0
        spend: 0,
        impressions: 0,
        clicks: 0,
        link_clicks: 0,
        reach: 0,
        frequency: 0,
        purchases: 0,
        revenue: 0,
        leads: 0,
        registrations: 0,
        conversations: 0,
        post_engagement: 0,
        post_reaction: 0,
        likes: 0,
        thruplays: 0,
        video_p75: 0,
        video_p50: 0,
        video_p25: 0,
        video_plays: 0,
        // Derived metrics will be calculated later
        roas: 0,
        ctr: 0,
        cpc: 0,
        cpl: 0,
        cpa: 0,
        cpm: 0,
        costPerConversation: 0,
        costPerRegistration: 0,
        costPerLike: 0,
        costPer1kReach: 0,
        thruplayRate: 0,
        engagementPerSpend: 0,
        conversionRate: 0,
      });
    }

    const creative = creativeMap.get(key)!;

    // Update creative content if current row has better data
    if (!creative.creative_id && row.creative_id) creative.creative_id = row.creative_id;
    if (!creative.image_url && row.image_url) creative.image_url = row.image_url;
    if (!creative.thumbnail_url && row.thumbnail_url) creative.thumbnail_url = row.thumbnail_url;
    if (!creative.thumbnail_storage_url && row.thumbnail_storage_url) creative.thumbnail_storage_url = row.thumbnail_storage_url;
    if (!creative.body && row.body) creative.body = row.body;
    if (!creative.title && row.title) creative.title = row.title;
    if (!creative.link && row.link) creative.link = row.link;
    if (!creative.media_type && row.media_type) creative.media_type = row.media_type;
    if (!creative.ad_object_type && row.ad_object_type) creative.ad_object_type = row.ad_object_type;
    if (!creative.facebook_permalink_url && row.facebook_permalink_url) creative.facebook_permalink_url = row.facebook_permalink_url;
    if (!creative.instagram_permalink_url && row.instagram_permalink_url) creative.instagram_permalink_url = row.instagram_permalink_url;

    // Sum metrics across all instances
    creative.spend += parseFloat(String(row.spend || 0));
    creative.impressions += row.impressions || 0;
    creative.clicks += row.clicks || 0;
    creative.link_clicks += row.link_clicks || 0;
    creative.reach += row.reach || 0;
    creative.purchases += row.actions_purchase || 0;
    creative.revenue += parseFloat(String(row.action_values_omni_purchase || 0));
    creative.leads += row.actions_lead || 0;
    creative.registrations += row.actions_complete_registration || 0;
    creative.conversations += row.actions_onsite_conversion_messaging_conversation_started_7d || 0;
    creative.post_engagement += row.actions_post_engagement || 0;
    creative.post_reaction += row.actions_post_reaction || 0;
    creative.likes += row.actions_like || 0;
    creative.thruplays += row.video_thruplay_watched_actions_video_view || 0;
    creative.video_p75 += row.video_p75_watched_actions_video_view || 0;
    creative.video_p50 += row.video_p50_watched_actions_video_view || 0;
    creative.video_p25 += row.video_p25_watched_actions_video_view || 0;
    creative.video_plays += row.video_play_actions_video_view || 0;

    // Frequency is an average, take max for now (will recalculate if needed)
    const rowFreq = parseFloat(String(row.frequency || 0));
    if (rowFreq > creative.frequency) creative.frequency = rowFreq;
  }

  return Array.from(creativeMap.values());
}

type DerivedMetrics = {
  roas: number;
  ctr: number;
  cpc: number;
  cpl: number;
  cpa: number;
  cpm: number;
  costPerConversation: number;
  costPerRegistration: number;
  costPerLike: number;
  costPer1kReach: number;
  thruplayRate: number;
  engagementPerSpend: number;
  conversionRate: number;
};

/**
 * Calculate derived metrics from aggregated base metrics
 */
function calculateDerivedMetrics(ad: Omit<TopCreative, keyof DerivedMetrics> & Partial<DerivedMetrics>): TopCreative {
  const { spend, impressions, link_clicks, clicks, purchases, revenue, leads, registrations, conversations, likes, reach, post_engagement, thruplays, video_plays } = ad;

  return {
    ...ad,
    // ROAS
    roas: spend > 0 ? revenue / spend : 0,
    // CTR (based on link clicks)
    ctr: impressions > 0 ? (link_clicks / impressions) * 100 : 0,
    // CPC
    cpc: link_clicks > 0 ? spend / link_clicks : 0,
    // CPL (Cost Per Lead)
    cpl: leads > 0 ? spend / leads : Infinity,
    // CPA (Cost Per Acquisition/Purchase)
    cpa: purchases > 0 ? spend / purchases : Infinity,
    // CPM (Cost Per 1000 Impressions)
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    // Cost per conversation
    costPerConversation: conversations > 0 ? spend / conversations : Infinity,
    // Cost per registration
    costPerRegistration: registrations > 0 ? spend / registrations : Infinity,
    // Cost per like/follower
    costPerLike: likes > 0 ? spend / likes : Infinity,
    // Cost per 1k reach
    costPer1kReach: reach > 0 ? (spend / reach) * 1000 : 0,
    // ThruPlay rate (ThruPlays / Video Plays)
    thruplayRate: video_plays > 0 ? (thruplays / video_plays) * 100 : 0,
    // Engagement per spend
    engagementPerSpend: spend > 0 ? post_engagement / spend : 0,
    // Conversion rate (purchases / clicks)
    conversionRate: clicks > 0 ? (purchases / clicks) * 100 : 0,
  };
}

/**
 * Sort creatives by the objective's primary metric
 * Note: Filtering by minimum spend threshold is done before this function
 */
function sortByObjective(creatives: TopCreative[], objective: DashboardObjective): TopCreative[] {
  const config = getRankingConfig(objective);
  const { sortBy, lowerIsBetter } = config;

  // Creatives are already filtered by minimum spend threshold
  // Just sort by the objective metric
  return [...creatives].sort((a, b) => {
    const aValue = (a as Record<string, unknown>)[sortBy] as number ?? (lowerIsBetter ? Infinity : 0);
    const bValue = (b as Record<string, unknown>)[sortBy] as number ?? (lowerIsBetter ? Infinity : 0);

    // Handle Infinity for "lower is better" metrics (e.g., CPL)
    if (lowerIsBetter) {
      // For lower-is-better metrics, Infinity goes to the end
      if (aValue === Infinity && bValue === Infinity) return 0;
      if (aValue === Infinity) return 1;
      if (bValue === Infinity) return -1;
      return aValue - bValue;
    }

    // For higher-is-better metrics, sort descending
    return bValue - aValue;
  });
}
