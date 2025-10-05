import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Archive
} from "lucide-react";

interface StatusMetricsProps {
  items: any[];
  onStatusFilter: (status: string | null) => void;
  activeFilter: string | null;
}

const statusConfig = {
  draft: { 
    label: "Rascunhos", 
    icon: FileText, 
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700",
    borderColor: "border-slate-200 dark:border-slate-600"
  },
  pending: { 
    label: "Pendentes", 
    icon: Clock, 
    color: "text-[#FA4721] dark:text-orange-400",
    bgColor: "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/30 dark:hover:bg-orange-800/40",
    borderColor: "border-orange-200 dark:border-orange-700"
  },
  queued: { 
    label: "Na Fila", 
    icon: Archive, 
    color: "text-[#FA4721] dark:text-orange-400",
    bgColor: "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/30 dark:hover:bg-orange-800/40",
    borderColor: "border-orange-200 dark:border-orange-700"
  },
  processing: { 
    label: "Processando", 
    icon: Loader2, 
    color: "text-[#FA4721] dark:text-orange-400",
    bgColor: "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/30 dark:hover:bg-orange-800/40",
    borderColor: "border-orange-200 dark:border-orange-700"
  },
  processed: { 
    label: "Publicados", 
    icon: CheckCircle, 
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-800/40",
    borderColor: "border-green-200 dark:border-green-700"
  },
  error: { 
    label: "Erros", 
    icon: AlertCircle, 
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/40",
    borderColor: "border-red-200 dark:border-red-700"
  },
};

export const StatusMetrics: React.FC<StatusMetricsProps> = ({ 
  items, 
  onStatusFilter, 
  activeFilter 
}) => {
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Initialize all status counts
    Object.keys(statusConfig).forEach(status => {
      counts[status] = 0;
    });
    
    // Count actual statuses
    items.forEach(item => {
      if (counts.hasOwnProperty(item.status)) {
        counts[item.status]++;
      }
    });
    
    return counts;
  }, [items]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {Object.entries(statusConfig).map(([status, config]) => {
        const Icon = config.icon;
        const count = statusCounts[status];
        const isActive = activeFilter === status;
        
        return (
          <Card 
            key={status}
            className={`cursor-pointer transition-all duration-200 ${config.bgColor} ${config.borderColor} ${
              isActive ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'
            }`}
            onClick={() => onStatusFilter(isActive ? null : status)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon 
                    className={`h-4 w-4 ${config.color} ${
                      status === 'processing' ? 'animate-spin' : ''
                    }`} 
                  />
                  <span className="text-sm font-medium text-foreground">
                    {config.label}
                  </span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${config.color} border-current`}
                >
                  {count}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};