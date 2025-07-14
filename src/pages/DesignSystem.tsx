import React, { useState } from 'react';
import { JumperBackground } from '@/components/ui/jumper-background';
import { JumperLogo } from '@/components/ui/jumper-logo';
import { JumperButton } from '@/components/ui/jumper-button';
import { JumperCard, JumperCardContent, JumperCardHeader, JumperCardTitle, JumperCardDescription } from '@/components/ui/jumper-card';
import { JumperInput } from '@/components/ui/jumper-input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useJumperTheme } from '@/hooks/use-jumper-theme';
import { ArrowLeft, Heart, Star, Settings, Download, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

const DesignSystem = () => {
  const { colors, isDark } = useJumperTheme();
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | boolean>(false);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setInputError(value.length > 20 ? 'Máximo 20 caracteres' : false);
  };

  return (
    <JumperBackground variant={1} className="min-h-screen">
      {/* Header */}
      <div className="relative z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <JumperButton variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </JumperButton>
              </Link>
              <JumperLogo size="md" />
            </div>
            <ThemeToggle variant="full" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Título */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Design System</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Documentação visual dos componentes oficiais da Jumper Studio
          </p>
        </div>

        {/* Paleta de Cores */}
        <JumperCard>
          <JumperCardHeader>
            <JumperCardTitle>🎨 Nova Hierarquia de Cores</JumperCardTitle>
            <JumperCardDescription>
              Sistema de cores sutis com laranja (#FA4721) apenas para ações críticas
            </JumperCardDescription>
          </JumperCardHeader>
          <JumperCardContent>
            <div className="space-y-6">
              {/* Cores Críticas */}
              <div>
                <h4 className="font-semibold mb-3 text-accent-critical">🔥 Cores Críticas (Uso Restrito)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center space-y-2">
                    <div 
                      className="w-20 h-20 rounded-lg mx-auto border border-border"
                      style={{ backgroundColor: colors.orange }}
                    />
                    <div>
                      <p className="font-semibold text-sm">Jumper Orange</p>
                      <p className="text-xs text-muted-foreground">{colors.orange}</p>
                      <p className="text-xs text-accent-critical">Apenas ações principais</p>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <div 
                      className="w-20 h-20 rounded-lg mx-auto border border-border bg-success"
                    />
                    <div>
                      <p className="font-semibold text-sm">Success</p>
                      <p className="text-xs text-muted-foreground">Para confirmações</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acentos Sutis */}
              <div>
                <h4 className="font-semibold mb-3 text-accent-subtle">✨ Acentos Principais (Sutis)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center space-y-2">
                    <div className="w-20 h-20 rounded-lg mx-auto border border-border bg-accent-subtle" />
                    <div>
                      <p className="font-semibold text-sm">Accent Subtle</p>
                      <p className="text-xs text-muted-foreground">Destaques gerais</p>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-20 h-20 rounded-lg mx-auto border border-border bg-accent-light" />
                    <div>
                      <p className="font-semibold text-sm">Accent Light</p>
                      <p className="text-xs text-muted-foreground">Hover states</p>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-20 h-20 rounded-lg mx-auto border-2 border-accent-border bg-background" />
                    <div>
                      <p className="font-semibold text-sm">Accent Border</p>
                      <p className="text-xs text-muted-foreground">Bordas ativas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cores Base */}
              <div>
                <h4 className="font-semibold mb-3">🖤 Cores Base</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center space-y-2">
                    <div 
                      className="w-20 h-20 rounded-lg mx-auto border border-border"
                      style={{ backgroundColor: colors.black }}
                    />
                    <div>
                      <p className="font-semibold text-sm">Jumper Black</p>
                      <p className="text-xs text-muted-foreground">{colors.black}</p>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <div 
                      className="w-20 h-20 rounded-lg mx-auto border border-border"
                      style={{ backgroundColor: colors.white }}
                    />
                    <div>
                      <p className="font-semibold text-sm">Jumper White</p>
                      <p className="text-xs text-muted-foreground">{colors.white}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </JumperCardContent>
        </JumperCard>

        {/* Logo */}
        <JumperCard>
          <JumperCardHeader>
            <JumperCardTitle>🚀 JumperLogo</JumperCardTitle>
            <JumperCardDescription>
              Único componente que usa gradiente orgânico (símbolo X)
            </JumperCardDescription>
          </JumperCardHeader>
          <JumperCardContent>
            <div className="flex flex-wrap items-center gap-8">
              <JumperLogo size="sm" showText={true} />
              <JumperLogo size="md" showText={true} />
              <JumperLogo size="lg" showText={true} />
              <JumperLogo size="md" showText={false} />
            </div>
          </JumperCardContent>
        </JumperCard>

        {/* Botões */}
        <JumperCard>
          <JumperCardHeader>
            <JumperCardTitle>🔘 JumperButton</JumperCardTitle>
            <JumperCardDescription>
              Botões com cores sólidas da paleta oficial
            </JumperCardDescription>
          </JumperCardHeader>
          <JumperCardContent>
            <div className="space-y-6">
              {/* Variants */}
              <div className="space-y-3">
                <h4 className="font-semibold">Variantes</h4>
                <div className="flex flex-wrap gap-4">
                  <JumperButton variant="primary">Primary</JumperButton>
                  <JumperButton variant="secondary">Secondary</JumperButton>
                  <JumperButton variant="ghost">Ghost</JumperButton>
                </div>
              </div>

              {/* Sizes */}
              <div className="space-y-3">
                <h4 className="font-semibold">Tamanhos</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <JumperButton size="sm">Small</JumperButton>
                  <JumperButton size="default">Default</JumperButton>
                  <JumperButton size="lg">Large</JumperButton>
                  <JumperButton variant="primary" size="icon">
                    <Heart className="w-4 h-4" />
                  </JumperButton>
                </div>
              </div>

              {/* Com ícones */}
              <div className="space-y-3">
                <h4 className="font-semibold">Com Ícones</h4>
                <div className="flex flex-wrap gap-4">
                  <JumperButton variant="primary">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </JumperButton>
                  <JumperButton variant="ghost">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </JumperButton>
                  <JumperButton variant="secondary">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </JumperButton>
                </div>
              </div>
            </div>
          </JumperCardContent>
        </JumperCard>

        {/* Cards */}
        <JumperCard>
          <JumperCardHeader>
            <JumperCardTitle>🃏 JumperCard</JumperCardTitle>
            <JumperCardDescription>
              Cards com cores sólidas e estado de seleção
            </JumperCardDescription>
          </JumperCardHeader>
          <JumperCardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map((num) => (
                <JumperCard
                  key={num}
                  selected={selectedCard === num}
                  className="cursor-pointer"
                  onClick={() => setSelectedCard(selectedCard === num ? null : num)}
                >
                  <JumperCardHeader>
                    <JumperCardTitle className="text-base flex items-center">
                      <Star className="w-4 h-4 mr-2" />
                      Card {num}
                    </JumperCardTitle>
                    <JumperCardDescription>
                      Exemplo de card {selectedCard === num ? 'selecionado' : 'normal'}
                    </JumperCardDescription>
                  </JumperCardHeader>
                  <JumperCardContent>
                    <p className="text-sm text-muted-foreground">
                      Clique para {selectedCard === num ? 'desselecionar' : 'selecionar'} este card.
                    </p>
                  </JumperCardContent>
                </JumperCard>
              ))}
            </div>
          </JumperCardContent>
        </JumperCard>

        {/* Inputs */}
        <JumperCard>
          <JumperCardHeader>
            <JumperCardTitle>📝 JumperInput</JumperCardTitle>
            <JumperCardDescription>
              Campos de entrada com foco sutil e validação visual
            </JumperCardDescription>
          </JumperCardHeader>
          <JumperCardContent>
            <div className="space-y-4">
              <JumperInput
                label="Nome"
                placeholder="Digite seu nome"
                value={inputValue}
                onChange={handleInputChange}
                error={inputError}
              />
              <JumperInput
                label="Email"
                placeholder="seu@email.com"
                disabled
              />
              <JumperInput
                label="Campo com erro"
                placeholder="Campo inválido"
                error="Este campo é obrigatório"
              />
            </div>
          </JumperCardContent>
        </JumperCard>

        {/* Backgrounds */}
        <JumperCard>
          <JumperCardHeader>
            <JumperCardTitle>🌈 JumperBackground</JumperCardTitle>
            <JumperCardDescription>
              Gradientes orgânicos oficiais para backgrounds grandes
            </JumperCardDescription>
          </JumperCardHeader>
          <JumperCardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map((variant) => (
                <div
                  key={variant}
                  className="h-20 rounded-lg border border-border relative overflow-hidden"
                  style={{
                    background: `var(--gradient-jumper-${variant})`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      Gradient {variant}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              *Gradientes são usados apenas em backgrounds de páginas inteiras ou seções grandes
            </p>
          </JumperCardContent>
        </JumperCard>

        {/* Theme Toggle */}
        <JumperCard>
          <JumperCardHeader>
            <JumperCardTitle>🌙 ThemeToggle</JumperCardTitle>
            <JumperCardDescription>
              Toggle entre modo claro e escuro
            </JumperCardDescription>
          </JumperCardHeader>
          <JumperCardContent>
            <div className="flex flex-wrap items-center gap-4">
              <ThemeToggle variant="icon" />
              <ThemeToggle variant="text" />
              <ThemeToggle variant="full" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Modo atual: <span className="font-semibold">{isDark ? 'Escuro' : 'Claro'}</span>
            </p>
          </JumperCardContent>
        </JumperCard>

        {/* Footer da página */}
        <div className="text-center text-white/60 text-sm">
          <p>Design System oficial da Jumper Studio v2.0</p>
          <p className="mt-2">
            Nova hierarquia: <span className="text-accent-subtle ml-1">Acentos sutis como padrão</span> • 
            <span className="text-accent-critical ml-1">Laranja apenas para ações críticas</span>
          </p>
        </div>
      </div>
    </JumperBackground>
  );
};

export default DesignSystem;