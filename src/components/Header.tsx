
import React, { useState } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import UserMenu from './UserMenu';
import xWhiteLogo from '../assets/logos/x-white.png';
import logoBackground from '../assets/gradients-optimized/organic-07.png';
import { LazyImage } from '@/components/ui/lazy-image';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Users, LayoutDashboard, TrendingUp, BarChart3 } from 'lucide-react';
import { AccountSelectorModal } from '@/components/reports/AccountSelectorModal';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const location = useLocation();
  const [showReportsModal, setShowReportsModal] = useState(false);

  const navLinks = [
    { to: '/my-accounts', label: 'Contas', icon: Users },
    { to: '/creatives', label: 'Criativos', icon: LayoutDashboard },
    { to: '/optimization', label: 'Otimizações', icon: TrendingUp },
  ];

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
            <div className="flex items-center gap-8">
              {/* Logo */}
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
                  <span className="text-xs text-muted-foreground">v1.97</span>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Navegação principal">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.to;

                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline',
                        isActive
                          ? 'bg-[hsl(var(--orange-hero)/0.1)] text-[hsl(var(--orange-hero))]'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}

                {/* Reports Button (opens modal instead of navigating) */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReportsModal(true)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
                    'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Relatórios</span>
                </Button>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle variant="icon" />
              <UserMenu />
            </div>
        </div>
      </div>
    </header>

      <AccountSelectorModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
      />
    </>
  );
};

export default Header;
