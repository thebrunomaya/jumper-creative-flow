import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle, Wrench, RefreshCw } from 'lucide-react';

interface SystemStatusProps {
  onRetry?: () => void;
  className?: string;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ onRetry, className }) => {
  return (
    <Alert className={`border-warning bg-warning/5 ${className}`}>
      <Wrench className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Sistema em Manutenção
        <Badge variant="outline" className="text-xs">
          Temporário
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>
          Estamos atualizando o sistema para melhorar sua experiência. 
          Esta manutenção deve durar apenas alguns minutos.
        </p>
        
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Interface funcionando normalmente</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
          <span>Processamento de criativos temporariamente indisponível</span>
        </div>
        
        {onRetry && (
          <div className="flex items-center gap-2 mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
            <span className="text-xs text-muted-foreground">
              A funcionalidade será restaurada automaticamente
            </span>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

// Status banner para o header
export const SystemStatusBanner: React.FC = () => {
  const [dismissed, setDismissed] = React.useState(false);
  
  if (dismissed) return null;
  
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/10 border-b border-yellow-200 dark:border-yellow-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Wrench className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-yellow-800 dark:text-yellow-200">
              Manutenção em andamento
            </span>
            <span className="text-yellow-600 dark:text-yellow-400">
              - Algumas funcionalidades podem estar temporariamente indisponíveis
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-yellow-600 hover:text-yellow-800 h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;