import React from 'react';
import { Trophy, AlertCircle, RefreshCw, ChevronRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TopCreativeCard, TopCreativeCardSkeleton } from './TopCreativeCard';
import { useTopCreatives, FilterInfo } from '@/hooks/useTopCreatives';
import { DashboardObjective, getRankingConfig } from '@/utils/creativeRankingMetrics';

/**
 * Format currency in BRL with 2 decimal places
 */
function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

interface TopCreativesSectionProps {
  /** Meta Ads account ID */
  accountId: string | null;
  /** Dashboard objective for ranking logic */
  objective: DashboardObjective;
  /** Start date for data range */
  dateStart: Date;
  /** End date for data range */
  dateEnd: Date;
  /** Optional callback when "Ver todos" is clicked */
  onViewAll?: () => void;
}

/**
 * Section component displaying top 3 performing creatives
 *
 * @example
 * ```tsx
 * <TopCreativesSection
 *   accountId="act_123456"
 *   objective="vendas"
 *   dateStart={subDays(new Date(), 7)}
 *   dateEnd={subDays(new Date(), 1)}
 * />
 * ```
 */
export function TopCreativesSection({
  accountId,
  objective,
  dateStart,
  dateEnd,
  onViewAll,
}: TopCreativesSectionProps) {
  const { creatives, isLoading, error, refetch, filterInfo } = useTopCreatives({
    accountId,
    objective,
    dateStart,
    dateEnd,
    limit: 3,
  });

  const config = getRankingConfig(objective);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Top Criativos</h3>
            <span className="text-sm text-muted-foreground">
              (por {config.primaryMetric.label})
            </span>

            {/* Info tooltip explaining the 10% threshold */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground/60 cursor-help hover:text-muted-foreground transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px]">
                <p className="text-xs">
                  Mostra os 3 criativos com melhor performance que tiveram
                  pelo menos 10% do gasto total do período.
                  {filterInfo && (
                    <span className="block mt-1 font-medium">
                      Mínimo: {formatCurrency(filterInfo.minSpendThreshold)} de {formatCurrency(filterInfo.totalSpend)}
                    </span>
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Subtle threshold disclaimer */}
          {filterInfo && filterInfo.minSpendThreshold > 0 && (
            <p className="text-xs text-muted-foreground/70 ml-7">
              Criativos com no mínimo 10% do gasto ({formatCurrency(filterInfo.minSpendThreshold)})
            </p>
          )}
        </div>

        {onViewAll && creatives.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : creatives.length === 0 ? (
        <EmptyState filterInfo={filterInfo} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {creatives.map((creative, index) => (
            <TopCreativeCard
              key={creative.creative_id || creative.ad_id}
              creative={creative}
              rank={(index + 1) as 1 | 2 | 3}
              objective={objective}
              accountId={accountId!}
              dateStart={dateStart}
              dateEnd={dateEnd}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Loading state with skeleton cards
 */
function LoadingState() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <TopCreativeCardSkeleton />
      <TopCreativeCardSkeleton />
      <TopCreativeCardSkeleton />
    </div>
  );
}

/**
 * Error state with retry button
 */
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-destructive/50 rounded-lg bg-destructive/5">
      <AlertCircle className="h-8 w-8 text-destructive mb-2" />
      <p className="text-sm text-destructive font-medium mb-1">Erro ao carregar criativos</p>
      <p className="text-xs text-muted-foreground mb-3">{error}</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  );
}

/**
 * Empty state when no creatives found or none pass threshold
 */
function EmptyState({ filterInfo }: { filterInfo: FilterInfo | null }) {
  // If we have filterInfo with totalCreatives > 0 but filteredCreatives is 0,
  // it means creatives exist but none passed the 10% threshold
  const hasCreativesButFiltered = filterInfo && filterInfo.totalCreatives > 0 && filterInfo.filteredCreatives === 0;

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-border rounded-lg bg-muted/30">
      <Trophy className="h-8 w-8 text-muted-foreground/50 mb-2" />
      <p className="text-sm text-muted-foreground font-medium">
        {hasCreativesButFiltered
          ? 'Nenhum criativo atingiu o mínimo de 10% do gasto'
          : 'Nenhum criativo encontrado'}
      </p>
      <p className="text-xs text-muted-foreground/70 text-center max-w-xs">
        {hasCreativesButFiltered
          ? `${filterInfo.totalCreatives} criativo(s) encontrado(s), mas nenhum com gasto acima de ${formatCurrency(filterInfo.minSpendThreshold)}`
          : 'Não há dados de criativos para o período selecionado'}
      </p>
    </div>
  );
}
