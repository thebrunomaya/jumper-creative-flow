
import React from 'react';
import { FormData } from '@/types/creative';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNotionClients } from '@/hooks/useNotionData';
import { Skeleton } from '@/components/ui/skeleton';
import { validateCreativeName, previewCreativeNameDetailed } from '@/utils/creativeName';
import { JumperHeroSection } from '../JumperHeroSection';
import { PlatformCard } from '../PlatformCard';

interface Step1Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const Step1: React.FC<Step1Props> = ({ formData, updateFormData, errors }) => {
  const { clients, loading: clientsLoading, error: clientsError } = useNotionClients();

  // Get selected client data to access objectives
  const selectedClient = clients.find(client => client.id === formData.client);
  const availableObjectives = selectedClient?.objectives || [];

  // Check if all prerequisites for creative name are filled
  const canShowCreativeName = !!(
    formData.client && 
    formData.platform && 
    formData.campaignObjective && 
    (formData.platform === 'google' || formData.creativeType) // For Google, creativeType is not required
  );

  // Handle creative name change with automatic space removal
  const handleCreativeNameChange = (value: string) => {
    const cleanValue = value.replace(/\s/g, ''); // Remove espaços automaticamente
    updateFormData({ creativeName: cleanValue });
  };

  // Generate detailed preview name if all required fields are filled
  const detailedPreviewName = React.useMemo(() => {
    if (
      formData.creativeName && 
      formData.campaignObjective && 
      formData.creativeType && 
      selectedClient
    ) {
      return previewCreativeNameDetailed(
        formData.creativeName,
        formData.campaignObjective,
        formData.creativeType,
        selectedClient.name
      );
    }
    return null;
  }, [formData.creativeName, formData.campaignObjective, formData.creativeType, selectedClient]);

  return (
    <div className="space-y-8 animate-fade-in">
      <JumperHeroSection 
        currentStep={1}
        totalSteps={4}
        stepTitle="Vamos começar com os dados"
        stepDescription="Escolha a plataforma e configure as informações básicas para criar criativos de alta performance."
        icon="📋"
      />

      {/* Seleção de Conta */}
      <div className="space-y-3">
        <Label htmlFor="client" className="block text-foreground font-semibold text-lg">
          Selecione a conta
        </Label>
        {clientsLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <Select value={formData.client} onValueChange={(value) => updateFormData({ client: value, campaignObjective: undefined, creativeType: undefined, objective: undefined, creativeName: '' })}>
            <SelectTrigger className={`input-jumper h-12 text-lg ${errors.client ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.client && <p className="text-sm text-destructive">{errors.client}</p>}
        {clientsError && <p className="text-sm text-yellow-600">⚠️ {clientsError} (usando dados locais)</p>}
      </div>

      {/* Cards de Plataforma */}
      <div className="space-y-4">
        <Label className="block text-foreground font-semibold text-lg">
          Escolha a plataforma
        </Label>
        
        <div className="grid md:grid-cols-2 gap-6">
          <PlatformCard 
            platform={{
              name: "Meta Ads",
              subtitle: "Facebook & Instagram", 
              icon: "📘",
              color: "blue",
              available: true
            }}
            isSelected={formData.platform === 'meta'}
            onClick={() => updateFormData({ platform: 'meta', campaignObjective: undefined, creativeType: undefined, objective: undefined, creativeName: '' })}
          />
          
          <PlatformCard 
            platform={{
              name: "Google Ads",
              subtitle: "Search & Display",
              icon: "🔍", 
              color: "yellow",
              available: false
            }}
            isSelected={false}
            onClick={() => {}}
          />
        </div>
        {errors.platform && <p className="text-sm text-destructive">{errors.platform}</p>}
      </div>

      {/* Fields specific to when platform is selected */}
      {(formData.platform === 'meta' || formData.platform === 'google') && (
        <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
          {/* Objetivo de Campanha */}
          <div className="space-y-3">
            <Label className="text-foreground font-semibold">Objetivo de Campanha *</Label>
            <Select 
              value={formData.campaignObjective || ''} 
              onValueChange={(value) => updateFormData({ campaignObjective: value, creativeType: undefined, creativeName: '' })}
              disabled={!formData.client}
            >
              <SelectTrigger className={`input-jumper h-12 ${errors.campaignObjective ? 'border-destructive' : ''}`}>
                <SelectValue placeholder={!formData.client ? "Selecione uma conta primeiro" : "Selecione o objetivo"} />
              </SelectTrigger>
              <SelectContent>
                {availableObjectives.map((objective) => (
                  <SelectItem key={objective} value={objective}>
                    {objective}
                  </SelectItem>
                ))}
                {availableObjectives.length === 0 && formData.client && (
                  <SelectItem value="no-objectives" disabled>
                    Nenhum objetivo disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.campaignObjective && <p className="text-sm text-destructive">{errors.campaignObjective}</p>}
          </div>

          {/* Tipo de Anúncio - only for Meta Ads and only after campaign objective is selected */}
          {formData.platform === 'meta' && (
            <div className="space-y-3">
              <Label className="text-foreground font-semibold">Tipo de Anúncio *</Label>
              <Select 
                value={formData.creativeType || ''} 
                onValueChange={(value) => updateFormData({ creativeType: value as any, creativeName: '' })}
                disabled={!formData.campaignObjective}
              >
                <SelectTrigger className={`input-jumper h-12 ${errors.creativeType ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder={!formData.campaignObjective ? "Selecione o objetivo primeiro" : "Selecione o tipo"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">🖼️ Imagem/Vídeo Único</SelectItem>
                  <SelectItem value="carousel">🎠 Carrossel</SelectItem>
                  <SelectItem value="collection" disabled className="opacity-50 cursor-not-allowed">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-muted-foreground">🏪 Coleção</span>
                      <Badge 
                        variant="outline" 
                        className="ml-2 text-xs border-primary/30 text-primary bg-primary/10"
                      >
                        Em Breve
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="existing-post">📱 Publicação Existente</SelectItem>
                </SelectContent>
              </Select>
              {errors.creativeType && <p className="text-sm text-destructive">{errors.creativeType}</p>}
            </div>
          )}
        </div>
      )}

      {/* Nome do Criativo - só aparece quando todos os pré-requisitos estão preenchidos */}
      {canShowCreativeName && (
        <div className="space-y-3 animate-fade-in">
          <Label htmlFor="creativeName" className="text-foreground font-semibold">
            Nome do Criativo *
          </Label>
          <Input
            id="creativeName"
            value={formData.creativeName || ''}
            onChange={(e) => handleCreativeNameChange(e.target.value)}
            placeholder="Ex: Ronaldo, BlackFridayDesc50"
            maxLength={20}
            className={`input-jumper h-12 text-lg ${errors.creativeName ? 'border-destructive' : ''}`}
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Máximo 20 caracteres • Sem espaços • Apenas letras, números e _
            </div>
            <div className="text-xs text-primary">
              {formData.creativeName?.length || 0}/20 caracteres
            </div>
          </div>
          {errors.creativeName && (
            <p className="text-sm text-destructive">{errors.creativeName}</p>
          )}
          
          {/* Preview detalhado do nome final */}
          {detailedPreviewName && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800">
              <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">🎯 Preview do Nome Final:</p>
              <p className="text-sm font-mono text-green-700 dark:text-green-200 break-all bg-white dark:bg-green-950/30 px-3 py-2 rounded border border-green-200 dark:border-green-800">
                {detailedPreviewName}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Este será o nome usado no Facebook Ads Manager e no Notion
              </p>
            </div>
          )}
        </div>
      )}

      {/* Botão de Continuar */}
      {formData.platform && (
        <div className="flex justify-end pt-4">
          <button className="btn-jumper-primary px-8 py-4 text-lg font-semibold">
            Continuar para Arquivos →
          </button>
        </div>
      )}
    </div>
  );
};

export default Step1;
