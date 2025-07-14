
import React from 'react';
import { JumperButton } from './ui/jumper-button';
import { JumperCard, JumperCardContent } from './ui/jumper-card';
import { CheckCircle2, Plus } from 'lucide-react';

interface SuccessProps {
  creativeIds: string[];
  onNewCreative: () => void;
}

const Success: React.FC<SuccessProps> = ({ creativeIds, onNewCreative }) => {
  const creativeCount = creativeIds.length;
  const isMultiple = creativeCount > 1;

  return (
    <JumperCard className="shadow-lg text-center">
      <JumperCardContent className="p-8">
        <div className="mb-6">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            🎉 {isMultiple ? 'Criativos Enviados' : 'Criativo Enviado'} com Sucesso!
          </h1>
          <p className="text-muted-foreground">
            {isMultiple 
              ? `${creativeCount} criativos foram criados e enviados para aprovação.`
              : 'Seu criativo foi enviado para aprovação.'
            }
          </p>
        </div>

        <div className="bg-muted rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {isMultiple ? 'IDs dos Criativos:' : 'ID do Criativo:'}
          </h2>
          <div className="space-y-2">
            {creativeIds.map((id, index) => (
              <div key={id} className="flex items-center justify-center space-x-2">
                <span className="text-2xl font-mono font-bold text-jumper-orange">
                  {id}
                </span>
                {isMultiple && (
                  <span className="text-sm text-muted-foreground">
                    (Variação {index + 1})
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {isMultiple 
              ? 'Guarde estes IDs para acompanhar o status dos seus criativos'
              : 'Guarde este ID para acompanhar o status do seu criativo'
            }
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground max-w-md mx-auto">
            {isMultiple 
              ? `Seus ${creativeCount} criativos estão sendo analisados pela equipe. Você receberá uma notificação quando estiverem prontos.`
              : 'Seu criativo está sendo analisado pela equipe. Você receberá uma notificação quando estiver pronto.'
            }
          </p>
          
          <JumperButton
            variant="primary"
            onClick={onNewCreative}
            className="flex items-center space-x-2 mx-auto px-8"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Criativo</span>
          </JumperButton>
        </div>
      </JumperCardContent>
    </JumperCard>
  );
};

export default Success;
