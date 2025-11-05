import { cn } from '@/lib/utils';
import {
  BarChart3,
  ShoppingCart,
  MousePointer,
  Users,
  Target,
  Eye,
  Video,
  TrendingUp,
  Megaphone,
  MessageCircle,
  UserPlus,
  UserCheck
} from 'lucide-react';
import type { DashboardObjective } from '@/hooks/useMultiAccountMetrics';

export interface ObjectiveSelectorProps {
  value: DashboardObjective;
  onChange: (objective: DashboardObjective) => void;
}

interface ObjectiveOption {
  value: DashboardObjective;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const OBJECTIVES: ObjectiveOption[] = [
  {
    value: 'geral',
    label: 'Geral',
    icon: BarChart3,
    description: 'Visão geral de todas as métricas'
  },
  {
    value: 'vendas',
    label: 'Vendas',
    icon: ShoppingCart,
    description: 'Gasto, CPA, Compras, ROAS'
  },
  {
    value: 'trafego',
    label: 'Tráfego',
    icon: MousePointer,
    description: 'Gasto, Cliques, CPC, CTR'
  },
  {
    value: 'leads',
    label: 'Leads',
    icon: Target,
    description: 'Gasto, Leads, CPL, Taxa Conversão'
  },
  {
    value: 'engajamento',
    label: 'Engajamento',
    icon: Users,
    description: 'Gasto, Interações, CPE, Taxa Eng.'
  },
  {
    value: 'reconhecimento',
    label: 'Reconhecimento',
    icon: Megaphone,
    description: 'Gasto, Alcance, CPM, Frequência'
  },
  {
    value: 'video',
    label: 'Vídeo',
    icon: Video,
    description: 'Gasto, Views 100%, CPV, Taxa Conclusão'
  },
  {
    value: 'conversoes',
    label: 'Conversões',
    icon: TrendingUp,
    description: 'Gasto, Conversões, CPA, ROAS'
  },
  {
    value: 'alcance',
    label: 'Alcance',
    icon: Eye,
    description: 'Gasto, Alcance, CPM, Impressões'
  },
  {
    value: 'conversas',
    label: 'Conversas',
    icon: MessageCircle,
    description: 'Gasto, Mensagens, CPM, Taxa Resposta'
  },
  {
    value: 'cadastros',
    label: 'Cadastros',
    icon: UserPlus,
    description: 'Gasto, Cadastros, CPC, Taxa Cadastro'
  },
  {
    value: 'seguidores',
    label: 'Seguidores',
    icon: UserCheck,
    description: 'Gasto, Seguidores, CPS, Alcance'
  },
];

export function ObjectiveSelector({ value, onChange }: ObjectiveSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Tipo de Relatório:</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {OBJECTIVES.map((objective) => {
          const Icon = objective.icon;
          const isSelected = value === objective.value;

          return (
            <button
              key={objective.value}
              onClick={() => onChange(objective.value)}
              className={cn(
                'relative p-3 border rounded-lg text-left transition-all duration-200 hover:shadow-md group',
                isSelected
                  ? 'border-[hsl(var(--orange-hero))] bg-[hsl(var(--orange-hero)/0.1)] ring-2 ring-[hsl(var(--orange-hero)/0.2)]'
                  : 'border-border hover:border-muted-foreground bg-card'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isSelected ? 'text-[hsl(var(--orange-hero))]' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <div
                  className={cn(
                    'font-medium text-sm',
                    isSelected ? 'text-[hsl(var(--orange-hero))]' : 'text-foreground'
                  )}
                >
                  {objective.label}
                </div>
              </div>

              <div
                className={cn(
                  'text-xs leading-tight',
                  isSelected ? 'text-[hsl(var(--orange-hero)/0.8)]' : 'text-muted-foreground'
                )}
              >
                {objective.description}
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="h-2 w-2 bg-[hsl(var(--orange-hero))] rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
