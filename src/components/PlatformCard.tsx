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
        group relative p-6 rounded-xl text-left transition-all duration-300 w-full
        ${!platform.available 
          ? 'bg-gray-900/20 border border-gray-800/20 opacity-50 cursor-not-allowed' 
          : isSelected
          ? 'bg-gray-900/40 border border-orange-400/30 shadow-lg shadow-orange-400/10'
          : 'bg-gray-900/40 border border-gray-700/30 hover:border-orange-400/30 hover:bg-gray-900/60'
        }
      `}
    >
      
      {/* Badge "Em Breve" */}
      {!platform.available && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
          Em breve
        </div>
      )}

      {/* Indicador de Seleção */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="w-4 h-4 bg-orange-400 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>
      )}

      <div className="relative z-10">
        {/* Ícone */}
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300
          ${platform.name === 'Meta Ads' 
            ? 'bg-blue-500/20' 
            : 'bg-yellow-500/10'
          }
        `}>
          <span className={`text-2xl ${
            platform.name === 'Meta Ads' ? 'text-blue-400' : 'text-yellow-600'
          }`}>
            {platform.icon}
          </span>
        </div>

        {/* Conteúdo */}
        <h3 className={`
          font-medium text-lg mb-1 transition-colors duration-300
          ${platform.available ? 'text-white' : 'text-gray-500'}
        `}>
          {platform.name}
        </h3>
        
        <p className={`
          text-sm font-light transition-colors duration-300
          ${platform.available ? 'text-gray-500' : 'text-gray-600'}
        `}>
          {platform.subtitle}
        </p>
      </div>
    </button>
  );
};