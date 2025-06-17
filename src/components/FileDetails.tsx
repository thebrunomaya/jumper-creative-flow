
import React from 'react';
import { ValidatedFile } from '@/types/creative';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, AlertCircle, Image, Replace } from 'lucide-react';

interface FileDetailsProps {
  file: ValidatedFile;
  format: 'square' | 'vertical' | 'horizontal';
  onRemove: () => void;
  onReplace: () => void;
}

const FileDetails: React.FC<FileDetailsProps> = ({
  file,
  format,
  onRemove,
  onReplace
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 bg-white p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <Image className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <p className="text-lg font-semibold text-jumper-text truncate">
            {file.file.name}
          </p>
          {file.valid ? (
            <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReplace}
            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500 hover:bg-blue-50"
            title="Substituir arquivo"
          >
            <Replace className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
            title="Remover arquivo"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mb-4 flex items-center space-x-4 text-left">
        <span className="font-medium">{formatFileSize(file.file.size)}</span>
        {file.dimensions && (
          <span>{file.dimensions.width}×{file.dimensions.height}px</span>
        )}
        {file.duration && (
          <span>{file.duration}s</span>
        )}
      </div>
      
      <div className="space-y-2 text-left">
        {file.errors.map((error, errorIndex) => (
          <div 
            key={errorIndex}
            className={`text-sm font-medium flex items-center space-x-2 ${
              file.valid ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            <span className="flex-shrink-0">{file.valid ? '✓' : '✗'}</span>
            <span>{error}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileDetails;
