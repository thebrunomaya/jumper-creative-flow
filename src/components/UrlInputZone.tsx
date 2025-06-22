
import React from 'react';
import { Button } from '@/components/ui/button';
import { Instagram, Link } from 'lucide-react';

interface UrlInputZoneProps {
  isValidating?: boolean;
  enabled: boolean;
  onUrlInputClick: () => void;
}

const UrlInputZone: React.FC<UrlInputZoneProps> = ({
  isValidating = false,
  enabled,
  onUrlInputClick
}) => {
  if (!enabled) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <Link className="h-8 w-8 mx-auto" />
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
          <p className="text-sm text-gray-600">Validando URL...</p>
        </div>
      </div>
    );
  }

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
          <Link className="h-4 w-4 mr-2" />
          Adicionar URL
        </Button>
        <p className="text-xs text-gray-500">
          Cole o link da publicação do Instagram
        </p>
      </div>
    </div>
  );
};

export default UrlInputZone;
