
import React from 'react';
import { FormData, VALID_CTAS } from '@/types/creative';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAvailableDestinations, getAvailableCTAs, getDestinationFieldConfig, getInputType } from '@/utils/destinationUtils';

interface DestinationSectionProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const DestinationSection: React.FC<DestinationSectionProps> = ({ formData, updateFormData, errors }) => {
  const availableDestinations = getAvailableDestinations(formData.campaignObjective, formData.platform);
  const availableCTAs = getAvailableCTAs(formData.campaignObjective, formData.destination, formData.platform);
  const destinationFieldConfig = getDestinationFieldConfig(formData.destination, formData.campaignObjective, formData.platform);
  const shouldShowConditionalFields = formData.platform === 'meta' && formData.campaignObjective;

  // Handle destination change - reset CTA and destination URL when destination changes
  const handleDestinationChange = (value: string) => {
    updateFormData({ 
      destination: value,
      cta: '', // Reset CTA when destination changes
      destinationUrl: '' // Reset destination URL when destination changes
    });
  };

  if (!shouldShowConditionalFields) {
    // Legacy fields for non-Meta ads
    return (
      <>
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
            className={errors.destinationUrl ? 'border-red-500' : ''}
          />
          {errors.destinationUrl && (
            <p className="text-sm text-red-600">{errors.destinationUrl}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="callToAction">Call-to-Action *</Label>
          <Select value={formData.callToAction} onValueChange={(value) => updateFormData({ callToAction: value })}>
            <SelectTrigger className={errors.callToAction ? 'border-red-500' : ''}>
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
      </>
    );
  }

  // Meta ads conditional fields
  return (
    <>
      {/* Destino */}
      <div className="space-y-2">
        <Label htmlFor="destination">Destino *</Label>
        <Select value={formData.destination || ''} onValueChange={handleDestinationChange}>
          <SelectTrigger className={errors.destination ? 'border-red-500' : ''}>
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
            <SelectTrigger className={errors.cta ? 'border-red-500' : ''}>
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
            className={errors.destinationUrl ? 'border-red-500' : ''}
          />
          {errors.destinationUrl && (
            <p className="text-sm text-red-600">{errors.destinationUrl}</p>
          )}
        </div>
      )}
    </>
  );
};

export default DestinationSection;
