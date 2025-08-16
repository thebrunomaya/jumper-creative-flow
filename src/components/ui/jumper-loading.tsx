import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import xWhite from "@/assets/logos/x-white.png";
import xBlack from "@/assets/logos/x-black.png";

interface JumperLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const JumperLoading: React.FC<JumperLoadingProps> = ({
  message = "Carregando...",
  size = 'md',
  className
}) => {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // Use the correct X logo based on theme
  const logoSrc = theme === 'dark' ? xWhite : xBlack;

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      {/* Logo with spinning ring */}
      <div className={cn(
        "relative flex items-center justify-center",
        sizeClasses[size]
      )}>
        {/* X Logo perfectly centered */}
        <img 
          src={logoSrc}
          alt="Jumper Studio"
          className={cn(
            "animate-pulse opacity-60 object-contain",
            sizeClasses[size]
          )}
        />
        
        {/* Spinning ring around logo */}
        <div className={cn(
          "absolute inset-0 border-2 border-transparent border-t-primary border-r-primary rounded-full animate-spin",
          sizeClasses[size]
        )} />
      </div>

      {/* Loading message */}
      {message && (
        <p className={cn(
          "text-muted-foreground font-medium animate-fade-in",
          textSizeClasses[size]
        )}>
          {message}
        </p>
      )}

      {/* Loading dots animation */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};

// Full screen loading overlay - perfectly centered
export const JumperLoadingOverlay: React.FC<JumperLoadingProps> = (props) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border rounded-lg p-8 shadow-lg animate-scale-in">
        <JumperLoading {...props} size="lg" />
      </div>
    </div>
  );
};

// Page loading component - perfectly centered
export const JumperPageLoading: React.FC<JumperLoadingProps> = (props) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <JumperLoading {...props} size="lg" />
    </div>
  );
};