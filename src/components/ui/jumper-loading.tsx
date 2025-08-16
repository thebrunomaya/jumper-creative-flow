import React from 'react';
import { JumperLogo } from './jumper-logo';
import { cn } from '@/lib/utils';

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

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      {/* Logo with pulsing animation */}
      <div className={cn(
        "relative",
        sizeClasses[size]
      )}>
        <JumperLogo 
          className={cn(
            "animate-pulse opacity-60",
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

// Full screen loading overlay
export const JumperLoadingOverlay: React.FC<JumperLoadingProps> = (props) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border rounded-lg p-8 shadow-lg animate-scale-in">
        <JumperLoading {...props} size="lg" />
      </div>
    </div>
  );
};

// Page loading component
export const JumperPageLoading: React.FC<JumperLoadingProps> = (props) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <JumperLoading {...props} size="lg" />
    </div>
  );
};