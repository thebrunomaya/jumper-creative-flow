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
        relative p-8 rounded-2xl border-3 text-left transition-all duration-300 backdrop-blur-md shadow-2xl group
        ${!platform.available 
          ? 'bg-black/20 border-white/20 opacity-50 cursor-not-allowed' 
          : isSelected
          ? 'bg-black/30 border-orange-400 shadow-orange-400/30 hover:shadow-orange-400/50'
          : 'bg-black/20 border-white/30 hover:bg-black/30 hover:border-white/50 hover:scale-105'
        }
      `}
    >
      
      {/* Badge mais visível */}
      {!platform.available && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
          Em breve
        </div>
      )}

      {/* Indicador de seleção melhorado */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-sm font-bold">✓</span>
          </div>
        </div>
      )}

      <div className="relative z-10">
        {/* Ícone mais contrastado */}
        <div className={`
          w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 shadow-lg
          ${isSelected 
            ? 'bg-orange-400/30 border-2 border-orange-400/50' 
            : 'bg-white/10 border-2 border-white/20 group-hover:bg-white/20'
          }
        `}>
          <span className="text-3xl">{platform.icon}</span>
        </div>

        {/* Conteúdo mais legível */}
        <h3 className={`
          font-bold text-2xl mb-2 drop-shadow-lg transition-colors duration-300
          ${isSelected 
            ? 'text-white' 
            : platform.available 
            ? 'text-white/90 group-hover:text-white' 
            : 'text-white/60'
          }
        `}>
          {platform.name}
        </h3>
        
        <p className={`
          text-lg font-medium drop-shadow-sm transition-colors duration-300
          ${isSelected 
            ? 'text-white/90' 
            : platform.available 
            ? 'text-white/70 group-hover:text-white/80' 
            : 'text-white/40'
          }
        `}>
          {platform.subtitle}
        </p>
      </div>
    </button>
  );
};