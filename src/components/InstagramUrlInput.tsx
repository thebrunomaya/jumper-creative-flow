
import React, { useState, useCallback } from 'react';
import { ExistingPostData } from '@/types/creative';
import { validateInstagramUrl } from '@/utils/instagramValidation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Instagram, ExternalLink, X, Check } from 'lucide-react';

interface InstagramUrlInputProps {
  value?: ExistingPostData;
  onChange: (data?: ExistingPostData) => void;
  placeholder?: string;
}

const InstagramUrlInput: React.FC<InstagramUrlInputProps> = ({
  value,
  onChange,
  placeholder = "Cole aqui o link da publicação do Instagram"
}) => {
  const [inputValue, setInputValue] = useState(value?.instagramUrl || '');
  const [isValidating, setIsValidating] = useState(false);

  const handleUrlChange = useCallback(async (url: string) => {
    setInputValue(url);
    
    if (!url.trim()) {
      onChange(undefined);
      return;
    }

    setIsValidating(true);
    
    // Simulate a small delay for validation
    setTimeout(() => {
      const validatedData = validateInstagramUrl(url);
      onChange(validatedData);
      setIsValidating(false);
    }, 500);
  }, [onChange]);

  const handleClear = () => {
    setInputValue('');
    onChange(undefined);
  };

  const openInstagramUrl = () => {
    if (value?.instagramUrl) {
      window.open(value.instagramUrl, '_blank');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Instagram className="h-5 w-5 text-pink-500" />
        <span className="text-sm font-medium text-gray-700">URL da Publicação do Instagram</span>
      </div>
      
      <div className="relative">
        <Input
          type="url"
          value={inputValue}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={placeholder}
          className={`pr-10 ${
            value?.valid === false ? 'border-red-500' : 
            value?.valid === true ? 'border-green-500' : ''
          }`}
        />
        
        {inputValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Status and Actions */}
      {value && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isValidating ? (
              <Badge variant="outline" className="text-xs">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600 mr-1"></div>
                Validando...
              </Badge>
            ) : (
              <Badge 
                variant={value.valid ? "default" : "destructive"} 
                className="text-xs"
              >
                {value.valid ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    URL Válida
                  </>
                ) : (
                  'URL Inválida'
                )}
              </Badge>
            )}
          </div>
          
          {value.valid && (
            <Button
              variant="outline"
              size="sm"
              onClick={openInstagramUrl}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Abrir Post
            </Button>
          )}
        </div>
      )}

      {/* Errors */}
      {value?.errors && value.errors.length > 0 && (
        <div className="text-sm text-red-600">
          {value.errors.map((error, index) => (
            <div key={index} className="flex items-center space-x-1">
              <span>•</span>
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Post ID Display */}
      {value?.valid && value.postId && (
        <div className="text-xs text-gray-500">
          ID da Publicação: {value.postId}
        </div>
      )}
    </div>
  );
};

export default InstagramUrlInput;
