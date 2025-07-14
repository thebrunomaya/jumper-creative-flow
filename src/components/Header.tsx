
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
              {/* Logo quadrado com imagem de fundo */}
              <div 
                className="relative w-10 h-10 rounded-lg flex items-center justify-center shadow-md bg-cover bg-center"
                style={{
                  backgroundImage: 'url(https://jumper.studio/wp-content/uploads/2025/07/JMP-GR07.png)'
                }}
              >
                <img 
                  src="https://jumper.studio/wp-content/uploads/2025/07/X-White.png"
                  alt="Jumper X"
                  className="w-5 h-5 dark:block hidden"
                />
                <img 
                  src="https://jumper.studio/wp-content/uploads/2025/07/X-Black.png"
                  alt="Jumper X"
                  className="w-5 h-5 dark:hidden block"
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
