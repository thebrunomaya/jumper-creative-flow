
import metaAdsObjectives from '@/config/meta-ads-objectives.json';

export const getAvailableDestinations = (campaignObjective?: string, platform?: string) => {
  if (!campaignObjective || platform !== 'meta') {
    return [];
  }
  const objectiveConfig = metaAdsObjectives.objectiveMapping[campaignObjective];
  return objectiveConfig ? objectiveConfig.destinations : [];
};

export const getAvailableCTAs = (campaignObjective?: string, destination?: string, platform?: string) => {
  if (!campaignObjective || !destination || platform !== 'meta') {
    return [];
  }
  const destinations = getAvailableDestinations(campaignObjective, platform);
  const selectedDestination = destinations.find(dest => dest.value === destination);
  return selectedDestination ? selectedDestination.ctas : [];
};

export const getDestinationFieldConfig = (destination?: string, campaignObjective?: string, platform?: string) => {
  if (!destination || platform !== 'meta') {
    return null;
  }
  const destinations = getAvailableDestinations(campaignObjective, platform);
  const selectedDestination = destinations.find(dest => dest.value === destination);
  if (!selectedDestination || !selectedDestination.fieldType) {
    return null;
  }
  
  return {
    fieldType: selectedDestination.fieldType,
    label: metaAdsObjectives.fieldLabels[selectedDestination.fieldType]
  };
};

export const getInputType = (fieldType: string) => {
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
