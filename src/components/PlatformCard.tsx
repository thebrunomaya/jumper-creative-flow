import React from 'react';

interface Platform {
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  available: boolean;
}

interface PlatformCardProps {
  platform: Platform;
  isSelected: boolean;
  onClick: () => void;
}

export const PlatformCard: React.FC<PlatformCardProps> = ({ platform, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={!platform.available}
      className={`
        relative p-6 rounded-xl border-2 transition-all duration-300 text-left group w-full
        ${!platform.available 
          ? 'bg-jumper-gray-medium border-border opacity-50 cursor-not-allowed' 
          : isSelected
          ? 'bg-gradient-to-br from-primary/10 to-accent/10 border-primary shadow-lg shadow-primary/25'
          : 'bg-card border-border hover:border-muted hover:bg-muted/50'
        }
      `}
    >
      
      {/* Badge "Em Breve" */}
      {!platform.available && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
          Em Breve
        </div>
      )}

      {/* Glow Effect quando selecionado */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl" />
      )}

      <div className="relative z-10">
        {/* Ícone */}
        <div className={`
          w-16 h-16 rounded-lg flex items-center justify-center mb-4 transition-all duration-300
          ${isSelected 
            ? 'bg-gradient-jumper-primary shadow-lg' 
            : platform.available
            ? 'bg-muted group-hover:bg-muted/80'
            : 'bg-muted/50'
          }
        `}>
          <span className="text-2xl">{platform.icon}</span>
        </div>

        {/* Conteúdo */}
        <h3 className={`
          font-bold text-xl mb-2 transition-colors duration-300
          ${isSelected 
            ? 'text-foreground' 
            : platform.available 
            ? 'text-foreground group-hover:text-primary' 
            : 'text-muted-foreground'
          }
        `}>
          {platform.name}
        </h3>
        
        <p className={`
          font-medium text-sm transition-colors duration-300
          ${isSelected 
            ? 'text-primary/80' 
            : platform.available 
            ? 'text-muted-foreground group-hover:text-foreground/80' 
            : 'text-muted-foreground/50'
          }
        `}>
          {platform.subtitle}
        </p>

        {/* Indicador de Seleção */}
        {isSelected && (
          <div className="absolute top-4 right-4">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm">✓</span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
};