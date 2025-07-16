
import React from 'react';
import { FormData, TEXT_LIMITS, META_TEXT_VARIATIONS } from '@/types/creative';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { VALID_CTAS } from '@/types/creative';
import { Plus, X, Instagram } from 'lucide-react';
import TextCounterWithRecommendation from '../TextCounterWithRecommendation';
import metaAdsObjectives from '@/config/meta-ads-objectives.json';

interface Step3Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const Step3: React.FC<Step3Props> = ({ formData, updateFormData, errors }) => {
  // Check if this is an existing post creative type
  const isExistingPost = formData.creativeType === 'existing-post';

  // Initialize arrays if they don't exist (but empty for existing posts)
  const titles = formData.titles || (isExistingPost ? [''] : ['']);
  const mainTexts = formData.mainTexts || (isExistingPost ? [''] : ['']);

  // Get available destinations based on selected objective
  const getAvailableDestinations = () => {
    if (!formData.campaignObjective || formData.platform !== 'meta') {
      return [];
    }
    const objectiveConfig = metaAdsObjectives.objectiveMapping[formData.campaignObjective];
    return objectiveConfig ? objectiveConfig.destinations : [];
  };

  // Get available CTAs based on selected objective and destination
  const getAvailableCTAs = () => {
    if (!formData.campaignObjective || !formData.destination || formData.platform !== 'meta') {
      return [];
    }
    const destinations = getAvailableDestinations();
    const selectedDestination = destinations.find(dest => dest.value === formData.destination);
    return selectedDestination ? selectedDestination.ctas : [];
  };

  // Get destination field configuration
  const getDestinationFieldConfig = () => {
    if (!formData.destination || formData.platform !== 'meta') {
      return null;
    }
    const destinations = getAvailableDestinations();
    const selectedDestination = destinations.find(dest => dest.value === formData.destination);
    if (!selectedDestination || !selectedDestination.fieldType) {
      return null;
    }
    
    return {
      fieldType: selectedDestination.fieldType,
      label: metaAdsObjectives.fieldLabels[selectedDestination.fieldType]
    };
  };

  // Get input type based on field type
  const getInputType = (fieldType: string) => {
    switch (fieldType) {
      case 'url':
      case 'facebook_url':
        return 'url';
      case 'phone':
        return 'tel';
      default:
        return 'text';
    }
  };

  // Check if field should be validated as URL
  const shouldValidateAsUrl = () => {
    const destinationFieldConfig = getDestinationFieldConfig();
    if (!destinationFieldConfig) {
      return true; // Default validation for non-Meta ads
    }
    return destinationFieldConfig.fieldType === 'url' || destinationFieldConfig.fieldType === 'facebook_url';
  };

  // Handle destination change - reset CTA and destination URL when destination changes
  const handleDestinationChange = (value: string) => {
    updateFormData({ 
      destination: value,
      cta: '', // Reset CTA when destination changes
      destinationUrl: '' // Reset destination URL when destination changes
    });
  };

  const addTitle = () => {
    if (titles.length < META_TEXT_VARIATIONS.maxTitles) {
      updateFormData({ 
        titles: [...titles, ''] 
      });
    }
  };

  const removeTitle = (index: number) => {
    if (titles.length > 1) {
      const newTitles = titles.filter((_, i) => i !== index);
      updateFormData({ 
        titles: newTitles 
      });
    }
  };

  const updateTitle = (index: number, value: string) => {
    const newTitles = [...titles];
    newTitles[index] = value;
    updateFormData({ 
      titles: newTitles 
    });
  };

  const addMainText = () => {
    if (mainTexts.length < META_TEXT_VARIATIONS.maxMainTexts) {
      updateFormData({ 
        mainTexts: [...mainTexts, ''] 
      });
    }
  };

  const removeMainText = (index: number) => {
    if (mainTexts.length > 1) {
      const newMainTexts = mainTexts.filter((_, i) => i !== index);
      updateFormData({ 
        mainTexts: newMainTexts 
      });
    }
  };

  const updateMainText = (index: number, value: string) => {
    const newMainTexts = [...mainTexts];
    newMainTexts[index] = value;
    updateFormData({ 
      mainTexts: newMainTexts 
    });
  };

  const availableDestinations = getAvailableDestinations();
  const availableCTAs = getAvailableCTAs();
  const destinationFieldConfig = getDestinationFieldConfig();
  const shouldShowConditionalFields = formData.platform === 'meta' && formData.campaignObjective;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isExistingPost ? 'Configurações do Anúncio' : 'Conteúdo do Anúncio'}
        </h2>
        <p className="text-muted-foreground">
          {isExistingPost 
            ? 'Configure o destino e as opções do seu anúncio de publicação existente.' 
            : 'Preencha os textos que aparecerão no seu anúncio.'
          }
        </p>
      </div>

      <div className="space-y-8">
        {/* Only show text fields for non-existing-post types */}
        {!isExistingPost && (
          <>
            {/* Títulos Section */}
            <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg font-semibold text-foreground">📝 Títulos *</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Você pode adicionar até {META_TEXT_VARIATIONS.maxTitles} títulos.
                  </p>
                </div>
                {titles.length < META_TEXT_VARIATIONS.maxTitles && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTitle}
                    className="flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar título</span>
                  </Button>
                )}
              </div>

              {titles.map((title, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-jumper-blue text-white text-xs px-2 py-1 rounded-full font-medium">
                          {index + 1}
                        </span>
                        <Label htmlFor={`title-${index}`} className="text-sm">
                          Título {index + 1}
                        </Label>
                        {titles.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTitle(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <Input
                        id={`title-${index}`}
                        value={title}
                        onChange={(e) => updateTitle(index, e.target.value)}
                        placeholder={`Digite o título ${index + 1} do anúncio`}
                        className={errors[`title-${index}`] ? 'border-destructive bg-destructive/10' : ''}
                      />
                      
                      {errors[`title-${index}`] && (
                        <p className="text-sm text-red-600 mt-1">{errors[`title-${index}`]}</p>
                      )}
                    </div>
                  </div>
                  
                  <TextCounterWithRecommendation
                    text={title}
                    recommended={TEXT_LIMITS.title.recommended}
                    maximum={TEXT_LIMITS.title.maximum}
                  />
                </div>
              ))}
            </div>

            {/* Textos Principais Section */}
            <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg font-semibold text-foreground">💬 Textos Principais *</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Você pode adicionar até {META_TEXT_VARIATIONS.maxMainTexts} textos principais.
                  </p>
                </div>
                {mainTexts.length < META_TEXT_VARIATIONS.maxMainTexts && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMainText}
                    className="flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar texto</span>
                  </Button>
                )}
              </div>

              {mainTexts.map((mainText, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-jumper-blue text-white text-xs px-2 py-1 rounded-full font-medium">
                          {index + 1}
                        </span>
                        <Label htmlFor={`mainText-${index}`} className="text-sm">
                          Texto Principal {index + 1}
                        </Label>
                        {mainTexts.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMainText(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <Textarea
                        id={`mainText-${index}`}
                        value={mainText}
                        onChange={(e) => updateMainText(index, e.target.value)}
                        placeholder={`Digite o texto principal ${index + 1} do anúncio`}
                        className={`min-h-[100px] ${errors[`mainText-${index}`] ? 'border-destructive bg-destructive/10' : ''}`}
                      />
                      
                      {errors[`mainText-${index}`] && (
                        <p className="text-sm text-red-600 mt-1">{errors[`mainText-${index}`]}</p>
                      )}
                    </div>
                  </div>
                  
                  <TextCounterWithRecommendation
                    text={mainText}
                    recommended={TEXT_LIMITS.mainText.recommended}
                    maximum={TEXT_LIMITS.mainText.maximum}
                  />
                </div>
              ))}
            </div>

            {/* Separador */}
            <Separator className="my-8" />

            {/* Descrição - only for non-existing-post */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Digite uma descrição adicional (opcional)"
                className={`min-h-[80px] ${errors.description ? 'border-destructive bg-destructive/10' : ''}`}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
              
              <TextCounterWithRecommendation
                text={formData.description}
                recommended={TEXT_LIMITS.description.recommended}
                maximum={TEXT_LIMITS.description.maximum}
              />
            </div>
          </>
        )}

        {/* Show Instagram post info for existing-post type */}
        {isExistingPost && (
          <div className="bg-accent-subtle/10 border border-accent-border rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <Instagram className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">📱 Publicação Selecionada</h3>
                {formData.existingPost && formData.existingPost.valid ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>Tipo:</strong> {formData.existingPost.contentType === 'post' ? 'Post' : 
                                             formData.existingPost.contentType === 'reel' ? 'Reel' : 'IGTV'}
                    </p>
                    {formData.existingPost.username && (
                      <p className="text-sm text-gray-700">
                        <strong>Perfil:</strong> @{formData.existingPost.username}
                      </p>
                    )}
                    {formData.existingPost.postId && (
                      <p className="text-sm text-gray-500">
                        <strong>ID:</strong> {formData.existingPost.postId}
                      </p>
                    )}
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(formData.existingPost.instagramUrl, '_blank')}
                        className="text-pink-600 border-pink-300 hover:bg-pink-50"
                      >
                        <Instagram className="h-4 w-4 mr-1" />
                        Ver Post
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma publicação válida selecionada.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Outros Campos Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {isExistingPost ? '🎯 Configurações do Anúncio' : 'ℹ️ Informações Adicionais'}
            </h3>
          </div>

          {/* Conditional Fields for Meta Ads */}
          {shouldShowConditionalFields && (
            <>
              {/* Destino */}
              <div className="space-y-2">
                <Label htmlFor="destination">Destino *</Label>
                <Select value={formData.destination || ''} onValueChange={handleDestinationChange}>
                  <SelectTrigger className={errors.destination ? 'border-destructive bg-destructive/10' : ''}>
                    <SelectValue placeholder="Selecione o destino do anúncio" />
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

              {/* CTA - only show if destination is selected */}
              {formData.destination && (
                <div className="space-y-2">
                  <Label htmlFor="cta">Call-to-Action *</Label>
                  <Select value={formData.cta || ''} onValueChange={(value) => updateFormData({ cta: value })}>
                    <SelectTrigger className={errors.cta ? 'border-destructive bg-destructive/10' : ''}>
                      <SelectValue placeholder="Selecione um call-to-action" />
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

              {/* Destination Field - only show if destination has a field type */}
              {destinationFieldConfig && (
                <div className="space-y-2">
                  <Label htmlFor="destinationUrl">{destinationFieldConfig.label} *</Label>
                  <Input
                    id="destinationUrl"
                    type={getInputType(destinationFieldConfig.fieldType)}
                    value={formData.destinationUrl}
                    onChange={(e) => {
                      console.log('🔄 Destination field changed:', e.target.value);
                      updateFormData({ destinationUrl: e.target.value });
                    }}
                    placeholder={
                      destinationFieldConfig.fieldType === 'url' ? 'https://exemplo.com' :
                      destinationFieldConfig.fieldType === 'facebook_url' ? 'https://facebook.com/suapagina' :
                      destinationFieldConfig.fieldType === 'phone' ? '(11) 99999-9999' :
                      'Digite aqui...'
                    }
                    className={errors.destinationUrl ? 'border-destructive bg-destructive/10' : ''}
                  />
                  {errors.destinationUrl && (
                    <p className="text-sm text-red-600">{errors.destinationUrl}</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Legacy URL field for non-Meta ads or when no conditional fields are shown */}
          {!shouldShowConditionalFields && (
            <div className="space-y-2">
              <Label htmlFor="destinationUrl">URL de Destino *</Label>
              <Input
                id="destinationUrl"
                type="url"
                value={formData.destinationUrl}
                onChange={(e) => {
                  console.log('🔄 URL field changed:', e.target.value);
                  updateFormData({ destinationUrl: e.target.value });
                }}
                placeholder="https://exemplo.com"
                className={errors.destinationUrl ? 'border-destructive bg-destructive/10' : ''}
              />
              {errors.destinationUrl && (
                <p className="text-sm text-red-600">{errors.destinationUrl}</p>
              )}
            </div>
          )}

          {/* Legacy Call to Action for non-Meta ads */}
          {!shouldShowConditionalFields && (
            <div className="space-y-2">
              <Label htmlFor="callToAction">Call-to-Action *</Label>
              <Select value={formData.callToAction} onValueChange={(value) => updateFormData({ callToAction: value })}>
                <SelectTrigger className={errors.callToAction ? 'border-destructive bg-destructive/10' : ''}>
                  <SelectValue placeholder="Selecione um call-to-action" />
                </SelectTrigger>
                <SelectContent>
                  {VALID_CTAS.map((cta) => (
                    <SelectItem key={cta} value={cta}>
                      {cta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.callToAction && (
                <p className="text-sm text-red-600">{errors.callToAction}</p>
              )}
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => updateFormData({ observations: e.target.value })}
              placeholder="Adicione observações ou instruções especiais para a equipe da Jumper"
              className={`min-h-[80px] ${errors.observations ? 'border-destructive bg-destructive/10' : ''}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3;
