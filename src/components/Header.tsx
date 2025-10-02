
import React from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import UserMenu from './UserMenu';
import xWhiteLogo from '../assets/logos/x-white.png';
import logoBackground from '../assets/gradients-optimized/organic-07.png';
import { LazyImage } from '@/components/ui/lazy-image';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <>
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="skip-to-content">
        Pular para o conteúdo principal
      </a>
      
      <header 
        className="bg-background/95 backdrop-blur-sm shadow-sm border-b border-border relative z-20"
        role="banner"
        aria-label="Cabeçalho principal"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                {/* Logo quadrado com imagem de fundo */}
                <Link 
                  to="/" 
                  className="flex items-center space-x-3 no-underline"
                  aria-label="Ad Uploader - Página inicial"
                >
                  <div 
                    className="relative w-10 h-10 rounded-lg flex items-center justify-center shadow-md bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${logoBackground})`
                    }}
                    role="img"
                    aria-label="Logo Jumper Studio"
                  >
                    <img 
                      src={xWhiteLogo}
                      alt=""
                      className="w-5 h-5"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold text-foreground">Ad Uploader</span>
                    <span className="text-xs text-muted-foreground">v1.9</span>
                  </div>
                </Link>
              </div>
            </div>
            
            <nav className="flex items-center space-x-6" role="navigation" aria-label="Navegação principal">
              <div className="flex items-center space-x-6">
                <ThemeToggle variant="icon" />
                <UserMenu />
              </div>
            </nav>
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;
