
import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadZoneProps {
  getRootProps: () => any;
  getInputProps: () => any;
  isDragActive: boolean;
  isValidating: boolean;
  dimensions: string;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  getRootProps,
  getInputProps,
  isDragActive,
  isValidating,
  dimensions
}) => {
  return (
    <div 
      {...getRootProps()}
      className={`flex-1 flex items-center justify-center cursor-pointer transition-all duration-200 ${
        isDragActive
        ? 'bg-blue-50 border-blue-200'
        : 'hover:bg-gray-50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="text-left space-y-4 p-8 w-full">
        <div className="flex items-center space-x-3">
          <Upload className="h-10 w-10 text-gray-400 flex-shrink-0" />
          <div className="text-left">
            <p className="text-lg font-medium text-jumper-text">
              {isDragActive 
              ? 'Solte o arquivo aqui' 
              : 'Clique ou arraste uma imagem/vídeo'
              }
            </p>
            <p className="text-sm text-gray-600 mt-1">
              JPG, PNG, MP4, MOV • {dimensions}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Máx: 30MB (imagens) / 4GB (vídeos)
            </p>
          </div>
        </div>
        {isValidating && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-jumper-blue"></div>
            <span className="text-sm text-jumper-blue">Validando...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadZone;
