/**
 * TagSelector - Interface for tagging RADAR optimizations
 *
 * Features:
 * - 5 tabs (R-A-D-A-R) with keyboard navigation
 * - Multi-select (checkboxes) and single-select (radio buttons)
 * - Required fields validation (visual warnings only, not blocking)
 * - Auto-save on changes
 * - Color-coded tags from schema
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { JumperButton } from '@/components/ui/jumper-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TAGS_SCHEMA, RADAR_SECTIONS_ORDER, validateTags } from '@/config/tagsSchema';
import { RadarTags, getMissingFields } from '@/types/radarTags';
import { AlertCircle, Save, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TagSelectorProps {
  recordingId: string;
  currentTags: RadarTags;
  onSave: (tags: RadarTags) => Promise<void>;
  onTagsChanged?: (tags: RadarTags) => void;
}

export function TagSelector({ recordingId, currentTags, onSave, onTagsChanged }: TagSelectorProps) {
  const [tags, setTags] = useState<RadarTags>(currentTags);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Validate tags
  const validation = validateTags(tags);
  const missingFields = getMissingFields(tags);

  // Update local state when props change
  useEffect(() => {
    setTags(currentTags);
    setHasChanges(false);
  }, [currentTags]);

  // Notify parent of changes
  useEffect(() => {
    if (onTagsChanged && hasChanges) {
      onTagsChanged(tags);
    }
  }, [tags, hasChanges, onTagsChanged]);

  // Handle single-select change
  function handleSingleSelect(sectionKey: string, categoryKey: string, value: string) {
    setTags((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey as keyof RadarTags],
        [categoryKey]: value,
      },
    }));
    setHasChanges(true);
  }

  // Handle multi-select change
  function handleMultiSelect(sectionKey: string, categoryKey: string, value: string, checked: boolean) {
    setTags((prev) => {
      const sectionData = prev[sectionKey as keyof RadarTags] as any;
      const currentArray = (sectionData[categoryKey] || []) as string[];

      const newArray = checked
        ? [...currentArray, value] // Add value
        : currentArray.filter((v) => v !== value); // Remove value

      return {
        ...prev,
        [sectionKey]: {
          ...sectionData,
          [categoryKey]: newArray,
        },
      };
    });
    setHasChanges(true);
  }

  // Handle save
  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave(tags);
      setHasChanges(false);
      toast.success('Tags salvas com sucesso!');
    } catch (error) {
      console.error('Error saving tags:', error);
      toast.error('Erro ao salvar tags');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Validation Warning */}
      {!validation.isComplete && (
        <Alert variant="default" className="border-orange-500/50 bg-orange-500/10">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-sm">
            <strong>Tags sugeridas pendentes:</strong>
            <ul className="mt-2 space-y-1">
              {missingFields.map((field, idx) => (
                <li key={idx} className="text-xs">
                  • {field}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Você pode salvar mesmo sem preencher todas as tags, mas recomendamos completar para melhor organização.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for R-A-D-A-R sections */}
      <Tabs defaultValue="registro" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {RADAR_SECTIONS_ORDER.map((sectionKey) => {
            const section = TAGS_SCHEMA[sectionKey];
            const letter = section.label[0]; // R, A, D, A, R
            const requiredCategories = section.categories.filter((cat) => cat.required);
            const hasMissing = requiredCategories.some((cat) => {
              const value = (tags[sectionKey as keyof RadarTags] as any)?.[cat.key];
              if (cat.multi_select) {
                return !value || !Array.isArray(value) || value.length === 0;
              } else {
                return value === null || value === undefined;
              }
            });

            return (
              <TabsTrigger key={sectionKey} value={sectionKey} className="relative">
                {letter}
                {hasMissing && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-500" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {RADAR_SECTIONS_ORDER.map((sectionKey) => {
          const section = TAGS_SCHEMA[sectionKey];

          return (
            <TabsContent key={sectionKey} value={sectionKey} className="space-y-6 mt-6">
              {/* Section Header */}
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{section.label}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>

              {/* No tags message for DIAGNÓSTICO */}
              {section.categories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Esta seção não possui tags - apenas texto livre no RADAR
                </div>
              )}

              {/* Render categories */}
              {section.categories.map((category) => (
                <div key={category.key} className="space-y-3">
                  <Label className="text-base">
                    {category.name}
                    {category.required && <span className="text-orange-500 ml-1">*</span>}
                  </Label>

                  {category.multi_select ? (
                    // Multi-select: Checkboxes
                    <div className="space-y-2">
                      {category.options.map((option) => {
                        const currentValues = ((tags[sectionKey as keyof RadarTags] as any)?.[category.key] || []) as string[];
                        const isChecked = currentValues.includes(option.value);

                        return (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${sectionKey}-${category.key}-${option.value}`}
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                handleMultiSelect(sectionKey, category.key, option.value, checked as boolean)
                              }
                            />
                            <Label
                              htmlFor={`${sectionKey}-${category.key}-${option.value}`}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Badge
                                variant="outline"
                                style={{
                                  borderColor: option.color,
                                  backgroundColor: isChecked ? `${option.color}20` : 'transparent',
                                }}
                              >
                                {option.label}
                              </Badge>
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Single-select: Radio buttons
                    <RadioGroup
                      value={((tags[sectionKey as keyof RadarTags] as any)?.[category.key] as string) || ''}
                      onValueChange={(value) => handleSingleSelect(sectionKey, category.key, value)}
                    >
                      {category.options.map((option) => {
                        const isSelected = ((tags[sectionKey as keyof RadarTags] as any)?.[category.key] as string) === option.value;

                        return (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={option.value}
                              id={`${sectionKey}-${category.key}-${option.value}`}
                            />
                            <Label
                              htmlFor={`${sectionKey}-${category.key}-${option.value}`}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Badge
                                variant="outline"
                                style={{
                                  borderColor: option.color,
                                  backgroundColor: isSelected ? `${option.color}20` : 'transparent',
                                }}
                              >
                                {option.label}
                              </Badge>
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  )}
                </div>
              ))}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {hasChanges ? (
            <span className="text-orange-500">• Alterações não salvas</span>
          ) : (
            <span className="flex items-center gap-1 text-green-600">
              <Check className="h-3 w-3" />
              Salvo
            </span>
          )}
        </div>

        <JumperButton onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving ? (
            <>Salvando...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Tags
            </>
          )}
        </JumperButton>
      </div>
    </div>
  );
}
