import React from 'react';
import UserMenu from './UserMenu';

export const JumperHeader: React.FC = () => {
  return (
    <header className="bg-gray-950 border-b border-gray-800/30 px-8 py-5">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Logo Sofisticado */}
        <div className="flex items-center space-x-3">
          {/* Símbolo X mais discreto */}
          <div className="relative">
            <img src="/lovable-uploads/b6b05e33-b479-4d61-834b-75cec82c1eec.png" alt="Jumper Logo" className="w-8 h-8" />
          </div>
          
          {/* Branding Clean */}
          <div>
            <h1 className="text-white font-medium text-lg tracking-tight">
              Sistema de Criativos
            </h1>
            <p className="text-gray-500 text-xs font-light tracking-wide uppercase">Jumper Studio</p>
          </div>
        </div>

        {/* Status Badges Discretos */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
            <span className="text-gray-400 font-light">SLA 24h</span>
          </div>
          
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
            <span className="text-gray-400 font-light">Auto confirmação</span>
          </div>
        </div>

        {/* User Profile Minimalista */}
        <div className="flex items-center space-x-3">
          <span className="text-gray-300 text-sm font-light">Mariana Estrela</span>
          <div className="w-7 h-7 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">ME</span>
          </div>
        </div>
      </div>
    </header>
  );
};