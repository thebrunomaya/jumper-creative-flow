
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

    console.log('🚀 Iniciando submissão do criativo:', { 
      creativeType: formData.creativeType,
      client: formData.client,
      submissionId: options?.submissionId 
    });

    toast({
      title: "Salvando criativo...",
      description: "Processando arquivos e salvando submissão para aprovação.",
    });

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
        managerUserId: currentUser?.id,
        managerEmail: currentUser?.email,
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
      
      const { data, error } = await supabase.functions.invoke('j_ads_ingest_creative', {
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
        title: `Criativo salvo com sucesso!`,
        description: `ID: ${submissionId}. Aguardando aprovação do Admin para publicação no Notion.`,
      });

    } catch (error) {
      console.error('Error submitting creative:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = "Erro ao salvar criativo. Tente novamente.";
      
      if (error.message?.includes('CTA')) {
        errorMessage = "CTA inválido. Verifique se selecionou um valor válido.";
      } else if (error.message?.includes('Gerente') || error.message?.includes('Manager')) {
        errorMessage = "Erro na validação do gerente. Tente fazer logout e login novamente.";
      } else if (error.message?.includes('validation')) {
        errorMessage = "Erro de validação dos dados. Verifique todos os campos obrigatórios.";
      } else if (error.message?.includes('file') || error.message?.includes('upload')) {
        errorMessage = "Erro no processamento dos arquivos. Verifique os arquivos e tente novamente.";
      }
      
      toast({
        title: "Erro ao salvar",
        description: error.message || errorMessage,
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
