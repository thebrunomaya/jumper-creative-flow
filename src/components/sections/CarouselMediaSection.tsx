
import React from 'react';
import { FormData, ValidatedFile, CarouselCard, CAROUSEL_LIMITS } from '@/types/creative';
import CarouselAspectRatioToggle from '@/components/CarouselAspectRatioToggle';
import CarouselCardUpload from '@/components/CarouselCardUpload';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertTriangle } from 'lucide-react';

interface CarouselMediaSectionProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const CarouselMediaSection: React.FC<CarouselMediaSectionProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  // Initialize carousel data if not exists
  const carouselAspectRatio = formData.carouselAspectRatio || '1:1';
  const carouselCards = formData.carouselCards || [{
    id: 1
  }, {
    id: 2
  }];

  const updateCarouselAspectRatio = (ratio: '1:1' | '4:5') => {
    updateFormData({
      carouselAspectRatio: ratio,
      // Revalidate all existing files when aspect ratio changes
      carouselCards: carouselCards.map(card => ({
        ...card,
        file: undefined // Clear files to force revalidation
      }))
    });
  };

  const updateCarouselCards = (cards: CarouselCard[]) => {
    updateFormData({
      carouselCards: cards
    });
  };

  const addCard = () => {
    if (carouselCards.length < CAROUSEL_LIMITS.maxCards) {
      const newCards = [...carouselCards, {
        id: Math.max(...carouselCards.map(c => c.id)) + 1
      }];
      updateCarouselCards(newCards);
    }
  };

  const removeCard = (id: number) => {
    if (carouselCards.length > CAROUSEL_LIMITS.minCards) {
      const newCards = carouselCards.filter(c => c.id !== id);
      updateCarouselCards(newCards);
    }
  };

  const updateCardFile = (cardId: number, file?: ValidatedFile) => {
    const newCards = carouselCards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          file
        };
      }
      return card;
    });
    updateCarouselCards(newCards);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-jumper-text mb-2">🎠 Upload do Carrossel</h2>
        <p className="text-gray-600">Configure a proporção e envie as imagens para cada cartão</p>
      </div>

      {/* Aspect Ratio Toggle */}
      <CarouselAspectRatioToggle 
        value={carouselAspectRatio} 
        onValueChange={updateCarouselAspectRatio} 
      />

      {/* Carousel Cards */}
      <div className="space-y-6">
        {carouselCards.map((card, index) => (
          <CarouselCardUpload
            key={card.id}
            card={card}
            aspectRatio={carouselAspectRatio}
            onFileChange={(file) => updateCardFile(card.id, file)}
            onRemove={index >= 2 ? () => removeCard(card.id) : undefined}
            canRemove={index >= 2}
            cardNumber={index + 1}
          />
        ))}
      </div>

      {/* Add Card Button */}
      {carouselCards.length < CAROUSEL_LIMITS.maxCards && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={addCard}
            className="bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 hover:border-jumper-blue transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Cartão ({carouselCards.length}/{CAROUSEL_LIMITS.maxCards})
          </Button>
        </div>
      )}

      {/* Validation Errors */}
      {errors.files && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-600">{errors.files}</p>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">Dica para Carrossel</p>
            <p className="text-sm text-blue-700">
              • Mínimo {CAROUSEL_LIMITS.minCards} cartões, máximo {CAROUSEL_LIMITS.maxCards} cartões<br />
              • Cada cartão deve ter pelo menos 1 arquivo válido na proporção selecionada<br />
              • Imagens: máx 30MB | Vídeos: máx 4GB, duração 1s-240min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarouselMediaSection;
