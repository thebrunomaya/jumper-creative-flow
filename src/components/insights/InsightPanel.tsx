import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, AlertCircle, Info, Sparkles } from 'lucide-react';
import { useComparativeMetrics } from '@/hooks/useComparativeMetrics';
import { DashboardType } from '@/utils/dashboardObjectives';
import { cn } from '@/lib/utils';

interface InsightPanelProps {
  accountId?: string;
  accountName?: string;
  metaAdsId?: string;
  selectedPeriod: number;
  dashboardType: DashboardType;
  className?: string;
}

export function InsightPanel({
  accountId,
  accountName,
  metaAdsId,
  selectedPeriod,
  dashboardType,
  className
}: InsightPanelProps) {

  const { insights, currentPeriod, previousPeriod, loading, error } = useComparativeMetrics({
    accountId,
    metaAdsId,
    selectedPeriod,
    dashboardType,
    enabled: !!metaAdsId
  });

  if (loading) {
    return <InsightPanelSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar insights comparativos: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!metaAdsId || insights.length === 0) {
    return null; // Don't show if no data
  }

  return (
    <Card className={cn("border-l-4 border-l-[hsl(var(--orange-hero))] bg-gradient-to-r from-[hsl(var(--orange-subtle))] to-background", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[hsl(var(--orange-hero))]" />
            <CardTitle className="text-lg">
              Destaques do Período
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            vs {previousPeriod.label}
          </Badge>
        </div>
        <CardDescription>
          Comparando {currentPeriod.label} com período anterior
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <InsightItem key={index} insight={insight} />
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// INSIGHT ITEM COMPONENT
// ============================================================================

interface InsightItemProps {
  insight: {
    type: 'win' | 'warning' | 'info';
    icon: '✅' | '⚠️' | '📊';
    title: string;
    description: string;
    metric: any;
  };
}

function InsightItem({ insight }: InsightItemProps) {
  const { type, icon, title, description, metric } = insight;

  const typeStyles = {
    win: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      border: 'border-green-200 dark:border-green-900',
      icon: 'text-green-600 dark:text-green-400',
      title: 'text-green-900 dark:text-green-100',
      iconComponent: TrendingUp
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-900',
      icon: 'text-amber-600 dark:text-amber-400',
      title: 'text-amber-900 dark:text-amber-100',
      iconComponent: TrendingDown
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-900',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-900 dark:text-blue-100',
      iconComponent: Info
    }
  };

  const style = typeStyles[type];
  const IconComponent = style.iconComponent;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
        style.bg,
        style.border
      )}
    >
      <div className={cn("p-1.5 rounded-md bg-white/50 dark:bg-black/10 flex-shrink-0", style.icon)}>
        <IconComponent className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className={cn("font-medium text-sm leading-tight mb-0.5", style.title)}>
          {title}
        </div>
        <div className="text-xs text-muted-foreground">
          {description}
        </div>

        {/* Trend badge */}
        {metric.trend !== 'stable' && (
          <div className="mt-1.5">
            <TrendBadge
              trend={metric.trend}
              change={metric.change}
              sentiment={metric.sentiment}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TREND BADGE
// ============================================================================

interface TrendBadgeProps {
  trend: 'up' | 'down' | 'stable';
  change: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

function TrendBadge({ trend, change, sentiment }: TrendBadgeProps) {
  if (trend === 'stable') return null;

  const isPositive = sentiment === 'positive';
  const changeText = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        isPositive
          ? "border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
          : "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
      )}
    >
      {trend === 'up' ? '↑' : '↓'} {changeText}
    </Badge>
  );
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

function InsightPanelSkeleton() {
  return (
    <Card className="border-l-4 border-l-muted">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>

      <CardContent className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
            <Skeleton className="h-10 w-10 rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
