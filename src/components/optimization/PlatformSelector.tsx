import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlatformSelectorProps {
  value: 'meta' | 'google';
  onChange: (value: 'meta' | 'google') => void;
  onEditPrompt: () => void;
}

export const PlatformSelector = ({ value, onChange, onEditPrompt }: PlatformSelectorProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Plataforma</label>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEditPrompt}
          className="h-6 w-6 p-0"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>
      
      <RadioGroup value={value} onValueChange={(v) => onChange(v as 'meta' | 'google')}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="meta" id="meta" />
          <Label htmlFor="meta" className="cursor-pointer">
            Meta Ads
          </Label>
        </div>
        <div className="flex items-center space-x-2 opacity-50">
          <RadioGroupItem value="google" id="google" disabled />
          <Label htmlFor="google" className="cursor-not-allowed">
            Google Ads (Em breve)
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};
