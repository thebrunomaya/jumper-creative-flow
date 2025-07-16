
import React from 'react';
import { Button } from '@/components/ui/button';
import { Instagram, Link, Play, Video, Camera, CheckCircle } from 'lucide-react';
import { ExistingPostData } from '@/types/creative';

interface UrlInputZoneProps {
  isValidating?: boolean;
  enabled: boolean;
  onUrlInputClick: () => void;
  existingPostData?: ExistingPostData;
}

const UrlInputZone: React.FC<UrlInputZoneProps> = ({
  isValidating = false,
  enabled,
  onUrlInputClick,
  existingPostData
}) => {
  // Get content type icon and label
  const getContentTypeInfo = (contentType?: string) => {
    switch (contentType) {
      case 'post':
        return { icon: Camera, label: 'Post' };
      case 'reel':
        return { icon: Play, label: 'Reel' };
      case 'igtv':
        return { icon: Video, label: 'IGTV' };
      default:
        return { icon: Instagram, label: 'Post' };
    }
  };

  if (!enabled) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <Instagram className="h-8 w-8 mx-auto" />
          </div>
          <p className="text-sm text-gray-500">Posicionamento desativado</p>
        </div>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-jumper-blue mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Validando URL...</p>
        </div>
      </div>
    );
  }

  // Show confirmation state when valid post is selected
  if (existingPostData && existingPostData.valid) {
    const { icon: ContentIcon, label } = getContentTypeInfo(existingPostData.contentType);
    
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-green-50 border border-green-200">
        <div className="text-center w-full">
          <div className="flex items-center justify-center mb-3">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <ContentIcon className="h-5 w-5 text-green-600" />
          </div>
          
          <div className="mb-3">
            <p className="text-sm font-medium text-green-800">
              {existingPostData.username ? (
                <>@{existingPostData.username} - {label}</>
              ) : (
                <>{label} selecionado</>
              )}
            </p>
            {existingPostData.postId && (
              <p className="text-xs text-green-600 mt-1">
                ID: {existingPostData.postId}
              </p>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onUrlInputClick}
            className="text-green-700 border-green-300 hover:bg-green-100"
          >
            Alterar publicação
          </Button>
        </div>
      </div>
    );
  }

  // Default selection state
  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="text-center">
        <div className="text-pink-500 mb-3">
          <Instagram className="h-8 w-8 mx-auto" />
        </div>
        <Button
          variant="outline"
          onClick={onUrlInputClick}
          className="mb-2"
        >
          <Instagram className="h-4 w-4 mr-2" />
          Selecionar Publicação
        </Button>
        <p className="text-xs text-gray-500">
          Cole o link da publicação do Instagram
        </p>
      </div>
    </div>
  );
};

export default UrlInputZone;
