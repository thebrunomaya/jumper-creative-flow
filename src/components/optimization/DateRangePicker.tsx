import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

export interface DateRangePickerProps {
  value: { start: Date; end: Date };
  compareValue?: { start: Date; end: Date } | null;
  onChange: (range: { start: Date; end: Date }) => void;
  onCompareChange?: (range: { start: Date; end: Date } | null) => void;
  showCompare?: boolean;
  onClose?: () => void;
  onApply?: () => void;
}

type PresetKey =
  | "today"
  | "yesterday"
  | "today_yesterday"
  | "last_7_days"
  | "last_14_days"
  | "last_28_days"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month";

interface DatePreset {
  key: PresetKey;
  label: string;
  getRange: () => { start: Date; end: Date };
}

const getDatePresets = (): DatePreset[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getStartOfMonth = (date: Date) => {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getEndOfMonth = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  return [
    {
      key: "today",
      label: "Hoje",
      getRange: () => ({ start: today, end: today }),
    },
    {
      key: "yesterday",
      label: "Ontem",
      getRange: () => ({ start: yesterday, end: yesterday }),
    },
    {
      key: "today_yesterday",
      label: "Hoje e ontem",
      getRange: () => ({ start: yesterday, end: today }),
    },
    {
      key: "last_7_days",
      label: "Últimos 7 dias",
      getRange: () => {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        return { start, end: today };
      },
    },
    {
      key: "last_14_days",
      label: "Últimos 14 dias",
      getRange: () => {
        const start = new Date(today);
        start.setDate(start.getDate() - 13);
        return { start, end: today };
      },
    },
    {
      key: "last_28_days",
      label: "Últimos 28 dias",
      getRange: () => {
        const start = new Date(today);
        start.setDate(start.getDate() - 27);
        return { start, end: today };
      },
    },
    {
      key: "this_week",
      label: "Esta semana",
      getRange: () => ({
        start: getStartOfWeek(today),
        end: today,
      }),
    },
    {
      key: "last_week",
      label: "Semana passada",
      getRange: () => {
        const lastWeekEnd = new Date(getStartOfWeek(today));
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
        const lastWeekStart = getStartOfWeek(lastWeekEnd);
        return { start: lastWeekStart, end: lastWeekEnd };
      },
    },
    {
      key: "this_month",
      label: "Este mês",
      getRange: () => ({
        start: getStartOfMonth(today),
        end: today,
      }),
    },
    {
      key: "last_month",
      label: "Mês passado",
      getRange: () => {
        const lastMonthDate = new Date(today);
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        return {
          start: getStartOfMonth(lastMonthDate),
          end: getEndOfMonth(lastMonthDate),
        };
      },
    },
  ];
};

export function DateRangePicker({
  value,
  compareValue,
  onChange,
  onCompareChange,
  showCompare = false,
  onClose,
  onApply,
}: DateRangePickerProps) {
  const presets = getDatePresets();

  // Detect which preset matches the current value
  const detectMatchingPreset = (range: { start: Date; end: Date }): PresetKey | "custom" => {
    for (const preset of presets) {
      const presetRange = preset.getRange();
      // Compare dates by comparing their time values (ignores milliseconds)
      if (
        presetRange.start.toDateString() === range.start.toDateString() &&
        presetRange.end.toDateString() === range.end.toDateString()
      ) {
        return preset.key;
      }
    }
    return "custom";
  };

  const [selectedPreset, setSelectedPreset] = useState<PresetKey | "custom">(
    detectMatchingPreset(value)
  );
  const [localRange, setLocalRange] = useState<DateRange>({
    from: value.start,
    to: value.end,
  });
  const [enableCompare, setEnableCompare] = useState(!!compareValue);
  const [compareRange, setCompareRange] = useState<DateRange | undefined>(
    compareValue ? { from: compareValue.start, to: compareValue.end } : undefined
  );

  const handlePresetChange = (presetKey: string) => {
    if (presetKey === "custom") {
      setSelectedPreset("custom");
      return;
    }

    const preset = presets.find((p) => p.key === presetKey);
    if (preset) {
      const range = preset.getRange();
      setLocalRange({ from: range.start, to: range.end });
      setSelectedPreset(preset.key);
    }
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    if (range) {
      setLocalRange(range);
      setSelectedPreset("custom");
    }
  };

  const handleCompareChange = (checked: boolean) => {
    setEnableCompare(checked);
    if (!checked) {
      setCompareRange(undefined);
    }
  };

  const handleApply = () => {
    if (localRange.from && localRange.to) {
      onChange({ start: localRange.from, end: localRange.to });
    }

    if (onCompareChange) {
      if (enableCompare && compareRange?.from && compareRange?.to) {
        onCompareChange({ start: compareRange.from, end: compareRange.to });
      } else {
        onCompareChange(null);
      }
    }

    onApply?.();
  };

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return "Selecione um item";
    if (!range.to) return format(range.from, "dd 'de' MMM", { locale: ptBR });
    return `${format(range.from, "dd 'de' MMM", { locale: ptBR })} - ${format(
      range.to,
      "dd 'de' MMM",
      { locale: ptBR }
    )}`;
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg border shadow-lg min-w-[700px]">
      <div className="flex gap-6">
        {/* Left: Presets */}
        <div className="flex-shrink-0 w-48 border-r pr-4">
          <h3 className="text-sm font-medium mb-3">Usados recentemente</h3>
          <RadioGroup
            value={selectedPreset}
            onValueChange={handlePresetChange}
            className="space-y-2"
          >
            {presets.map((preset) => (
              <div key={preset.key} className="flex items-center space-x-2">
                <RadioGroupItem value={preset.key} id={preset.key} />
                <Label
                  htmlFor={preset.key}
                  className="text-sm font-normal cursor-pointer"
                >
                  {preset.label}
                </Label>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label
                htmlFor="custom"
                className="text-sm font-normal cursor-pointer"
              >
                Personalizado
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Right: Calendar */}
        <div className="flex-1">
          <Calendar
            mode="range"
            selected={localRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            locale={ptBR}
            className="rounded-md"
          />
        </div>
      </div>

      {/* Compare Section */}
      {showCompare && (
        <div className="border-t pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox
              id="compare"
              checked={enableCompare}
              onCheckedChange={handleCompareChange}
            />
            <Label htmlFor="compare" className="text-sm cursor-pointer">
              Comparar
            </Label>
          </div>

          {enableCompare && (
            <div className="pl-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">
                    Período de comparação
                  </Label>
                  <input
                    type="text"
                    readOnly
                    value={formatDateRange(compareRange)}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
                  />
                </div>
              </div>

              <Calendar
                mode="range"
                selected={compareRange}
                onSelect={setCompareRange}
                numberOfMonths={2}
                locale={ptBR}
                className="rounded-md mt-2"
              />
            </div>
          )}
        </div>
      )}

      {/* Footer: Range Display + Actions */}
      <div className="border-t pt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {formatDateRange(localRange)}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleApply}
            disabled={!localRange.from || !localRange.to}
            className={cn(
              "bg-[#FA4721] hover:bg-[#FA4721]/90 text-white"
            )}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Timezone note */}
      <div className="text-xs text-muted-foreground text-center border-t pt-2">
        Fuso horário das datas: Horário de São Paulo
      </div>
    </div>
  );
}
