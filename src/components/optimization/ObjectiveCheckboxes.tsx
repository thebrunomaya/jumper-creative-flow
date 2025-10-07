import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ObjectiveCheckboxesProps {
  availableObjectives: string[];
  selectedObjectives: string[];
  notionObjectives: string[];
  onChange: (objectives: string[]) => void;
  onEditPrompt: (objective: string) => void;
}

export const ObjectiveCheckboxes = ({
  availableObjectives,
  selectedObjectives,
  notionObjectives,
  onChange,
  onEditPrompt,
}: ObjectiveCheckboxesProps) => {
  const handleToggle = (objective: string) => {
    if (selectedObjectives.includes(objective)) {
      onChange(selectedObjectives.filter((o) => o !== objective));
    } else {
      onChange([...selectedObjectives, objective]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Objetivos da Conta ({selectedObjectives.length} de {notionObjectives.length} selecionados)
        </label>
      </div>

      {notionObjectives.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum objetivo configurado para esta conta no Notion.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {notionObjectives.map((objective) => {
            return (
              <div
                key={objective}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-2 flex-1">
                  <Checkbox
                    id={`obj-${objective}`}
                    checked={selectedObjectives.includes(objective)}
                    onCheckedChange={() => handleToggle(objective)}
                  />
                  <Label
                    htmlFor={`obj-${objective}`}
                    className="cursor-pointer text-sm flex-1"
                  >
                    {objective}
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditPrompt(objective)}
                  className="h-6 w-6 p-0"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
