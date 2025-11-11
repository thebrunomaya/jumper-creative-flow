import { useState } from "react";
import { AlertCircle, Monitor, Maximize2, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useViewportSize } from "@/hooks/useViewportSize";
import { VIEWPORT_REQUIREMENTS, FORCE_VIEWPORT_KEY } from "@/config/viewport";

interface ViewportWarningProps {
  /**
   * Whether to show admin override button
   * @default false
   */
  showAdminOverride?: boolean;
}

/**
 * Viewport Size Warning Component
 *
 * Shows full-screen overlay when viewport is too small for deck presentations.
 * Provides helpful suggestions and optional admin override.
 *
 * @example
 * // In DeckPreview (admin can override)
 * <ViewportWarning showAdminOverride={isAdmin} />
 *
 * // In SharedDeck (public, no override)
 * <ViewportWarning />
 */
export function ViewportWarning({ showAdminOverride = false }: ViewportWarningProps) {
  const { width, height, isValid } = useViewportSize();
  const [isForced, setIsForced] = useState(() => {
    // Check if admin previously forced viewport
    if (typeof window === "undefined") return false;
    return localStorage.getItem(FORCE_VIEWPORT_KEY) === "true";
  });

  // Don't show warning if viewport is valid OR admin forced it
  if (isValid || isForced) {
    return null;
  }

  // Handle admin override
  const handleForceViewport = () => {
    localStorage.setItem(FORCE_VIEWPORT_KEY, "true");
    setIsForced(true);
  };

  const suggestions = [
    { icon: Monitor, text: "Use um monitor ou TV com tela maior" },
    { icon: Maximize2, text: "Maximize a janela do navegador" },
    { icon: Smartphone, text: "Gire seu dispositivo para modo paisagem (landscape)" },
  ];

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-8 w-8 text-warning" />
            <CardTitle className="text-xl">Tela muito pequena</CardTitle>
          </div>
          <CardDescription>
            Esta apresentação foi otimizada para telas maiores para garantir a melhor
            experiência visual.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current vs Required Resolution */}
          <Alert>
            <AlertDescription className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Resolução atual:</span>
                <span className="text-sm font-mono text-destructive">
                  {width}x{height}px
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Resolução mínima:</span>
                <span className="text-sm font-mono text-green-600">
                  {VIEWPORT_REQUIREMENTS.minWidth}x{VIEWPORT_REQUIREMENTS.minHeight}px
                </span>
              </div>
            </AlertDescription>
          </Alert>

          {/* Suggestions */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Sugestões:</p>
            <ul className="space-y-2">
              {suggestions.map(({ icon: Icon, text }, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin Override Button */}
          {showAdminOverride && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceViewport}
                className="w-full"
              >
                🔓 Forçar visualização (Admin)
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Apresentação pode não ser exibida corretamente
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
