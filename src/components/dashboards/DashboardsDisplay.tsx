import React, { useState } from 'react';
import { SalesDashboard } from './SalesDashboard';
import { GeneralDashboard } from './GeneralDashboard';
import { TrafficDashboard } from './TrafficDashboard';
import { EngagementDashboard } from './EngagementDashboard';
import { LeadsDashboard } from './LeadsDashboard';
import { BrandAwarenessDashboard } from './BrandAwarenessDashboard';
import { ReachDashboard } from './ReachDashboard';
import { VideoViewsDashboard } from './VideoViewsDashboard';
import { ConversionsDashboard } from './ConversionsDashboard';
import { SeguidoresDashboard } from './SeguidoresDashboard';
import { ConversasDashboard } from './ConversasDashboard';
import { CadastrosDashboard } from './CadastrosDashboard';
import { ComingSoonTemplate } from './ComingSoonTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Target, BarChart3, Calendar } from 'lucide-react';

interface AccountInfo {
  id: string;
  name: string;
  metaAdsId?: string;
  id_google_ads?: string;
  id_google_analytics?: string;
  objectives?: string[];
}

interface DashboardsDisplayProps {
  accountName?: string;
  accountInfo?: AccountInfo;
}

export function DashboardsDisplay({ accountName, accountInfo }: DashboardsDisplayProps) {
  // State for selected template and period
  const [selectedTemplate, setSelectedTemplate] = useState<string>('geral');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);

  // Build available templates based on objectives
  const getAvailableTemplates = () => {
    const templates = [
      { value: 'geral', label: 'Visão Geral', description: 'Métricas gerais da conta' }
    ];

    // Add templates based on objectives
    if (accountInfo?.objectives && accountInfo.objectives.length > 0) {
      accountInfo.objectives.forEach(objective => {
        const objectiveLower = objective.toLowerCase();
        
        if (objectiveLower.includes('vendas') || objectiveLower.includes('sales')) {
          templates.push({
            value: 'vendas',
            label: 'Vendas',
            description: 'Funil de conversão e vendas'
          });
        } else if (objectiveLower.includes('tráfego') || objectiveLower.includes('trafego') || objectiveLower.includes('traffic')) {
          templates.push({
            value: 'trafego',
            label: 'Tráfego',
            description: 'Geração de tráfego e cliques'
          });
        } else if (objectiveLower.includes('engajamento') || objectiveLower.includes('engagement')) {
          templates.push({
            value: 'engajamento',
            label: 'Engajamento',
            description: 'Interações e engajamento'
          });
        } else if (objectiveLower.includes('leads') || objectiveLower.includes('lead')) {
          templates.push({
            value: 'leads',
            label: 'Leads',
            description: 'Geração e custo de leads'
          });
        } else if (objectiveLower.includes('reconhecimento') || objectiveLower.includes('marca') || objectiveLower.includes('brand')) {
          templates.push({
            value: 'reconhecimento',
            label: 'Reconhecimento de Marca',
            description: 'Alcance e visibilidade'
          });
        } else if (objectiveLower.includes('alcance') || objectiveLower.includes('reach')) {
          templates.push({
            value: 'alcance',
            label: 'Alcance',
            description: 'Expansão de audiência'
          });
        } else if (objectiveLower.includes('vídeo') || objectiveLower.includes('video') || objectiveLower.includes('reproduções')) {
          templates.push({
            value: 'video',
            label: 'Reproduções de Vídeo',
            description: 'Performance de vídeos'
          });
        } else if (objectiveLower.includes('conversões') || objectiveLower.includes('conversoes') || objectiveLower.includes('conversions')) {
          templates.push({
            value: 'conversoes',
            label: 'Conversões',
            description: 'Conversões e ROAS'
          });
        } else if (objectiveLower.includes('seguidores') || objectiveLower.includes('followers')) {
          templates.push({
            value: 'seguidores',
            label: 'Seguidores',
            description: 'Crescimento de base de seguidores'
          });
        } else if (objectiveLower.includes('conversas') || objectiveLower.includes('mensagens') || objectiveLower.includes('messages')) {
          templates.push({
            value: 'conversas',
            label: 'Conversas',
            description: 'Mensagens e conversas iniciadas'
          });
        } else if (objectiveLower.includes('cadastros') || objectiveLower.includes('cadastro') || objectiveLower.includes('leads')) {
          templates.push({
            value: 'cadastros',
            label: 'Cadastros',
            description: 'Geração de leads e cadastros'
          });
        } else {
          // For other objectives, add as "coming soon"
          templates.push({
            value: `objetivo-${objective.toLowerCase()}`,
            label: objective,
            description: `Métricas específicas de ${objective.toLowerCase()}`
          });
        }
      });
    }

    return templates;
  };

  const availableTemplates = getAvailableTemplates();

  // Render dashboard based on selected template
  const renderDashboard = () => {
    // Get the account's Meta Ads ID
    const accountId = accountInfo?.metaAdsId || '';
    
    switch (selectedTemplate) {
      case 'geral':
        return (
          <GeneralDashboard 
            accountName={accountName} 
            accountInfo={accountInfo}
            selectedPeriod={selectedPeriod}
          />
        );
      
      case 'vendas':
        return (
          <SalesDashboard 
            accountName={accountName} 
            accountInfo={accountInfo}
            selectedPeriod={selectedPeriod}
          />
        );
      
      case 'trafego':
        return (
          <TrafficDashboard 
            accountId={accountId}
            selectedPeriod={selectedPeriod}
          />
        );
      
      case 'engajamento':
        return (
          <EngagementDashboard 
            accountId={accountId}
            selectedPeriod={selectedPeriod}
          />
        );
      
      case 'leads':
        return (
          <LeadsDashboard 
            accountId={accountId}
            selectedPeriod={selectedPeriod}
          />
        );
      
      case 'reconhecimento':
        return (
          <BrandAwarenessDashboard 
            accountId={accountId}
            selectedPeriod={selectedPeriod}
          />
        );
      
      case 'alcance':
        return (
          <ReachDashboard 
            accountId={accountId}
            selectedPeriod={selectedPeriod}
          />
        );
      
      case 'video':
        return (
          <VideoViewsDashboard 
            accountId={accountId}
            selectedPeriod={selectedPeriod}
          />
        );
      
      case 'conversoes':
        return (
          <ConversionsDashboard 
            accountId={accountId}
            selectedPeriod={selectedPeriod}
          />
        );
      
      case 'seguidores':
        return (
          <SeguidoresDashboard 
            accountId={accountId}
            selectedPeriod={selectedPeriod}
          />
        );
      
      case 'conversas':
        return (
          <ConversasDashboard 
            accountId={accountId}
            selectedPeriod={selectedPeriod}
          />
        );
      
      case 'cadastros':
        return (
          <CadastrosDashboard 
            accountId={accountId}
            selectedPeriod={selectedPeriod}
          />
        );
      
      default:
        // For other objectives, show coming soon template
        const objective = selectedTemplate.replace('objetivo-', '');
        const originalObjective = accountInfo?.objectives?.find(obj => 
          obj.toLowerCase() === objective
        ) || objective;
        
        return (
          <ComingSoonTemplate objective={originalObjective} />
        );
    }
  };

  // Show account info and objectives
  return (
    <div className="space-y-6">
      {/* Account Info Header with Template Selector */}
      {accountInfo && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{accountInfo.name}</CardTitle>
                <CardDescription>
                  Relatórios de Performance • {availableTemplates.length} template{availableTemplates.length !== 1 ? 's' : ''} disponível{availableTemplates.length !== 1 ? 'eis' : ''}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <Select value={selectedPeriod.toString()} onValueChange={(value) => setSelectedPeriod(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="14">14 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {accountInfo.objectives?.length || 0} objetivo{(accountInfo.objectives?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Selector - Panel Style */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tipo de Relatório:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                {availableTemplates.map((template) => (
                  <button
                    key={template.value}
                    onClick={() => setSelectedTemplate(template.value)}
                    className={`
                      relative p-4 border rounded-lg text-left transition-all duration-200 hover:shadow-md
                      ${selectedTemplate === template.value 
                        ? 'border-[hsl(var(--orange-hero))] bg-[hsl(var(--orange-subtle))] ring-2 ring-[hsl(var(--orange-hero)/0.2)]' 
                        : 'border-border hover:border-muted-foreground bg-card'
                      }
                    `}
                  >
                    <div className="space-y-1">
                      <div className={`font-medium text-sm ${
                        selectedTemplate === template.value 
                          ? 'text-[hsl(var(--orange-hero))]' 
                          : 'text-foreground'
                      }`}>
                        {template.label}
                      </div>
                      <div className={`text-xs ${
                        selectedTemplate === template.value 
                          ? 'text-[hsl(var(--orange-hero)/0.8)]' 
                          : 'text-muted-foreground'
                      }`}>
                        {template.description}
                      </div>
                    </div>
                    {selectedTemplate === template.value && (
                      <div className="absolute top-2 right-2">
                        <div className="h-2 w-2 bg-[hsl(var(--orange-hero))] rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Objectives Display */}
            {accountInfo.objectives && accountInfo.objectives.length > 0 && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Objetivos da conta:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {accountInfo.objectives.map((objective, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {objective}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dashboard Content */}
      {accountInfo?.metaAdsId ? (
        renderDashboard()
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">ID Meta Ads não encontrado</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Esta conta não possui um ID Meta Ads configurado. 
              Verifique se a conta está corretamente vinculada no Notion.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}