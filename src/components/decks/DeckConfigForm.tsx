import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMyNotionAccounts } from "@/hooks/useMyNotionAccounts";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrioritizedAccountSelect } from "@/components/shared/PrioritizedAccountSelect";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const deckFormSchema = z.object({
  account_id: z.string().min(1, "Selecione uma conta"),
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  type: z.enum(["report", "plan", "pitch"], {
    required_error: "Selecione um tipo de deck",
  }),
  brand_identity: z.enum(["jumper", "koko", "general"], {
    required_error: "Selecione uma identidade de marca",
  }),
  template_id: z.string().min(1, "Selecione um template"),
  markdown_source: z.string().min(100, "Conteúdo markdown deve ter no mínimo 100 caracteres"),
});

type DeckFormValues = z.infer<typeof deckFormSchema>;

interface DeckConfigFormProps {
  initialValues?: Partial<DeckFormValues>;
  onSubmit: (values: DeckFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const AVAILABLE_TEMPLATES = [
  // Jumper templates
  { id: "jumper-flare", name: "Jumper Flare", identity: "jumper", description: "Template moderno para apresentações e relatórios" },

  // Koko templates
  { id: "koko-rebel", name: "Koko Rebel", identity: "koko", description: "Template criativo e ousado" },
  { id: "koko-classic", name: "Koko Classic", identity: "koko", description: "Template clássico com estética punk e editorial" },

  // General templates
  { id: "general-animated-gradients", name: "Animated Gradients", identity: "general", description: "Gradientes animados e dinâmicos" },
  { id: "general-apple-keynote-style", name: "Apple Keynote Style", identity: "general", description: "Estilo Apple Keynote clássico" },
  { id: "general-apple-keynote-style-light", name: "Apple Keynote Light", identity: "general", description: "Keynote estilo Apple (tema claro)" },
  { id: "general-apple-minimal", name: "Apple Minimal", identity: "general", description: "Minimalismo inspirado na Apple" },
  { id: "general-black-neon-glow", name: "Black Neon Glow", identity: "general", description: "Neon vibrante em fundo escuro" },
  { id: "general-blue-background-modal", name: "Blue Background Modal", identity: "general", description: "Modal com fundo azul moderno" },
  { id: "general-brutalist", name: "Brutalist", identity: "general", description: "Design brutalista e impactante" },
  { id: "general-cluely-3d-style", name: "Cluely 3D Style", identity: "general", description: "Elementos 3D modernos" },
  { id: "general-cluely-style", name: "Cluely Style", identity: "general", description: "Estilo Cluely limpo e profissional" },
  { id: "general-cyberpunk-neon", name: "Cyberpunk Neon", identity: "general", description: "Estética cyberpunk futurista" },
  { id: "general-dark-glowing-style", name: "Dark Glowing", identity: "general", description: "Elementos brilhantes em fundo escuro" },
  { id: "general-dark-mode-pro", name: "Dark Mode Pro", identity: "general", description: "Dark mode profissional" },
  { id: "general-editorial-magazine", name: "Editorial Magazine", identity: "general", description: "Layout estilo revista editorial" },
  { id: "general-glassmorphism", name: "Glassmorphism", identity: "general", description: "Efeito de vidro moderno" },
  { id: "general-hand-drawn-sketch", name: "Hand Drawn Sketch", identity: "general", description: "Estilo desenhado à mão" },
  { id: "general-isometric-3d", name: "Isometric 3D", identity: "general", description: "Perspectiva isométrica 3D" },
  { id: "general-liquid-metal", name: "Liquid Metal", identity: "general", description: "Efeitos de metal líquido" },
  { id: "general-memphis-design", name: "Memphis Design", identity: "general", description: "Design Memphis colorido" },
  { id: "general-minimalist-clean", name: "Minimalist Clean", identity: "general", description: "Minimalismo limpo e elegante" },
  { id: "general-modern-modal-style", name: "Modern Modal", identity: "general", description: "Modal moderno e profissional" },
  { id: "general-modern-saas-dark", name: "Modern SaaS Dark", identity: "general", description: "Estilo SaaS moderno (dark)" },
  { id: "general-modern-tech-startup", name: "Modern Tech Startup", identity: "general", description: "Visual de startup tecnológica" },
  { id: "general-neumorphism", name: "Neumorphism", identity: "general", description: "Neumorfismo suave" },
  { id: "general-old-vide-game", name: "Old Video Game", identity: "general", description: "Estilo videogame retrô" },
  { id: "general-old-video-game2", name: "Old Video Game 2", identity: "general", description: "Videogame retrô alternativo" },
  { id: "general-retro-synthwave", name: "Retro Synthwave", identity: "general", description: "Synthwave anos 80" },
  { id: "general-simple-colors-style", name: "Simple Colors", identity: "general", description: "Cores simples e vibrantes" },
  { id: "general-swiss-design", name: "Swiss Design", identity: "general", description: "Design suíço clássico" },
  { id: "general-terminal-code", name: "Terminal Code", identity: "general", description: "Estilo terminal de código" },
  { id: "general-white-with-pops-of-color", name: "White with Pops of Color", identity: "general", description: "Branco com toques de cor" },
];

export function DeckConfigForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: DeckConfigFormProps) {
  const { accounts, loading: loadingAccounts } = useMyNotionAccounts();
  const { userRole } = useUserRole();
  const { currentUser } = useAuth();
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<DeckFormValues>({
    resolver: zodResolver(deckFormSchema),
    defaultValues: {
      account_id: initialValues?.account_id || "",
      title: initialValues?.title || "",
      type: initialValues?.type || "report",
      brand_identity: initialValues?.brand_identity || "jumper",
      template_id: initialValues?.template_id || "",
      markdown_source: initialValues?.markdown_source || "",
    },
  });

  // Watch brand_identity to filter templates dynamically
  const selectedIdentity = form.watch("brand_identity");

  // Filter templates based on selected identity
  const getFilteredTemplates = () => {
    const recommended = AVAILABLE_TEMPLATES.filter(
      (t) => t.identity === selectedIdentity
    );
    const others = AVAILABLE_TEMPLATES.filter(
      (t) => t.identity !== selectedIdentity
    );
    return { recommended, others };
  };

  const { recommended, others } = getFilteredTemplates();

  // Helper to format identity name for display
  const formatIdentity = (identity: string) => {
    if (identity === "general") return "Geral";
    return identity.charAt(0).toUpperCase() + identity.slice(1);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".md")) {
      toast.error("Arquivo inválido", {
        description: "Por favor, selecione um arquivo .md (markdown)",
      });
      return;
    }

    try {
      const text = await file.text();
      form.setValue("markdown_source", text, { shouldValidate: true });
      toast.success("Arquivo carregado com sucesso!");
    } catch (err) {
      console.error("Error reading file:", err);
      toast.error("Erro ao ler arquivo");
    }
  };

  const handleSubmit = async (values: DeckFormValues) => {
    try {
      await onSubmit(values);
    } catch (err: any) {
      console.error("Form submission error:", err);
      toast.error("Erro ao salvar deck", {
        description: err.message,
      });
    }
  };

  const markdownValue = form.watch("markdown_source");
  const wordCount = markdownValue.split(/\s+/).filter(Boolean).length;
  const charCount = markdownValue.length;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Configure as informações principais do deck
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Account */}
                <FormField
                  control={form.control}
                  name="account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta</FormLabel>
                      <FormControl>
                        <PrioritizedAccountSelect
                          accounts={accounts}
                          loading={loadingAccounts}
                          value={field.value}
                          onChange={field.onChange}
                          userEmail={currentUser?.email}
                          userRole={userRole}
                          placeholder="Selecione a conta"
                          disabled={isSubmitting}
                          showAllOption={false}
                          showInactiveToggle={false}
                        />
                      </FormControl>
                      <FormDescription>
                        Conta para a qual o deck será gerado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Relatório de Performance - Outubro 2024"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Nome do deck (será exibido no cabeçalho)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type and Identity Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Type */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Deck</FormLabel>
                        <Select
                          disabled={isSubmitting}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="report">Relatório</SelectItem>
                            <SelectItem value="plan">Planejamento</SelectItem>
                            <SelectItem value="pitch">Pitch</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Brand Identity */}
                  <FormField
                    control={form.control}
                    name="brand_identity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identidade de Marca</FormLabel>
                        <Select
                          disabled={isSubmitting}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a marca" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="jumper">Jumper</SelectItem>
                            <SelectItem value="koko">Koko</SelectItem>
                            <SelectItem value="general">Geral</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Template */}
                <FormField
                  control={form.control}
                  name="template_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estilo Visual</FormLabel>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estilo visual" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[400px]">
                          {/* Recommended templates */}
                          {recommended.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>
                                Recomendados para {formatIdentity(selectedIdentity)}
                              </SelectLabel>
                              {recommended.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {template.name} ({formatIdentity(template.identity)})
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {template.description}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}

                          {/* Separator if we have both sections */}
                          {recommended.length > 0 && others.length > 0 && (
                            <SelectSeparator />
                          )}

                          {/* Other templates */}
                          {others.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Outros estilos</SelectLabel>
                              {others.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {template.name} ({formatIdentity(template.identity)})
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {template.description}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Template HTML que define o visual do deck (compatível com qualquer identidade)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo Markdown</CardTitle>
                <CardDescription>
                  Cole o conteúdo em markdown ou faça upload de um arquivo .md
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File upload */}
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => document.getElementById("markdown-file")?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Carregar Arquivo .md
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Ocultar Preview
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Mostrar Preview
                      </>
                    )}
                  </Button>

                  <input
                    id="markdown-file"
                    type="file"
                    accept=".md"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Markdown textarea */}
                <FormField
                  control={form.control}
                  name="markdown_source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="# Título do Slide 1&#10;&#10;Conteúdo do slide...&#10;&#10;---&#10;&#10;# Título do Slide 2&#10;&#10;Mais conteúdo..."
                          disabled={isSubmitting}
                          className="min-h-[400px] font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="flex items-center justify-between">
                        <span>Use markdown para estruturar o conteúdo do deck</span>
                        <span className="text-xs">
                          {charCount} caracteres | {wordCount} palavras
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Preview */}
                {showPreview && markdownValue && (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <div className="prose prose-sm max-w-none mt-2">
                        <pre className="whitespace-pre-wrap text-xs">{markdownValue}</pre>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form actions */}
        <div className="flex items-center justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando Deck...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Gerar Deck
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
