import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, TrendingUp, Users, Target, Play, Heart } from 'lucide-react';

interface ComingSoonTemplateProps {
  objective: string;
}

const getObjectiveInfo = (objective: string) => {
  const lowerObjective = objective.toLowerCase();
  
  if (lowerObjective.includes('trafego') || lowerObjective.includes('tráfego')) {
    return {
      icon: TrendingUp,
      title: 'Relatório de Tráfego',
      description: 'Dashboard especializado em métricas de tráfego e visitação',
      metrics: [
        'CTR (Taxa de cliques)',
        'CPC (Custo por clique)',
        'Cliques no link',
        'Sessões geradas',
        'Taxa de rejeição',
        'Páginas por sessão',
        'Tempo médio na página',
        'Fontes de tráfego'
      ]
    };
  }
  
  if (lowerObjective.includes('engajamento') || lowerObjective.includes('engagement')) {
    return {
      icon: Heart,
      title: 'Relatório de Engajamento',
      description: 'Dashboard focado em interação e relacionamento com a audiência',
      metrics: [
        'Taxa de engajamento',
        'Curtidas por impressão',
        'Compartilhamentos',
        'Comentários',
        'Salvamentos',
        'Cliques no perfil',
        'Seguidores ganhos',
        'Alcance orgânico vs pago'
      ]
    };
  }
  
  if (lowerObjective.includes('conscientizacao') || lowerObjective.includes('awareness')) {
    return {
      icon: Users,
      title: 'Relatório de Conscientização',
      description: 'Dashboard para campanhas de brand awareness e reconhecimento',
      metrics: [
        'Alcance único',
        'Frequência média',
        'CPM (Custo por mil)',
        'Share of voice',
        'Brand lift',
        'Recall de marca',
        'Impressões qualificadas',
        'Audiência expandida'
      ]
    };
  }
  
  if (lowerObjective.includes('app') || lowerObjective.includes('aplicativo')) {
    return {
      icon: Play,
      title: 'Relatório de App',
      description: 'Dashboard especializado em instalações e eventos de aplicativo',
      metrics: [
        'Instalações do app',
        'Custo por instalação',
        'Taxa de instalação',
        'Eventos no app',
        'Valor do tempo de vida',
        'Retenção de usuários',
        'Compras no app',
        'ROI por coorte'
      ]
    };
  }
  
  if (lowerObjective.includes('leads') || lowerObjective.includes('lead')) {
    return {
      icon: Target,
      title: 'Relatório de Leads',
      description: 'Dashboard focado em geração e qualificação de leads',
      metrics: [
        'Leads gerados',
        'Custo por lead',
        'Taxa de conversão',
        'Qualidade do lead',
        'Lead scoring',
        'Funil de conversão',
        'Tempo de conversão',
        'ROI por canal'
      ]
    };
  }
  
  // Default case for unknown objectives
  return {
    icon: Rocket,
    title: `Relatório de ${objective}`,
    description: `Dashboard especializado em métricas de ${objective.toLowerCase()}`,
    metrics: [
      'Métricas específicas',
      'KPIs personalizados',
      'Análise de performance',
      'Otimizações sugeridas',
      'Comparativo temporal',
      'Segmentação avançada',
      'Insights automáticos',
      'Alertas inteligentes'
    ]
  };
};

export function ComingSoonTemplate({ objective }: ComingSoonTemplateProps) {
  const objectiveInfo = getObjectiveInfo(objective);
  const Icon = objectiveInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
            <Icon className="h-8 w-8 text-orange-600 dark:text-orange-300" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2">{objectiveInfo.title}</h2>
        <p className="text-muted-foreground mb-4">{objectiveInfo.description}</p>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          <Rocket className="h-3 w-3 mr-1" />
          Em Breve
        </Badge>
      </div>

      {/* Preview of metrics */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métricas que serão exibidas
          </CardTitle>
          <CardDescription>
            Este template incluirá análises detalhadas e KPIs específicos para campanhas de {objective.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {objectiveInfo.metrics.map((metric, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium">{metric}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call to action */}
      <div className="text-center pt-6">
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-6 max-w-md mx-auto">
          <Rocket className="h-6 w-6 text-orange-600 dark:text-orange-300 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Este template está em desenvolvimento e será disponibilizado em breve com análises avançadas e insights automatizados.
          </p>
        </div>
      </div>
    </div>
  );
}