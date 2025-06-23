
import React from 'react';
import { FormData } from '@/types/creative';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useNotionClients } from '@/hooks/useNotionData';
import { Skeleton } from '@/components/ui/skeleton';
import { validateCreativeName, previewCreativeName } from '@/utils/creativeName';

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

  // Handle creative name change with automatic space removal
  const handleCreativeNameChange = (value: string) => {
    const cleanValue = value.replace(/\s/g, ''); // Remove espaços automaticamente
    updateFormData({ creativeName: cleanValue });
  };

  // Generate preview name if all required fields are filled
  const previewName = React.useMemo(() => {
    if (
      formData.creativeName && 
      formData.campaignObjective && 
      formData.creativeType && 
      selectedClient
    ) {
      return previewCreativeName(
        formData.creativeName,
        formData.campaignObjective,
        formData.creativeType,
        selectedClient.name,
        selectedClient.id
      );
    }
    return null;
  }, [formData.creativeName, formData.campaignObjective, formData.creativeType, selectedClient]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-jumper-text mb-2">📋 Informações Básicas</h2>
        <p className="text-gray-600">Vamos começar com os dados essenciais do seu criativo</p>
      </div>

      {/* Nome do Criativo - Novo campo */}
      <div className="space-y-2">
        <Label htmlFor="creativeName" className="text-sm font-medium text-jumper-text">
          Nome do Criativo *
        </Label>
        <Input
          id="creativeName"
          value={formData.creativeName || ''}
          onChange={(e) => handleCreativeNameChange(e.target.value)}
          placeholder="Ex: BlackFridayDesc50"
          maxLength={20}
          className={`h-12 ${errors.creativeName ? 'border-red-500' : ''}`}
        />
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Máximo 20 caracteres • Sem espaços • Apenas letras, números e _
          </div>
          <div className="text-xs text-blue-600">
            {formData.creativeName?.length || 0}/20 caracteres
          </div>
        </div>
        {errors.creativeName && (
          <p className="text-sm text-red-500">{errors.creativeName}</p>
        )}
        
        {/* Preview do nome final */}
        {previewName && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-1">Preview do Nome Final:</p>
            <p className="text-xs text-blue-600 font-mono break-all">{previewName}</p>
          </div>
        )}
      </div>

      {/* Conta - agora ocupando mais espaço */}
      <div className="space-y-2">
        <Label htmlFor="client" className="text-sm font-medium text-jumper-text">
          Conta *
        </Label>
        {clientsLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <Select value={formData.client} onValueChange={(value) => updateFormData({ client: value, campaignObjective: undefined, creativeType: undefined, objective: undefined })}>
            <SelectTrigger className={`h-12 ${errors.client ? 'border-red-500' : ''}`}>
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
        <Label className="text-sm font-medium text-jumper-text">Plataforma *</Label>
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              formData.platform === 'meta' 
                ? 'ring-2 ring-jumper-blue bg-blue-50' 
                : 'hover:shadow-md'
            }`}
            onClick={() => updateFormData({ platform: 'meta', campaignObjective: undefined, creativeType: undefined, objective: undefined })}
          >
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">📘</div>
              <h3 className="font-semibold text-jumper-text">Meta Ads</h3>
              <p className="text-sm text-gray-600 mt-1">Facebook & Instagram</p>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              formData.platform === 'google' 
                ? 'ring-2 ring-jumper-blue bg-blue-50' 
                : 'hover:shadow-md'
            }`}
            onClick={() => updateFormData({ platform: 'google', campaignObjective: undefined, creativeType: undefined, objective: undefined })}
          >
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-semibold text-jumper-text">Google Ads</h3>
              <p className="text-sm text-gray-600 mt-1">Search & Display</p>
            </CardContent>
          </Card>
        </div>
        {errors.platform && <p className="text-sm text-red-500">{errors.platform}</p>}
      </div>

      {/* Fields specific to when platform is selected */}
      {(formData.platform === 'meta' || formData.platform === 'google') && (
        <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
          {/* Objetivo de Campanha */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-jumper-text">Objetivo de Campanha *</Label>
            <Select 
              value={formData.campaignObjective || ''} 
              onValueChange={(value) => updateFormData({ campaignObjective: value, creativeType: undefined })}
              disabled={!formData.client}
            >
              <SelectTrigger className={`h-12 ${errors.campaignObjective ? 'border-red-500' : ''}`}>
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
              <Label className="text-sm font-medium text-jumper-text">Tipo de Anúncio *</Label>
              <Select 
                value={formData.creativeType || ''} 
                onValueChange={(value) => updateFormData({ creativeType: value as any })}
                disabled={!formData.campaignObjective}
              >
                <SelectTrigger className={`h-12 ${errors.creativeType ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder={!formData.campaignObjective ? "Selecione o objetivo primeiro" : "Selecione o tipo"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">🖼️ Imagem/Vídeo Único</SelectItem>
                  <SelectItem value="carousel">🎠 Carrossel</SelectItem>
                  <SelectItem value="collection">🏪 Coleção</SelectItem>
                  <SelectItem value="existing-post">📱 Publicação Existente</SelectItem>
                </SelectContent>
              </Select>
              {errors.creativeType && <p className="text-sm text-red-500">{errors.creativeType}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Step1;
