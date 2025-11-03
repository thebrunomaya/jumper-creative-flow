import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, Save, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const deckFormSchema = z.object({
  account_id: z.string().min(1, "Selecione uma conta"),
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  type: z.enum(["report", "plan", "pitch"], {
    required_error: "Selecione um tipo de deck",
  }),
  brand_identity: z.enum(["jumper", "koko"], {
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

interface Account {
  id: string;
  name: string;
}

const TEMPLATES = [
  { id: "moldura-minuto", name: "Moldura Minuto", description: "Template para relatório mensal" },
  { id: "plan-template", name: "Planejamento", description: "Template para planejamento estratégico" },
  { id: "pitch-template", name: "Pitch", description: "Template para apresentação de pitch" },
];

export function DeckConfigForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: DeckConfigFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
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

  // Load user accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoadingAccounts(true);

        const { data, error } = await supabase.functions.invoke("j_hub_user_accounts");

        if (error) throw error;
        if (!data || data.success !== true) {
          throw new Error(data?.error || "Falha ao carregar contas");
        }

        const accountsList: Account[] = (data.accounts || []).map((acc: any) => ({
          id: acc.id,
          name: acc.name,
        }));

        setAccounts(accountsList);
      } catch (err: any) {
        console.error("Error loading accounts:", err);
        toast.error("Erro ao carregar contas", {
          description: err.message,
        });
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, []);

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
                      <Select
                        disabled={loadingAccounts || isSubmitting}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a conta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <FormLabel>Template</FormLabel>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TEMPLATES.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{template.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {template.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Template HTML base para o deck
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
