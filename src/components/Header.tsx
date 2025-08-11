
import React from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import UserMenu from './UserMenu';
import xWhiteLogo from '../assets/logos/x-white.png';
import logoBackground from '../assets/gradients/organic-07.png';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-background/95 backdrop-blur-sm shadow-sm border-b border-border relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center">
              {/* Logo quadrado com imagem de fundo */}
              <div className="flex items-center space-x-3">
                <div 
                  className="relative w-10 h-10 rounded-lg flex items-center justify-center shadow-md bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${logoBackground})`
                  }}
                >
                  <img 
                    src={xWhiteLogo}
                    alt="Jumper X"
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-foreground">Ad Uploader</span>
                  <span className="text-xs text-muted-foreground">v1.8</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              <span>⏰ SLA: 24h</span>
              <span>•</span>
              <span>📧 Confirmação automática</span>
            </div>
            
            <Link to="/admin" className="hidden md:inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
            <ThemeToggle variant="icon" />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
