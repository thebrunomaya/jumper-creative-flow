import React from 'react';
import { FormData } from '@/types/creative';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, FileText, Image, Video, Users, User } from 'lucide-react';
import { useNotionClients } from '@/hooks/useNotionData';
import { useAuth } from '@/contexts/AuthContext';

interface Step4Props {
  formData: FormData;
  isSubmitting: boolean;
}

const Step4: React.FC<Step4Props> = ({ formData, isSubmitting }) => {
  const { clients } = useNotionClients();
  const { currentUser } = useAuth();

  // Get client name
  const selectedClient = clients.find(c => c.id === formData.client);
  const clientName = selectedClient?.name || 'Cliente não encontrado';

  // Check for validation issues based on creative type
  const getValidationIssues = () => {
    if (formData.creativeType === 'carousel') {
      // For carousel, check carouselCards
      if (!formData.carouselCards || formData.carouselCards.length === 0) {
        return ['Nenhum cartão de carrossel encontrado'];
      }
      
      const invalidCards = formData.carouselCards.filter(card => !card.file || !card.file.valid);
      if (invalidCards.length > 0) {
        return [`${invalidCards.length} cartão(s) do carrossel com problemas`];
      }
      
      return [];
    } else if (formData.creativeType === 'single') {
      // For single, check mediaVariations
      if (!formData.mediaVariations || formData.mediaVariations.length === 0) {
        return ['Nenhuma variação de mídia encontrada'];
      }
      
      const issues: string[] = [];
      formData.mediaVariations.forEach((variation, index) => {
        const requiredPositions = [];
        if (variation.squareEnabled !== false) requiredPositions.push('square');
        if (variation.verticalEnabled !== false) requiredPositions.push('vertical');
        if (variation.horizontalEnabled !== false) requiredPositions.push('horizontal');
        
        const missingFiles = requiredPositions.filter(position => {
          const file = variation[`${position}File`];
          return !file || !file.valid;
        });
        
        if (missingFiles.length > 0) {
          issues.push(`Variação ${index + 1}: ${missingFiles.join(', ')} com problemas`);
        }
      });
      
      return issues;
    } else {
      // For other types, check validatedFiles
      const invalidFiles = formData.validatedFiles.filter(f => !f.valid);
      if (invalidFiles.length > 0) {
        return [`${invalidFiles.length} arquivo(s) com problemas`];
      }
      
      return [];
    }
  };

  const validationIssues = getValidationIssues();
  const hasValidationIssues = validationIssues.length > 0;

  // Count total files based on creative type
  const getTotalFiles = () => {
    if (formData.creativeType === 'carousel') {
      return formData.carouselCards?.filter(card => card.file).length || 0;
    } else if (formData.creativeType === 'single') {
      let totalFiles = 0;
      formData.mediaVariations?.forEach(variation => {
        if (variation.squareFile) totalFiles++;
        if (variation.verticalFile) totalFiles++;
        if (variation.horizontalFile) totalFiles++;
      });
      return totalFiles;
    } else {
      return formData.validatedFiles.length;
    }
  };

  const totalFiles = getTotalFiles();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-jumper-text mb-2">📋 Revisão Final</h2>
        <p className="text-gray-600">Confira todas as informações antes de enviar</p>
      </div>

      {/* Validation Issues Alert */}
      {hasValidationIssues && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção!</strong>
            <br />
            Existem arquivos com problemas. Volte para a etapa de upload e corrija os arquivos inválidos.
            <ul className="mt-2 ml-4 list-disc">
              {validationIssues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {!hasValidationIssues && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <strong>Tudo pronto!</strong> Seu criativo está válido e pode ser enviado.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Info Card */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-5 w-5 text-jumper-blue" />
            <h3 className="font-semibold text-gray-900">Informações Básicas</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="break-words"><span className="font-medium">Cliente:</span> <span className="break-all">{clientName}</span></div>
            <div className="break-words"><span className="font-medium">Plataforma:</span> {formData.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}</div>
            {formData.campaignObjective && (
              <div className="break-words"><span className="font-medium">Objetivo:</span> <span className="break-all">{formData.campaignObjective}</span></div>
            )}
            {formData.creativeType && (
              <div className="break-words"><span className="font-medium">Tipo:</span> {
                formData.creativeType === 'single' ? 'Anúncio Único' :
                formData.creativeType === 'carousel' ? 'Carrossel' : 'Coleção'
              }</div>
            )}
          </div>
        </div>

        {/* Manager Info Card */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-5 w-5 text-jumper-blue" />
            <h3 className="font-semibold text-gray-900">Gerente Responsável</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="break-words"><span className="font-medium">Nome:</span> <span className="break-all">{currentUser?.name || 'Não identificado'}</span></div>
            {currentUser?.email && (
              <div className="break-words"><span className="font-medium">E-mail:</span> <span className="break-all">{currentUser.email}</span></div>
            )}
          </div>
        </div>

        {/* Files Card */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            {formData.creativeType === 'carousel' ? (
              <Image className="h-5 w-5 text-jumper-blue" />
            ) : (
              <FileText className="h-5 w-5 text-jumper-blue" />
            )}
            <h3 className="font-semibold text-gray-900">
              {formData.creativeType === 'carousel' ? 'Cartões do Carrossel' : 'Arquivos'}
            </h3>
          </div>
          <div className="text-sm">
            <div className="mb-2">
              <span className="font-medium">Total de arquivos:</span> {totalFiles}
            </div>
            {formData.creativeType === 'carousel' && formData.carouselAspectRatio && (
              <div className="break-words">
                <span className="font-medium">Proporção:</span> <span className="break-all">{formData.carouselAspectRatio}</span>
              </div>
            )}
            {formData.creativeType === 'single' && formData.mediaVariations && (
              <div>
                <span className="font-medium">Variações:</span> {formData.mediaVariations.length}
              </div>
            )}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-5 w-5 text-jumper-blue" />
            <h3 className="font-semibold text-gray-900">Conteúdo</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Títulos:</span> {formData.titles?.length || 0}</div>
            <div><span className="font-medium">Textos principais:</span> {formData.mainTexts?.length || 0}</div>
            {formData.description && (
              <div className="break-words">
                <span className="font-medium">Descrição:</span> 
                <span className="break-all ml-1">
                  {formData.description.substring(0, 50)}{formData.description.length > 50 ? '...' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CTA & Destination Card */}
        <div className="bg-white border rounded-lg p-6 shadow-sm col-span-full">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-5 w-5 text-jumper-blue" />
            <h3 className="font-semibold text-gray-900">Call-to-Action & Destino</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="break-words">
              {formData.cta && (
                <div><span className="font-medium">CTA:</span> <span className="break-all ml-1">{formData.cta}</span></div>
              )}
              {formData.callToAction && !formData.cta && (
                <div><span className="font-medium">CTA:</span> <span className="break-all ml-1">{formData.callToAction}</span></div>
              )}
            </div>
            <div className="break-words">
              {formData.destinationUrl && (
                <div>
                  <span className="font-medium">Destino:</span> 
                  <span className="break-all ml-1">
                    {formData.destinationUrl.substring(0, 40)}{formData.destinationUrl.length > 40 ? '...' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Observations */}
      {formData.observations && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Observações</h3>
          <p className="text-sm text-gray-600 break-words whitespace-pre-wrap">{formData.observations}</p>
        </div>
      )}

      {/* Submission Status */}
      {isSubmitting && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-3 text-jumper-blue">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-jumper-blue"></div>
            <span className="font-medium">Enviando criativo...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step4;
