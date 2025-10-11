import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roleFilter: string | null;
  onRoleFilterChange: (role: string | null) => void;
  statusFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
  totalResults: number;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  totalResults,
}) => {
  const hasActiveFilters = searchQuery || roleFilter || statusFilter;

  const handleClearFilters = () => {
    onSearchChange('');
    onRoleFilterChange(null);
    onStatusFilterChange(null);
  };

  return (
    <div className="space-y-4">
      {/* Search and filters row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome ou email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Role filter */}
        <Select
          value={roleFilter || 'all'}
          onValueChange={(value) => onRoleFilterChange(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
            <SelectItem value="gerente">Gerente</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={statusFilter || 'all'}
          onValueChange={(value) => onStatusFilterChange(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={handleClearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {totalResults === 0 ? (
            'Nenhum usuário encontrado'
          ) : totalResults === 1 ? (
            '1 usuário encontrado'
          ) : (
            `${totalResults} usuários encontrados`
          )}
        </p>

        {hasActiveFilters && (
          <Button
            variant="link"
            size="sm"
            onClick={handleClearFilters}
            className="h-auto p-0"
          >
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
};
