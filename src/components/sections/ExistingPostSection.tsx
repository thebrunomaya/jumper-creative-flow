
import React, { useState } from 'react';
import { FormData } from '@/types/creative';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import MediaCard from '@/components/MediaCard';
import InstagramUrlInput from '@/components/InstagramUrlInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
        <p className="text-gray-600">Impulsione uma publicação já existente no seu Instagram</p>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <strong>Como funciona:</strong> Cole o link de uma publicação do seu Instagram (post, reel ou IGTV) 
          que você deseja impulsionar como anúncio.
        </AlertDescription>
      </Alert>

      {/* MediaCard adaptado para URL */}
      <MediaCard
        title="Publicação do Instagram"
        format="square"
        dimensions="URL da publicação"
        file={undefined}
        onPreviewClick={() => {}}
        onUploadClick={handleUrlInputClick}
        onReplaceClick={handleUrlInputClick}
        onRemoveClick={() => handleUrlChange(undefined)}
        enabled={true}
        showHeader={true}
        getRootProps={() => ({})}
        getInputProps={() => ({})}
        isDragActive={false}
        isValidating={false}
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

      {/* Current URL Display */}
      {formData.existingPost && (
        <div className="bg-white border rounded-lg p-4">
          <InstagramUrlInput
            value={formData.existingPost}
            onChange={handleUrlChange}
          />
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">📋 Instruções</h3>
        <ul className="text-sm text-gray-600 space-y-1">
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
