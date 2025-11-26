import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkeletonDashboard } from '@/components/ui/skeleton-screen';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';
import { LayoutGrid, Table2, ChevronDown, ImageIcon, AlertCircle } from 'lucide-react';
import { CreativesTableView } from '@/components/creatives/CreativesTableView';
import { CreativesGridView } from '@/components/creatives/CreativesGridView';
import { CreativesAccordionView } from '@/components/creatives/CreativesAccordionView';

// Interface para métricas agregadas por anúncio
export interface AdMetrics {
  ad_id: string;
  ad_name: string;
  campaign: string;
  campaign_id: string;
  adset_name: string;
  image_url: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  link_clicks: number;
  reach: number;
  purchases: number;
  revenue: number;
  // Métricas calculadas
  ctr: number;
  cpc: number;
  roas: number;
}

// Interface para métricas agregadas por campanha (para accordion)
export interface CampaignMetrics {
  campaign: string;
  campaign_id: string;
  spend: number;
  impressions: number;
  purchases: number;
  revenue: number;
  roas: number;
  ads: AdMetrics[];
}

const ACCOUNT_NAME = 'Boiler 2.0';
const PERIOD_DAYS = 30;

export default function CreativesPrototypePage() {
  const [adMetrics, setAdMetrics] = useState<AdMetrics[]>([]);
  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<{ name: string; metaAdsId: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Buscar account info pelo nome
      const { data: accountData, error: accountError } = await supabase
        .from('j_hub_notion_db_accounts')
        .select('name, meta_ads_id')
        .ilike('name', `%${ACCOUNT_NAME}%`)
        .single();

      if (accountError || !accountData) {
        throw new Error(`Conta "${ACCOUNT_NAME}" não encontrada`);
      }

      if (!accountData.meta_ads_id) {
        throw new Error(`Conta "${ACCOUNT_NAME}" não tem Meta Ads ID configurado`);
      }

      setAccountInfo({
        name: accountData.name,
        metaAdsId: accountData.meta_ads_id
      });

      // 2. Calcular período (últimos 30 dias até ontem)
      const endDate = startOfDay(subDays(new Date(), 1));
      const startDate = startOfDay(subDays(endDate, PERIOD_DAYS - 1));

      console.log(`📊 Fetching creatives for ${accountData.name} (${accountData.meta_ads_id})`);
      console.log(`📅 Period: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

      // 3. Buscar dados brutos
      const { data: rawData, error: dataError } = await supabase
        .from('j_rep_metaads_bronze')
        .select('*')
        .eq('account_id', accountData.meta_ads_id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (dataError) {
        throw new Error(`Erro ao buscar dados: ${dataError.message}`);
      }

      if (!rawData || rawData.length === 0) {
        throw new Error(`Nenhum dado encontrado para ${accountData.name}`);
      }

      console.log(`✅ Found ${rawData.length} raw records`);

      // 4. Agregar por ad_id
      const adMap = new Map<string, AdMetrics>();

      rawData.forEach(row => {
        const adId = row.ad_id;

        if (!adMap.has(adId)) {
          adMap.set(adId, {
            ad_id: adId,
            ad_name: row.ad_name || 'Sem nome',
            campaign: row.campaign || 'Sem campanha',
            campaign_id: row.campaign_id || '',
            adset_name: row.adset_name || 'Sem conjunto',
            image_url: row.image_url,
            spend: 0,
            impressions: 0,
            clicks: 0,
            link_clicks: 0,
            reach: 0,
            purchases: 0,
            revenue: 0,
            ctr: 0,
            cpc: 0,
            roas: 0
          });
        }

        const ad = adMap.get(adId)!;
        ad.spend += parseFloat(String(row.spend || 0));
        ad.impressions += row.impressions || 0;
        ad.clicks += row.clicks || 0;
        ad.link_clicks += row.link_clicks || 0;
        ad.reach += row.reach || 0;
        ad.purchases += row.actions_purchase || 0;
        ad.revenue += parseFloat(String(row.action_values_omni_purchase || 0));

        // Atualizar image_url se ainda não tiver
        if (!ad.image_url && row.image_url) {
          ad.image_url = row.image_url;
        }
      });

      // 5. Calcular métricas derivadas e ordenar por spend
      const adsArray = Array.from(adMap.values()).map(ad => ({
        ...ad,
        ctr: ad.impressions > 0 ? (ad.link_clicks / ad.impressions) * 100 : 0,
        cpc: ad.link_clicks > 0 ? ad.spend / ad.link_clicks : 0,
        roas: ad.spend > 0 ? ad.revenue / ad.spend : 0
      })).sort((a, b) => b.spend - a.spend);

      setAdMetrics(adsArray);

      // 6. Agregar por campanha (para accordion view)
      const campaignMap = new Map<string, CampaignMetrics>();

      adsArray.forEach(ad => {
        const campaignId = ad.campaign_id || ad.campaign;

        if (!campaignMap.has(campaignId)) {
          campaignMap.set(campaignId, {
            campaign: ad.campaign,
            campaign_id: ad.campaign_id,
            spend: 0,
            impressions: 0,
            purchases: 0,
            revenue: 0,
            roas: 0,
            ads: []
          });
        }

        const campaign = campaignMap.get(campaignId)!;
        campaign.spend += ad.spend;
        campaign.impressions += ad.impressions;
        campaign.purchases += ad.purchases;
        campaign.revenue += ad.revenue;
        campaign.ads.push(ad);
      });

      // Calcular ROAS por campanha e ordenar
      const campaignsArray = Array.from(campaignMap.values())
        .map(c => ({
          ...c,
          roas: c.spend > 0 ? c.revenue / c.spend : 0
        }))
        .sort((a, b) => b.spend - a.spend);

      setCampaignMetrics(campaignsArray);

      console.log(`✅ Aggregated into ${adsArray.length} unique ads across ${campaignsArray.length} campaigns`);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <SkeletonDashboard />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Erro ao carregar dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-jumper-orange" />
            Protótipo: Dashboard de Criativos
          </h1>
          <p className="text-muted-foreground">
            Conta: <span className="font-medium">{accountInfo?.name}</span> |
            Período: <span className="font-medium">Últimos {PERIOD_DAYS} dias</span> |
            Anúncios: <span className="font-medium">{adMetrics.length}</span> |
            Campanhas: <span className="font-medium">{campaignMetrics.length}</span>
          </p>
        </div>

        {/* Tabs com 3 layouts */}
        <Tabs defaultValue="table" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              Tabela
            </TabsTrigger>
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="accordion" className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4" />
              Accordion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Layout A: Tabela com Thumbnails</CardTitle>
                <CardDescription>
                  Visualização compacta em tabela com preview pequeno do criativo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreativesTableView ads={adMetrics} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grid">
            <Card>
              <CardHeader>
                <CardTitle>Layout B: Grid de Cards</CardTitle>
                <CardDescription>
                  Cards grandes com imagem dominante, ideal para análise visual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreativesGridView ads={adMetrics} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accordion">
            <Card>
              <CardHeader>
                <CardTitle>Layout C: Accordion por Campanha</CardTitle>
                <CardDescription>
                  Agrupado por campanha, expande para ver os anúncios individuais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreativesAccordionView campaigns={campaignMetrics} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
