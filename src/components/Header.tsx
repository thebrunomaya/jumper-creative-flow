
import React from 'react';
import UserMenu from './UserMenu';
import jumperLogo from '@/assets/jumper-logo.svg';

const Header: React.FC = () => {
  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-black border border-border flex items-center justify-center">
              <img src={jumperLogo} alt="Jumper Studio" className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Sistema de Criativos</h1>
              <p className="text-sm text-muted-foreground">Jumper Studio</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
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
