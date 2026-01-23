/**
 * ReportDispatchControl - Manual dispatch control for daily WhatsApp reports
 *
 * Features:
 * - "Dispatch Now" button to manually trigger daily report
 * - Override phone number input (send to different number for testing)
 * - Test mode toggle (runs report but doesn't send to WhatsApp)
 * - Status display with success/error feedback
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Phone,
  TestTube,
} from "lucide-react";

interface ReportDispatchControlProps {
  accountId: string;
  hasReportEnabled: boolean;
}

interface DispatchResult {
  success: boolean;
  message: string;
  details?: string;
}

export function ReportDispatchControl({
  accountId,
  hasReportEnabled,
}: ReportDispatchControlProps) {
  const [dispatching, setDispatching] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [overridePhone, setOverridePhone] = useState("");
  const [result, setResult] = useState<DispatchResult | null>(null);

  const handleDispatch = async () => {
    setDispatching(true);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        setResult({
          success: false,
          message: "Sessão expirada. Faça login novamente.",
        });
        return;
      }

      const requestBody: Record<string, unknown> = {
        account_id: accountId,
        test_mode: testMode,
      };

      if (overridePhone.trim()) {
        requestBody.override_phone = overridePhone.trim();
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/j_hub_daily_report`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Check if any account had an error
      const accountResult = data.results?.[0];
      if (accountResult?.status === "error") {
        setResult({
          success: false,
          message: "Erro ao gerar relatório",
          details: accountResult.error,
        });
      } else if (accountResult?.status === "success") {
        const details = testMode
          ? "Relatório gerado (modo teste - não enviado ao WhatsApp)"
          : `Relatório enviado para ${accountResult.phones_sent || "números configurados"}`;
        setResult({
          success: true,
          message: "Relatório disparado com sucesso!",
          details,
        });
      } else if (accountResult?.status === "skipped") {
        setResult({
          success: false,
          message: "Relatório não enviado",
          details: accountResult.reason || "Conta não tem dados ou está desabilitada",
        });
      } else {
        setResult({
          success: true,
          message: "Requisição processada",
          details: JSON.stringify(data),
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: "Erro ao disparar relatório",
        details: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setDispatching(false);
    }
  };

  // Don't show if reports not enabled
  if (!hasReportEnabled) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        Ative os relatórios acima para habilitar o disparo manual.
      </div>
    );
  }

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
      <h4 className="font-medium text-sm">Disparo Manual</h4>

      {/* Test mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TestTube className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="testMode" className="text-sm">
            Modo teste (não envia ao WhatsApp)
          </Label>
        </div>
        <Switch
          id="testMode"
          checked={testMode}
          onCheckedChange={setTestMode}
          disabled={dispatching}
        />
      </div>

      {/* Override phone input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="overridePhone" className="text-sm">
            Enviar para outro número (opcional)
          </Label>
        </div>
        <Input
          id="overridePhone"
          type="text"
          placeholder="5521999999999"
          value={overridePhone}
          onChange={(e) => setOverridePhone(e.target.value)}
          disabled={dispatching}
          className="max-w-xs"
        />
        <p className="text-xs text-muted-foreground">
          Deixe vazio para usar os números configurados na conta
        </p>
      </div>

      {/* Dispatch button */}
      <Button
        onClick={handleDispatch}
        disabled={dispatching}
        variant={testMode ? "secondary" : "default"}
      >
        {dispatching ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        {testMode ? "Testar Relatório" : "Disparar Agora"}
      </Button>

      {/* Result message */}
      {result && (
        <div
          className={`flex items-start gap-2 text-sm p-3 rounded ${
            result.success
              ? "text-green-600 bg-green-50 dark:bg-green-950/20"
              : "text-destructive bg-destructive/10"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <div className="font-medium">{result.message}</div>
            {result.details && (
              <div className="text-xs opacity-80 mt-1">{result.details}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
