/**
 * DeckEditorStepCard - Card component for each deck generation step
 * Used in DeckEditorPage for 3-stage interactive workflow
 * Based on OptimizationStepCard pattern
 */

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Lock, LucideIcon } from "lucide-react";

interface DeckEditorStepCardProps {
  step: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  isOpen: boolean;
  onToggle: () => void;
  isLocked?: boolean; // Step is locked until previous stage completes
  children: ReactNode;
}

function getStatusBadge(status: 'pending' | 'processing' | 'completed' | 'failed') {
  const variants: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
  > = {
    pending: { variant: "secondary", label: "Pendente" },
    processing: { variant: "default", label: "Processando" },
    completed: { variant: "outline", label: "Concluído" },
    failed: { variant: "destructive", label: "Falha" },
  };

  const config = variants[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function DeckEditorStepCard({
  step,
  title,
  subtitle,
  icon: Icon,
  status,
  isOpen,
  onToggle,
  isLocked = false,
  children
}: DeckEditorStepCardProps) {
  const handleHeaderClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }

    // Don't toggle if locked
    if (!isLocked) {
      onToggle();
    }
  };

  const ChevronIcon = isOpen ? ChevronUp : ChevronDown;

  return (
    <Card className={cn(
      "border-2 transition-all duration-300",
      isLocked && "opacity-60 cursor-not-allowed",
      !isLocked && "hover:border-primary/50"
    )}>
      <CardHeader
        className={cn(
          "transition-colors duration-200",
          !isLocked && "cursor-pointer hover:bg-muted/50"
        )}
        onClick={handleHeaderClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Step Number Circle with Icon */}
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
              status === 'completed' && "bg-green-500/10",
              status === 'processing' && "bg-primary/10 animate-pulse",
              status === 'failed' && "bg-red-500/10",
              status === 'pending' && "bg-gray-500/10"
            )}>
              {isLocked ? (
                <Lock className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Icon className={cn(
                  "h-6 w-6",
                  status === 'completed' && "text-green-600",
                  status === 'processing' && "text-primary",
                  status === 'failed' && "text-red-600",
                  status === 'pending' && "text-muted-foreground"
                )} />
              )}
            </div>

            {/* Title & Description */}
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Stage {step}: {title}
              </CardTitle>
              <CardDescription className="mt-1">{subtitle}</CardDescription>
            </div>
          </div>

          {/* Status Badge & Chevron */}
          <div className="flex items-center gap-3">
            {getStatusBadge(status)}

            {/* Collapse/Expand Indicator */}
            {!isLocked && (
              <ChevronIcon
                className="h-5 w-5 text-muted-foreground transition-transform duration-300"
                aria-label={isOpen ? "Recolher seção" : "Expandir seção"}
              />
            )}
          </div>
        </div>
      </CardHeader>

      {/* Collapsible Content */}
      {isOpen && !isLocked && (
        <CardContent className="pt-4 animate-in slide-in-from-top-2 duration-300">
          {children}
        </CardContent>
      )}

      {/* Locked State Message */}
      {isOpen && isLocked && (
        <CardContent className="pt-4 animate-in slide-in-from-top-2 duration-300">
          <div className="text-center py-8 text-muted-foreground">
            <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Esta etapa está bloqueada</p>
            <p className="text-sm mt-2">Complete as etapas anteriores para desbloquear</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
