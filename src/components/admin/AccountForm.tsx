/**
 * AccountForm - Form for editing account data with tabs
 */

import { useState, useEffect } from "react";
import { NotionAccount } from "@/hooks/useMyNotionAccounts";
import { AccountUpdates, useAccountUpdate } from "@/hooks/useAccountUpdate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Loader2 } from "lucide-react";

interface AccountFormProps {
  account: NotionAccount;
  onSuccess: () => void;
  onCancel: () => void;
}

const STATUS_OPTIONS = ["Ativo", "Inativo", "Pausado"];

const OBJETIVOS_OPTIONS = [
  "Vendas",
  "Tráfego",
  "Leads",
  "Engajamento",
  "Reconhecimento",
  "Alcance",
  "Video",
  "Conversões",
  "Seguidores",
  "Conversas",
  "Cadastros",
];

const PAYMENT_OPTIONS = ["Boleto", "Cartão", "Faturamento", "Misto"];

export function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const { updateAccount, isUpdating } = useAccountUpdate();

  // Form state
  const [formData, setFormData] = useState({
    Conta: account.name || "",
    Status: account.status || "Ativo",
    Tier: account.tier ? parseInt(account.tier) : 3,
    Objetivos: account.objectives || [],
    Nicho: [] as string[],
    Gestor: account.gestor_email || "",
    Atendimento: account.atendimento_email || "",
    "ID Meta Ads": account.meta_ads_id || "",
    "ID Google Ads": account.id_google_ads || "",
    "ID Tiktok Ads": "",
    "ID Google Analytics": "",
    "Contexto para Otimizacao": account.contexto_otimizacao || "",
    "Contexto para Transcricao": account.contexto_transcricao || "",
    "Metodo de Pagamento": account.payment_method || "",
    "META: Verba Mensal": "",
    "G-ADS: Verba Mensal": "",
  });

  // Track which fields have changed
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setChangedFields(prev => new Set(prev).add(field));
  };

  const handleAddObjetivo = (objetivo: string) => {
    if (!formData.Objetivos.includes(objetivo)) {
      handleFieldChange("Objetivos", [...formData.Objetivos, objetivo]);
    }
  };

  const handleRemoveObjetivo = (objetivo: string) => {
    handleFieldChange(
      "Objetivos",
      formData.Objetivos.filter(o => o !== objetivo)
    );
  };

  const handleSubmit = async () => {
    // Only send changed fields
    const updates: AccountUpdates = {};

    changedFields.forEach(field => {
      (updates as any)[field] = (formData as any)[field];
    });

    if (Object.keys(updates).length === 0) {
      onCancel();
      return;
    }

    const result = await updateAccount(account.id, updates);

    if (result.success) {
      onSuccess();
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basico" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basico">Básico</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="plataformas">Plataformas</TabsTrigger>
          <TabsTrigger value="ai">AI Context</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>

        {/* Aba Básico */}
        <TabsContent value="basico" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="conta">Nome da Conta</Label>
            <Input
              id="conta"
              value={formData.Conta}
              onChange={e => handleFieldChange("Conta", e.target.value)}
              placeholder="Nome da conta"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.Status}
                onValueChange={value => handleFieldChange("Status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier">Tier (1-5)</Label>
              <Input
                id="tier"
                type="number"
                min={1}
                max={5}
                value={formData.Tier}
                onChange={e => handleFieldChange("Tier", parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Objetivos</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.Objetivos.map(obj => (
                <Badge key={obj} variant="secondary" className="gap-1">
                  {obj}
                  <button
                    type="button"
                    onClick={() => handleRemoveObjetivo(obj)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Select onValueChange={handleAddObjetivo}>
              <SelectTrigger>
                <SelectValue placeholder="Adicionar objetivo" />
              </SelectTrigger>
              <SelectContent>
                {OBJETIVOS_OPTIONS.filter(o => !formData.Objetivos.includes(o)).map(obj => (
                  <SelectItem key={obj} value={obj}>
                    {obj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Aba Equipe */}
        <TabsContent value="equipe" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="gestor">Gestor (emails separados por vírgula)</Label>
            <Textarea
              id="gestor"
              value={formData.Gestor}
              onChange={e => handleFieldChange("Gestor", e.target.value)}
              placeholder="gestor1@jumper.studio, gestor2@jumper.studio"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="atendimento">Atendimento (emails separados por vírgula)</Label>
            <Textarea
              id="atendimento"
              value={formData.Atendimento}
              onChange={e => handleFieldChange("Atendimento", e.target.value)}
              placeholder="atend1@jumper.studio, atend2@jumper.studio"
              rows={2}
            />
          </div>
        </TabsContent>

        {/* Aba Plataformas */}
        <TabsContent value="plataformas" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="metaAds">ID Meta Ads</Label>
            <Input
              id="metaAds"
              value={formData["ID Meta Ads"]}
              onChange={e => handleFieldChange("ID Meta Ads", e.target.value)}
              placeholder="1234567890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleAds">ID Google Ads</Label>
            <Input
              id="googleAds"
              value={formData["ID Google Ads"]}
              onChange={e => handleFieldChange("ID Google Ads", e.target.value)}
              placeholder="123-456-7890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktokAds">ID TikTok Ads</Label>
            <Input
              id="tiktokAds"
              value={formData["ID Tiktok Ads"]}
              onChange={e => handleFieldChange("ID Tiktok Ads", e.target.value)}
              placeholder="ID da conta TikTok"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ga">ID Google Analytics</Label>
            <Input
              id="ga"
              value={formData["ID Google Analytics"]}
              onChange={e => handleFieldChange("ID Google Analytics", e.target.value)}
              placeholder="G-XXXXXXXXXX"
            />
          </div>
        </TabsContent>

        {/* Aba AI Context */}
        <TabsContent value="ai" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="contextoOtimizacao">Contexto para Otimização</Label>
            <p className="text-xs text-muted-foreground">
              Usado pela IA ao analisar gravações de otimização
            </p>
            <Textarea
              id="contextoOtimizacao"
              value={formData["Contexto para Otimizacao"]}
              onChange={e => handleFieldChange("Contexto para Otimizacao", e.target.value)}
              placeholder="Descreva o contexto da conta, produtos, público-alvo..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contextoTranscricao">Contexto para Transcrição</Label>
            <p className="text-xs text-muted-foreground">
              Usado pelo Whisper para melhorar a transcrição de áudio
            </p>
            <Textarea
              id="contextoTranscricao"
              value={formData["Contexto para Transcricao"]}
              onChange={e => handleFieldChange("Contexto para Transcricao", e.target.value)}
              placeholder="Termos específicos, nomes de campanhas, produtos..."
              rows={4}
            />
          </div>
        </TabsContent>

        {/* Aba Financeiro */}
        <TabsContent value="financeiro" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="pagamento">Método de Pagamento</Label>
            <Select
              value={formData["Metodo de Pagamento"]}
              onValueChange={value => handleFieldChange("Metodo de Pagamento", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_OPTIONS.map(method => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="verbaMeta">META: Verba Mensal</Label>
              <Input
                id="verbaMeta"
                value={formData["META: Verba Mensal"]}
                onChange={e => handleFieldChange("META: Verba Mensal", e.target.value)}
                placeholder="R$ 10.000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="verbaGoogle">G-ADS: Verba Mensal</Label>
              <Input
                id="verbaGoogle"
                value={formData["G-ADS: Verba Mensal"]}
                onChange={e => handleFieldChange("G-ADS: Verba Mensal", e.target.value)}
                placeholder="R$ 5.000"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isUpdating}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isUpdating || changedFields.size === 0}>
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Alterações"
          )}
        </Button>
      </div>

      {changedFields.size > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {changedFields.size} campo(s) modificado(s)
        </p>
      )}
    </div>
  );
}
