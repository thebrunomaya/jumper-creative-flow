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
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <JumperButton variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </JumperButton>
            </Link>
            
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <JumperLogo size="md" />
            </div>
            
            <ThemeToggle variant="full" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-12">
        {/* Título */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Design System</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Documentação visual dos componentes oficiais da Jumper Studio
          </p>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent-critical/20 text-accent-critical text-sm font-medium">
            Versão 1.8 • Dark Mode Unificado e Consistência Visual
          </div>
        </div>

        {/* Consolidação das Decisões Recentes */}
        <JumperCard className="shadow-lg border border-border/20 bg-card/80 backdrop-blur-sm">
          <JumperCardHeader>
            <JumperCardTitle>📋 Decisões de Design v1.8</JumperCardTitle>
            <JumperCardDescription>
              Dark Mode unificado e consistência visual aprimorada
            </JumperCardDescription>
          </JumperCardHeader>
          <JumperCardContent>
            <div className="space-y-6">
              {/* Principais Mudanças v1.8 */}
              <div>
                <h4 className="font-semibold mb-3 text-accent-critical">🚀 Novidades v1.8</h4>
                <div className="grid gap-4">
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-success/10 border border-success/30">
                    <div className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-success">Dark Mode Unificado</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Aplicação usa tema escuro como padrão sempre, tanto no login quanto pós-login
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-accent-subtle/10 border border-accent-border">
                    <div className="w-2 h-2 rounded-full bg-accent-subtle mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-accent-subtle">Design System Tokens</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Uso rigoroso de semantic tokens (HSL) - nunca cores diretas como text-white, bg-black
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border">
                    <div className="w-2 h-2 rounded-full bg-foreground mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium">Componentes Reutilizáveis</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Maximização de reusabilidade - componentes customizados via variants em vez de estilos inline
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border">
                    <div className="w-2 h-2 rounded-full bg-foreground mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium">Consistência de Layout</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Alinhamentos padronizados e hierarquia visual clara em todos os componentes
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border">
                    <div className="w-2 h-2 rounded-full bg-foreground mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium">Shadcn Customizado</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Componentes shadcn editados para seguir o design system - criação de variants apropriados
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Princípios de Design v1.8 */}
              <div>
                <h4 className="font-semibold mb-3">🎯 Princípios Fundamentais v1.8</h4>
                <div className="space-y-3">
                  <div className="bg-accent-critical/10 border border-accent-critical/30 rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold text-accent-critical">🎨 Design System First:</span> 
                      <span className="text-muted-foreground ml-2">Tudo definido em index.css e tailwind.config.ts - nunca estilos diretos nos componentes</span>
                    </p>
                  </div>
                  
                  <div className="bg-accent-subtle/10 border border-accent-border rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold text-accent-subtle">🌙 Dark Mode Sempre:</span> 
                      <span className="text-muted-foreground ml-2">Tema escuro como padrão global - consistência total na experiência</span>
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 border rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold">♻️ Componentes Inteligentes:</span> 
                      <span className="text-muted-foreground ml-2">Variants bem definidas evitam repetição de código e garantem consistência</span>
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 border rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold">🎭 Contraste Perfeito:</span> 
                      <span className="text-muted-foreground ml-2">Atenção especial aos contrastes dark/light para evitar texto invisível</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Implementação Técnica */}
              <div>
                <h4 className="font-semibold mb-3">⚙️ Implementação Técnica v1.8</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                    <span className="text-muted-foreground">Semantic tokens HSL definidos globalmente em CSS</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                    <span className="text-muted-foreground">ThemeProvider configurado para 'dark' como padrão</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                    <span className="text-muted-foreground">Componentes shadcn customizados com variants específicas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                    <span className="text-muted-foreground">Layout responsivo com max-w-4xl e espaçamentos padronizados</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                    <span className="text-muted-foreground">Glassmorphism e efeitos visuais consistentes</span>
                  </div>
                </div>
              </div>
            </div>
          </JumperCardContent>
        </JumperCard>

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
              Logotipo oficial usando imagens PNG
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
        <JumperCard className="shadow-lg border border-border/20 bg-card/80 backdrop-blur-sm">
          <JumperCardHeader>
            <JumperCardTitle>🃏 JumperCard</JumperCardTitle>
            <JumperCardDescription>
              Cards sofisticados com efeito glass e estado de seleção
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
              Cores sólidas oficiais para backgrounds
            </JumperCardDescription>
          </JumperCardHeader>
          <JumperCardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="h-20 rounded-lg border bg-[hsl(var(--jumper-orange-solid))]">
                <div className="flex items-center justify-center h-full text-white font-medium text-sm">
                  Laranja Jumper
                </div>
              </div>
              <div className="h-20 rounded-lg border bg-[hsl(var(--jumper-purple-solid))]">
                <div className="flex items-center justify-center h-full text-white font-medium text-sm">
                  Roxo Jumper
                </div>
              </div>
              <div className="h-20 rounded-lg border bg-background">
                <div className="flex items-center justify-center h-full text-foreground font-medium text-sm">
                  Background
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              *Apenas cores sólidas são usadas em toda a aplicação
            </p>
          </JumperCardContent>
        </JumperCard>

        {/* Theme Toggle */}
        <JumperCard>
          <JumperCardHeader>
            <JumperCardTitle>🌙 ThemeToggle</JumperCardTitle>
            <JumperCardDescription>
              Toggle entre modo claro e escuro com ícones monocromáticos
            </JumperCardDescription>
          </JumperCardHeader>
          <JumperCardContent>
            <div className="flex flex-wrap items-center gap-4">
              <ThemeToggle variant="icon" />
              <ThemeToggle variant="text" />
              <ThemeToggle variant="full" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Modo atual: <span className="font-semibold">{isDark ? 'Escuro' : 'Claro'}</span> • 
              Ícones: <span className="text-accent-subtle">Sun/Moon (lucide-react)</span>
            </p>
          </JumperCardContent>
        </JumperCard>

        {/* Footer da página */}
        <div className="text-center text-white/60 text-sm">
          <p>Design System oficial da Jumper Studio v1.8</p>
          <p className="mt-2">
            🌙 <span className="text-accent-subtle">Dark Mode unificado</span> • 
            🎨 <span className="text-accent-critical">Semantic tokens HSL</span> • 
            ♻️ <span className="text-white/80">Componentes reutilizáveis</span>
          </p>
          <div className="mt-4 text-xs text-white/40">
            Última atualização: Dark Mode unificado e consistência visual v1.8
          </div>
        </div>
      </div>
    </JumperBackground>
  );
};

export default DesignSystem;