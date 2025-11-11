import { useState } from "react";
import { AlertCircle, Monitor, Maximize2, Smartphone, RotateCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useViewportSize } from "@/hooks/useViewportSize";
import {
  VIEWPORT_REQUIREMENTS,
  FORCE_VIEWPORT_KEY,
  getAspectRatioLabel,
  SUPPORTED_RESOLUTIONS
} from "@/config/viewport";

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
 * Shows full-screen overlay when viewport doesn't meet requirements.
 * Supports multiple aspect ratios (4:3, 16:10, 16:9) and blocks ultra-wide.
 * Provides reason-specific feedback and suggestions.
 *
 * @example
 * // In DeckPreview (admin can override)
 * <ViewportWarning showAdminOverride={isAdmin} />
 *
 * // In SharedDeck (public, no override)
 * <ViewportWarning />
 */
export function ViewportWarning({ showAdminOverride = false }: ViewportWarningProps) {
  const { width, height, isValid, reason, aspectRatio } = useViewportSize();
  const [isForced, setIsForced] = useState(() => {
    // Check if admin previously forced viewport
    if (typeof window === "undefined") return false;
    return localStorage.getItem(FORCE_VIEWPORT_KEY) === "true";
  });

  // DEBUG: Log viewport state
  console.log('[ViewportWarning]', {
    width,
    height,
    isValid,
    reason,
    aspectRatio: aspectRatio?.toFixed(2),
    aspectRatioLabel: aspectRatio ? getAspectRatioLabel(width, height) : undefined,
    isForced,
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

  // Get reason-specific content
  const getReasonContent = () => {
    const aspectRatioLabel = aspectRatio ? getAspectRatioLabel(width, height) : '?';
    const smallestDim = Math.min(width, height);

    switch (reason) {
      case 'portrait':
        return {
          title: 'Orientação não suportada',
          description: 'Apresentações devem ser visualizadas em modo paisagem (landscape).',
          suggestions: [
            { icon: RotateCw, text: 'Gire seu dispositivo para modo paisagem' },
            { icon: Monitor, text: 'Use um monitor em orientação horizontal' },
          ],
        };

      case 'too_small':
        return {
          title: 'Resolução muito baixa',
          description: `A menor dimensão da tela (${smallestDim}px) está abaixo do mínimo de ${VIEWPORT_REQUIREMENTS.minSmallestDimension}px.`,
          suggestions: [
            { icon: Monitor, text: 'Use um monitor ou tela maior' },
            { icon: Maximize2, text: 'Maximize a janela do navegador' },
            { icon: Smartphone, text: 'Aumente a resolução do display nas configurações' },
          ],
        };

      case 'too_narrow':
        return {
          title: 'Tela muito estreita',
          description: `Proporção ${aspectRatioLabel} (${aspectRatio?.toFixed(2)}:1) é mais estreita que o mínimo 4:3 (1.33:1).`,
          suggestions: [
            { icon: Monitor, text: 'Use um display com proporção 4:3 ou mais ampla' },
            { icon: RotateCw, text: 'Verifique a orientação do dispositivo' },
          ],
        };

      case 'too_wide':
        return {
          title: 'Tela ultra-wide não suportada',
          description: `Proporção ${aspectRatioLabel} (${aspectRatio?.toFixed(2)}:1) é mais larga que o máximo 16:9 (1.78:1).`,
          suggestions: [
            { icon: Maximize2, text: 'Redimensione a janela do navegador para formato 16:9' },
            { icon: Monitor, text: 'Use um monitor com proporção padrão (4:3, 16:10, 16:9)' },
            { icon: AlertCircle, text: 'Apresentações em ultra-wide (21:9, 32:9) ficam distorcidas' },
          ],
        };

      default:
        return {
          title: 'Tela incompatível',
          description: 'Este formato de tela não é suportado para apresentações.',
          suggestions: [
            { icon: Monitor, text: 'Use um display com proporção entre 4:3 e 16:9' },
          ],
        };
    }
  };

  const content = getReasonContent();
  const aspectRatioLabel = aspectRatio ? getAspectRatioLabel(width, height) : '?';

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-8 w-8 text-warning" />
            <CardTitle className="text-xl">{content.title}</CardTitle>
          </div>
          <CardDescription>
            {content.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current vs Required Resolution */}
          <Alert>
            <AlertDescription className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Resolução atual:</span>
                <span className="text-sm font-mono text-destructive">
                  {width}x{height}px ({aspectRatioLabel})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Mínimo necessário:</span>
                <span className="text-sm font-mono text-green-600">
                  {VIEWPORT_REQUIREMENTS.minSmallestDimension}px (menor dimensão)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Proporções suportadas:</span>
                <span className="text-sm font-mono text-green-600">
                  4:3 até 16:9
                </span>
              </div>
            </AlertDescription>
          </Alert>

          {/* Suggestions */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Sugestões:</p>
            <ul className="space-y-2">
              {content.suggestions.map(({ icon: Icon, text }, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Supported Resolutions Examples */}
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Exemplos de resoluções suportadas:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium">4:3:</span>{' '}
                <span className="text-muted-foreground">
                  {SUPPORTED_RESOLUTIONS['4:3'].slice(0, 2).join(', ')}
                </span>
              </div>
              <div>
                <span className="font-medium">16:9:</span>{' '}
                <span className="text-muted-foreground">
                  {SUPPORTED_RESOLUTIONS['16:9'].slice(0, 2).join(', ')}
                </span>
              </div>
            </div>
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
