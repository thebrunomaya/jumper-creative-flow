
import React, { useState } from 'react';
import { FormData } from '@/types/creative';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import MediaCard from '@/components/MediaCard';
import InstagramUrlInput from '@/components/InstagramUrlInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ExistingPostSectionProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const ExistingPostSection: React.FC<ExistingPostSectionProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);

  const handleUrlInputClick = () => {
    setUrlDialogOpen(true);
  };

  const handleUrlChange = (existingPost) => {
    updateFormData({ existingPost });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-jumper-text mb-2">📱 Publicação Existente</h2>
        <p className="text-muted-foreground">Impulsione uma publicação já existente no seu Instagram</p>
      </div>

      {/* Info Alert */}
      <Alert className="border-accent-border bg-accent-subtle/10">
        <Info className="h-4 w-4 text-accent-subtle" />
        <AlertDescription className="text-accent-subtle">
          <strong>Como funciona:</strong> Cole o link de uma publicação do seu Instagram (post, reel ou IGTV) 
          que você deseja impulsionar como anúncio.
        </AlertDescription>
      </Alert>

      {/* MediaCard adaptado para URL */}
      <MediaCard
        title="Publicação do Instagram"
        format="square"
        dimensions="Publicação do Instagram"
        file={undefined}
        onPreviewClick={() => {
          if (formData.existingPost?.instagramUrl) {
            window.open(formData.existingPost.instagramUrl, '_blank');
          }
        }}
        onUploadClick={handleUrlInputClick}
        onReplaceClick={handleUrlInputClick}
        onRemoveClick={() => handleUrlChange(undefined)}
        enabled={true}
        showHeader={true}
        getRootProps={() => ({})}
        getInputProps={() => ({})}
        isDragActive={false}
        isValidating={false}
        urlMode={true}
        existingPostData={formData.existingPost}
      />

      {/* URL Input Dialog */}
      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar URL da Publicação</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <InstagramUrlInput
              value={formData.existingPost}
              onChange={(data) => {
                handleUrlChange(data);
                if (data?.valid) {
                  setUrlDialogOpen(false);
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Display */}
      {errors.existingPost && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errors.existingPost}</AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-2">📋 Instruções</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Abra o Instagram e encontre a publicação que deseja impulsionar</li>
          <li>• Toque nos três pontos (...) da publicação</li>
          <li>• Selecione "Copiar link"</li>
          <li>• Cole o link no campo acima</li>
        </ul>
      </div>
    </div>
  );
};

export default ExistingPostSection;
