import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Shield, Briefcase, UserCircle, UserX } from 'lucide-react';

interface UserMetricsProps {
  users: Array<{
    role: string;
    is_active: boolean;
  }>;
  onFilterChange?: (filter: string | null) => void;
  activeFilter?: string | null;
}

export const UserMetrics: React.FC<UserMetricsProps> = ({
  users,
  onFilterChange,
  activeFilter,
}) => {
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const managerCount = users.filter((u) => u.role === 'manager').length;
  const supervisorCount = users.filter((u) => u.role === 'supervisor').length;
  const gerenteCount = users.filter((u) => u.role === 'gerente').length;
  const userCount = users.filter((u) => u.role === 'user').length;
  const inactiveCount = users.filter((u) => !u.is_active).length;
  const activeCount = totalUsers - inactiveCount;

  const metrics = [
    {
      label: 'Total de Usuários',
      value: totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      filter: null,
    },
    {
      label: 'Admins',
      value: adminCount,
      icon: Shield,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      filter: 'admin',
    },
    {
      label: 'Managers',
      value: managerCount,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      filter: 'manager',
    },
    {
      label: 'Supervisors',
      value: supervisorCount,
      icon: UserCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      filter: 'supervisor',
    },
    {
      label: 'Gerentes',
      value: gerenteCount,
      icon: UserCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      filter: 'gerente',
    },
    {
      label: 'Users',
      value: userCount,
      icon: Users,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
      filter: 'user',
    },
    {
      label: 'Ativos',
      value: activeCount,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      filter: 'active',
    },
    {
      label: 'Inativos',
      value: inactiveCount,
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      filter: 'inactive',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const isActive = activeFilter === metric.filter;

        return (
          <Card
            key={metric.label}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isActive ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => {
              if (onFilterChange) {
                onFilterChange(isActive ? null : metric.filter);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
