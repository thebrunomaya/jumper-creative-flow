
import React from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import UserMenu from './UserMenu';

const Header: React.FC = () => {
  return (
    <header className="bg-background/95 backdrop-blur-sm shadow-sm border-b border-border relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/src/assets/jumper-white.png"
                alt="Jumper X"
                className="w-10 h-10 dark:block hidden"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <img 
                src="/src/assets/jumper-black.png"
                alt="Jumper X"
                className="w-10 h-10 dark:hidden block"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div 
                className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg hidden"
              >
                X
              </div>
              <img 
                src="/src/assets/jumper-full-logo-white.png"
                alt="Jumper Studio"
                className="h-8 dark:block hidden"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <img 
                src="/src/assets/jumper-full-logo-black.png"
                alt="Jumper Studio"
                className="h-8 dark:hidden block"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <span className="text-xl font-haffer-bold hidden">
                Jumper Studio
              </span>
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
