
import React from 'react';
import UserMenu from './UserMenu';

interface HeaderProps {
  creativeId?: string;
}

const Header: React.FC<HeaderProps> = ({ creativeId }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-jumper rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🚀</span>
            </div>
            <div>
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-xl font-bold text-jumper-text">Sistema de Criativos</h1>
                  <p className="text-sm text-gray-500">Jumper Studio</p>
                </div>
                {creativeId && (
                  <div className="bg-gradient-jumper text-white px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium">
                      Editando: {creativeId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <span>⏰ SLA: 24h</span>
              <span>•</span>
              <span>📧 Confirmação automática</span>
            </div>
            
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
