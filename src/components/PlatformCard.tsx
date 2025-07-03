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
        group relative p-6 rounded-xl text-left transition-all duration-300 w-full backdrop-blur-md shadow-xl
        ${!platform.available 
          ? 'bg-white/5 border border-white/20 opacity-60 cursor-not-allowed' 
          : isSelected
          ? 'bg-white/10 border-2 border-orange-400/50 shadow-2xl hover:bg-white/15'
          : 'bg-white/8 border border-white/20 hover:border-orange-400/50 hover:bg-white/12'
        }
      `}
    >
      
      {/* Badge "Em Breve" */}
      {!platform.available && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
          Em breve
        </div>
      )}

      {/* Indicador de Seleção */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
        </div>
      )}

      <div className="relative z-10">
        {/* Ícone */}
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 backdrop-blur-sm shadow-lg
          ${platform.name === 'Meta Ads' 
            ? 'bg-blue-500/30 border border-blue-400/30' 
            : 'bg-yellow-500/20 border border-yellow-400/20'
          }
        `}>
          <span className={`text-2xl ${
            platform.name === 'Meta Ads' ? 'text-blue-200' : 'text-yellow-300'
          }`}>
            {platform.icon}
          </span>
        </div>

        {/* Conteúdo */}
        <h3 className={`
          font-semibold text-lg mb-1 transition-colors duration-300 drop-shadow-sm
          ${platform.available ? 'text-white' : 'text-white/80'}
        `}>
          {platform.name}
        </h3>
        
        <p className={`
          text-sm font-normal transition-colors duration-300
          ${platform.available ? 'text-white/80' : 'text-white/60'}
        `}>
          {platform.subtitle}
        </p>
      </div>
    </button>
  );
};