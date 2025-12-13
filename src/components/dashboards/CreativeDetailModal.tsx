import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { LazyImage } from '@/components/ui/lazy-image';
import {
  Video,
  Image as ImageIcon,
  Images,
  ShoppingBag,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  MousePointer,
  Target,
  Layers,
  AlertTriangle,
  BarChart3,
  ShoppingCart,
  Wallet,
  Percent,
  CircleDollarSign,
} from 'lucide-react';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TopCreative } from '@/hooks/useTopCreatives';
import { CreativeInstance } from '@/hooks/useCreativeInstances';
import { DashboardObjective } from '@/utils/creativeRankingMetrics';

interface CreativeDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creative: TopCreative;
  instances: CreativeInstance[];
  instancesLoading: boolean;
  objective: DashboardObjective;
}

const CATALOG_PLACEHOLDER = '/images/catalog-placeholder.png';

/**
 * Detect if creative is a catalog/dynamic ad
 */
function isCatalogAd(creative: TopCreative): boolean {
  const title = creative.title || '';
  const body = creative.body || '';
  return title.includes('{{') || body.includes('{{');
}

/**
 * Get media type label
 */
function getMediaTypeLabel(creative: TopCreative, isCatalog: boolean): string {
  if (isCatalog) return 'Catálogo';
  const type = (creative.ad_object_type || creative.media_type || '').toUpperCase();
  switch (type) {
    case 'VIDEO': return 'Video';
    case 'CAROUSEL_ALBUM':
    case 'CAROUSEL': return 'Carrossel';
    case 'SHARE': return 'Post';
    default: return 'Imagem';
  }
}

/**
 * Get media type icon
 */
function MediaTypeIcon({ creative, isCatalog }: { creative: TopCreative; isCatalog: boolean }) {
  if (isCatalog) return <ShoppingBag className="h-4 w-4" />;
  const type = (creative.ad_object_type || creative.media_type || '').toUpperCase();
  switch (type) {
    case 'VIDEO': return <Video className="h-4 w-4" />;
    case 'CAROUSEL_ALBUM':
    case 'CAROUSEL': return <Images className="h-4 w-4" />;
    default: return <ImageIcon className="h-4 w-4" />;
  }
}

/**
 * Metric definitions with icons and tooltips
 */
const METRIC_CONFIG = {
  spend: {
    label: 'Gasto',
    icon: DollarSign,
    tooltip: 'Valor total investido neste criativo no período selecionado.',
  },
  roas: {
    label: 'ROAS',
    icon: BarChart3,
    tooltip: 'Retorno sobre o investimento em anúncios. ROAS 2x significa que para cada R$1 gasto, você faturou R$2. Acima de 1x indica lucro.',
  },
  purchases: {
    label: 'Compras',
    icon: ShoppingCart,
    tooltip: 'Número total de vendas atribuídas a este criativo.',
  },
  revenue: {
    label: 'Receita',
    icon: Wallet,
    tooltip: 'Valor total faturado com as vendas geradas por este criativo.',
  },
  impressions: {
    label: 'Impressões',
    icon: Eye,
    tooltip: 'Quantas vezes o anúncio foi exibido. Uma mesma pessoa pode ver várias vezes.',
  },
  clicks: {
    label: 'Cliques',
    icon: MousePointer,
    tooltip: 'Cliques no link do anúncio que direcionam para o site ou landing page.',
  },
  ctr: {
    label: 'CTR',
    icon: Percent,
    tooltip: 'Taxa de cliques. Percentual de pessoas que clicaram após ver o anúncio. Acima de 1% é considerado bom.',
  },
  cpc: {
    label: 'CPC',
    icon: CircleDollarSign,
    tooltip: 'Custo por clique. Quanto você paga, em média, por cada clique no link. Quanto menor, melhor.',
  },
} as const;

type MetricKey = keyof typeof METRIC_CONFIG;

/**
 * Metric card component with tooltip
 */
function MetricCard({
  metricKey,
  value,
  trend,
  alert,
  alertColor = 'yellow',
}: {
  metricKey: MetricKey;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  alert?: boolean;
  alertColor?: 'yellow' | 'orange';
}) {
  const config = METRIC_CONFIG[metricKey];
  const Icon = config.icon;
  const alertColorClass = alertColor === 'orange' ? 'text-orange-500' : 'text-yellow-500';
  const valueAlertClass = alertColor === 'orange' ? 'text-orange-600' : 'text-yellow-600';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="bg-muted/50 rounded-lg p-3 space-y-1 cursor-help">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            <span className="text-xs">{config.label}</span>
            {alert && <AlertTriangle className={cn('h-3 w-3', alertColorClass)} />}
          </div>
          <div className="flex items-center gap-1">
            <span className={cn('text-lg font-semibold', alert && valueAlertClass)}>{value}</span>
            {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
            {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-sm">
        <p>{config.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Target thresholds for metrics
// Based on: ROAS 5x, Ticket R$180, Conv. Rate 1% → CPC max ~R$0.36 (ideal)
// Realistic targets considering typical Meta Ads performance
const METRIC_TARGETS = {
  ctr: { min: 1.0 }, // CTR below 1% is concerning
  cpc: { max: 1.50 }, // CPC above R$1.50 is concerning (adjusted from R$2.50)
};

/**
 * Format currency with 2 decimal places
 */
function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

/**
 * Consolidated metrics section
 */
function ConsolidatedMetrics({ creative }: { creative: TopCreative }) {
  // Check if CTR/CPC are outside targets
  const ctrBelowTarget = creative.ctr < METRIC_TARGETS.ctr.min;
  const cpcAboveTarget = creative.cpc > METRIC_TARGETS.cpc.max;

  return (
    <TooltipProvider delayDuration={300}>
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Métricas Consolidadas
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            metricKey="spend"
            value={formatCurrency(creative.spend)}
          />
          <MetricCard
            metricKey="roas"
            value={`${creative.roas.toFixed(2)}x`}
            trend={creative.roas >= 1 ? 'up' : creative.roas > 0 ? 'neutral' : 'down'}
          />
          <MetricCard
            metricKey="purchases"
            value={String(creative.purchases)}
          />
          <MetricCard
            metricKey="revenue"
            value={formatCurrency(creative.revenue)}
          />
          <MetricCard
            metricKey="impressions"
            value={creative.impressions.toLocaleString('pt-BR')}
          />
          <MetricCard
            metricKey="clicks"
            value={creative.link_clicks.toLocaleString('pt-BR')}
          />
          <MetricCard
            metricKey="ctr"
            value={`${creative.ctr.toFixed(2)}%`}
            alert={ctrBelowTarget}
            alertColor="yellow"
          />
          <MetricCard
            metricKey="cpc"
            value={formatCurrency(creative.cpc)}
            alert={cpcAboveTarget}
            alertColor="orange"
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * Mini metric for instance cards with tooltip
 */
function MiniMetric({
  metricKey,
  value,
  valueColor,
  alert,
  alertColor = 'yellow',
}: {
  metricKey: MetricKey;
  value: string;
  valueColor?: string;
  alert?: boolean;
  alertColor?: 'yellow' | 'orange';
}) {
  const config = METRIC_CONFIG[metricKey];
  const Icon = config.icon;
  const alertColorClass = alertColor === 'orange' ? 'text-orange-500' : 'text-yellow-500';
  const valueAlertClass = alertColor === 'orange' ? 'text-orange-600' : 'text-yellow-600';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="text-center cursor-help">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
            {alert && <AlertTriangle className={cn('h-3 w-3', alertColorClass)} />}
          </p>
          <p className={cn('text-sm font-medium', valueColor, alert && valueAlertClass)}>
            {value}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-sm">
        <p>{config.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Instance card component
 */
function InstanceCard({ instance }: { instance: CreativeInstance }) {
  const roasColor = instance.roas >= 1 ? 'text-green-600' : instance.roas > 0 ? 'text-yellow-600' : 'text-red-600';

  // Check if CTR/CPC are outside targets
  const ctrBelowTarget = instance.ctr < METRIC_TARGETS.ctr.min;
  const cpcAboveTarget = instance.cpc > METRIC_TARGETS.cpc.max;

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="bg-muted/30">
        <CardContent className="p-4 space-y-3">
          {/* Ad Name & Location */}
          <div className="space-y-1">
            <h4 className="font-medium text-sm line-clamp-1" title={instance.ad_name}>
              {instance.ad_name}
            </h4>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground line-clamp-1" title={instance.campaign}>
                <span className="font-medium">Campanha:</span> {instance.campaign}
              </p>
              {instance.adset_name && (
                <p className="text-xs text-muted-foreground line-clamp-1" title={instance.adset_name}>
                  <span className="font-medium">Conjunto:</span> {instance.adset_name}
                </p>
              )}
            </div>
          </div>

          {/* Metrics Grid - 6 columns */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <MiniMetric
              metricKey="spend"
              value={formatCurrency(instance.spend)}
            />
            <MiniMetric
              metricKey="roas"
              value={`${instance.roas.toFixed(2)}x`}
              valueColor={roasColor}
            />
            <MiniMetric
              metricKey="purchases"
              value={String(instance.purchases)}
            />
            <MiniMetric
              metricKey="revenue"
              value={formatCurrency(instance.revenue)}
            />
            <MiniMetric
              metricKey="ctr"
              value={`${instance.ctr.toFixed(2)}%`}
              alert={ctrBelowTarget}
              alertColor="yellow"
            />
            <MiniMetric
              metricKey="cpc"
              value={formatCurrency(instance.cpc)}
              alert={cpcAboveTarget}
              alertColor="orange"
            />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

/**
 * Modal for displaying detailed creative information
 */
export function CreativeDetailModal({
  open,
  onOpenChange,
  creative,
  instances,
  instancesLoading,
  objective,
}: CreativeDetailModalProps) {
  const isCatalog = isCatalogAd(creative);
  const imageUrl = isCatalog
    ? CATALOG_PLACEHOLDER
    : (creative.thumbnail_storage_url || creative.thumbnail_url || creative.image_url);

  const displayTitle = isCatalog ? null : creative.title;
  const displayBody = isCatalog ? null : creative.body;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Detalhes do Criativo</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)] px-6 pb-6">
          <div className="space-y-6">
            {/* Creative Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Thumbnail */}
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                {imageUrl ? (
                  <LazyImage
                    src={imageUrl}
                    alt={creative.ad_name}
                    className="w-full h-full object-cover"
                    fallback="/placeholder.svg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 opacity-40" />
                  </div>
                )}
              </div>

              {/* Creative Details */}
              <div className="md:col-span-2 space-y-3">
                {/* Title & Name */}
                <div>
                  {displayTitle ? (
                    <h3 className="font-semibold text-lg">{displayTitle}</h3>
                  ) : (
                    <h3 className="font-semibold text-lg text-muted-foreground">{creative.ad_name}</h3>
                  )}
                  {displayTitle && (
                    <p className="text-sm text-muted-foreground">{creative.ad_name}</p>
                  )}
                </div>

                {/* Body Text */}
                {displayBody && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{displayBody}</p>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={cn('gap-1', isCatalog && 'border-purple-400 text-purple-600')}>
                    <MediaTypeIcon creative={creative} isCatalog={isCatalog} />
                    {getMediaTypeLabel(creative, isCatalog)}
                  </Badge>
                  {creative.creative_id && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Layers className="h-3 w-3" />
                      {instances.length} instância{instances.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex gap-2 pt-2">
                  {creative.facebook_permalink_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={creative.facebook_permalink_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaFacebook className="h-4 w-4 mr-2 text-blue-600" />
                        Ver no Facebook
                        <ExternalLink className="h-3 w-3 ml-1.5" />
                      </a>
                    </Button>
                  )}
                  {creative.instagram_permalink_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={creative.instagram_permalink_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaInstagram className="h-4 w-4 mr-2 text-pink-600" />
                        Ver no Instagram
                        <ExternalLink className="h-3 w-3 ml-1.5" />
                      </a>
                    </Button>
                  )}
                </div>

                {/* Campaign Info */}
                <p className="text-xs text-muted-foreground pt-2">
                  Campanha: {creative.campaign}
                </p>
              </div>
            </div>

            <Separator />

            {/* Consolidated Metrics */}
            <ConsolidatedMetrics creative={creative} />

            <Separator />

            {/* Instances Section */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Instâncias deste Criativo ({instances.length})
              </h4>

              {instancesLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : instances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma instância encontrada no período selecionado.
                </p>
              ) : (
                <div className="space-y-3">
                  {instances.map((instance) => (
                    <InstanceCard
                      key={instance.ad_id}
                      instance={instance}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
