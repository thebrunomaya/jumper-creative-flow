import React, { useState, useEffect } from 'react';
import { JumperBackground } from '@/components/ui/jumper-background';
import { JumperLogo } from '@/components/ui/jumper-logo';
import { JumperButton } from '@/components/ui/jumper-button';
import { JumperCard, JumperCardContent, JumperCardHeader, JumperCardTitle, JumperCardDescription } from '@/components/ui/jumper-card';
import { JumperInput } from '@/components/ui/jumper-input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useJumperTheme } from '@/hooks/use-jumper-theme';
import { GradientThumbnailDemo } from '@/components/GradientThumbnailDemo';
import { ArrowLeft, Heart, Star, Settings, Download, Upload, Image, Layers, Zap, HardDrive, Palette, Code2, FileImage, Cpu } from 'lucide-react';
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

        {/* Sistema de Gradientes Orgânicos */}
        <JumperCard className="shadow-lg border border-border/20 bg-card/80 backdrop-blur-sm">
          <JumperCardHeader>
            <JumperCardTitle className="flex items-center">
              <Image className="w-5 h-5 mr-2" />
              Sistema de Gradientes Orgânicos
            </JumperCardTitle>
            <JumperCardDescription>
              7 gradientes orgânicos armazenados localmente com sistema de crop inteligente para diferentes formatos
            </JumperCardDescription>
          </JumperCardHeader>
          <JumperCardContent>
            <div className="space-y-6">
              {/* Assets Internos */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <FileImage className="w-4 h-4 mr-2" />
                  Assets Internos
                </h4>
                <div className="bg-muted/20 rounded-lg p-4 border">
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                      <span className="text-muted-foreground">7 gradientes: <code className="bg-muted/50 px-1 rounded">organic-01.png</code> a <code className="bg-muted/50 px-1 rounded">organic-07.png</code></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                      <span className="text-muted-foreground">Armazenados em <code className="bg-muted/50 px-1 rounded">src/assets/gradients/</code></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                      <span className="text-muted-foreground">Importados como ES6 modules - não URLs externas</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                      <span className="text-muted-foreground">Definidos como CSS variables: <code className="bg-muted/50 px-1 rounded">--gradient-01</code> a <code className="bg-muted/50 px-1 rounded">--gradient-07</code></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sistema de Crops */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Layers className="w-4 h-4 mr-2" />
                  Sistema de Crops Automáticos
                </h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <GradientThumbnailDemo format="square" />
                  <GradientThumbnailDemo format="vertical" />
                  <GradientThumbnailDemo format="horizontal" />
                  <GradientThumbnailDemo format="square" carouselMode={true} carouselAspectRatio="1:1" />
                  <GradientThumbnailDemo format="square" carouselMode={true} carouselAspectRatio="4:5" />
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Cada formato usa uma região específica do gradiente orgânico para criar thumbnails otimizados automaticamente via <code className="bg-muted/50 px-1 rounded">gradientCropper.ts</code>
                </p>
              </div>

              {/* Performance e Cache */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <HardDrive className="w-4 h-4 mr-2" />
                  Cache e Performance
                </h4>
                <div className="space-y-3">
                  <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold text-success">Lazy Loading:</span> 
                      <span className="text-muted-foreground ml-2">Hook <code className="bg-muted/50 px-1 rounded">useLazyThumbnail</code> carrega thumbnails apenas quando visíveis</span>
                    </p>
                  </div>
                  <div className="bg-accent-subtle/10 border border-accent-border rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold text-accent-subtle">Cache Inteligente:</span> 
                      <span className="text-muted-foreground ml-2">Thumbnails são cachados por 5 minutos via <code className="bg-muted/50 px-1 rounded">thumbnailCache.ts</code></span>
                    </p>
                  </div>
                  <div className="bg-muted/30 border rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold">Intersection Observer:</span> 
                      <span className="text-muted-foreground ml-2">Detecta visibilidade com 50px de antecedência para UX fluida</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </JumperCardContent>
        </JumperCard>

        {/* Componentes Jumper Customizados */}
        <JumperCard className="shadow-lg border border-border/20 bg-card/80 backdrop-blur-sm">
          <JumperCardHeader>
            <JumperCardTitle className="flex items-center">
              <Code2 className="w-5 h-5 mr-2" />
              Componentes Jumper Customizados
            </JumperCardTitle>
            <JumperCardDescription>
              Suite completa de componentes reutilizáveis com variants inteligentes e design system integrado
            </JumperCardDescription>
          </JumperCardHeader>
          <JumperCardContent>
            <div className="space-y-6">
              {/* JumperBackground */}
              <div>
                <h4 className="font-semibold mb-3">🌈 JumperBackground</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((variant) => (
                    <div key={variant} className="text-center space-y-2">
                      <div className="h-16 rounded-lg border relative overflow-hidden">
                        <JumperBackground variant={variant as 1|2|3|4|5|6|7} className="!min-h-0 h-full">
                          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                            V{variant}
                          </div>
                        </JumperBackground>
                      </div>
                      <p className="text-xs text-muted-foreground">Variant {variant}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-muted/20 rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Props:</strong> <code className="bg-muted/50 px-1 rounded">variant={'{1-7}'}</code> • 
                    <code className="bg-muted/50 px-1 rounded">overlay={'{true|false}'}</code> • 
                    Overlay escuro automático para contraste
                  </p>
                </div>
              </div>

              {/* JumperButton */}
              <div>
                <h4 className="font-semibold mb-3">🔘 JumperButton</h4>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <JumperButton variant="primary">Primary</JumperButton>
                    <JumperButton variant="secondary">Secondary</JumperButton>
                    <JumperButton variant="ghost">Ghost</JumperButton>
                    <JumperButton variant="critical">Critical</JumperButton>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <JumperButton size="sm">Small</JumperButton>
                    <JumperButton size="default">Default</JumperButton>
                    <JumperButton size="lg">Large</JumperButton>
                    <JumperButton size="icon" variant="primary"><Heart className="w-4 h-4" /></JumperButton>
                  </div>
                </div>
                <div className="mt-4 bg-muted/20 rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Variants:</strong> primary (slate→orange hover), secondary, ghost, critical • 
                    <strong>Sizes:</strong> sm, default, lg, icon
                  </p>
                </div>
              </div>

              {/* JumperCard */}
              <div>
                <h4 className="font-semibold mb-3">🃏 JumperCard</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <JumperCard>
                    <JumperCardHeader>
                      <JumperCardTitle className="text-base">Card Normal</JumperCardTitle>
                      <JumperCardDescription>Estado padrão do card</JumperCardDescription>
                    </JumperCardHeader>
                    <JumperCardContent>
                      <p className="text-sm text-muted-foreground">Conteúdo do card sem seleção</p>
                    </JumperCardContent>
                  </JumperCard>
                  <JumperCard selected={true}>
                    <JumperCardHeader>
                      <JumperCardTitle className="text-base">Card Selecionado</JumperCardTitle>
                      <JumperCardDescription>Estado com selected=true</JumperCardDescription>
                    </JumperCardHeader>
                    <JumperCardContent>
                      <p className="text-sm text-muted-foreground">Border accent e shadow automáticos</p>
                    </JumperCardContent>
                  </JumperCard>
                </div>
                <div className="mt-4 bg-muted/20 rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Props:</strong> <code className="bg-muted/50 px-1 rounded">selected={'{true|false}'}</code> • 
                    Background sólido sem glassmorphism • Hover states automáticos
                  </p>
                </div>
              </div>

              {/* JumperInput */}
              <div>
                <h4 className="font-semibold mb-3">📝 JumperInput</h4>
                <div className="space-y-4 max-w-md">
                  <JumperInput label="Input Normal" placeholder="Digite algo..." />
                  <JumperInput label="Input com Erro" placeholder="Campo inválido" error="Este campo é obrigatório" />
                  <JumperInput label="Input Desabilitado" placeholder="Desabilitado" disabled />
                </div>
                <div className="mt-4 bg-muted/20 rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Props:</strong> <code className="bg-muted/50 px-1 rounded">error=(boolean|string)</code> • 
                    <code className="bg-muted/50 px-1 rounded">onChange=(value) =&gt; void</code> • 
                    Focus accent sutil automático
                  </p>
                </div>
              </div>

              {/* JumperLogo */}
              <div>
                <h4 className="font-semibold mb-3">🚀 JumperLogo</h4>
                <div className="flex flex-wrap items-center gap-6">
                  <JumperLogo size="sm" showText={true} />
                  <JumperLogo size="md" showText={true} />
                  <JumperLogo size="lg" showText={true} />
                  <JumperLogo size="md" showText={false} />
                </div>
                <div className="mt-4 bg-muted/20 rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Props:</strong> <code className="bg-muted/50 px-1 rounded">size={'{sm|md|lg}'}</code> • 
                    <code className="bg-muted/50 px-1 rounded">showText={'{true|false}'}</code> • 
                    <code className="bg-muted/50 px-1 rounded">theme={'auto|light|dark'}</code> • 
                    Auto-detecção de tema
                  </p>
                </div>
              </div>
            </div>
          </JumperCardContent>
        </JumperCard>

        {/* Hooks e Utilities Especializados */}
        <JumperCard className="shadow-lg border border-border/20 bg-card/80 backdrop-blur-sm">
          <JumperCardHeader>
            <JumperCardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Hooks e Utilities Especializados
            </JumperCardTitle>
            <JumperCardDescription>
              Lógica reutilizável para gestão de tema, cache, validação e formulários complexos
            </JumperCardDescription>
          </JumperCardHeader>
          <JumperCardContent>
            <div className="space-y-6">
              {/* useJumperTheme */}
              <div>
                <h4 className="font-semibold mb-3">🎨 useJumperTheme</h4>
                <div className="bg-muted/20 rounded-lg p-4 border">
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                      <span className="text-muted-foreground">Gestão centralizada de tema dark/light com cores oficiais</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                      <span className="text-muted-foreground">Retorna: <code className="bg-muted/50 px-1 rounded">colors</code>, <code className="bg-muted/50 px-1 rounded">isDark</code>, <code className="bg-muted/50 px-1 rounded">toggleTheme</code>, <code className="bg-muted/50 px-1 rounded">getThemeClasses</code></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                      <span className="text-muted-foreground">Cores pré-definidas: Jumper Orange, Purple, Black, White, Gray variants</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* useLazyThumbnail */}
              <div>
                <h4 className="font-semibold mb-3">⚡ useLazyThumbnail</h4>
                <div className="bg-muted/20 rounded-lg p-4 border">
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-subtle"></div>
                      <span className="text-muted-foreground">Intersection Observer para carregamento lazy de thumbnails</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-subtle"></div>
                      <span className="text-muted-foreground">Props: <code className="bg-muted/50 px-1 rounded">format</code>, <code className="bg-muted/50 px-1 rounded">carouselMode</code>, <code className="bg-muted/50 px-1 rounded">carouselAspectRatio</code>, <code className="bg-muted/50 px-1 rounded">enabled</code></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-subtle"></div>
                      <span className="text-muted-foreground">Retorna: <code className="bg-muted/50 px-1 rounded">ref</code>, <code className="bg-muted/50 px-1 rounded">thumbnailSrc</code>, <code className="bg-muted/50 px-1 rounded">isLoading</code>, <code className="bg-muted/50 px-1 rounded">error</code></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* useCreativeForm & useCreativeSubmission */}
              <div>
                <h4 className="font-semibold mb-3">📋 useCreativeForm & useCreativeSubmission</h4>
                <div className="bg-muted/20 rounded-lg p-4 border">
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning"></div>
                      <span className="text-muted-foreground">Gestão de formulários complexos multi-step com validação</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning"></div>
                      <span className="text-muted-foreground">Estados: formData, errors, validateStep, updateFormData</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning"></div>
                      <span className="text-muted-foreground">Integração com Supabase para submissão e Notion API</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Utils */}
              <div>
                <h4 className="font-semibold mb-3">🔧 Utilities</h4>
                <div className="space-y-3">
                  <div className="bg-muted/30 border rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold">thumbnailUtils.ts:</span> 
                      <span className="text-muted-foreground ml-2">Geração, cache e dimensionamento de thumbnails</span>
                    </p>
                  </div>
                  <div className="bg-muted/30 border rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold">gradientCropper.ts:</span> 
                      <span className="text-muted-foreground ml-2">Crop inteligente de gradientes por formato</span>
                    </p>
                  </div>
                  <div className="bg-muted/30 border rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold">thumbnailCache.ts:</span> 
                      <span className="text-muted-foreground ml-2">Cache Map com TTL de 5 minutos e limpeza automática</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </JumperCardContent>
        </JumperCard>

        {/* Arquitetura Técnica */}
        <JumperCard className="shadow-lg border border-border/20 bg-card/80 backdrop-blur-sm">
          <JumperCardHeader>
            <JumperCardTitle className="flex items-center">
              <Cpu className="w-5 h-5 mr-2" />
              Arquitetura Técnica
            </JumperCardTitle>
            <JumperCardDescription>
              Estrutura de código, padrões de desenvolvimento e integração com tecnologias modernas
            </JumperCardDescription>
          </JumperCardHeader>
          <JumperCardContent>
            <div className="space-y-6">
              {/* Estrutura de Pastas */}
              <div>
                <h4 className="font-semibold mb-3">📁 Estrutura Padronizada</h4>
                <div className="bg-muted/20 rounded-lg p-4 border font-mono text-sm">
                  <div className="space-y-1 text-muted-foreground">
                    <div>src/</div>
                    <div>├── components/</div>
                    <div>│   ├── ui/ <span className="text-accent-subtle"># Componentes base (shadcn + Jumper)</span></div>
                    <div>│   ├── sections/ <span className="text-accent-subtle"># Seções de página</span></div>
                    <div>│   └── [Feature].tsx <span className="text-accent-subtle"># Componentes específicos</span></div>
                    <div>├── hooks/ <span className="text-accent-subtle"># Lógica reutilizável</span></div>
                    <div>├── utils/ <span className="text-accent-subtle"># Utilities puras</span></div>
                    <div>├── assets/ <span className="text-accent-subtle"># Recursos estáticos</span></div>
                    <div>│   ├── gradients/ <span className="text-accent-subtle"># organic-01.png a organic-07.png</span></div>
                    <div>│   ├── fonts/ <span className="text-accent-subtle"># Haffer Variable + Italic</span></div>
                    <div>│   └── logos/ <span className="text-accent-subtle"># Jumper PNG assets</span></div>
                    <div>└── pages/ <span className="text-accent-subtle"># Páginas da aplicação</span></div>
                  </div>
                </div>
              </div>

              {/* Padrões de Código */}
              <div>
                <h4 className="font-semibold mb-3">💻 Padrões de Desenvolvimento</h4>
                <div className="space-y-3">
                  <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold text-success">Semantic Tokens:</span> 
                      <span className="text-muted-foreground ml-2">Todas as cores via HSL variables definidas em index.css</span>
                    </p>
                  </div>
                  <div className="bg-accent-subtle/10 border border-accent-border rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold text-accent-subtle">Class Variance Authority:</span> 
                      <span className="text-muted-foreground ml-2">Variants tipadas com cva() para todos os Jumper components</span>
                    </p>
                  </div>
                  <div className="bg-muted/30 border rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold">TypeScript Strict:</span> 
                      <span className="text-muted-foreground ml-2">Tipagem rigorosa para props, hooks e utilities</span>
                    </p>
                  </div>
                  <div className="bg-muted/30 border rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold">ES6 Modules:</span> 
                      <span className="text-muted-foreground ml-2">Import/export limpo - sem require() ou URLs externas</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div>
                <h4 className="font-semibold mb-3">⚡ Performance e Otimização</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="font-medium text-accent-critical">Frontend</h5>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                        <span className="text-muted-foreground">Lazy loading de componentes</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                        <span className="text-muted-foreground">Intersection Observer</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                        <span className="text-muted-foreground">Cache inteligente de thumbnails</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                        <span className="text-muted-foreground">Tree-shaking automático</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-accent-subtle">Assets</h5>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-subtle"></div>
                        <span className="text-muted-foreground">Fonts preload automático</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-subtle"></div>
                        <span className="text-muted-foreground">Gradientes locais otimizados</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-subtle"></div>
                        <span className="text-muted-foreground">PNG logos comprimidos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-subtle"></div>
                        <span className="text-muted-foreground">Vite bundling otimizado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stack Tecnológico */}
              <div>
                <h4 className="font-semibold mb-3">🛠️ Stack Tecnológico</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-muted/20 rounded-lg p-3 border text-center">
                    <p className="font-medium text-sm">React 18</p>
                    <p className="text-xs text-muted-foreground">Hooks + FC</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 border text-center">
                    <p className="font-medium text-sm">TypeScript</p>
                    <p className="text-xs text-muted-foreground">Strict mode</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 border text-center">
                    <p className="font-medium text-sm">Tailwind CSS</p>
                    <p className="text-xs text-muted-foreground">Design tokens</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 border text-center">
                    <p className="font-medium text-sm">Shadcn/ui</p>
                    <p className="text-xs text-muted-foreground">Customizado</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 border text-center">
                    <p className="font-medium text-sm">Vite</p>
                    <p className="text-xs text-muted-foreground">Build tool</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 border text-center">
                    <p className="font-medium text-sm">Supabase</p>
                    <p className="text-xs text-muted-foreground">Backend</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 border text-center">
                    <p className="font-medium text-sm">Lucide React</p>
                    <p className="text-xs text-muted-foreground">Ícones</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 border text-center">
                    <p className="font-medium text-sm">React Router</p>
                    <p className="text-xs text-muted-foreground">Navegação</p>
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