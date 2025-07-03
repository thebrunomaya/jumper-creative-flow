import React from 'react';
import UserMenu from './UserMenu';

export const JumperHeader: React.FC = () => {
  return (
    <header style={{ backgroundColor: 'hsl(var(--jumper-black))', borderBottom: '1px solid hsl(var(--jumper-gray-medium))' }} className="px-6 py-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        
        {/* Logo com gradiente estratégico */}
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
            style={{
              backgroundImage: "url('https://jumper.studio/wp-content/uploads/2025/07/Gradiente-1.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <img src="/lovable-uploads/79a4b82f-0de4-4b80-a55e-5e7e283eab07.png" alt="Jumper Logo" className="w-5 h-5" />
          </div>
          
          <div>
            <h1 className="text-white font-semibold text-lg">Sistema de Criativos</h1>
            <p style={{ color: 'hsl(var(--jumper-gray-light))' }} className="text-xs uppercase tracking-wide">Jumper Studio</p>
          </div>
        </div>

        {/* Status em fundo neutro */}
        <div className="flex items-center space-x-3">
          <div 
            className="flex items-center space-x-2 rounded-lg px-3 py-1.5 border"
            style={{ 
              backgroundColor: 'hsl(var(--jumper-gray-dark))', 
              borderColor: 'hsl(var(--jumper-gray-medium))' 
            }}
          >
            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
            <span className="text-white text-xs font-medium">SLA 24h</span>
          </div>
          
          <div 
            className="flex items-center space-x-2 rounded-lg px-3 py-1.5 border"
            style={{ 
              backgroundColor: 'hsl(var(--jumper-gray-dark))', 
              borderColor: 'hsl(var(--jumper-gray-medium))' 
            }}
          >
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
            <span className="text-white text-xs font-medium">Auto confirmação</span>
          </div>
        </div>

        {/* User profile neutro */}
        <div className="flex items-center space-x-2">
          <span className="text-white text-sm font-medium">Mariana Estrela</span>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center border"
            style={{ 
              backgroundColor: 'hsl(var(--jumper-gray-dark))', 
              borderColor: 'hsl(var(--jumper-gray-medium))' 
            }}
          >
            <span className="text-white text-xs font-bold">ME</span>
          </div>
        </div>
      </div>
    </header>
  );
};