import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/ui/lazy-image';
import { ImageOff, Video, Image as ImageIcon, Images, ShoppingBag, Facebook, Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TopCreative } from '@/hooks/useTopCreatives';
import {
  DashboardObjective,
  getRankingConfig,
  formatMetricValue,
  getPerformanceBadgeColor,
  MetricConfig,
} from '@/utils/creativeRankingMetrics';

interface TopCreativeCardProps {
  /** Creative data */
  creative: TopCreative;
  /** Ranking position (1, 2, or 3) */
  rank: 1 | 2 | 3;
  /** Dashboard objective for metric display */
  objective: DashboardObjective;
}

const RANK_STYLES = {
  1: {
    medal: '🥇',
    border: 'border-yellow-400/50 dark:border-yellow-500/30',
    bg: 'bg-yellow-50/50 dark:bg-yellow-950/20',
  },
  2: {
    medal: '🥈',
    border: 'border-slate-400/50 dark:border-slate-500/30',
    bg: 'bg-slate-50/50 dark:bg-slate-950/20',
  },
  3: {
    medal: '🥉',
    border: 'border-amber-600/50 dark:border-amber-700/30',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
  },
} as const;

const BADGE_COLORS = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
} as const;

/**
 * Get media type from ad_object_type or media_type
 * ad_object_type values: VIDEO, SHARE, PHOTO
 * media_type values: VIDEO, CAROUSEL_ALBUM, IMAGE
 */
function getMediaType(adObjectType: string | null, mediaType: string | null): string {
  const type = adObjectType || mediaType || '';
  return type.toUpperCase();
}

/**
 * Get media type icon
 */
function getMediaTypeIcon(mediaType: string | null, adObjectType: string | null = null) {
  const type = getMediaType(adObjectType, mediaType);
  switch (type) {
    case 'VIDEO':
      return <Video className="h-3 w-3" />;
    case 'CAROUSEL_ALBUM':
    case 'CAROUSEL':
      return <Images className="h-3 w-3" />;
    case 'SHARE':
    case 'PHOTO':
    case 'IMAGE':
    default:
      return <ImageIcon className="h-3 w-3" />;
  }
}

/**
 * Get media type label for display
 */
function getMediaTypeLabel(mediaType: string | null, adObjectType: string | null = null, isCatalog: boolean = false): string {
  if (isCatalog) return 'Catálogo';

  const type = getMediaType(adObjectType, mediaType);
  switch (type) {
    case 'VIDEO':
      return 'Video';
    case 'CAROUSEL_ALBUM':
    case 'CAROUSEL':
      return 'Carrossel';
    case 'SHARE':
      return 'Post';
    case 'PHOTO':
    case 'IMAGE':
      return 'Imagem';
    default:
      return type || 'Anuncio';
  }
}

/**
 * Detect if creative is a catalog/dynamic ad
 * Catalog ads have template placeholders like {{product.name}}
 */
function isCatalogAd(creative: TopCreative): boolean {
  const title = creative.title || '';
  const body = creative.body || '';
  // Check for Meta template placeholders
  return title.includes('{{') || body.includes('{{');
}

/**
 * Get icon for media type (including catalog)
 */
function getMediaTypeIconComponent(mediaType: string | null, adObjectType: string | null, isCatalog: boolean, size: 'sm' | 'lg' = 'sm') {
  const className = size === 'sm' ? 'h-3 w-3' : 'h-16 w-16 opacity-40';

  if (isCatalog) {
    return <ShoppingBag className={className} />;
  }

  const type = getMediaType(adObjectType, mediaType);
  switch (type) {
    case 'VIDEO':
      return <Video className={className} />;
    case 'CAROUSEL_ALBUM':
    case 'CAROUSEL':
      return <Images className={className} />;
    default:
      return size === 'sm' ? <ImageIcon className={className} /> : <ImageOff className={className} />;
  }
}

/**
 * Card component for displaying a top-performing creative
 */
export function TopCreativeCard({ creative, rank, objective }: TopCreativeCardProps) {
  const rankStyle = RANK_STYLES[rank];
  const config = getRankingConfig(objective);

  // Get primary metric value
  const primaryValue = (creative as Record<string, unknown>)[config.primaryMetric.key] as number ?? 0;
  const badgeColor = getPerformanceBadgeColor(primaryValue, objective);

  // Detect catalog/dynamic ads
  const isCatalog = isCatalogAd(creative);

  // Get image URL with fallback priority:
  // For catalogs: ALWAYS use astronaut placeholder (Meta returns useless generic placeholder)
  // For regular ads: thumbnail_storage_url → thumbnail_url → image_url
  const CATALOG_PLACEHOLDER = '/images/catalog-placeholder.png';
  const imageUrl = isCatalog
    ? CATALOG_PLACEHOLDER
    : (creative.thumbnail_storage_url || creative.thumbnail_url || creative.image_url);

  // Get media type for display (prefer ad_object_type from new Windsor data)
  const mediaType = getMediaType(creative.ad_object_type, creative.media_type);
  const mediaTypeLabel = getMediaTypeLabel(creative.media_type, creative.ad_object_type, isCatalog);

  // For catalog ads, don't show template titles like {{product.name}}
  const displayTitle = isCatalog ? null : creative.title;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-md',
        'border-2',
        rankStyle.border,
        rankStyle.bg
      )}
    >
      {/* Header: Medal + Links + Type Badge */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label={`Rank ${rank}`}>
            {rankStyle.medal}
          </span>
          {/* Social Links */}
          <div className="flex items-center gap-0.5">
            {creative.facebook_permalink_url && (
              <a
                href={creative.facebook_permalink_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-muted rounded transition-colors"
                title="Ver no Facebook"
              >
                <Facebook className="h-3.5 w-3.5 text-blue-600" />
              </a>
            )}
            {creative.instagram_permalink_url && (
              <a
                href={creative.instagram_permalink_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-muted rounded transition-colors"
                title="Ver no Instagram"
              >
                <Instagram className="h-3.5 w-3.5 text-pink-600" />
              </a>
            )}
          </div>
        </div>
        {(mediaType || isCatalog) && (
          <Badge variant="outline" className={cn('text-xs gap-1', isCatalog && 'border-purple-400 text-purple-600 dark:border-purple-500 dark:text-purple-400')}>
            {getMediaTypeIconComponent(creative.media_type, creative.ad_object_type, isCatalog, 'sm')}
            {mediaTypeLabel}
          </Badge>
        )}
      </div>

      {/* Image Container - Square (1:1) to match Meta thumbnails */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {imageUrl ? (
          <LazyImage
            src={imageUrl}
            alt={creative.ad_name}
            className="w-full h-full object-cover"
            fallback="/placeholder.svg"
          />
        ) : (
          <div className={cn(
            'w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2',
            isCatalog
              ? 'bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-950/30 dark:to-purple-900/20'
              : 'bg-gradient-to-br from-muted to-muted/50'
          )}>
            {getMediaTypeIconComponent(creative.media_type, creative.ad_object_type, isCatalog, 'lg')}
            <span className="text-xs opacity-60">{mediaTypeLabel || 'Sem preview'}</span>
            {isCatalog && (
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Anúncio Dinâmico</span>
            )}
          </div>
        )}

        {/* Primary Metric Badge Overlay */}
        <div className="absolute top-2 right-2">
          <Badge className={cn('text-sm font-bold', BADGE_COLORS[badgeColor])}>
            {formatMetricValue(primaryValue, config.primaryMetric)}
          </Badge>
        </div>

        {/* Spend Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
          <p className="text-white font-semibold text-sm">
            {formatMetricValue(creative.spend, { key: 'spend', label: 'Gasto', format: 'currency' })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title - don't show template placeholders for catalog ads */}
        {displayTitle && (
          <h4 className="font-semibold text-sm line-clamp-1" title={displayTitle}>
            {displayTitle}
          </h4>
        )}

        {/* Ad Name (if no displayable title, use ad_name) */}
        {!displayTitle && (
          <h4 className="font-semibold text-sm line-clamp-1 text-muted-foreground" title={creative.ad_name}>
            {creative.ad_name}
          </h4>
        )}

        {/* Body text - don't show template placeholders for catalog ads */}
        {creative.body && !isCatalog && (
          <p className="text-xs text-muted-foreground line-clamp-2" title={creative.body}>
            {creative.body}
          </p>
        )}

        {/* Campaign info */}
        <p className="text-xs text-muted-foreground/70 truncate" title={creative.campaign}>
          {creative.campaign}
        </p>

        {/* Secondary Metrics */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-border/50">
          {config.secondaryMetrics.slice(0, 3).map((metric) => (
            <SecondaryMetric
              key={metric.key}
              metric={metric}
              value={(creative as Record<string, unknown>)[metric.key] as number}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * Secondary metric display
 */
function SecondaryMetric({ metric, value }: { metric: MetricConfig; value: number }) {
  return (
    <div className="text-xs">
      <span className="text-muted-foreground">{metric.label}: </span>
      <span className="font-medium">{formatMetricValue(value, metric)}</span>
    </div>
  );
}

/**
 * Skeleton card for loading state
 */
export function TopCreativeCardSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      {/* Rank Badge skeleton */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="w-6 h-6 bg-muted rounded" />
        <div className="w-16 h-5 bg-muted rounded-full" />
      </div>

      {/* Image skeleton */}
      <div className="aspect-square bg-muted" />

      {/* Content skeleton */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="flex gap-3 pt-2 border-t border-border/50">
          <div className="h-3 bg-muted rounded w-16" />
          <div className="h-3 bg-muted rounded w-16" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
      </div>
    </Card>
  );
}
