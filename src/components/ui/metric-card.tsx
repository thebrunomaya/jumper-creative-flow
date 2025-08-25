import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type MetricPerformance = 'excellent' | 'good' | 'warning' | 'critical' | 'neutral';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  performance?: MetricPerformance;
  trend?: 'up' | 'down' | 'neutral';
  isHero?: boolean;
  className?: string;
}

const performanceStyles = {
  excellent: {
    border: 'border-l-4 border-l-[hsl(var(--metric-excellent))]',
    icon: 'text-[hsl(var(--metric-excellent))]',
    accent: 'bg-[hsl(var(--metric-excellent)/0.1)]'
  },
  good: {
    border: 'border-l-4 border-l-[hsl(var(--metric-good))]',
    icon: 'text-[hsl(var(--metric-good))]',
    accent: 'bg-[hsl(var(--metric-good)/0.1)]'
  },
  warning: {
    border: 'border-l-4 border-l-[hsl(var(--metric-warning))]',
    icon: 'text-[hsl(var(--metric-warning))]',
    accent: 'bg-[hsl(var(--metric-warning)/0.1)]'
  },
  critical: {
    border: 'border-l-4 border-l-[hsl(var(--metric-critical))]',
    icon: 'text-[hsl(var(--metric-critical))]',
    accent: 'bg-[hsl(var(--metric-critical)/0.1)]'
  },
  neutral: {
    border: 'border-l-4 border-l-muted',
    icon: 'text-muted-foreground',
    accent: 'bg-muted/50'
  }
};

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  performance = 'neutral',
  isHero = false,
  className,
  ...props 
}: MetricCardProps) {
  const styles = performanceStyles[performance];

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      styles.border,
      isHero && "ring-2 ring-[hsl(var(--orange-hero)/0.2)] bg-[hsl(var(--orange-subtle))]",
      className
    )} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn(
          "text-sm font-medium line-clamp-2 leading-tight",
          "sm:text-base sm:line-clamp-1",
          isHero && "text-[hsl(var(--orange-hero))] font-semibold"
        )}>
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn(
            "p-1 rounded-md flex-shrink-0",
            styles.accent
          )}>
            <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", styles.icon)} />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        <div className={cn(
          "text-xl font-bold leading-tight truncate",
          "sm:text-2xl",
          isHero && "text-2xl sm:text-3xl text-[hsl(var(--orange-hero))]"
        )}>
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </div>
        {subtitle && (
          <p className={cn(
            "text-xs text-muted-foreground line-clamp-2 leading-tight",
            "sm:text-sm sm:line-clamp-1",
            isHero && "text-sm sm:text-base font-medium text-[hsl(var(--orange-hero)/0.8)]"
          )}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}