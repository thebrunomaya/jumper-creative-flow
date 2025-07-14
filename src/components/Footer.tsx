import React from 'react';
import { Link } from 'react-router-dom';
import { JumperLogo } from '@/components/ui/jumper-logo';

const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 bg-background/95 backdrop-blur-sm border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Logo e descrição */}
          <div className="space-y-4">
            <JumperLogo size="md" showText={true} />
            <p className="text-sm text-muted-foreground max-w-xs">
              Sistema de criativos oficial da Jumper Studio para criação e gerenciamento de campanhas publicitárias.
            </p>
          </div>

          {/* Links principais */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Sistema</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-jumper-orange transition-colors">
                  Criar Criativo
                </Link>
              </li>
              <li>
                <Link to="/design-system" className="text-muted-foreground hover:text-jumper-orange transition-colors">
                  Design System
                </Link>
              </li>
            </ul>
          </div>

          {/* Informações */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Suporte</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>⏰ SLA: 24h para aprovação</li>
              <li>📧 Confirmação automática</li>
              <li>🚀 Análise profissional</li>
            </ul>
          </div>
        </div>

        {/* Linha inferior */}
        <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Jumper Studio. Todos os direitos reservados.
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Design System v1.0</span>
            <span>•</span>
            <span>Cores oficiais aplicadas</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;