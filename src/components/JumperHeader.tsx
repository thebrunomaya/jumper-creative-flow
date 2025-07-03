import React from 'react';
import UserMenu from './UserMenu';

export const JumperHeader: React.FC = () => {
  return (
    <header 
      className="relative border-b border-white/10 px-8 py-5"
      style={{
        backgroundImage: "url('https://jumper.studio/wp-content/uploads/2025/07/Gradiente-1.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top'
      }}
    >
      {/* Glass morphism effect */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md"></div>
      
      <div className="relative z-10 flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Logo com glass effect */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/15 backdrop-blur-sm rounded-md flex items-center justify-center border border-white/20 shadow-lg">
            <img src="/lovable-uploads/79a4b82f-0de4-4b80-a55e-5e7e283eab07.png" alt="Jumper Logo" className="w-5 h-5" />
          </div>
          
          <div>
            <h1 className="text-white font-medium text-lg tracking-tight drop-shadow-sm">
              Sistema de Criativos
            </h1>
            <p className="text-white/80 text-xs font-light tracking-wide uppercase">Jumper Studio</p>
          </div>
        </div>

        {/* Status com glass containers */}
        <div className="flex items-center space-x-4">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 shadow-lg">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full shadow-sm animate-pulse"></div>
              <span className="text-white font-medium">SLA 24h</span>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 shadow-lg">
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-sm"></div>
              <span className="text-white font-medium">Auto confirmação</span>
            </div>
          </div>
        </div>

        {/* User Profile com glass */}
        <div className="flex items-center space-x-3">
          <span className="text-white font-medium text-sm drop-shadow-sm">Mariana Estrela</span>
          <div className="w-7 h-7 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-lg">
            <span className="text-white text-xs font-semibold">ME</span>
          </div>
        </div>
      </div>
    </header>
  );
};