/**
 * OptimizationStepCard - Card component for each optimization step
 * Used in fullscreen OptimizationEditor page
 * Now supports collapsible behavior for cleaner interface
 */

import { ReactNode, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JumperButton } from "@/components/ui/jumper-button";
import { Bug, Bot, Edit, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptimizationStepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  status: string | undefined;
  badge?: string; // Optional badge text (e.g., "Beta", "Preview")
  onDebug?: () => void;
  onEnhancementView?: () => void; // View AI enhancement changes
  onEdit?: () => void; // Edit action (opens modal)
  onCopy?: () => void; // Copy step content to clipboard
  isEditDisabled?: boolean; // Disable edit if step not completed
  isCollapsible?: boolean; // Enable collapse/expand behavior
  defaultCollapsed?: boolean; // Start collapsed (default: true)
  children: ReactNode;
}

function getStatusBadge(status: string | undefined) {
  const variants: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
  > = {
    pending: { variant: "secondary", label: "Pendente" },
    processing: { variant: "default", label: "Processando" },
    completed: { variant: "outline", label: "Concluído" },
    failed: { variant: "destructive", label: "Falha" },
  };

  const config = variants[status || 'pending'] || variants.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function OptimizationStepCard({
  stepNumber,
  title,
  description,
  status,
  badge,
  onDebug,
  onEnhancementView,
  onEdit,
  onCopy,
  isEditDisabled = false,
  isCollapsible = true,
  defaultCollapsed = true,
  children
}: OptimizationStepCardProps) {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);

  const handleHeaderClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }

    if (isCollapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  const ChevronIcon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <Card className={cn(
      "border-2 transition-all duration-300",
      isEditDisabled && "opacity-60"
    )}>
      <CardHeader
        className={cn(
          "transition-colors duration-200",
          isCollapsible && "cursor-pointer hover:bg-muted/50"
        )}
        onClick={handleHeaderClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Step Number Circle */}
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary">{stepNumber}</span>
            </div>

            {/* Title & Description */}
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                {title}
                {badge && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {badge}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>

          {/* Status Badge & Action Buttons */}
          <div className="flex items-center gap-2">
            {getStatusBadge(status)}

            {/* Edit Button */}
            {onEdit && (
              <JumperButton
                size="sm"
                variant="ghost"
                onClick={onEdit}
                disabled={isEditDisabled}
                className="h-8 w-8 p-0"
                title={isEditDisabled ? "Complete o step para editar" : "Editar"}
              >
                <Edit className="h-4 w-4" />
              </JumperButton>
            )}

            {/* Copy Button */}
            {onCopy && (
              <JumperButton
                size="sm"
                variant="ghost"
                onClick={onCopy}
                disabled={isEditDisabled}
                className="h-8 w-8 p-0"
                title={isEditDisabled ? "Complete o step para copiar" : "Copiar"}
              >
                <Copy className="h-4 w-4" />
              </JumperButton>
            )}

            {/* Enhancement View Button */}
            {onEnhancementView && (
              <JumperButton
                size="sm"
                variant="ghost"
                onClick={onEnhancementView}
                className="h-8 w-8 p-0"
                title="Ver Ajustes da IA"
              >
                <Bot className="h-4 w-4" />
              </JumperButton>
            )}

            {/* Debug Button (Admin only) */}
            {onDebug && (
              <JumperButton
                size="sm"
                variant="ghost"
                onClick={onDebug}
                className="h-8 w-8 p-0"
                title="Debug (Admin)"
              >
                <Bug className="h-4 w-4" />
              </JumperButton>
            )}

            {/* Collapse/Expand Indicator */}
            {isCollapsible && (
              <ChevronIcon
                className="h-5 w-5 text-muted-foreground transition-transform duration-300"
              />
            )}
          </div>
        </div>
      </CardHeader>

      {/* Collapsible Content */}
      {isExpanded && (
        <CardContent className="pt-4 animate-in slide-in-from-top-2 duration-300">
          {children}
        </CardContent>
      )}
    </Card>
  );
}
