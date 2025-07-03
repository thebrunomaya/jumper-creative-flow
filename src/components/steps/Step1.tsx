
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
      <div className="mb-10">
        <Label htmlFor="client" className="block text-white font-light text-base mb-4 tracking-wide">
          Conta
        </Label>
        {clientsLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <Select value={formData.client} onValueChange={(value) => updateFormData({ client: value, campaignObjective: undefined, creativeType: undefined, objective: undefined, creativeName: '' })}>
            <SelectTrigger className={`w-full bg-gray-900/50 border border-gray-700/50 text-white rounded-lg px-4 py-3 text-base font-light focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/30 transition-all duration-200 ${errors.client ? 'border-destructive' : ''}`}>
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
      <div className="mb-10">
        <Label className="block text-white font-light text-base mb-6 tracking-wide">
          Plataforma
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
        <div className="grid gap-6 md:grid-cols-2 animate-fade-in mb-10">
          {/* Objetivo de Campanha */}
          <div className="space-y-3">
            <Label className="text-white font-light text-base tracking-wide">Objetivo de Campanha *</Label>
            <Select 
              value={formData.campaignObjective || ''} 
              onValueChange={(value) => updateFormData({ campaignObjective: value, creativeType: undefined, creativeName: '' })}
              disabled={!formData.client}
            >
              <SelectTrigger className={`w-full bg-gray-900/50 border border-gray-700/50 text-white rounded-lg px-4 py-3 text-base font-light focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/30 transition-all duration-200 ${errors.campaignObjective ? 'border-destructive' : ''}`}>
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
              <Label className="text-white font-light text-base tracking-wide">Tipo de Anúncio *</Label>
              <Select 
                value={formData.creativeType || ''} 
                onValueChange={(value) => updateFormData({ creativeType: value as any, creativeName: '' })}
                disabled={!formData.campaignObjective}
              >
                <SelectTrigger className={`w-full bg-gray-900/50 border border-gray-700/50 text-white rounded-lg px-4 py-3 text-base font-light focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/30 transition-all duration-200 ${errors.creativeType ? 'border-destructive' : ''}`}>
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
        <div className="space-y-3 animate-fade-in mb-10">
          <Label htmlFor="creativeName" className="text-white font-light text-base tracking-wide">
            Nome do Criativo *
          </Label>
          <Input
            id="creativeName"
            value={formData.creativeName || ''}
            onChange={(e) => handleCreativeNameChange(e.target.value)}
            placeholder="Ex: Ronaldo, BlackFridayDesc50"
            maxLength={20}
            className={`w-full bg-gray-900/50 border border-gray-700/50 text-white rounded-lg px-4 py-3 text-base font-light focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/30 transition-all duration-200 ${errors.creativeName ? 'border-destructive' : ''}`}
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500 font-light">
              Máximo 20 caracteres • Sem espaços • Apenas letras, números e _
            </div>
            <div className="text-xs text-orange-400">
              {formData.creativeName?.length || 0}/20 caracteres
            </div>
          </div>
          {errors.creativeName && (
            <p className="text-sm text-destructive">{errors.creativeName}</p>
          )}
          
          {/* Preview detalhado do nome final */}
          {detailedPreviewName && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-sm font-medium text-emerald-300 mb-2">🎯 Preview do Nome Final:</p>
              <p className="text-sm font-mono text-emerald-200 break-all bg-gray-900/50 px-3 py-2 rounded border border-emerald-500/30">
                {detailedPreviewName}
              </p>
              <p className="text-xs text-emerald-400 mt-2 font-light">
                Este será o nome usado no Facebook Ads Manager e no Notion
              </p>
            </div>
          )}
        </div>
      )}

      {/* Botão de Continuar */}
      {formData.platform && (
        <div className="flex justify-end">
          <button className="btn-jumper-primary">
            Continuar
          </button>
        </div>
      )}
    </div>
  );
};

export default Step1;
