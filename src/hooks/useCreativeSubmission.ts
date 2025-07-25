
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

  const submitForm = async (formData: FormData, validateStep: (step: number) => boolean, toast: any) => {
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
        instagramUrl?: string;
      }> = [];

      if (formData.creativeType === 'existing-post' && formData.existingPost) {
        filesInfo.push({
          name: 'Instagram Post',
          type: 'existing-post',
          size: 0,
          instagramUrl: formData.existingPost.instagramUrl,
          variationIndex: 1
        });
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
              base64Data
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
              base64Data
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
              base64Data
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
              base64Data
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
            base64Data
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

      console.log('Submitting creative to Notion:', submissionData);
      
      const { data, error } = await supabase.functions.invoke('submit-creative', {
        body: submissionData
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Erro ao enviar criativo');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido ao enviar criativo');
      }

      console.log('✅ Creative successfully submitted:', data);

      setCreativeIds(data.creativeIds || []);
      setIsSubmitted(true);

      const creativeCount = data.totalCreatives || 1;
      const creativeIdsList = data.creativeIds?.join(', ') || '';

      toast({
        title: `${creativeCount} Criativo(s) enviado(s)!`,
        description: `IDs: ${creativeIdsList}. Registros criados no Notion com sucesso!`,
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
