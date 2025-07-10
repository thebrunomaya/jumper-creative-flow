
import React from 'react';
import { FormData } from '@/types/creative';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAccounts } from '@/hooks/useAccounts';
import { Skeleton } from '@/components/ui/skeleton';
import { validateCreativeName, previewCreativeNameDetailed } from '@/utils/creativeName';

interface Step1Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const Step1: React.FC<Step1Props> = ({ formData, updateFormData, errors }) => {
  const { accounts, loading: accountsLoading, error: accountsError } = useAccounts();

  // Get selected account data to access objectives
  const selectedAccount = accounts.find(account => account.id === formData.client);
  const availableObjectives = selectedAccount?.objectives || [];

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
      selectedAccount
    ) {
      return previewCreativeNameDetailed(
        formData.creativeName,
        formData.campaignObjective,
        formData.creativeType,
        selectedAccount.name
      );
    }
    return null;
  }, [formData.creativeName, formData.campaignObjective, formData.creativeType, selectedAccount]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-jumper-text mb-2">📋 Informações Básicas</h2>
        <p className="text-gray-600">Vamos começar com os dados essenciais do seu criativo</p>
      </div>

      {/* Conta - agora ocupando mais espaço */}
      <div className="space-y-2">
        <Label htmlFor="client" className="text-sm font-medium text-jumper-text">
          Conta *
        </Label>
        {accountsLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <Select value={formData.client} onValueChange={(value) => updateFormData({ client: value, campaignObjective: undefined, creativeType: undefined, objective: undefined, creativeName: '' })}>
            <SelectTrigger className={`h-12 ${errors.client ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.client && <p className="text-sm text-red-500">{errors.client}</p>}
        {accountsError && <p className="text-sm text-yellow-600">⚠️ {accountsError} (usando dados locais)</p>}
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
            onClick={() => updateFormData({ platform: 'meta', campaignObjective: undefined, creativeType: undefined, objective: undefined, creativeName: '' })}
          >
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">📘</div>
              <h3 className="font-semibold text-jumper-text">Meta Ads</h3>
              <p className="text-sm text-gray-600 mt-1">Facebook & Instagram</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-not-allowed transition-all duration-200 opacity-50 relative"
          >
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-semibold text-gray-500">Google Ads</h3>
              <p className="text-sm text-gray-400 mt-1">Search & Display</p>
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-yellow-500 text-white text-xs px-2 py-1 shadow-lg"
              >
                Em Breve
              </Badge>
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
              onValueChange={(value) => updateFormData({ campaignObjective: value, creativeType: undefined, creativeName: '' })}
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
                onValueChange={(value) => updateFormData({ creativeType: value as any, creativeName: '' })}
                disabled={!formData.campaignObjective}
              >
                <SelectTrigger className={`h-12 ${errors.creativeType ? 'border-red-500' : ''}`}>
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
                        className="ml-2 text-xs border-orange-300 text-orange-600 bg-orange-50"
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
        </div>
      )}

      {/* Nome do Criativo - só aparece quando todos os pré-requisitos estão preenchidos */}
      {canShowCreativeName && (
        <div className="space-y-2 animate-fade-in">
          <Label htmlFor="creativeName" className="text-sm font-medium text-jumper-text">
            Nome do Criativo *
          </Label>
          <Input
            id="creativeName"
            value={formData.creativeName || ''}
            onChange={(e) => handleCreativeNameChange(e.target.value)}
            placeholder="Ex: Ronaldo, BlackFridayDesc50"
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
          
          {/* Preview detalhado do nome final */}
          {detailedPreviewName && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
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
