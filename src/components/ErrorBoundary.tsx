import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="space-y-6 animate-fade-in p-6">
          <Alert className="border-destructive bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-foreground">
              <strong>Erro no componente:</strong> {this.state.error?.message || 'Erro desconhecido'}
            </AlertDescription>
          </Alert>
          
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">Detalhes técnicos:</h3>
            <pre className="text-sm text-muted-foreground overflow-auto">
              {this.state.error?.stack}
            </pre>
            {this.state.errorInfo && (
              <pre className="text-sm text-muted-foreground overflow-auto mt-2">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </div>

          <div className="text-center">
            <button 
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;