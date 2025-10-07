/**
 * OptimizationStats - Stats cards for optimization overview
 */

import { Card, CardContent } from "@/components/ui/card";
import { FileAudio, Clock, CheckCircle2, Brain } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  variant?: "default" | "primary" | "success" | "warning";
}

function StatCard({ icon: Icon, label, value, variant = "default" }: StatCardProps) {
  const variantClasses = {
    default: "border-border",
    primary: "border-primary/20 bg-primary/5",
    success: "border-success/20 bg-success/5",
    warning: "border-warning/20 bg-warning/5"
  };

  return (
    <Card className={variantClasses[variant]}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-background p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface OptimizationStatsProps {
  total: number;
  pending: number;
  transcribed: number;
  analyzed: number;
}

export function OptimizationStats({ total, pending, transcribed, analyzed }: OptimizationStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={FileAudio} label="Total de Gravações" value={total} variant="default" />
      <StatCard icon={Clock} label="Aguardando Transcrição" value={pending} variant="warning" />
      <StatCard icon={CheckCircle2} label="Transcritas" value={transcribed} variant="primary" />
      <StatCard icon={Brain} label="Analisadas com IA" value={analyzed} variant="success" />
    </div>
  );
}
