
import React from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import UserMenu from './UserMenu';

const Header: React.FC = () => {
  return (
    <header className="bg-background/95 backdrop-blur-sm shadow-sm border-b border-border relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center">
              {/* Logo quadrado com gradiente */}
              <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-jumper-orange to-jumper-purple flex items-center justify-center shadow-md">
                <img 
                  src="/src/assets/jumper-white.png"
                  alt="Jumper Studio"
                  className="w-6 h-6 dark:block hidden"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <img 
                  src="/src/assets/jumper-black.png"
                  alt="Jumper Studio"
                  className="w-6 h-6 dark:hidden block"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              <span>⏰ SLA: 24h</span>
              <span>•</span>
              <span>📧 Confirmação automática</span>
            </div>
            
            <ThemeToggle variant="icon" />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
