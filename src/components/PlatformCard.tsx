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
      className="relative p-6 rounded-xl text-left transition-all duration-200 w-full group"
      style={{
        backgroundColor: !platform.available 
          ? 'hsl(var(--jumper-gray-dark) / 0.5)' 
          : 'hsl(var(--jumper-gray-dark))',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: !platform.available 
          ? 'hsl(var(--jumper-gray-medium))' 
          : isSelected 
          ? 'transparent'
          : 'hsl(var(--jumper-gray-medium))',
        opacity: !platform.available ? 0.5 : 1,
        cursor: !platform.available ? 'not-allowed' : 'pointer'
      }}
    >
      {/* Gradiente apenas na borda do selecionado */}
      {isSelected && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-400 to-purple-500 p-0.5">
          <div 
            className="rounded-lg h-full w-full" 
            style={{ backgroundColor: 'hsl(var(--jumper-gray-dark))' }}
          ></div>
        </div>
      )}

      <div className="relative z-10">
        {/* Badge com gradiente */}
        {!platform.available && (
          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Em breve
          </div>
        )}

        {/* Check com gradiente */}
        {isSelected && (
          <div className="absolute top-4 right-4">
            <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          </div>
        )}

        {/* Icon em fundo neutro */}
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300"
          style={{
            backgroundColor: platform.available 
              ? 'hsl(var(--jumper-gray-medium))' 
              : 'hsl(var(--jumper-gray-medium) / 0.5)'
          }}
        >
          <span className={`text-2xl ${
            platform.name === 'Meta Ads' ? 'text-blue-300' : 'text-yellow-400'
          }`}
          style={{
            opacity: !platform.available ? 0.7 : 1
          }}
          >
            {platform.icon}
          </span>
        </div>

        {/* Conteúdo em cores neutras */}
        <h3 
          className="font-semibold text-lg mb-1 transition-colors duration-300"
          style={{
            color: platform.available ? 'white' : 'hsl(var(--jumper-gray-light))',
            opacity: platform.available ? 1 : 0.6
          }}
        >
          {platform.name}
        </h3>
        
        <p 
          className="text-sm transition-colors duration-300"
          style={{
            color: 'hsl(var(--jumper-gray-light))',
            opacity: platform.available ? 0.8 : 0.5
          }}
        >
          {platform.subtitle}
        </p>
      </div>
    </button>
  );
};