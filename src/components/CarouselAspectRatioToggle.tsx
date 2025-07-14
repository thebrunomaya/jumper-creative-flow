
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📐</span>
            <h3 className="text-xl font-semibold text-foreground">Proporção do Carrossel</h3>
          </div>
          <p className="text-sm text-muted-foreground">Selecione a proporção ideal para o seu conteúdo</p>
        </div>
        
        <ToggleGroup 
          type="single" 
          value={value} 
          onValueChange={(newValue) => newValue && onValueChange(newValue as '1:1' | '4:5')}
          className="bg-muted border border-border rounded-lg p-1 shadow-sm"
        >
          <ToggleGroupItem 
            value="1:1" 
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm px-6 py-3 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground"
          >
            1:1 (Feed)
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="4:5" 
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm px-6 py-3 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground"
          >
            4:5 (Feed Móvel)
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Warning for 4:5 format */}
      {value === '4:5' && (
        <Alert className="border-warning bg-warning/10 shadow-sm">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-foreground">
            <strong className="text-warning">Atenção:</strong> Formato 4:5 pode não funcionar 100% em alguns posicionamentos (como Threads).
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CarouselAspectRatioToggle;
