
import { useState } from 'react';
import { FormData } from '@/types/creative';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useCreativeSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [creativeIds, setCreativeIds] = useState<string[]>([]);
  const { currentUser } = useAuth();

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const submitForm = async (formData: FormData, validateStep: (step: number) => boolean, toast: any, options?: { submissionId?: string }) => {
    if (!validateStep(3)) {
      toast({
        title: "Erro na validação",
        description: "Corrija os erros antes de enviar",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const filesInfo: Array<{
        name: string;
        type: string;
        size: number;
        format?: string;
        variationIndex?: number;
        base64Data?: string;
        url?: string;
        instagramUrl?: string;
      }> = [];

      const savedMedia = (formData as any).savedMedia;

      if (formData.creativeType === 'existing-post' && formData.existingPost) {
        filesInfo.push({
          name: 'Instagram Post',
          type: 'existing-post',
          size: 0,
          instagramUrl: formData.existingPost.instagramUrl,
          variationIndex: 1,
        });
      } else if (savedMedia && formData.creativeType === 'carousel' && Array.isArray(savedMedia.carouselCards)) {
        const ratio = savedMedia.carouselAspectRatio || formData.carouselAspectRatio || '1:1';
        const format = ratio === '1:1' ? 'carousel-1:1' : 'carousel-4:5';
        for (const card of savedMedia.carouselCards) {
          const asset = card?.asset;
          if (asset?.url) {
            filesInfo.push({
              name: asset.name || 'carousel-card',
              type: asset.type || 'application/octet-stream',
              size: asset.size || 0,
              format,
              variationIndex: 1,
              url: asset.url,
            });
          }
        }
      } else if (savedMedia && formData.creativeType === 'single' && Array.isArray(savedMedia.mediaVariations)) {
        for (let i = 0; i < savedMedia.mediaVariations.length; i++) {
          const v = savedMedia.mediaVariations[i];
          const variationIndex = (v?.id && Number.isFinite(v.id)) ? v.id : i + 1;

          if (v?.square?.url) {
            filesInfo.push({
              name: v.square.name || 'square',
              type: v.square.type || 'application/octet-stream',
              size: v.square.size || 0,
              format: 'square',
              variationIndex,
              url: v.square.url,
            });
          }
          if (v?.vertical?.url) {
            filesInfo.push({
              name: v.vertical.name || 'vertical',
              type: v.vertical.type || 'application/octet-stream',
              size: v.vertical.size || 0,
              format: 'vertical',
              variationIndex,
              url: v.vertical.url,
            });
          }
          if (v?.horizontal?.url) {
            filesInfo.push({
              name: v.horizontal.name || 'horizontal',
              type: v.horizontal.type || 'application/octet-stream',
              size: v.horizontal.size || 0,
              format: 'horizontal',
              variationIndex,
              url: v.horizontal.url,
            });
          }
        }
      } else if (formData.creativeType === 'carousel' && formData.carouselCards) {
        for (const card of formData.carouselCards) {
          if (card.file) {
            const base64Data = await convertFileToBase64(card.file.file);
            filesInfo.push({
              name: card.file.file.name,
              type: card.file.file.type,
              size: card.file.file.size,
              format: `carousel-${formData.carouselAspectRatio}`,
              variationIndex: 1,
              base64Data,
            });
          }
        }
      } else if (formData.creativeType === 'single' && formData.mediaVariations) {
        for (const variation of formData.mediaVariations) {
          const index = formData.mediaVariations.indexOf(variation);

          if (variation.squareFile) {
            const base64Data = await convertFileToBase64(variation.squareFile.file);
            filesInfo.push({
              name: variation.squareFile.file.name,
              type: variation.squareFile.file.type,
              size: variation.squareFile.file.size,
              format: 'square',
              variationIndex: index + 1,
              base64Data,
            });
          }
          if (variation.verticalFile) {
            const base64Data = await convertFileToBase64(variation.verticalFile.file);
            filesInfo.push({
              name: variation.verticalFile.file.name,
              type: variation.verticalFile.file.type,
              size: variation.verticalFile.file.size,
              format: 'vertical',
              variationIndex: index + 1,
              base64Data,
            });
          }
          if (variation.horizontalFile) {
            const base64Data = await convertFileToBase64(variation.horizontalFile.file);
            filesInfo.push({
              name: variation.horizontalFile.file.name,
              type: variation.horizontalFile.file.type,
              size: variation.horizontalFile.file.size,
              format: 'horizontal',
              variationIndex: index + 1,
              base64Data,
            });
          }
        }
      } else {
        for (const file of formData.validatedFiles) {
          const base64Data = await convertFileToBase64(file.file);
          filesInfo.push({
            name: file.file.name,
            type: file.file.type,
            size: file.file.size,
            variationIndex: 1,
            base64Data,
          });
        }
      }

      const submissionData = {
        client: formData.client,
        managerId: currentUser?.id,
        partner: formData.partner,
        platform: formData.platform,
        campaignObjective: formData.campaignObjective,
        creativeName: formData.creativeName,
        creativeType: formData.creativeType,
        objective: formData.objective,
        mainTexts: formData.creativeType === 'existing-post' ? [''] : (formData.mainTexts || ['']),
        titles: formData.creativeType === 'existing-post' ? [''] : (formData.titles || ['']),
        description: formData.creativeType === 'existing-post' ? '' : formData.description,
        destination: formData.destination,
        cta: formData.cta,
        destinationUrl: formData.destinationUrl,
        callToAction: formData.callToAction,
        observations: formData.observations,
        existingPost: formData.existingPost,
        filesInfo
      };

      console.log('Ingesting creative submission:', submissionData);
      
      const { data, error } = await supabase.functions.invoke('ingest-creative', {
        body: { ...submissionData, submissionId: options?.submissionId }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Erro ao salvar criativo');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido ao salvar criativo');
      }

      console.log('✅ Creative successfully ingested:', data);

      setCreativeIds(data.submissionId ? [data.submissionId] : []);
      setIsSubmitted(true);

      const submissionId = data.submissionId || '';

      toast({
        title: `Submissão salva com sucesso!`,
        description: `ID: ${submissionId}. O envio para o Notion será processado posteriormente.`,
      });

    } catch (error) {
      console.error('Error submitting creative:', error);
      toast({
        title: "Erro no envio",
        description: error.message || "Erro ao enviar para o Notion. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSubmission = () => {
    setIsSubmitted(false);
    setCreativeIds([]);
    setIsSubmitting(false);
  };

  return {
    isSubmitting,
    isSubmitted,
    creativeIds,
    submitForm,
    resetSubmission
  };
};
