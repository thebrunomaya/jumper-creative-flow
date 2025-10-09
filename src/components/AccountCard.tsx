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
    atendimento?: string; // Renamed from supervisor
    gerente?: string;
  };
  accessReasons: AccessReason[]; // Multiple badges (cumulative)
  className?: string;
}

// Liquid Glass Design System (referência: StatusMetrics.tsx)
const accessReasonStyles = {
  ADMIN: {
    label: 'ADMIN',
    color: 'text-foreground',
    bgColor: 'bg-foreground/5 hover:bg-foreground/10 backdrop-blur-sm',
    borderColor: 'border-foreground/20',
    borderLeft: 'border-l-4 border-l-foreground',
  },
  GESTOR: {
    label: 'GESTOR',
    color: 'text-[#2AA876]',
    bgColor: 'bg-[#2AA876]/5 hover:bg-[#2AA876]/10 backdrop-blur-sm',
    borderColor: 'border-[#2AA876]/20',
    borderLeft: 'border-l-4 border-l-[#2AA876]',
  },
  SUPERVISOR: {
    label: 'ATENDIMENTO',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/5 hover:bg-blue-500/10 backdrop-blur-sm',
    borderColor: 'border-blue-500/20',
    borderLeft: 'border-l-4 border-l-blue-500',
  },
  GERENTE: {
    label: 'GERENTE',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30 hover:bg-muted/40 backdrop-blur-sm',
    borderColor: 'border-border/50',
    borderLeft: 'border-l-4 border-l-muted',
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

export function AccountCard({ account, accessReasons, className }: AccountCardProps) {
  // Use primeira badge para border-left (maior prioridade)
  const primaryReason = accessReasons[0] || 'GERENTE';
  const primaryStyle = accessReasonStyles[primaryReason];

  const statusKey = account.status?.toLowerCase() || 'ativa';
  const StatusIcon = statusIcons[statusKey as keyof typeof statusIcons] || CheckCircle2;

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-lg hover:scale-[1.02]',
        primaryStyle.borderLeft,
        className
      )}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          {/* Múltiplas badges acumulativas (Liquid Glass design) */}
          <div className="flex gap-1.5">
            {accessReasons.map((reason) => {
              const style = accessReasonStyles[reason];
              return (
                <Badge
                  key={reason}
                  variant="outline"
                  className={cn(
                    'text-xs font-semibold border',
                    style.color,
                    style.bgColor,
                    style.borderColor
                  )}
                >
                  {style.label}
                </Badge>
              );
            })}
          </div>

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
            <span className="font-semibold text-foreground">Status:</span> <span className="font-medium">{account.status || 'Ativa'}</span>
          </span>
        </div>

        {account.objectives && account.objectives.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">Objetivos:</p>
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
              <span className="font-semibold text-foreground">Gestor:</span>{' '}
              <span className="truncate block">{account.gestor}</span>
            </div>
          )}
          {account.atendimento && (
            <div>
              <span className="font-semibold text-foreground">Atendimento:</span>{' '}
              <span className="truncate block">{account.atendimento}</span>
            </div>
          )}
          {account.gerente && (
            <div>
              <span className="font-semibold text-foreground">Gerente:</span>{' '}
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
