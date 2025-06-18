
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Upload } from 'lucide-react';

interface ValidationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  count?: number;
}

interface ValidationPanelProps {
  validations: ValidationItem[];
  className?: string;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({ validations, className = '' }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Upload className="h-4 w-4 text-blue-600" />;
    }
  };

  const getAlertVariant = (type: string) => {
    return type === 'error' ? 'destructive' : 'default';
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (validations.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-900 flex items-center">
        Status da Validação
        <Badge variant="outline" className="ml-2 text-xs">
          {validations.length}
        </Badge>
      </h4>
      
      <div className="space-y-2">
        {validations.map((validation) => (
          <Alert key={validation.id} variant={getAlertVariant(validation.type)} className="py-2">
            <div className="flex items-center space-x-2">
              {getIcon(validation.type)}
              <AlertDescription className="text-sm flex-1">
                {validation.message}
              </AlertDescription>
              {validation.count && (
                <Badge variant={getBadgeVariant(validation.type)} className="text-xs">
                  {validation.count}
                </Badge>
              )}
            </div>
          </Alert>
        ))}
      </div>
    </div>
  );
};

export default ValidationPanel;
