
import React from 'react';
import { FormData, GoogleAdsConfig } from '@/types/creative';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JumperCard, JumperCardContent } from '@/components/ui/jumper-card';
import { JumperInput } from '@/components/ui/jumper-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useNotionClients } from '@/hooks/useNotionData';
import { Skeleton } from '@/components/ui/skeleton';
import { validateCreativeName, previewCreativeNameDetailed } from '@/utils/creativeName';
import facebookLogo from '@/assets/facebook-logo.svg';
import googleGLogo from '@/assets/google-g-logo.svg';
import googleAdsConfig from '@/config/google-ads-objectives.json';

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

  // Load Google Ads configuration
  const config = googleAdsConfig as GoogleAdsConfig;

  // Get available Google Ads campaign types for selected objective
  const getAvailableGoogleCampaignTypes = () => {
    if (formData.platform !== 'google' || !formData.campaignObjective) {
      return [];
    }
    
    // Direct lookup first
    let availableTypes = config.objectiveToTypes[formData.campaignObjective]?.availableTypes;
    
    // If not found, try objective mapping for common objectives
    if (!availableTypes) {
      const objectiveMapping = {
        'Vendas': 'Vendas',
        'Tráfego': 'Tráfego', 
        'Leads': 'Leads',
        'Conversões': 'Conversões',
        'Reconhecimento': 'Reconhecimento',
        'Engajamento': 'Engajamento',
        'Aplicativo': 'Aplicativo',
        'Divulgação': 'Reconhecimento', // Map to closest match
        'Interações': 'Engajamento', // Map to closest match
        'Seguidores': 'Reconhecimento', // Map to closest match
        'Conversas': 'Leads', // Map to closest match
        'Direções': 'Tráfego', // Map to closest match
        'Cadastros': 'Leads' // Map to closest match
      };
      
      const mappedObjective = objectiveMapping[formData.campaignObjective];
      if (mappedObjective) {
        availableTypes = config.objectiveToTypes[mappedObjective]?.availableTypes;
      }
    }
    
    // Fallback to a default set if still not found
    if (!availableTypes) {
      console.warn(`No Google Ads campaign types found for objective: ${formData.campaignObjective}`);
      availableTypes = [
        {
          value: "search",
          label: "Campanhas de Pesquisa",
          description: "Anúncios quando usuários pesquisam",
          recommended: true
        },
        {
          value: "performance-max",
          label: "Performance Max",
          description: "IA do Google otimiza em todas as redes",
          recommended: false
        }
      ];
    }
    
    return availableTypes || [];
  };

  // Check if all prerequisites for creative name are filled
  const canShowCreativeName = !!(
    formData.client && 
    formData.platform && 
    formData.campaignObjective && 
    (formData.platform === 'meta' ? formData.creativeType : formData.googleCampaignType)
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
      selectedClient &&
      (formData.platform === 'meta' ? formData.creativeType : formData.googleCampaignType)
    ) {
      const typeForPreview = formData.platform === 'meta' 
        ? formData.creativeType 
        : formData.googleCampaignType;
      
      return previewCreativeNameDetailed(
        formData.creativeName,
        formData.campaignObjective,
        typeForPreview!,
        selectedClient.name
      );
    }
    return null;
  }, [formData.creativeName, formData.campaignObjective, formData.creativeType, formData.googleCampaignType, selectedClient, formData.platform]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">📋 Informações Básicas</h2>
        <p className="text-muted-foreground">Vamos começar com os dados essenciais do seu criativo</p>
      </div>

      {/* Conta - agora ocupando mais espaço */}
      <div className="space-y-2">
        <Label htmlFor="client" className="text-sm font-medium text-foreground">
          Conta *
        </Label>
        {clientsLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <Select value={formData.client} onValueChange={(value) => updateFormData({ client: value, campaignObjective: undefined, creativeType: undefined, objective: undefined, creativeName: '' })}>
            <SelectTrigger className={`h-12 ${errors.client ? 'border-red-500 bg-red-50' : ''}`}>
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
        {errors.client && <p className="text-sm text-red-500">{errors.client}</p>}
        {clientsError && <p className="text-sm text-yellow-600">⚠️ {clientsError} (usando dados locais)</p>}
      </div>

      {/* Plataforma */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-foreground">Plataforma *</Label>
        <div className="grid grid-cols-2 gap-4">
          <JumperCard 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              formData.platform === 'meta' 
                ? 'border-2 border-accent-subtle bg-accent-subtle/5' 
                : 'hover:shadow-md'
            }`}
            onClick={() => updateFormData({ platform: 'meta', campaignObjective: undefined, creativeType: undefined, googleCampaignType: undefined, objective: undefined, creativeName: '' })}
          >
            <JumperCardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <img src={facebookLogo} alt="Facebook" className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-foreground">Meta Ads</h3>
              <p className="text-sm text-muted-foreground mt-1">Facebook & Instagram</p>
            </JumperCardContent>
          </JumperCard>
          
          <JumperCard 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              formData.platform === 'google' 
                ? 'border-2 border-accent-subtle bg-accent-subtle/5' 
                : 'hover:shadow-md'
            }`}
            onClick={() => updateFormData({ platform: 'google', campaignObjective: undefined, creativeType: undefined, googleCampaignType: undefined, objective: undefined, creativeName: '' })}
          >
            <JumperCardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <img src={googleGLogo} alt="Google" className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-foreground">Google Ads</h3>
              <p className="text-sm text-muted-foreground mt-1">Search & Display</p>
            </JumperCardContent>
          </JumperCard>
        </div>
        {errors.platform && <p className="text-sm text-red-500">{errors.platform}</p>}
      </div>

      {/* Fields specific to when platform is selected */}
      {(formData.platform === 'meta' || formData.platform === 'google') && (
        <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
          {/* Objetivo de Campanha */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Objetivo de Campanha *</Label>
            <Select 
              value={formData.campaignObjective || ''} 
              onValueChange={(value) => updateFormData({ campaignObjective: value, creativeType: undefined, googleCampaignType: undefined, creativeName: '' })}
              disabled={!formData.client}
            >
              <SelectTrigger className={`h-12 ${errors.campaignObjective ? 'border-red-500 bg-red-50' : ''}`}>
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
            {errors.campaignObjective && <p className="text-sm text-red-500">{errors.campaignObjective}</p>}
          </div>

          {/* Tipo de Anúncio - only for Meta Ads and only after campaign objective is selected */}
          {formData.platform === 'meta' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Tipo de Anúncio *</Label>
              <Select 
                value={formData.creativeType || ''} 
                onValueChange={(value) => updateFormData({ creativeType: value as any, creativeName: '' })}
                disabled={!formData.campaignObjective}
              >
                <SelectTrigger className={`h-12 ${errors.creativeType ? 'border-red-500 bg-red-50' : ''}`}>
                  <SelectValue placeholder={!formData.campaignObjective ? "Selecione o objetivo primeiro" : "Selecione o tipo"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">🖼️ Imagem/Vídeo Único</SelectItem>
                  <SelectItem value="carousel">🎠 Carrossel</SelectItem>
                  <SelectItem value="collection" disabled className="opacity-50 cursor-not-allowed">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-gray-400">🏪 Coleção</span>
                      <Badge 
                        variant="outline" 
                        className="ml-2 text-xs border-gray-200 text-gray-500 bg-gray-50"
                      >
                        Em Breve
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="existing-post">📱 Publicação Existente</SelectItem>
                </SelectContent>
              </Select>
              {errors.creativeType && <p className="text-sm text-red-500">{errors.creativeType}</p>}
            </div>
          )}

          {/* Google Ads Campaign Type - only for Google Ads and only after campaign objective is selected */}
          {formData.platform === 'google' && formData.campaignObjective && (
            <div className="space-y-4 md:col-span-2">
              <Label className="text-sm font-medium text-foreground">Tipo de Campanha *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getAvailableGoogleCampaignTypes().map((campaignType) => (
                  <JumperCard
                    key={campaignType.value}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      formData.googleCampaignType === campaignType.value
                        ? 'border-2 border-accent-subtle bg-accent-subtle/5'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => updateFormData({ googleCampaignType: campaignType.value as any, creativeName: '' })}
                  >
                    <JumperCardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm text-foreground">
                          {campaignType.label}
                        </h4>
                        {campaignType.recommended && (
                          <Badge variant="default" className="ml-2 text-xs bg-accent-subtle text-accent-foreground">
                            Recomendado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {campaignType.description}
                      </p>
                    </JumperCardContent>
                  </JumperCard>
                ))}
              </div>
              {errors.googleCampaignType && <p className="text-sm text-red-500">{errors.googleCampaignType}</p>}
            </div>
          )}
        </div>
      )}

      {/* Nome do Criativo - só aparece quando todos os pré-requisitos estão preenchidos */}
      {canShowCreativeName && (
        <div className="space-y-2 animate-fade-in">
          <JumperInput
            label="Nome do Criativo *"
            value={formData.creativeName || ''}
            onChange={handleCreativeNameChange}
            placeholder="Ex: Ronaldo, BlackFridayDesc50"
            error={errors.creativeName}
            className="h-12"
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Máximo 20 caracteres • Sem espaços • Apenas letras, números e _
            </div>
            <div className="text-xs text-jumper-orange">
              {formData.creativeName?.length || 0}/20 caracteres
            </div>
          </div>
          
          {/* Preview detalhado do nome final */}
          {detailedPreviewName && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800 mb-2">🎯 Preview do Nome Final:</p>
              <p className="text-sm font-mono text-green-700 break-all bg-white px-3 py-2 rounded border border-green-200">
                {detailedPreviewName}
              </p>
              <p className="text-xs text-green-600 mt-2">
                Este será o nome usado no Facebook Ads Manager e no Notion
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Step1;
