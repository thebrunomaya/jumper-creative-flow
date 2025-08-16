
import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import ProgressBar from './ProgressBar';
import Breadcrumbs from './Breadcrumbs';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import Step4 from './steps/Step4';
import Success from './Success';
import CreativeNavigation from './CreativeNavigation';
import { JumperBackground } from '@/components/ui/jumper-background';
import { JumperCard, JumperCardContent } from '@/components/ui/jumper-card';
import { useNotionClients } from '@/hooks/useNotionData';
import { useCreativeForm } from '@/hooks/useCreativeForm';
import { useCreativeSubmission } from '@/hooks/useCreativeSubmission';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { validateFile } from '@/utils/fileValidation';
import { JumperPageLoading, JumperLoadingOverlay } from './ui/jumper-loading';

const STEP_LABELS = ['Básico', 'Arquivos', 'Conteúdo', 'Revisão'];

const CreativeSystem: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, message: '' });
  const { clients, loading: isLoadingClients } = useNotionClients();
  const [draftSubmissionId, setDraftSubmissionId] = useState<string | null>(() =>
    (typeof window !== 'undefined' ? sessionStorage.getItem('draftSubmissionId') : null)
  );
  
  const {
    formData,
    errors,
    updateFormData,
    resetForm,
    validateStep,
    toast
  } = useCreativeForm();

  const {
    isSubmitting,
    isSubmitted,
    creativeIds,
    submitForm,
    resetSubmission
  } = useCreativeSubmission();

  const { currentUser } = useAuth();
  
  // Extract draft ID from query string instead of route params
  const searchParams = new URLSearchParams(window.location.search);
  const routeSubmissionId = searchParams.get('draft');

  // Upload a single asset to Supabase Storage and return metadata for rehydration
  const uploadAsset = async (file: File, format: string) => {
    const originalName = file.name || `${format}`;
    const ext = originalName.includes('.') ? originalName.split('.').pop() : undefined;
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const user = currentUser?.id || 'anon';
    const subId = routeSubmissionId || 'new';
    const safeExt = ext ? `.${ext}` : '';
    const path = `drafts/${user}/${subId}/${ts}-${rand}-${format}${safeExt}`;

    const { error } = await supabase.storage
      .from('creative-files')
      .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from('creative-files').getPublicUrl(path);
    return {
      url: urlData.publicUrl,
      path,
      name: originalName,
      type: file.type,
      size: file.size,
      format,
    };
  };

  // Build savedMedia object by uploading all present files in the form with progress tracking
  const buildSavedMedia = async (onProgress?: (current: number, total: number, message: string) => void) => {
    const saved: any = {};
    let uploadedCount = 0;
    let totalFiles = 0;

    // Count total files first
    if (Array.isArray(formData.mediaVariations)) {
      formData.mediaVariations.forEach((v: any) => {
        if (v.squareFile?.file) totalFiles++;
        if (v.verticalFile?.file) totalFiles++;
        if (v.horizontalFile?.file) totalFiles++;
      });
    }
    if (Array.isArray((formData as any).carouselCards)) {
      (formData as any).carouselCards.forEach((c: any) => {
        if (c.file?.file) totalFiles++;
      });
    }

    if (Array.isArray(formData.mediaVariations) && formData.mediaVariations.length > 0) {
      const variations = await Promise.all(
        formData.mediaVariations.map(async (v: any) => {
          const entry: any = {
            id: v.id,
            squareEnabled: v.squareEnabled,
            verticalEnabled: v.verticalEnabled,
            horizontalEnabled: v.horizontalEnabled,
          };
          if (v.squareFile?.file) {
            onProgress?.(++uploadedCount, totalFiles, `Enviando arquivo quadrado ${v.id}...`);
            entry.square = await uploadAsset(v.squareFile.file, 'square');
          }
          if (v.verticalFile?.file) {
            onProgress?.(++uploadedCount, totalFiles, `Enviando arquivo vertical ${v.id}...`);
            entry.vertical = await uploadAsset(v.verticalFile.file, 'vertical');
          }
          if (v.horizontalFile?.file) {
            onProgress?.(++uploadedCount, totalFiles, `Enviando arquivo horizontal ${v.id}...`);
            entry.horizontal = await uploadAsset(v.horizontalFile.file, 'horizontal');
          }
          return entry;
        })
      );
      saved.mediaVariations = variations;
    }

    if (Array.isArray((formData as any).carouselCards) && (formData as any).carouselCards.length > 0) {
      const cards = await Promise.all(
        (formData as any).carouselCards.map(async (c: any) => {
          const entry: any = { id: c.id };
          if (c.file?.file) {
            const ratio = (formData.carouselAspectRatio || '1:1') === '1:1' ? 'carousel-1:1' : 'carousel-4:5';
            onProgress?.(++uploadedCount, totalFiles, `Enviando cartão ${c.id}...`);
            entry.asset = await uploadAsset(c.file.file, ratio);
          }
          // Preserve per-card custom fields without the heavy file
          if (c.customTitle) entry.customTitle = c.customTitle;
          if (c.customDescription) entry.customDescription = c.customDescription;
          if (c.customDestinationUrl) entry.customDestinationUrl = c.customDestinationUrl;
          if (c.customCta) entry.customCta = c.customCta;
          return entry;
        })
      );
      saved.carouselCards = cards;
      saved.carouselAspectRatio = formData.carouselAspectRatio || '1:1';
    }

    if ((formData as any).existingPost) {
      saved.existingPost = (formData as any).existingPost;
    }

    return saved;
  };

  // From savedMedia, reconstruct ValidatedFile objects and inject them back into formData
  async function rehydrateFilesFromSavedMedia(savedMedia: any, payload: any) {
    const newData: any = { ...payload };
    let hadFailures = false;

    if (Array.isArray(newData.mediaVariations) && Array.isArray(savedMedia.mediaVariations)) {
      const byId: Record<number, any> = {};
      savedMedia.mediaVariations.forEach((v: any) => { if (v?.id != null) byId[v.id] = v; });

      const rehydrated = await Promise.all(newData.mediaVariations.map(async (v: any) => {
        const savedV = byId[v.id];
        const result: any = {
          ...v,
          squareFile: undefined,
          verticalFile: undefined,
          horizontalFile: undefined,
        };

        if (savedV?.square?.url) {
          try {
            const res = await fetch(savedV.square.url);
            const blob = await res.blob();
            const f = new File([blob], savedV.square.name || `square-${v.id}`, { type: blob.type || savedV.square.type || 'application/octet-stream' });
            result.squareFile = await validateFile(f, 'square');
          } catch (e) {
            console.warn('Falha ao reidratar square', e);
            hadFailures = true;
          }
        }
        if (savedV?.vertical?.url) {
          try {
            const res = await fetch(savedV.vertical.url);
            const blob = await res.blob();
            const f = new File([blob], savedV.vertical.name || `vertical-${v.id}`, { type: blob.type || savedV.vertical.type || 'application/octet-stream' });
            result.verticalFile = await validateFile(f, 'vertical');
          } catch (e) {
            console.warn('Falha ao reidratar vertical', e);
            hadFailures = true;
          }
        }
        if (savedV?.horizontal?.url) {
          try {
            const res = await fetch(savedV.horizontal.url);
            const blob = await res.blob();
            const f = new File([blob], savedV.horizontal.name || `horizontal-${v.id}`, { type: blob.type || savedV.horizontal.type || 'application/octet-stream' });
            result.horizontalFile = await validateFile(f, 'horizontal');
          } catch (e) {
            console.warn('Falha ao reidratar horizontal', e);
            hadFailures = true;
          }
        }
        return result;
      }));

      newData.mediaVariations = rehydrated;
      updateFormData({ mediaVariations: rehydrated });
    }

    if (Array.isArray(newData.carouselCards) && Array.isArray(savedMedia.carouselCards)) {
      const byId: Record<number, any> = {};
      savedMedia.carouselCards.forEach((c: any) => { if (c?.id != null) byId[c.id] = c; });
      const ratio = (savedMedia.carouselAspectRatio || newData.carouselAspectRatio || '1:1') === '1:1' ? 'carousel-1:1' : 'carousel-4:5';

      const rehydratedCards = await Promise.all(newData.carouselCards.map(async (c: any) => {
        const savedC = byId[c.id];
        const result: any = { ...c, file: undefined };
        if (savedC?.asset?.url) {
          try {
            const res = await fetch(savedC.asset.url);
            const blob = await res.blob();
            const f = new File([blob], savedC.asset.name || `card-${c.id}`, { type: blob.type || savedC.asset.type || 'application/octet-stream' });
            result.file = await validateFile(f, ratio as any);
          } catch (e) {
            console.warn('Falha ao reidratar cartão', e);
            hadFailures = true;
          }
        }
        // restore custom fields if present
        if (savedC?.customTitle) result.customTitle = savedC.customTitle;
        if (savedC?.customDescription) result.customDescription = savedC.customDescription;
        if (savedC?.customDestinationUrl) result.customDestinationUrl = savedC.customDestinationUrl;
        if (savedC?.customCta) result.customCta = savedC.customCta;
        return result;
      }));

      newData.carouselCards = rehydratedCards;
      updateFormData({ carouselCards: rehydratedCards, carouselAspectRatio: savedMedia.carouselAspectRatio || newData.carouselAspectRatio });
    }

    if (hadFailures) {
      toast({
        title: 'Alguns arquivos não puderam ser reidratados',
        description: 'Eles foram ignorados. Se necessário, reenvie os arquivos.',
      });
    }
  }

  useEffect(() => {
    const loadDraft = async () => {
      if (!routeSubmissionId) return;
      
      setIsLoadingDraft(true);
      try {
        console.log('🔄 Carregando draft:', routeSubmissionId);
        // First try manager actions (for managers)
        let response = await supabase.functions.invoke('j_ads_manager_actions', {
          body: { action: 'get', submissionId: routeSubmissionId },
        });
        console.log('📥 Resposta manager_actions:', response);
        
        // If that fails, try admin actions (for admins)
        if (response.error || !response.data?.success) {
          console.log('⚠️ Manager actions falhou, tentando admin actions');
          response = await supabase.functions.invoke('j_ads_admin_actions', {
            body: { action: 'getSubmission', submissionId: routeSubmissionId },
          });
          console.log('📥 Resposta admin_actions:', response);
        }
        
        if (response.error || !response.data?.success) {
          toast({ title: 'Falha ao carregar criativo', description: response.data?.error || response.error?.message || 'Tente novamente.', variant: 'destructive' });
          return;
        }
        
        const item = response.data.item;
        console.log('📋 Item carregado:', item);
        if (item?.payload) {
          const payload = { ...item.payload };
          console.log('📦 Payload original:', payload);
          // 1) Ao retomar, mostrar apenas o nome digitado pelo usuário
          if (payload.managerInputName) {
            payload.creativeName = payload.managerInputName;
          }
          console.log('📝 Atualizando formData com:', payload);
          updateFormData(payload);
          // 2) Reidratar arquivos apenas quando necessário (no Step 2)
          if (payload.savedMedia && currentStep === 2) {
            await rehydrateFilesFromSavedMedia(payload.savedMedia, payload);
          }
        }
        if (item?.id) {
          setDraftSubmissionId(item.id);
          try { sessionStorage.setItem('draftSubmissionId', item.id); } catch (_) {}
        }
      } catch (e: any) {
        console.error('Erro ao carregar criativo:', e);
        toast({ title: 'Erro ao carregar criativo', description: e?.message || 'Tente novamente.', variant: 'destructive' });
      } finally {
        setIsLoadingDraft(false);
      }
    };
    loadDraft();
  }, [routeSubmissionId]);
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios para continuar",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    submitForm(formData, validateStep, toast, { submissionId: routeSubmissionId ?? undefined });
  };

  const handleSaveDraft = async () => {
    if (!formData.creativeName || !formData.creativeName.trim()) {
      toast({
        title: 'Antes de salvar o rascunho, defina um nome para o Criativo',
        variant: 'destructive',
      });
      return;
    }

    if (!currentUser?.id) {
      toast({
        title: 'Sessão expirada',
        description: 'Faça login novamente para salvar o rascunho.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSavingDraft(true);
      setUploadProgress({ current: 0, total: 0, message: 'Preparando upload...' });

      // 1) Enviar arquivos para o Storage e montar savedMedia com progresso
      const savedMedia = await buildSavedMedia((current, total, message) => {
        setUploadProgress({ current, total, message });
      });

      // 2) Montar um payload leve, sem objetos File, para salvar como rascunho
      const draftPayload: any = { ...formData, savedMedia };
      draftPayload.files = [];
      draftPayload.validatedFiles = [];
      if (Array.isArray(draftPayload.mediaVariations)) {
        draftPayload.mediaVariations = draftPayload.mediaVariations.map((v: any) => ({
          id: v.id,
          squareEnabled: v.squareEnabled,
          verticalEnabled: v.verticalEnabled,
          horizontalEnabled: v.horizontalEnabled,
        }));
      }
      if (Array.isArray(draftPayload.carouselCards)) {
        draftPayload.carouselCards = draftPayload.carouselCards.map((c: any) => ({
          id: c.id,
          customTitle: c.customTitle,
          customDescription: c.customDescription,
          customDestinationUrl: c.customDestinationUrl,
          customCta: c.customCta,
        }));
      }

      setUploadProgress({ current: 0, total: 0, message: 'Salvando no servidor...' });
      let response = await supabase.functions.invoke('j_ads_manager_actions', {
        body: {
          action: 'saveDraft',
          submissionId: routeSubmissionId ?? undefined,
          draft: draftPayload,
        },
      });

      // If manager endpoint fails, try admin endpoint
      if (response.error || !response.data?.success) {
        response = await supabase.functions.invoke('j_ads_admin_actions', {
          body: {
            action: 'saveDraft',
            submissionId: routeSubmissionId ?? undefined,
            draft: draftPayload,
          },
        });
      }

      if (response.error || !response.data?.success) {
        throw new Error(response.error?.message || response.data?.error || 'Falha ao salvar rascunho');
      }

      const data = response.data;

      if (data?.submissionId) {
        setDraftSubmissionId(data.submissionId);
        try { sessionStorage.setItem('draftSubmissionId', data.submissionId); } catch (_) {}
      }

      toast({
        title: 'Rascunho salvo',
        description: data?.creativeName || formData.creativeName || 'Rascunho atualizado.',
      });
    } catch (err: any) {
      console.error('Erro ao salvar rascunho:', err);
      toast({
        title: 'Erro ao salvar rascunho',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDraft(false);
      setUploadProgress({ current: 0, total: 0, message: '' });
    }
  };

  const handleReset = () => {
    resetForm();
    resetSubmission();
    setCurrentStep(1);
    setDraftSubmissionId(null);
    try { sessionStorage.removeItem('draftSubmissionId'); } catch (_) {}
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1">
          <Success creativeIds={creativeIds} onNewCreative={handleReset} />
        </div>
        <Footer />
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 flex-1">
        <ProgressBar 
          currentStep={currentStep} 
          totalSteps={4} 
          stepLabels={STEP_LABELS} 
        />

        <JumperCard className="shadow-lg border border-border/20 bg-card/80 backdrop-blur-sm mb-6">
          <JumperCardContent className="p-6 md:p-8">
            <Breadcrumbs 
              formData={formData}
              clients={clients}
            />
            
            {currentStep === 1 && (
              <Step1 
                formData={formData} 
                updateFormData={updateFormData} 
                errors={errors} 
              />
            )}
            
            {currentStep === 2 && (
              <Step2 
                formData={formData} 
                updateFormData={updateFormData} 
                errors={errors} 
              />
            )}
            
            {currentStep === 3 && (
              <Step3 
                formData={formData} 
                updateFormData={updateFormData} 
                errors={errors} 
              />
            )}
            
            {currentStep === 4 && (
              <Step4 
                formData={formData} 
                isSubmitting={isSubmitting} 
              />
            )}
          </JumperCardContent>
        </JumperCard>

        <CreativeNavigation
          currentStep={currentStep}
          onPrevStep={prevStep}
          onNextStep={nextStep}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          isSubmitting={isSubmitting}
        />
      </div>
      
      <Footer />
      
      {/* Loading overlay - appears on top when loading */}
      {(isLoadingDraft || isSavingDraft) && (
        <JumperLoadingOverlay 
          message={
            isLoadingDraft 
              ? "Carregando dados do criativo..." 
              : uploadProgress.total > 0 
                ? `${uploadProgress.message} (${uploadProgress.current}/${uploadProgress.total})`
                : uploadProgress.message || "Salvando rascunho..."
          } 
        />
      )}
    </div>
  );
};

export default CreativeSystem;
