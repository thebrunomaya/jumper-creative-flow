import React, { useState } from 'react';
import { FormData, GoogleAdsConfig } from '@/types/creative';
import { JumperInput } from '@/components/ui/jumper-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { getAssetRequirements, getFieldValidation } from '@/utils/googleAdsValidation';
import googleAdsConfig from '@/config/google-ads-objectives.json';

interface GoogleAdsAssetSectionProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const GoogleAdsAssetSection: React.FC<GoogleAdsAssetSectionProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  const config = googleAdsConfig as GoogleAdsConfig;
  const campaignType = formData.googleCampaignType!;
  const requirements = getAssetRequirements(campaignType);

  // State for file inputs
  const [dragOver, setDragOver] = useState<string | null>(null);

  // Helper function to add a new headline
  const addHeadline = () => {
    const currentHeadlines = formData.headlines || [];
    updateFormData({
      headlines: [...currentHeadlines, '']
    });
  };

  // Helper function to update a headline
  const updateHeadline = (index: number, value: string) => {
    const currentHeadlines = formData.headlines || [];
    const newHeadlines = [...currentHeadlines];
    newHeadlines[index] = value;
    updateFormData({ headlines: newHeadlines });
  };

  // Helper function to remove a headline
  const removeHeadline = (index: number) => {
    const currentHeadlines = formData.headlines || [];
    const newHeadlines = currentHeadlines.filter((_, i) => i !== index);
    updateFormData({ headlines: newHeadlines });
  };

  // Helper function to add a new description
  const addDescription = () => {
    const currentDescriptions = formData.descriptions || [];
    updateFormData({
      descriptions: [...currentDescriptions, '']
    });
  };

  // Helper function to update a description
  const updateDescription = (index: number, value: string) => {
    const currentDescriptions = formData.descriptions || [];
    const newDescriptions = [...currentDescriptions];
    newDescriptions[index] = value;
    updateFormData({ descriptions: newDescriptions });
  };

  // Helper function to remove a description
  const removeDescription = (index: number) => {
    const currentDescriptions = formData.descriptions || [];
    const newDescriptions = currentDescriptions.filter((_, i) => i !== index);
    updateFormData({ descriptions: newDescriptions });
  };

  // Handle file upload
  const handleFileUpload = (fileType: 'images' | 'logos' | 'videos' | 'productFeed', files: FileList) => {
    const fileArray = Array.from(files);
    
    switch (fileType) {
      case 'images':
        updateFormData({ files: [...(formData.files || []), ...fileArray] });
        break;
      case 'logos':
        updateFormData({ logos: [...(formData.logos || []), ...fileArray] });
        break;
      case 'videos':
        updateFormData({ videos: [...(formData.videos || []), ...fileArray] });
        break;
      case 'productFeed':
        updateFormData({ productFeed: fileArray[0] });
        break;
    }
  };

  // Get validation status for fields
  const headlineValidation = getFieldValidation(formData, 'headlines');
  const descriptionValidation = getFieldValidation(formData, 'descriptions');
  const businessNameValidation = getFieldValidation(formData, 'businessName');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">🎯 Assets do Google Ads</h2>
        <p className="text-muted-foreground">
          Configure os assets necessários para sua campanha {config.typeConfigurations[campaignType]?.destinations[0]?.label || campaignType}
        </p>
      </div>

      {/* Headlines Section */}
      {requirements.headlines && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Label className="text-lg font-semibold">Headlines</Label>
                {requirements.headlines.required && (
                  <span className="text-red-500">*</span>
                )}
                <Badge variant="outline" className="text-xs">
                  {headlineValidation.count || 0}/{requirements.headlines.max} 
                  {requirements.headlines.recommended && ` (Rec: ${requirements.headlines.recommended})`}
                </Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addHeadline}
                disabled={(formData.headlines?.length || 0) >= requirements.headlines.max!}
                className="flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar</span>
              </Button>
            </div>

            <div className="space-y-3">
              {(formData.headlines || []).map((headline, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-1">
                    <JumperInput
                      value={headline}
                      onChange={(value) => updateHeadline(index, value)}
                      placeholder={`Headline ${index + 1} (máx. ${requirements.headlines.charLimit} caracteres)`}
                      className="w-full"
                      maxLength={requirements.headlines.charLimit}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        {headline.length}/{requirements.headlines.charLimit} caracteres
                      </span>
                      {headline.length > requirements.headlines.charLimit! && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Excede o limite
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHeadline(index)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {(formData.headlines?.length || 0) < requirements.headlines.min! && (
                <p className="text-sm text-orange-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Adicione pelo menos {requirements.headlines.min} headlines
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Descriptions Section */}
      {requirements.descriptions && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Label className="text-lg font-semibold">Descriptions</Label>
                {requirements.descriptions.required && (
                  <span className="text-red-500">*</span>
                )}
                <Badge variant="outline" className="text-xs">
                  {descriptionValidation.count || 0}/{requirements.descriptions.max}
                  {requirements.descriptions.recommended && ` (Rec: ${requirements.descriptions.recommended})`}
                </Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDescription}
                disabled={(formData.descriptions?.length || 0) >= requirements.descriptions.max!}
                className="flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar</span>
              </Button>
            </div>

            <div className="space-y-3">
              {(formData.descriptions || []).map((description, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-1">
                    <JumperInput
                      value={description}
                      onChange={(value) => updateDescription(index, value)}
                      placeholder={`Description ${index + 1} (máx. ${requirements.descriptions.charLimit} caracteres)`}
                      className="w-full"
                      maxLength={requirements.descriptions.charLimit}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">
                        {description.length}/{requirements.descriptions.charLimit} caracteres
                      </span>
                      {description.length > requirements.descriptions.charLimit! && (
                        <span className="text-xs text-red-500 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Excede o limite
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDescription(index)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {(formData.descriptions?.length || 0) < requirements.descriptions.min! && (
                <p className="text-sm text-orange-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Adicione pelo menos {requirements.descriptions.min} descriptions
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign-specific fields */}
      {campaignType === 'search' && (
        <Card>
          <CardContent className="p-6">
            <Label className="text-lg font-semibold mb-4 block">Configurações de Search</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <JumperInput
                label="Path 1 (opcional)"
                value={formData.path1 || ''}
                onChange={(value) => updateFormData({ path1: value })}
                placeholder="Ex: promocoes"
                maxLength={15}
                helpText="Aparece na URL do anúncio"
              />
              <JumperInput
                label="Path 2 (opcional)"
                value={formData.path2 || ''}
                onChange={(value) => updateFormData({ path2: value })}
                placeholder="Ex: desconto"
                maxLength={15}
                helpText="Aparece na URL do anúncio"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {campaignType === 'performance-max' && (
        <Card>
          <CardContent className="p-6">
            <Label className="text-lg font-semibold mb-4 block">Performance Max Requirements</Label>
            <div className="space-y-4">
              <JumperInput
                label="Nome da Empresa *"
                value={formData.businessName || ''}
                onChange={(value) => updateFormData({ businessName: value })}
                placeholder="Nome da sua empresa"
                error={businessNameValidation.error}
                helpText="Nome que aparecerá nos anúncios"
              />
              
              {/* Logos upload section would go here */}
              <div className="space-y-2">
                <Label>Logos *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Upload de logos será implementado em breve</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images section for campaigns that require them */}
      {requirements.images?.required && (
        <Card>
          <CardContent className="p-6">
            <Label className="text-lg font-semibold mb-4 block">
              Imagens {requirements.images.required && '*'}
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                Upload de imagens será implementado no próximo passo
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Formatos aceitos: {requirements.images.formats?.join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress indicator */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Progresso</p>
            <p className="text-sm text-muted-foreground">
              Configure todos os assets necessários para continuar para o próximo passo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleAdsAssetSection;