import React from 'react';
import UserMenu from './UserMenu';

export const JumperHeader: React.FC = () => {
  return (
    <header className="bg-gray-950/95 backdrop-blur-sm border-b border-gray-800/50 px-8 py-5">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Logo mais visível */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-purple-600 rounded-md flex items-center justify-center shadow-lg">
            <img src="/lovable-uploads/b6b05e33-b479-4d61-834b-75cec82c1eec.png" alt="Jumper Logo" className="w-5 h-5" />
          </div>
          
          <div>
            <h1 className="text-gray-100 font-medium text-lg tracking-tight">
              Sistema de Criativos
            </h1>
            <p className="text-gray-400 text-xs font-light tracking-wide uppercase">Jumper Studio</p>
          </div>
        </div>

        {/* Status badges mais visíveis */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-900/60 border border-gray-700/50 rounded-lg px-3 py-1.5 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300 text-xs font-medium">SLA 24h</span>
          </div>
          
          <div className="flex items-center space-x-2 bg-gray-900/60 border border-gray-700/50 rounded-lg px-3 py-1.5 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
            <span className="text-gray-300 text-xs font-medium">Auto confirmação</span>
          </div>
        </div>

        {/* User profile mais legível */}
        <div className="flex items-center space-x-3">
          <span className="text-gray-200 text-sm font-normal">Mariana Estrela</span>
          <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-xs font-semibold">ME</span>
          </div>
        </div>
      </div>
    </header>
  );
};