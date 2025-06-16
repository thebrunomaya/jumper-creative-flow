
import React from 'react';
import { Button } from './ui/button';
import { CheckCircle2, Plus } from 'lucide-react';

interface SuccessProps {
  creativeIds: string[];
  onNewCreative: () => void;
}

const Success: React.FC<SuccessProps> = ({ creativeIds, onNewCreative }) => {
  const creativeCount = creativeIds.length;
  const isMultiple = creativeCount > 1;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="mb-6">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎉 {isMultiple ? 'Criativos Enviados' : 'Criativo Enviado'} com Sucesso!
        </h1>
        <p className="text-gray-600">
          {isMultiple 
            ? `${creativeCount} criativos foram criados e enviados para aprovação.`
            : 'Seu criativo foi enviado para aprovação.'
          }
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isMultiple ? 'IDs dos Criativos:' : 'ID do Criativo:'}
        </h2>
        <div className="space-y-2">
          {creativeIds.map((id, index) => (
            <div key={id} className="flex items-center justify-center space-x-2">
              <span className="text-2xl font-mono font-bold text-jumper-blue">
                {id}
              </span>
              {isMultiple && (
                <span className="text-sm text-gray-500">
                  (Variação {index + 1})
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-4">
          {isMultiple 
            ? 'Guarde estes IDs para acompanhar o status dos seus criativos'
            : 'Guarde este ID para acompanhar o status do seu criativo'
          }
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-gray-600 max-w-md mx-auto">
          {isMultiple 
            ? `Seus ${creativeCount} criativos estão sendo analisados pela equipe. Você receberá uma notificação quando estiverem prontos.`
            : 'Seu criativo está sendo analisado pela equipe. Você receberá uma notificação quando estiver pronto.'
          }
        </p>
        
        <Button
          onClick={onNewCreative}
          className="bg-gradient-jumper hover:opacity-90 transition-opacity flex items-center space-x-2 mx-auto px-8"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Criativo</span>
        </Button>
      </div>
    </div>
  );
};

export default Success;
