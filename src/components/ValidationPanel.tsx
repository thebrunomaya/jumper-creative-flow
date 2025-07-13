import React from 'react';
import { XCircle } from 'lucide-react';

interface ValidationPanelProps {
  errors: Record<string, string>;
}

const getFieldLabel = (field: string): string => {
  const fieldLabels: Record<string, string> = {
    client: 'Cliente',
    platform: 'Plataforma',
    campaignObjective: 'Objetivo da campanha',
    creativeType: 'Tipo de anúncio',
    creativeName: 'Nome do criativo',
    files: 'Arquivos/Mídia',
    existingPost: 'URL da publicação',
    destination: 'Destino',
    destinationUrl: 'URL de destino',
    cta: 'Call-to-Action',
    callToAction: 'Call-to-Action',
    description: 'Descrição',
    observations: 'Observações'
  };

  // Handle dynamic field names like title-0, mainText-1, etc.
  if (field.includes('-')) {
    const [baseField, index] = field.split('-');
    const indexNum = parseInt(index) + 1;
    
    if (baseField === 'title') {
      return `Título #${indexNum}`;
    }
    if (baseField === 'mainText') {
      return `Texto Principal #${indexNum}`;
    }
  }

  return fieldLabels[field] || field;
};

const ValidationPanel: React.FC<ValidationPanelProps> = ({ errors }) => {
  if (!errors || Object.keys(errors).length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
      <div className="flex items-center space-x-2 mb-3">
        <XCircle className="h-5 w-5 text-destructive" />
        <h4 className="font-semibold text-destructive">Campos obrigatórios pendentes</h4>
      </div>
      <p className="text-sm text-destructive/80 mb-3">
        Corrija os seguintes problemas para continuar:
      </p>
      <ul className="space-y-1">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field} className="flex items-start space-x-2 text-sm text-destructive/90">
            <span className="text-destructive mt-0.5">•</span>
            <span>
              <strong>{getFieldLabel(field)}:</strong> {error}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ValidationPanel;