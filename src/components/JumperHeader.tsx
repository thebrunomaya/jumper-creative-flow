import React from 'react';
import UserMenu from './UserMenu';

export const JumperHeader: React.FC = () => {
  return (
    <header className="bg-black border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        
        {/* Logo com gradiente estratégico */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <img src="/lovable-uploads/79a4b82f-0de4-4b80-a55e-5e7e283eab07.png" alt="Jumper Logo" className="w-5 h-5" />
          </div>
          
          <div>
            <h1 className="text-white font-semibold text-lg">Sistema de Criativos</h1>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Jumper Studio</p>
          </div>
        </div>

        {/* Status em fundo preto */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5">
            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
            <span className="text-white text-xs font-medium">SLA 24h</span>
          </div>
          
          <div className="flex items-center space-x-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
            <span className="text-white text-xs font-medium">Auto confirmação</span>
          </div>
        </div>

        {/* User profile preto */}
        <div className="flex items-center space-x-2">
          <span className="text-white text-sm font-medium">Mariana Estrela</span>
          <div className="w-8 h-8 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">ME</span>
          </div>
        </div>
      </div>
    </header>
  );
};