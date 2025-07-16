import React from 'react';
import { FormData, GoogleAdsConfig } from '@/types/creative';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, FileText, Image, Video, Search, ExternalLink, Hash, Target, Globe, Smartphone } from 'lucide-react';
import { useNotionClients } from '@/hooks/useNotionData';
import { useAuth } from '@/contexts/AuthContext';
import { validateGoogleAdsForm } from '@/utils/googleAdsValidation';
import { previewCreativeNameDetailed } from '@/utils/creativeName';
import googleAdsConfig from '@/config/google-ads-objectives.json';

interface GoogleAdsReviewSectionProps {
  formData: FormData;
  isSubmitting: boolean;
}

const GoogleAdsReviewSection: React.FC<GoogleAdsReviewSectionProps> = ({ formData, isSubmitting }) => {
  const { clients } = useNotionClients();
  const { currentUser } = useAuth();
  const config = googleAdsConfig as GoogleAdsConfig;

  // Get client name
  const selectedClient = clients.find(c => c.id === formData.client);
  const clientName = selectedClient?.name || 'Cliente não encontrado';

  // Get campaign type info
  const campaignType = formData.googleCampaignType!;
  const campaignTypeConfig = config.objectiveToTypes[formData.campaignObjective!]?.availableTypes.find(
    t => t.value === campaignType
  );

  // Generate preview of final creative name
  const finalCreativeName = React.useMemo(() => {
    if (
      formData.creativeName && 
      formData.campaignObjective && 
      formData.googleCampaignType && 
      selectedClient
    ) {
      return previewCreativeNameDetailed(
        formData.creativeName,
        formData.campaignObjective,
        formData.googleCampaignType,
        selectedClient.name
      );
    }
    return null;
  }, [formData.creativeName, formData.campaignObjective, formData.googleCampaignType, selectedClient]);

  // Validate Google Ads form
  const validation = validateGoogleAdsForm(formData);
  const hasValidationIssues = !validation.isValid;

  // Count assets
  const getAssetCounts = () => {
    const counts = {
      headlines: formData.headlines?.filter(h => h.trim().length > 0).length || 0,
      descriptions: formData.descriptions?.filter(d => d.trim().length > 0).length || 0,
      images: formData.files?.length || 0,
      logos: formData.logos?.length || 0,
      videos: formData.videos?.length || 0
    };
    return counts;
  };

  const assetCounts = getAssetCounts();

  // Get campaign icon
  const getCampaignIcon = (type: string) => {
    switch (type) {
      case 'search':
        return <Search className="h-5 w-5 text-blue-600" />;
      case 'display':
        return <Image className="h-5 w-5 text-green-600" />;
      case 'video':
        return <Video className="h-5 w-5 text-red-600" />;
      case 'shopping':
        return <ExternalLink className="h-5 w-5 text-orange-600" />;
      case 'app':
        return <Smartphone className="h-5 w-5 text-purple-600" />;
      case 'performance-max':
        return <Target className="h-5 w-5 text-pink-600" />;
      case 'demand-gen':
        return <Globe className="h-5 w-5 text-indigo-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">📋 Revisão - Google Ads</h2>
        <p className="text-muted-foreground">Confira todas as informações da sua campanha antes de enviar</p>
      </div>

      {/* Creative Name Preview */}
      {finalCreativeName && (
        <div className="bg-accent-subtle/10 border border-accent-subtle/30 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <Hash className="h-5 w-5 text-accent-subtle" />
            <h3 className="font-semibold text-accent-subtle">Nome Final do Criativo</h3>
          </div>
          <div className="bg-white border border-accent-border rounded-md p-3">
            <p className="text-sm font-mono text-accent-subtle break-all">{finalCreativeName}</p>
          </div>
          <p className="text-xs text-accent-subtle mt-2">
            Este será o nome usado no Google Ads e no Notion
          </p>
        </div>
      )}

      {/* Validation Issues Alert */}
      {hasValidationIssues && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção!</strong>
            <br />
            Existem problemas com a configuração da campanha. Corrija os seguintes itens:
            <ul className="mt-2 ml-4 list-disc">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && !hasValidationIssues && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700">
            <strong>Atenção!</strong> Recomendações para melhor performance:
            <ul className="mt-2 ml-4 list-disc">
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {!hasValidationIssues && validation.warnings.length === 0 && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <strong>Perfeito!</strong> Sua campanha Google Ads está configurada corretamente e pode ser enviada.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Campaign Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              {getCampaignIcon(campaignType)}
              <span>Informações da Campanha</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Cliente:</span>
              <span className="text-sm break-all">{clientName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Nome:</span>
              <span className="text-sm break-all">{formData.creativeName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Plataforma:</span>
              <Badge variant="outline">Google Ads</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Objetivo:</span>
              <span className="text-sm break-all">{formData.campaignObjective}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Tipo:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm">{campaignTypeConfig?.label}</span>
                {campaignTypeConfig?.recommended && (
                  <Badge variant="default" className="text-xs">Recomendado</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manager Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-jumper-blue" />
              <span>Gerente Responsável</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Nome:</span>
              <span className="text-sm break-all">{currentUser?.name || 'Não identificado'}</span>
            </div>
            {currentUser?.email && (
              <div className="flex justify-between items-center">
                <span className="font-medium">E-mail:</span>
                <span className="text-sm break-all">{currentUser.email}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assets Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-jumper-blue" />
              <span>Assets da Campanha</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assetCounts.headlines > 0 && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Headlines:</span>
                <Badge variant="outline">{assetCounts.headlines}</Badge>
              </div>
            )}
            {assetCounts.descriptions > 0 && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Descriptions:</span>
                <Badge variant="outline">{assetCounts.descriptions}</Badge>
              </div>
            )}
            {assetCounts.images > 0 && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Imagens:</span>
                <Badge variant="outline">{assetCounts.images}</Badge>
              </div>
            )}
            {assetCounts.logos > 0 && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Logos:</span>
                <Badge variant="outline">{assetCounts.logos}</Badge>
              </div>
            )}
            {assetCounts.videos > 0 && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Vídeos:</span>
                <Badge variant="outline">{assetCounts.videos}</Badge>
              </div>
            )}
            {formData.businessName && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Nome da Empresa:</span>
                <span className="text-sm break-all">{formData.businessName}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Destination & CTA Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Target className="h-5 w-5 text-jumper-blue" />
              <span>Destino & Call-to-Action</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.destination && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Destino:</span>
                <span className="text-sm break-all">{formData.destination}</span>
              </div>
            )}
            {formData.cta && (
              <div className="flex justify-between items-center">
                <span className="font-medium">CTA:</span>
                <span className="text-sm break-all">{formData.cta}</span>
              </div>
            )}
            {formData.destinationUrl && (
              <div className="space-y-1">
                <span className="font-medium">URL:</span>
                <div className="text-sm break-all text-muted-foreground bg-muted p-2 rounded">
                  {formData.destinationUrl}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign-specific details */}
        {(formData.path1 || formData.path2 || formData.merchantId || formData.appStoreUrl) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Configurações Específicas</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {formData.path1 && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Path 1:</span>
                  <span className="text-sm break-all">{formData.path1}</span>
                </div>
              )}
              {formData.path2 && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Path 2:</span>
                  <span className="text-sm break-all">{formData.path2}</span>
                </div>
              )}
              {formData.merchantId && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Merchant ID:</span>
                  <span className="text-sm break-all">{formData.merchantId}</span>
                </div>
              )}
              {formData.appStoreUrl && (
                <div className="space-y-1">
                  <span className="font-medium">App Store URL:</span>
                  <div className="text-sm break-all text-muted-foreground bg-muted p-2 rounded">
                    {formData.appStoreUrl}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Observations */}
      {formData.observations && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
              {formData.observations}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Campaign Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            {getCampaignIcon(campaignType)}
            <span>Preview da Campanha</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="text-sm text-muted-foreground text-center">
              <p>🎯 Tipo: <strong>{campaignTypeConfig?.label}</strong></p>
              <p className="mt-2">{campaignTypeConfig?.description}</p>
              {validation.warnings.length === 0 && (
                <p className="mt-3 text-green-600">✅ Campanha configurada corretamente</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission Status */}
      {isSubmitting && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-3 text-jumper-blue">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-jumper-blue"></div>
            <span className="font-medium">Enviando campanha Google Ads...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAdsReviewSection;