import React from 'react';
import { FormData } from '@/types/creative';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, FileText, Image, Video, Users, User, Instagram, ExternalLink, Hash } from 'lucide-react';
import { useNotionClients } from '@/hooks/useNotionData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { previewCreativeName } from '@/utils/creativeName';

interface Step4Props {
  formData: FormData;
  isSubmitting: boolean;
}

const Step4: React.FC<Step4Props> = ({ formData, isSubmitting }) => {
  const { clients } = useNotionClients();
  const { currentUser } = useAuth();

  // Check if this is an existing post
  const isExistingPost = formData.creativeType === 'existing-post';

  // Get client name
  const selectedClient = clients.find(c => c.id === formData.client);
  const clientName = selectedClient?.name || 'Cliente não encontrado';

  // Generate preview of final creative name
  const finalCreativeName = React.useMemo(() => {
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
    } else if (formData.creativeType === 'existing-post') {
      // For existing post, check URL validation
      if (!formData.existingPost || !formData.existingPost.valid) {
        return ['URL da publicação do Instagram inválida ou não fornecida'];
      }
      return [];
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
    } else if (formData.creativeType === 'existing-post') {
      return formData.existingPost && formData.existingPost.valid ? 1 : 0;
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

      {/* Creative Name Preview */}
      {finalCreativeName && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <Hash className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Nome Final do Criativo</h3>
          </div>
          <div className="bg-white border border-blue-200 rounded-md p-3">
            <p className="text-sm font-mono text-blue-800 break-all">{finalCreativeName}</p>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Este será o nome usado no Facebook Ads Manager e no Notion
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
            {formData.creativeType === 'existing-post' 
              ? 'Existe um problema com a URL da publicação. Volte para a etapa anterior e corrija.'
              : 'Existem arquivos com problemas. Volte para a etapa de upload e corrija os arquivos inválidos.'
            }
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
            <div className="break-words"><span className="font-medium">Nome:</span> <span className="break-all">{formData.creativeName}</span></div>
            <div className="break-words"><span className="font-medium">Plataforma:</span> {formData.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}</div>
            {formData.campaignObjective && (
              <div className="break-words"><span className="font-medium">Objetivo:</span> <span className="break-all">{formData.campaignObjective}</span></div>
            )}
            {formData.creativeType && (
              <div className="break-words"><span className="font-medium">Tipo:</span> {
                formData.creativeType === 'single' ? 'Anúncio Único' :
                formData.creativeType === 'carousel' ? 'Carrossel' : 
                formData.creativeType === 'existing-post' ? 'Publicação Existente' : 'Coleção'
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

        {/* Files/Content Card */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            {formData.creativeType === 'carousel' ? (
              <Image className="h-5 w-5 text-jumper-blue" />
            ) : formData.creativeType === 'existing-post' ? (
              <Instagram className="h-5 w-5 text-pink-500" />
            ) : (
              <FileText className="h-5 w-5 text-jumper-blue" />
            )}
            <h3 className="font-semibold text-gray-900">
              {formData.creativeType === 'carousel' ? 'Cartões do Carrossel' : 
               formData.creativeType === 'existing-post' ? 'Publicação do Instagram' : 'Arquivos'}
            </h3>
          </div>
          <div className="text-sm space-y-2">
            <div className="mb-2">
              <span className="font-medium">
                {formData.creativeType === 'existing-post' ? 'Publicação:' : 'Total de arquivos:'}
              </span> {formData.creativeType === 'existing-post' ? '1 post do Instagram' : totalFiles}
            </div>
            
            {/* Show Instagram post details for existing-post */}
            {formData.creativeType === 'existing-post' && formData.existingPost && formData.existingPost.valid && (
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mt-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Instagram className="h-4 w-4 text-pink-500" />
                    <span className="font-medium text-pink-800">Detalhes da Publicação</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div><span className="font-medium">Tipo:</span> {
                      formData.existingPost.contentType === 'post' ? 'Post' :
                      formData.existingPost.contentType === 'reel' ? 'Reel' : 'IGTV'
                    }</div>
                    {formData.existingPost.username && (
                      <div><span className="font-medium">Perfil:</span> @{formData.existingPost.username}</div>
                    )}
                    {formData.existingPost.postId && (
                      <div><span className="font-medium">ID:</span> {formData.existingPost.postId}</div>
                    )}
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(formData.existingPost.instagramUrl, '_blank')}
                      className="text-pink-600 border-pink-300 hover:bg-pink-100 text-xs h-7 px-2"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver Post
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
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
            {formData.creativeType === 'existing-post' && formData.existingPost && (
              <div className="break-words">
                <span className="font-medium">URL:</span> 
                <span className="break-all ml-1">
                  {formData.existingPost.instagramUrl.substring(0, 40)}
                  {formData.existingPost.instagramUrl.length > 40 ? '...' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content Card - Hide for existing-post */}
        {!isExistingPost && (
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
        )}

        {/* CTA & Destination Card */}
        <div className={`bg-white border rounded-lg p-6 shadow-sm ${isExistingPost ? 'col-span-full md:col-span-1' : 'col-span-full'}`}>
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
