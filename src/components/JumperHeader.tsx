import React from 'react';
import UserMenu from './UserMenu';

export const JumperHeader: React.FC = () => {
  return (
    <header className="bg-jumper-black border-b border-jumper-gray-medium px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        
        {/* Logo e Branding */}
        <div className="flex items-center space-x-4">
          {/* Símbolo X da Jumper */}
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-jumper-primary rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">✕</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-jumper-orange rounded-full animate-pulse"></div>
          </div>
          
          {/* Títulos */}
          <div>
            <h1 className="text-white font-bold text-xl text-gradient-jumper">
              Sistema de Criativos
            </h1>
            <p className="text-jumper-gray font-medium text-sm">Jumper Studio</p>
          </div>
        </div>

        {/* Status Central */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 bg-jumper-gray-dark px-4 py-2 rounded-lg border border-jumper-gray-medium">
            <div className="w-2 h-2 bg-jumper-orange rounded-full animate-pulse"></div>
            <span className="text-jumper-orange font-medium text-sm">SLA: 24h</span>
          </div>
          
          <div className="flex items-center space-x-2 bg-jumper-gray-dark px-4 py-2 rounded-lg border border-jumper-gray-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-400 font-medium text-sm">Confirmação automática</span>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};