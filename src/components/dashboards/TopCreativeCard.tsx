import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/ui/lazy-image';
import { ImageOff, Video, Image as ImageIcon, Images } from 'lucide-react';
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
 * Get media type icon
 */
function getMediaTypeIcon(mediaType: string | null) {
  switch (mediaType?.toUpperCase()) {
    case 'VIDEO':
      return <Video className="h-3 w-3" />;
    case 'CAROUSEL_ALBUM':
    case 'CAROUSEL':
      return <Images className="h-3 w-3" />;
    default:
      return <ImageIcon className="h-3 w-3" />;
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

  // Get image URL (prefer thumbnail for videos)
  const imageUrl = creative.thumbnail_url || creative.image_url;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-md',
        'border-2',
        rankStyle.border,
        rankStyle.bg
      )}
    >
      {/* Rank Badge */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <span className="text-lg" role="img" aria-label={`Rank ${rank}`}>
          {rankStyle.medal}
        </span>
        {creative.media_type && (
          <Badge variant="outline" className="text-xs gap-1">
            {getMediaTypeIcon(creative.media_type)}
            {creative.media_type === 'CAROUSEL_ALBUM' ? 'Carrossel' : creative.media_type}
          </Badge>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-[4/5] bg-muted">
        {imageUrl ? (
          <LazyImage
            src={imageUrl}
            alt={creative.ad_name}
            className="w-full h-full object-cover"
            fallback="/placeholder.svg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageOff className="h-12 w-12 opacity-50" />
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
        {/* Title */}
        {creative.title && (
          <h4 className="font-semibold text-sm line-clamp-1" title={creative.title}>
            {creative.title}
          </h4>
        )}

        {/* Ad Name (if no title, use ad_name) */}
        {!creative.title && (
          <h4 className="font-semibold text-sm line-clamp-1 text-muted-foreground" title={creative.ad_name}>
            {creative.ad_name}
          </h4>
        )}

        {/* Body text */}
        {creative.body && (
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
      <div className="aspect-[4/5] bg-muted" />

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
