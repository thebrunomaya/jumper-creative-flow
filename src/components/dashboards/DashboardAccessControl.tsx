import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotionClients } from '@/hooks/useNotionData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Lock, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardAccessControlProps {
  children: React.ReactNode;
}

export function DashboardAccessControl({ children }: DashboardAccessControlProps) {
  const { accountName } = useParams<{ accountName: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { clients, loading, isAdmin, userAccessibleAccounts } = useNotionClients();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [clientName, setClientName] = useState<string>('');

  useEffect(() => {
    if (!accountName || loading) return;

    const decodedAccountName = decodeURIComponent(accountName);
    
    // Find the client by name
    const client = clients.find(c => c.name === decodedAccountName);
    
    if (!client) {
      setHasAccess(false);
      setClientName(decodedAccountName);
      return;
    }

    // Check if user has access
    const userHasAccess = isAdmin || userAccessibleAccounts.includes(client.id);
    setHasAccess(userHasAccess);
    setClientName(client.name);
  }, [accountName, clients, loading, isAdmin, userAccessibleAccounts]);

  // Loading state
  if (loading || hasAccess === null) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Lock className="h-6 w-6 text-destructive" />
              <CardTitle>Acesso Negado</CardTitle>
            </div>
            <CardDescription>
              Você não tem permissão para visualizar os relatórios da conta "{clientName}".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>Possíveis razões:</p>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Você não está vinculado a esta conta</li>
                    <li>A conta não existe ou foi removida</li>
                    <li>Suas permissões foram alteradas recentemente</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={() => navigate('/creatives')}
                className="flex-1"
              >
                Ir para Criativos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access granted - render children with account info
  const decodedAccountName = decodeURIComponent(accountName || '');
  const client = clients.find(c => c.name === decodedAccountName);
  const accountInfo = client ? {
    id: client.id,
    name: client.name,
    metaAdsId: client.metaAdsId,
    id_google_ads: client.id_google_ads, // Include Google Ads ID for reports
    objectives: client.objectives || [] // Include objectives for template selection
  } : null;

  return React.cloneElement(children as React.ReactElement, { accountInfo });
}