import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { BarChart3, Plus, CheckCircle2, Pause, AlertCircle } from 'lucide-react';

export type AccessReason = 'ADMIN' | 'GESTOR' | 'SUPERVISOR' | 'GERENTE';

interface AccountCardProps {
  account: {
    id: string;
    name: string;
    status?: string;
    tier?: string;
    objectives?: string[];
    gestor?: string;
    supervisor?: string;
    gerente?: string;
  };
  accessReason: AccessReason;
  className?: string;
}

const accessReasonStyles = {
  ADMIN: {
    badge: 'bg-[hsl(var(--orange-hero))] text-white hover:bg-[hsl(var(--orange-hero)/0.9)]',
    border: 'border-l-4 border-l-[hsl(var(--orange-hero))]',
  },
  GESTOR: {
    badge: 'bg-[hsl(var(--metric-excellent))] text-white hover:bg-[hsl(var(--metric-excellent)/0.9)]',
    border: 'border-l-4 border-l-[hsl(var(--metric-excellent))]',
  },
  SUPERVISOR: {
    badge: 'bg-[hsl(var(--metric-good))] text-white hover:bg-[hsl(var(--metric-good)/0.9)]',
    border: 'border-l-4 border-l-[hsl(var(--metric-good))]',
  },
  GERENTE: {
    badge: 'bg-muted text-muted-foreground hover:bg-muted/80',
    border: 'border-l-4 border-l-muted',
  },
};

const statusIcons = {
  ativa: CheckCircle2,
  pausada: Pause,
  inativa: AlertCircle,
};

const statusStyles = {
  ativa: 'text-[hsl(var(--metric-excellent))]',
  pausada: 'text-[hsl(var(--metric-warning))]',
  inativa: 'text-muted-foreground',
};

export function AccountCard({ account, accessReason, className }: AccountCardProps) {
  const styles = accessReasonStyles[accessReason];
  const statusKey = account.status?.toLowerCase() || 'ativa';
  const StatusIcon = statusIcons[statusKey as keyof typeof statusIcons] || CheckCircle2;

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-lg hover:scale-[1.02]',
        styles.border,
        className
      )}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge className={cn('text-xs font-semibold', styles.badge)}>
            {accessReason}
          </Badge>
          {account.tier && (
            <Badge variant="outline" className="text-xs">
              {account.tier}
            </Badge>
          )}
        </div>
        <h3 className="text-lg font-semibold leading-tight line-clamp-2 min-h-[2.5rem]">
          {account.name}
        </h3>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <StatusIcon className={cn('h-4 w-4', statusStyles[statusKey as keyof typeof statusStyles])} />
          <span className="text-muted-foreground">
            Status: <span className="font-medium text-foreground">{account.status || 'Ativa'}</span>
          </span>
        </div>

        {account.objectives && account.objectives.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Objetivos:</p>
            <div className="flex flex-wrap gap-1">
              {account.objectives.slice(0, 3).map((obj, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {obj}
                </Badge>
              ))}
              {account.objectives.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{account.objectives.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1 text-xs text-muted-foreground border-t pt-3">
          {account.gestor && (
            <div>
              <span className="font-medium">Gestor:</span>{' '}
              <span className="truncate block">{account.gestor}</span>
            </div>
          )}
          {account.supervisor && (
            <div>
              <span className="font-medium">Supervisor:</span>{' '}
              <span className="truncate block">{account.supervisor}</span>
            </div>
          )}
          {account.gerente && (
            <div>
              <span className="font-medium">Gerente:</span>{' '}
              <span className="truncate block">{account.gerente}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        <Link to={`/reports/${encodeURIComponent(account.name)}`} className="flex-1">
          <Button variant="default" size="sm" className="w-full">
            <BarChart3 className="h-4 w-4 mr-2" />
            Ver Reports
          </Button>
        </Link>
        <Link to={`/create?account=${account.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Criativo
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
