import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Users } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedItems: string[];
  onBulkPublish: () => void;
  isPublishing: boolean;
  totalItems: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedItems,
  onBulkPublish,
  isPublishing,
  totalItems
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-slate-50/50 border-b">
      <div className="flex-1 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cliente ou gerente..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{totalItems} criativo{totalItems !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {selectedItems.length} selecionado{selectedItems.length !== 1 ? 's' : ''}
            </Badge>
            <Button
              onClick={onBulkPublish}
              disabled={isPublishing}
              className="bg-[#FA4721] hover:bg-[#FA4721]/90 text-white"
              size="sm"
            >
              {isPublishing ? "Publicando..." : "Publicar Selecionados"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};