
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface CarouselAspectRatioToggleProps {
  value: '1:1' | '4:5';
  onValueChange: (value: '1:1' | '4:5') => void;
}

const CarouselAspectRatioToggle: React.FC<CarouselAspectRatioToggleProps> = ({
  value,
  onValueChange
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-jumper-text">📐 Proporção do Carrossel</h3>
        <ToggleGroup 
          type="single" 
          value={value} 
          onValueChange={(newValue) => newValue && onValueChange(newValue as '1:1' | '4:5')}
          className="bg-white border border-gray-200 rounded-lg p-1"
        >
          <ToggleGroupItem 
            value="1:1" 
            className="data-[state=on]:bg-jumper-blue data-[state=on]:text-white px-4 py-2 text-sm font-medium"
          >
            1:1 (Feed)
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="4:5" 
            className="data-[state=on]:bg-jumper-blue data-[state=on]:text-white px-4 py-2 text-sm font-medium"
          >
            4:5 (Feed Móvel)
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Warning for 4:5 format */}
      {value === '4:5' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Atenção:</strong> Formato 4:5 pode não funcionar 100% em alguns posicionamentos (como Threads).
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CarouselAspectRatioToggle;
