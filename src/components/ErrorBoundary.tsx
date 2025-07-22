import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({ errorInfo });

    // Log error using supabase function
    this.logError(error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Get user info from localStorage
      const currentUser = localStorage.getItem('currentUser');
      const user = currentUser ? JSON.parse(currentUser) : null;

      const errorPayload = {
        error_type: 'React Component Error',
        message: error.message,
        stack_trace: error.stack,
        url: window.location.href,
        user_email: user?.email || 'anonymous',
        user_agent: navigator.userAgent,
        component_name: 'ErrorBoundary',
        severity: 'error',
        metadata: {
          component_stack: errorInfo.componentStack,
          error_boundary: true,
          timestamp: new Date().toISOString(),
          user_id: user?.id,
          manager_name: user?.name
        }
      };

      // Direct fetch call to the edge function
      const response = await fetch(`https://biwwowendjuzvpttyrlb.supabase.co/functions/v1/log-error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpd3dvd2VuZGp1enZwdHR5cmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1Njg3ODIsImV4cCI6MjA1NTE0NDc4Mn0.oXq2U2laZ0IEReJg3jTDpkybtI-99CmVKHg4sOKnB1w'}`
        },
        body: JSON.stringify(errorPayload)
      });

      if (!response.ok) {
        console.error('Failed to log error to Supabase:', response.statusText);
      }

    } catch (logError) {
      console.error('Error logging to Supabase:', logError);
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-foreground">
                Ops! Algo deu errado
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada automaticamente.
                </AlertDescription>
              </Alert>

              {this.state.error && (
                <details className="bg-muted p-4 rounded-lg">
                  <summary className="cursor-pointer text-muted-foreground mb-2">
                    Detalhes técnicos do erro
                  </summary>
                  <div className="text-sm space-y-2">
                    <div>
                      <strong>Mensagem:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 text-xs bg-background p-2 rounded overflow-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={this.handleRetry}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tentar Novamente
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Voltar ao Início
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Se o problema persistir, entre em contato com a equipe de suporte.
                  <br />
                  ID do erro será registrado nos logs do sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;