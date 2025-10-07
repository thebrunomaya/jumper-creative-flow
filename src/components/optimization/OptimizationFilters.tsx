/**
 * OptimizationFilters - Filter and sort controls for recordings list
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, ArrowUpDown } from "lucide-react";

export type FilterStatus = "all" | "pending" | "transcribed" | "analyzed";
export type SortBy = "newest" | "oldest" | "duration";

interface OptimizationFiltersProps {
  filterStatus: FilterStatus;
  sortBy: SortBy;
  onFilterChange: (status: FilterStatus) => void;
  onSortChange: (sort: SortBy) => void;
  totalCount: number;
  filteredCount: number;
}

export function OptimizationFilters({
  filterStatus,
  sortBy,
  onFilterChange,
  onSortChange,
  totalCount,
  filteredCount,
}: OptimizationFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Mostrando <strong>{filteredCount}</strong> de <strong>{totalCount}</strong> gravações
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {/* Filter by status */}
        <Select value={filterStatus} onValueChange={(v) => onFilterChange(v as FilterStatus)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filtrar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="transcribed">Transcritas</SelectItem>
            <SelectItem value="analyzed">Analisadas</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort by */}
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortBy)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mais Recentes</SelectItem>
            <SelectItem value="oldest">Mais Antigas</SelectItem>
            <SelectItem value="duration">Duração</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
