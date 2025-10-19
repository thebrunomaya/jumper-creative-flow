/**
 * OptimizationStepCard - Card component for each optimization step
 * Used in fullscreen OptimizationEditor page
 */

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JumperButton } from "@/components/ui/jumper-button";
import { Bug, Bot } from "lucide-react";

interface OptimizationStepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  status: string | undefined;
  badge?: string; // Optional badge text (e.g., "Beta", "Preview")
  onDebug?: () => void;
  onEnhancementView?: () => void; // View AI enhancement changes
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
  children
}: OptimizationStepCardProps) {
  return (
    <Card className="border-2">
      <CardHeader>
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
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {children}
      </CardContent>
    </Card>
  );
}
