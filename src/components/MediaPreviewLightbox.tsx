import React, { useState, useEffect } from 'react';
import { ValidatedFile } from '@/types/creative';
import { analyzeMedia, MediaAnalysis } from '@/utils/mediaAnalysis';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileImage, 
  FileVideo, 
  Monitor, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  Info,
  Zap
} from 'lucide-react';
import MetaZoneOverlay from './MetaZoneOverlay';

interface MediaPreviewLightboxProps {
  file: ValidatedFile;
  format: 'square' | 'vertical' | 'horizontal';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carouselMode?: boolean; // New prop for carousel mode
  carouselAspectRatio?: '1:1' | '4:5'; // New prop for carousel aspect ratio
}

const MediaPreviewLightbox: React.FC<MediaPreviewLightboxProps> = ({
  file,
  format,
  open,
  onOpenChange,
  carouselMode = false,
  carouselAspectRatio = '1:1'
}) => {
  const [analysis, setAnalysis] = useState<MediaAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (open && file) {
      setIsAnalyzing(true);
      analyzeMedia(file).then((result) => {
        setAnalysis(result);
        setIsAnalyzing(false);
      });
    }
  }, [open, file]);

  const isVideo = file.file.type.startsWith('video/');
  const sizeInMB = (file.file.size / (1024 * 1024)).toFixed(1);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return 'Normal';
    }
  };

  // Get preview container dimensions based on format and carousel mode
  const getPreviewContainerStyle = () => {
    if (carouselMode) {
      return carouselAspectRatio === '4:5' ? {
        maxWidth: '300px',
        maxHeight: '375px' // 300 * (5/4) = 375
      } : {
        maxWidth: '350px',
        maxHeight: '350px'
      };
    }
    
    switch (format) {
      case 'vertical':
        return {
          maxWidth: '300px',
          maxHeight: '80vh', // Increased significantly for vertical content
          minHeight: '500px' // Ensure minimum height for vertical content
        };
      case 'horizontal':
        return {
          maxWidth: '500px',
          maxHeight: '300px'
        };
      case 'square':
      default:
        return {
          maxWidth: '400px',
          maxHeight: '400px'
        };
    }
  };

  const getTitle = () => {
    if (carouselMode) {
      return `Preview Carrossel ${carouselAspectRatio} - ${file.file.name}`;
    }
    return `Preview - ${file.file.name}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isVideo ? <FileVideo className="h-5 w-5" /> : <FileImage className="h-5 w-5" />}
            <span>{getTitle()}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {carouselMode ? `Preview Carrossel ${carouselAspectRatio}` : 'Preview'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div 
                    className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                    style={getPreviewContainerStyle()}
                  >
                    {file.preview && (
                      <MetaZoneOverlay
                        imageUrl={file.preview}
                        format={format}
                        file={file.file}
                        onImageLoad={() => {}}
                        expanded={true}
                        size="lightbox"
                        carouselMode={carouselMode}
                        carouselAspectRatio={carouselAspectRatio}
                      />
                    )}
                  </div>
                </div>
                
                {/* Basic Info */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tamanho:</span>
                    <span className="font-medium">{sizeInMB} MB</span>
                  </div>
                  {file.dimensions && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Resolução:</span>
                      <span className="font-medium">
                        {file.dimensions.width}x{file.dimensions.height}px
                      </span>
                    </div>
                  )}
                  {file.duration && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duração:</span>
                      <span className="font-medium">{file.duration}s</span>
                    </div>
                  )}
                  {analysis && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Proporção:</span>
                      <span className="font-medium">{analysis.aspectRatio}</span>
                    </div>
                  )}
                  {carouselMode && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Formato:</span>
                      <span className="font-medium">Carrossel {carouselAspectRatio}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Section */}
          <div className="space-y-4">
            {isAnalyzing ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-600">Analisando mídia...</p>
                </div>
              </div>
            ) : analysis ? (
              <Tabs defaultValue="compatibility" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="compatibility">Plataformas</TabsTrigger>
                  <TabsTrigger value="quality">Qualidade</TabsTrigger>
                  <TabsTrigger value="technical">Técnico</TabsTrigger>
                  <TabsTrigger value="suggestions">Dicas</TabsTrigger>
                </TabsList>

                <TabsContent value="compatibility">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Monitor className="h-4 w-4" />
                        <span>Compatibilidade por Plataforma</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {carouselMode ? (
                        <div className="space-y-2">
                          <p className="text-sm text-accent-critical font-medium">
                            Formato Carrossel {carouselAspectRatio}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Instagram Feed</span>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">Facebook Feed</span>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </div>
                          </div>
                          {carouselAspectRatio === '4:5' && (
                            <p className="text-xs text-yellow-600">
                              ⚠️ Formato 4:5 pode ter limitações em alguns posicionamentos
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">Instagram Feed</span>
                            {analysis.compatibility.instagramFeed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">Instagram Stories</span>
                            {analysis.compatibility.instagramStories ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">Facebook Feed</span>
                            {analysis.compatibility.facebookFeed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">Facebook Stories</span>
                            {analysis.compatibility.facebookStories ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="quality">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Zap className="h-4 w-4" />
                        <span>Análise de Qualidade</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Nitidez:</span>
                          <Badge className={getQualityColor(analysis.quality.sharpness)}>
                            {getQualityLabel(analysis.quality.sharpness)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Brilho:</span>
                          <Badge className={getQualityColor(analysis.quality.brightness)}>
                            {getQualityLabel(analysis.quality.brightness)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Contraste:</span>
                          <Badge className={getQualityColor(analysis.quality.contrast)}>
                            {getQualityLabel(analysis.quality.contrast)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="technical">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Info className="h-4 w-4" />
                        <span>Informações Técnicas</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(analysis.technicalInfo).map(([key, value]) => {
                        if (!value) return null;
                        
                        const labels: Record<string, string> = {
                          colorDepth: 'Profundidade de Cor',
                          compression: 'Compressão',
                          codec: 'Codec',
                          bitrate: 'Bitrate',
                          frameRate: 'Frame Rate',
                          hasAudio: 'Áudio',
                        };
                        
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{labels[key]}:</span>
                            <span className="text-sm font-medium">
                              {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : value}
                            </span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="suggestions">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Lightbulb className="h-4 w-4" />
                        <span>Sugestões de Otimização</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysis.suggestions.length > 0 ? (
                        <div className="space-y-2">
                          {analysis.suggestions.map((suggestion, index) => (
                            <div key={index} className="flex items-start space-x-2 p-2 bg-accent-subtle/10 rounded">
                              <Lightbulb className="h-4 w-4 text-accent-subtle mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-accent-subtle">{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            Arquivo otimizado! Nenhuma sugestão adicional.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPreviewLightbox;
