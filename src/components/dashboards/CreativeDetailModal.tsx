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
  Facebook,
  Instagram,
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
} from 'lucide-react';
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
 * Metric card component
 */
function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  alert,
  alertColor = 'yellow',
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  alert?: boolean;
  alertColor?: 'yellow' | 'orange';
}) {
  const alertColorClass = alertColor === 'orange' ? 'text-orange-500' : 'text-yellow-500';
  const valueAlertClass = alertColor === 'orange' ? 'text-orange-600' : 'text-yellow-600';

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span className="text-xs">{label}</span>
        {alert && <AlertTriangle className={cn('h-3 w-3', alertColorClass)} />}
      </div>
      <div className="flex items-center gap-1">
        <span className={cn('text-lg font-semibold', alert && valueAlertClass)}>{value}</span>
        {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
        {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
      </div>
    </div>
  );
}

// Target thresholds for metrics
const METRIC_TARGETS = {
  ctr: { min: 1.0 }, // CTR below 1% is concerning
  cpc: { max: 2.50 }, // CPC above R$2.50 is concerning
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
    <div>
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <Target className="h-4 w-4" />
        Métricas Consolidadas
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Gasto Total"
          value={formatCurrency(creative.spend)}
          icon={DollarSign}
        />
        <MetricCard
          label="ROAS"
          value={`${creative.roas.toFixed(2)}x`}
          trend={creative.roas >= 1 ? 'up' : creative.roas > 0 ? 'neutral' : 'down'}
        />
        <MetricCard
          label="Compras"
          value={String(creative.purchases)}
        />
        <MetricCard
          label="Receita"
          value={formatCurrency(creative.revenue)}
        />
        <MetricCard
          label="Impressões"
          value={creative.impressions.toLocaleString('pt-BR')}
          icon={Eye}
        />
        <MetricCard
          label="Cliques"
          value={creative.link_clicks.toLocaleString('pt-BR')}
          icon={MousePointer}
        />
        <MetricCard
          label="CTR"
          value={`${creative.ctr.toFixed(2)}%`}
          alert={ctrBelowTarget}
          alertColor="yellow"
        />
        <MetricCard
          label="CPC"
          value={formatCurrency(creative.cpc)}
          alert={cpcAboveTarget}
          alertColor="orange"
        />
      </div>
    </div>
  );
}

/**
 * Instance card component
 */
function InstanceCard({ instance, objective }: { instance: CreativeInstance; objective: DashboardObjective }) {
  const roasColor = instance.roas >= 1 ? 'text-green-600' : instance.roas > 0 ? 'text-yellow-600' : 'text-red-600';

  // Check if CTR/CPC are outside targets
  const ctrBelowTarget = instance.ctr < METRIC_TARGETS.ctr.min;
  const cpcAboveTarget = instance.cpc > METRIC_TARGETS.cpc.max;

  return (
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
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Gasto</p>
            <p className="text-sm font-medium">
              {formatCurrency(instance.spend)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ROAS</p>
            <p className={cn('text-sm font-medium', roasColor)}>
              {instance.roas.toFixed(2)}x
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Compras</p>
            <p className="text-sm font-medium">{instance.purchases}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Receita</p>
            <p className="text-sm font-medium">
              {formatCurrency(instance.revenue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              CTR
              {ctrBelowTarget && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
            </p>
            <p className={cn('text-sm font-medium', ctrBelowTarget && 'text-yellow-600')}>
              {instance.ctr.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              CPC
              {cpcAboveTarget && <AlertTriangle className="h-3 w-3 text-orange-500" />}
            </p>
            <p className={cn('text-sm font-medium', cpcAboveTarget && 'text-orange-600')}>
              {formatCurrency(instance.cpc)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
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
                        <Facebook className="h-4 w-4 mr-2 text-blue-600" />
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
                        <Instagram className="h-4 w-4 mr-2 text-pink-600" />
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
                      objective={objective}
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
