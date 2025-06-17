
import React from 'react';
import { FormData, CLIENTS, PARTNERS } from '@/types/creative';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useNotionClients } from '@/hooks/useNotionData';
import { useAuth } from '@/contexts/AuthContext';

interface Step4Props {
  formData: FormData;
  isSubmitting: boolean;
}

const Step4: React.FC<Step4Props> = ({ formData, isSubmitting }) => {
  const { clients } = useNotionClients();
  const { currentUser } = useAuth();
  
  const client = clients.find(c => c.id === formData.client);
  const partner = PARTNERS.find(p => p.id === formData.partner);
  
  // Get files based on creative type
  const getAllFiles = () => {
    if (formData.creativeType === 'single' && formData.mediaVariations) {
      const files: any[] = [];
      formData.mediaVariations.forEach((variation, index) => {
        if (variation.squareFile) files.push({ ...variation.squareFile, variationIndex: index + 1, format: 'square' });
        if (variation.verticalFile) files.push({ ...variation.verticalFile, variationIndex: index + 1, format: 'vertical' });
        if (variation.horizontalFile) files.push({ ...variation.horizontalFile, variationIndex: index + 1, format: 'horizontal' });
      });
      return files;
    }
    return formData.validatedFiles || [];
  };

  const allFiles = getAllFiles();
  const validFiles = allFiles.filter(f => f.valid);
  const invalidFiles = allFiles.filter(f => !f.valid);
  
  const isAllValid = invalidFiles.length === 0 && validFiles.length > 0;

  const getPlatformIcon = (platform: string) => {
    return platform === 'meta' ? '📘' : '🔍';
  };

  const getCreativeTypeIcon = (type: string) => {
    switch(type) {
      case 'single': return '🖼️';
      case 'carousel': return '🎠';
      case 'video': return '🎬';
      default: return '📄';
    }
  };

  const getObjectiveIcon = (objective: string) => {
    switch(objective) {
      case 'sales': return '💰';
      case 'traffic': return '🚗';
      case 'awareness': return '👁️';
      case 'leads': return '📧';
      case 'engagement': return '❤️';
      default: return '🎯';
    }
  };

  const getFormatIcon = (format: string) => {
    switch(format) {
      case 'square': return '📐';
      case 'vertical': return '📱';
      case 'horizontal': return '💻';
      default: return '📄';
    }
  };

  // Group files by variation for better display
  const groupFilesByVariation = () => {
    if (formData.creativeType === 'single' && formData.mediaVariations) {
      const variations: Record<number, any[]> = {};
      allFiles.forEach(file => {
        const variationIndex = (file as any).variationIndex || 1;
        if (!variations[variationIndex]) {
          variations[variationIndex] = [];
        }
        variations[variationIndex].push(file);
      });
      return variations;
    }
    return { 1: allFiles };
  };

  const filesByVariation = groupFilesByVariation();

  if (isSubmitting) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-jumper-blue mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-jumper-text mb-2">🚀 Enviando seu criativo...</h2>
        <p className="text-gray-600">Criando registro no Notion e organizando arquivos</p>
        <div className="mt-6 space-y-2 text-sm text-gray-500">
          <div>✅ Validando dados finais</div>
          <div>📤 Enviando para o Notion</div>
          <div>📁 Organizando arquivos no Drive</div>
          <div>📧 Preparando confirmação por email</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-jumper-text mb-2">✅ Revisão Final</h2>
        <p className="text-gray-600">Confira todos os dados antes do envio</p>
      </div>

      {/* Summary Card */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📋</span>
            <span>Resumo do Criativo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Conta</p>
              <p className="font-semibold text-jumper-text">{client?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Enviado por</p>
              <p className="font-semibold text-jumper-text">{currentUser?.user_metadata?.full_name || currentUser?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Plataforma</p>
              <div className="flex items-center space-x-2">
                <span>{getPlatformIcon(formData.platform)}</span>
                <span className="font-semibold text-jumper-text">
                  {formData.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
                </span>
              </div>
            </div>
            {formData.creativeType && (
              <div>
                <p className="text-sm text-gray-600">Tipo</p>
                <div className="flex items-center space-x-2">
                  <span>{getCreativeTypeIcon(formData.creativeType)}</span>
                  <span className="font-semibold text-jumper-text">
                    {formData.creativeType === 'single' ? 'Imagem única' :
                     formData.creativeType === 'carousel' ? 'Carrossel' :
                     formData.creativeType === 'collection' ? 'Coleção' : formData.creativeType}
                  </span>
                </div>
              </div>
            )}
            {formData.campaignObjective && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Objetivo</p>
                <div className="flex items-center space-x-2">
                  <span>🎯</span>
                  <span className="font-semibold text-jumper-text">
                    {formData.campaignObjective}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span>📎</span>
              <span>Arquivos ({allFiles.length})</span>
            </span>
            {isAllValid ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Todos válidos
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                {invalidFiles.length} com erro
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(filesByVariation).map(([variationIndex, files]) => (
              <div key={variationIndex} className="space-y-2">
                {Object.keys(filesByVariation).length > 1 && (
                  <div className="bg-gray-100 px-3 py-2 rounded-md">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <span>🎭</span>
                      <span>Variação {variationIndex}</span>
                      <Badge variant="outline" className="text-xs">
                        {files.length} arquivo{files.length > 1 ? 's' : ''}
                      </Badge>
                    </h4>
                  </div>
                )}
                <div className="space-y-2 ml-4">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded border bg-white">
                      <div className="flex items-center space-x-2">
                        <span>{file.file.type.startsWith('image/') ? '🖼️' : '🎬'}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{file.file.name}</span>
                          {(file as any).format && (
                            <span className="text-xs text-gray-500 flex items-center space-x-1">
                              <span>{getFormatIcon((file as any).format)}</span>
                              <span>{(file as any).format} ({file.dimensions?.width}x{file.dimensions?.height}px)</span>
                            </span>
                          )}
                        </div>
                      </div>
                      {file.valid ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📝</span>
            <span>Conteúdo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Títulos */}
          <div>
            <p className="text-sm text-gray-600">Títulos ({formData.titles?.length || 0})</p>
            <div className="space-y-1">
              {formData.titles?.map((title, index) => (
                <p key={index} className="text-sm bg-gray-50 p-2 rounded">
                  <span className="text-xs text-gray-500 mr-2">#{index + 1}</span>
                  {title || 'Não informado'}
                </p>
              )) || <p className="text-sm bg-gray-50 p-2 rounded">Nenhum título informado</p>}
            </div>
          </div>

          {/* Textos Principais */}
          <div>
            <p className="text-sm text-gray-600">Textos Principais ({formData.mainTexts?.length || 0})</p>
            <div className="space-y-1">
              {formData.mainTexts?.map((mainText, index) => (
                <p key={index} className="text-sm bg-gray-50 p-2 rounded">
                  <span className="text-xs text-gray-500 mr-2">#{index + 1}</span>
                  {mainText || 'Não informado'}
                </p>
              )) || <p className="text-sm bg-gray-50 p-2 rounded">Nenhum texto principal informado</p>}
            </div>
          </div>

          {formData.description && (
            <div>
              <p className="text-sm text-gray-600">Descrição</p>
              <p className="text-sm bg-gray-50 p-2 rounded">{formData.description}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">URL Destino</p>
              <p className="text-sm text-blue-600 break-all">{formData.destinationUrl || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Call-to-Action</p>
              <p className="text-sm font-medium">{formData.callToAction || 'Não selecionado'}</p>
            </div>
          </div>
          {formData.observations && (
            <div>
              <p className="text-sm text-gray-600">Observações</p>
              <p className="text-sm bg-gray-50 p-2 rounded">{formData.observations}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SLA Information */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Clock className="w-8 h-8 text-jumper-blue" />
            <div>
              <h3 className="font-semibold text-jumper-text">⏰ SLA de Processamento</h3>
              <p className="text-sm text-gray-600 mt-1">
                Seu criativo será processado em até 24 horas úteis
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <span>📧 Confirmação por email</span>
                <span>•</span>
                <span>📱 Notificação para o gestor</span>
                <span>•</span>
                <span>📋 Acompanhamento no Notion</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!isAllValid && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-800">Atenção!</p>
                <p className="text-sm text-red-700">
                  Existem arquivos com problemas. Volte para a etapa de upload e corrija os arquivos inválidos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Step4;
