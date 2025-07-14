
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ValidatedFile } from '@/types/creative';
import { validateFile } from '@/utils/fileValidation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Upload, CheckCircle, AlertCircle, Image, Video } from 'lucide-react';

interface FileUploadProps {
  files: ValidatedFile[];
  onFilesChange: (files: ValidatedFile[]) => void;
  platform: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ files, onFilesChange, platform }) => {
  const [isValidating, setIsValidating] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsValidating(true);
    const newValidatedFiles: ValidatedFile[] = [];
    
    for (const file of acceptedFiles) {
      const validatedFile = await validateFile(file);
      newValidatedFiles.push(validatedFile);
    }
    
    onFilesChange([...files, ...newValidatedFiles]);
    setIsValidating(false);
  }, [files, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'video/*': ['.mp4', '.mov']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-jumper-blue bg-blue-50'
            : 'border-gray-300 hover:border-jumper-blue hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div>
            <p className="text-lg font-medium text-jumper-text">
              {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              JPG, PNG, MP4, MOV • Máx: 30MB (img) / 4GB (vídeo)
            </p>
          </div>
          {isValidating && (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-jumper-blue"></div>
              <span className="text-sm text-jumper-blue">Validando arquivos...</span>
            </div>
          )}
        </div>
      </div>

      {/* Specifications */}
      {platform === 'meta' && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-amber-800 mb-2">⚠️ Especificações Meta Ads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-amber-700">
              <div>🖼️ Feed: 1080x1080px</div>
              <div>📱 Stories: 1080x1920px</div>
              <div>🎬 Vídeo: 15-60s, MP4/MOV</div>
              <div>💾 Máx: 30MB (img) / 4GB (vid)</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-jumper-text">Arquivos Enviados ({files.length})</h3>
          {files.map((validatedFile, index) => (
            <Card key={index} className={`${validatedFile.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      {validatedFile.file.type.startsWith('image/') ? (
                        <Image className="h-8 w-8 text-blue-500" />
                      ) : (
                        <Video className="h-8 w-8 text-purple-500" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-jumper-text truncate">
                          {validatedFile.file.name}
                        </p>
                        {validatedFile.valid ? (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>
                          {formatFileSize(validatedFile.file.size)}
                          {validatedFile.dimensions && (
                            <span> • {validatedFile.dimensions.width}x{validatedFile.dimensions.height}px</span>
                          )}
                          {validatedFile.duration && (
                            <span> • {validatedFile.duration}s</span>
                          )}
                        </div>
                        
                        {/* Validation Messages */}
                        <div className="space-y-1">
                          {validatedFile.errors.map((error, errorIndex) => (
                            <div 
                              key={errorIndex}
                              className={`text-xs ${validatedFile.valid ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Preview for images */}
                    {validatedFile.preview && (
                      <div className="flex-shrink-0">
                        <img 
                          src={validatedFile.preview} 
                          alt="Preview" 
                          className="w-16 h-16 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
