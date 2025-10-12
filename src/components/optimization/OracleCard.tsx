/**
 * OracleCard - Selection card for oracle report types
 * Displays oracle info (icon, name, description) with visual feedback
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JumperButton } from '@/components/ui/jumper-button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OracleType = 'delfos' | 'orfeu' | 'nostradamus';

interface OracleCardProps {
  oracle: OracleType;
  icon: string;
  name: string;
  subtitle: string;
  description: string;
  color: 'red' | 'blue' | 'orange';
  onSelect: () => void;
  isLoading?: boolean;
  isSelected?: boolean;
  isGenerated?: boolean; // Already generated in cache
}

const colorClasses = {
  red: {
    border: 'border-red-500',
    bg: 'bg-red-500/5 hover:bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    button: 'bg-red-500 hover:bg-red-600',
  },
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-500/5 hover:bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    button: 'bg-blue-500 hover:bg-blue-600',
  },
  orange: {
    border: 'border-orange-500',
    bg: 'bg-orange-500/5 hover:bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    button: 'bg-orange-500 hover:bg-orange-600',
  },
};

export function OracleCard({
  oracle,
  icon,
  name,
  subtitle,
  description,
  color,
  onSelect,
  isLoading = false,
  isSelected = false,
  isGenerated = false,
}: OracleCardProps) {
  const colors = colorClasses[color];

  return (
    <Card
      className={cn(
        'transition-all duration-200 cursor-pointer h-full',
        isSelected && 'ring-2 ring-offset-2',
        colors.border,
        colors.bg,
        !isLoading && 'hover:scale-[1.02] hover:shadow-lg'
      )}
      onClick={!isLoading ? onSelect : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl" role="img" aria-label={name}>
              {icon}
            </span>
            <div>
              <CardTitle className={cn('text-lg', colors.text)}>{name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </div>
          </div>
          {isGenerated && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Gerado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

        <JumperButton
          className={cn('w-full', colors.button, 'text-white')}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          disabled={isLoading}
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : isGenerated ? (
            'Ver Relatório'
          ) : (
            'Selecionar'
          )}
        </JumperButton>
      </CardContent>
    </Card>
  );
}
