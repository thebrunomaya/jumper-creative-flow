import React from 'react';
import { FormData, GoogleAdsConfig } from '@/types/creative';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAvailableDestinations, getAvailableCTAs } from '@/utils/googleAdsValidation';
import googleAdsConfig from '@/config/google-ads-objectives.json';

interface GoogleAdsContentSectionProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const GoogleAdsContentSection: React.FC<GoogleAdsContentSectionProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  const config = googleAdsConfig as GoogleAdsConfig;
  const campaignType = formData.googleCampaignType!;
  
  // Get available destinations and CTAs for this campaign type
  const availableDestinations = getAvailableDestinations(campaignType);
  const availableCTAs = getAvailableCTAs(campaignType, formData.destination);

  // Handle destination change - reset CTA when destination changes
  const handleDestinationChange = (value: string) => {
    updateFormData({ 
      destination: value,
      cta: '' // Reset CTA when destination changes
    });
  };

  // Get destination field configuration
  const getDestinationFieldConfig = () => {
    if (!formData.destination) {
      return null;
    }
    const selectedDestination = availableDestinations.find(dest => dest.value === formData.destination);
    return selectedDestination;
  };

  // Get input type based on field type
  const getInputType = (fieldType: string) => {
    switch (fieldType) {
      case 'url':
        return 'url';
      case 'phone':
        return 'tel';
      default:
        return 'text';
    }
  };

  const destinationFieldConfig = getDestinationFieldConfig();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">🎯 Configuração da Campanha</h2>
        <p className="text-muted-foreground">
          Configure o destino e as opções da sua campanha {config.typeConfigurations[campaignType]?.destinations[0]?.label || campaignType}
        </p>
      </div>

      {/* Campaign Type Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📊 Resumo da Campanha</span>
            <Badge variant="outline">
              {config.objectiveToTypes[formData.campaignObjective!]?.availableTypes.find(t => t.value === campaignType)?.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Objetivo</Label>
              <p className="text-sm font-semibold">{formData.campaignObjective}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Tipo de Campanha</Label>
              <p className="text-sm font-semibold">
                {config.objectiveToTypes[formData.campaignObjective!]?.availableTypes.find(t => t.value === campaignType)?.label}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Destination Configuration */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Destination Selection */}
            <div className="space-y-2">
              <Label htmlFor="destination">Destino da Campanha *</Label>
              <Select value={formData.destination || ''} onValueChange={handleDestinationChange}>
                <SelectTrigger className={errors.destination ? 'border-red-500 bg-red-50' : ''}>
                  <SelectValue placeholder="Selecione para onde os usuários serão direcionados" />
                </SelectTrigger>
                <SelectContent>
                  {availableDestinations.map((destination) => (
                    <SelectItem key={destination.value} value={destination.value}>
                      {destination.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.destination && (
                <p className="text-sm text-red-600">{errors.destination}</p>
              )}
            </div>

            {/* CTA Selection - only show if destination is selected */}
            {formData.destination && (
              <div className="space-y-2">
                <Label htmlFor="cta">Call-to-Action *</Label>
                <Select value={formData.cta || ''} onValueChange={(value) => updateFormData({ cta: value })}>
                  <SelectTrigger className={errors.cta ? 'border-red-500 bg-red-50' : ''}>
                    <SelectValue placeholder="Selecione a ação que os usuários devem fazer" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCTAs.map((cta) => (
                      <SelectItem key={cta} value={cta}>
                        {cta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cta && (
                  <p className="text-sm text-red-600">{errors.cta}</p>
                )}
              </div>
            )}

            {/* Destination URL/Phone - only show if destination has a field type */}
            {destinationFieldConfig && (
              <div className="space-y-2">
                <Label htmlFor="destinationUrl">
                  {destinationFieldConfig.fieldType === 'url' ? 'URL de Destino' : 
                   destinationFieldConfig.fieldType === 'phone' ? 'Número de Telefone' : 
                   'Destino'} *
                </Label>
                <Input
                  id="destinationUrl"
                  type={getInputType(destinationFieldConfig.fieldType)}
                  value={formData.destinationUrl || ''}
                  onChange={(e) => updateFormData({ destinationUrl: e.target.value })}
                  placeholder={
                    destinationFieldConfig.fieldType === 'url' ? 'https://exemplo.com' :
                    destinationFieldConfig.fieldType === 'phone' ? '(11) 99999-9999' :
                    'Digite aqui...'
                  }
                  className={errors.destinationUrl ? 'border-red-500 bg-red-50' : ''}
                />
                {errors.destinationUrl && (
                  <p className="text-sm text-red-600">{errors.destinationUrl}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campaign-specific additional fields */}
      {campaignType === 'shopping' && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Configurações de Shopping</Label>
              <div className="space-y-2">
                <Label htmlFor="merchantId">Merchant ID (opcional)</Label>
                <Input
                  id="merchantId"
                  value={formData.merchantId || ''}
                  onChange={(e) => updateFormData({ merchantId: e.target.value })}
                  placeholder="ID da sua conta Google Merchant Center"
                  className={errors.merchantId ? 'border-red-500 bg-red-50' : ''}
                />
                {errors.merchantId && (
                  <p className="text-sm text-red-600">{errors.merchantId}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Se você tem uma conta Google Merchant Center, insira o ID aqui
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {campaignType === 'app' && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Configurações de App</Label>
              <div className="space-y-2">
                <Label htmlFor="appStoreUrl">URL da App Store/Google Play</Label>
                <Input
                  id="appStoreUrl"
                  type="url"
                  value={formData.appStoreUrl || ''}
                  onChange={(e) => updateFormData({ appStoreUrl: e.target.value })}
                  placeholder="https://play.google.com/store/apps/details?id=com.seuapp"
                  className={errors.appStoreUrl ? 'border-red-500 bg-red-50' : ''}
                />
                {errors.appStoreUrl && (
                  <p className="text-sm text-red-600">{errors.appStoreUrl}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Link direto para download do seu aplicativo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observações */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              value={formData.observations || ''}
              onChange={(e) => updateFormData({ observations: e.target.value })}
              placeholder="Adicione observações ou instruções especiais para a equipe da Jumper"
              className={`min-h-[80px] ${errors.observations ? 'border-red-500 bg-red-50' : ''}`}
            />
            {errors.observations && (
              <p className="text-sm text-red-600">{errors.observations}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help text */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">💡 Dica</p>
            <p className="text-sm text-muted-foreground">
              Os textos (headlines e descriptions) foram configurados no passo anterior. 
              Aqui você define apenas o destino e configurações específicas da campanha.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleAdsContentSection;