import React from 'react';
import UserMenu from './UserMenu';

export const JumperHeader: React.FC = () => {
  return (
    <header 
      className="relative px-8 py-5 border-b border-white/20"
      style={{
        backgroundImage: "url('https://jumper.studio/wp-content/uploads/2025/07/Gradiente-1.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top'
      }}
    >
      {/* Overlay mais forte para melhor contraste */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      
      <div className="relative z-10 flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Logo com melhor contraste */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30 shadow-lg">
            <img src="/lovable-uploads/79a4b82f-0de4-4b80-a55e-5e7e283eab07.png" alt="Jumper Logo" className="w-5 h-5" />
          </div>
          
          <div>
            <h1 className="text-white font-semibold text-xl tracking-tight drop-shadow-lg">
              Sistema de Criativos
            </h1>
            <p className="text-white/90 text-sm font-medium tracking-wide uppercase drop-shadow-sm">Jumper Studio</p>
          </div>
        </div>

        {/* Status mais legíveis */}
        <div className="flex items-center space-x-4">
          <div className="bg-black/30 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse shadow-sm"></div>
              <span className="text-white font-semibold text-sm">SLA 24h</span>
            </div>
          </div>
          
          <div className="bg-black/30 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-sm"></div>
              <span className="text-white font-semibold text-sm">Auto confirmação</span>
            </div>
          </div>
        </div>

        {/* User profile melhorado */}
        <div className="flex items-center space-x-3">
          <span className="text-white font-medium text-base drop-shadow-sm">Mariana Estrela</span>
          <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-lg">
            <span className="text-white text-sm font-bold">ME</span>
          </div>
        </div>
      </div>
    </header>
  );
};