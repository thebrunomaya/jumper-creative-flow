/**
 * WooCommerceSyncControl - Admin control for WooCommerce sync operations
 *
 * Features:
 * - Display last sync status
 * - "Sync Now" button (yesterday only)
 * - "Backfill" with configurable days
 * - Progress tracking with auto-continue for chunked processing
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Play,
} from "lucide-react";

interface SyncStatus {
  account_id: string;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_orders_count: number | null;
  last_error_message: string | null;
}

interface SyncProgress {
  chunk_start: string;
  chunk_end: string;
  days_in_chunk: number;
  processed_days: number;
  total_days: number;
}

interface SyncResponse {
  message: string;
  completed: boolean;
  next_start_date: string | null;
  progress: SyncProgress;
  results: Array<{
    account: string;
    status: string;
    orders?: number;
    order_rows?: number;
    products?: number;
    error?: string;
  }>;
}

interface WooCommerceSyncControlProps {
  accountId: string;
  hasWooConfig: boolean;
}

export function WooCommerceSyncControl({
  accountId,
  hasWooConfig,
}: WooCommerceSyncControlProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [backfillDays, setBackfillDays] = useState(90);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  // Fetch current sync status
  const fetchSyncStatus = useCallback(async () => {
    const { data, error } = await supabase
      .from("j_hub_woocommerce_sync_status")
      .select("*")
      .eq("account_id", accountId)
      .maybeSingle();

    if (!error && data) {
      setSyncStatus(data);
    }
    setLoading(false);
  }, [accountId]);

  useEffect(() => {
    if (hasWooConfig) {
      fetchSyncStatus();
    } else {
      setLoading(false);
    }
  }, [hasWooConfig, fetchSyncStatus]);

  // Run sync (single call or continuation)
  const runSync = async (
    days: number,
    startDate?: string | null
  ): Promise<SyncResponse | null> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setError("Sessao expirada. Faca login novamente.");
      return null;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/j_hub_woocommerce_sync`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_id: accountId,
          backfill_days: days,
          chunk_days: 14,
          ...(startDate && { start_date: startDate }),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API: ${response.status} - ${errorText}`);
    }

    return response.json();
  };

  // Handle Sync Now (1 day)
  const handleSyncNow = async () => {
    setSyncing(true);
    setError(null);
    setProgress(null);
    setLastResult(null);

    try {
      const result = await runSync(1);
      if (result) {
        const accountResult = result.results[0];
        if (accountResult?.status === "success") {
          setLastResult(
            `Sync concluido: ${accountResult.orders || 0} pedidos, ${accountResult.order_rows || 0} linhas`
          );
        } else if (accountResult?.status === "error") {
          setError(accountResult.error || "Erro desconhecido");
        }
      }
      await fetchSyncStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncing(false);
    }
  };

  // Handle Backfill (chunked, auto-continue)
  const handleBackfill = async () => {
    setSyncing(true);
    setError(null);
    setLastResult(null);

    let nextStartDate: string | null = null;
    let totalOrders = 0;
    let totalRows = 0;

    try {
      // Process chunks until completed
      while (true) {
        const result = await runSync(backfillDays, nextStartDate);

        if (!result) {
          break;
        }

        // Update progress
        setProgress(result.progress);

        // Accumulate totals
        const accountResult = result.results[0];
        if (accountResult?.status === "success") {
          totalOrders += accountResult.orders || 0;
          totalRows += accountResult.order_rows || 0;
        } else if (accountResult?.status === "error") {
          setError(accountResult.error || "Erro desconhecido");
          break;
        }

        // Check if completed
        if (result.completed) {
          setLastResult(
            `Backfill concluido: ${totalOrders} pedidos, ${totalRows} linhas em ${backfillDays} dias`
          );
          break;
        }

        // Continue with next chunk
        nextStartDate = result.next_start_date;

        // Small delay between chunks to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await fetchSyncStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncing(false);
      setProgress(null);
    }
  };

  // Don't show if WooCommerce not configured
  if (!hasWooConfig) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        Configure as credenciais WooCommerce acima para habilitar o sync.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando status...
      </div>
    );
  }

  const progressPercent = progress
    ? Math.round((progress.processed_days / progress.total_days) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Status display */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Ultimo sync:</span>
        {syncStatus?.last_sync_at ? (
          <>
            <Badge
              variant={
                syncStatus.last_sync_status === "success"
                  ? "default"
                  : "destructive"
              }
              className="gap-1"
            >
              {syncStatus.last_sync_status === "success" ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {syncStatus.last_sync_status}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(syncStatus.last_sync_at).toLocaleString("pt-BR")}
            </span>
            {syncStatus.last_sync_orders_count !== null && (
              <span className="text-sm text-muted-foreground">
                ({syncStatus.last_sync_orders_count} pedidos)
              </span>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Nunca executado</span>
        )}
      </div>

      {syncStatus?.last_error_message && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {syncStatus.last_error_message}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Sync Now button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSyncNow}
          disabled={syncing}
        >
          {syncing && !progress ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sync Agora (ontem)
        </Button>

        {/* Backfill section */}
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="backfillDays" className="text-xs">
              Dias para backfill
            </Label>
            <Input
              id="backfillDays"
              type="number"
              min={7}
              max={365}
              value={backfillDays}
              onChange={(e) => setBackfillDays(parseInt(e.target.value) || 90)}
              className="w-20 h-8"
              disabled={syncing}
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBackfill}
            disabled={syncing}
          >
            {syncing && progress ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            Backfill
          </Button>
        </div>
      </div>

      {/* Progress bar during backfill */}
      {progress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Processando: {progress.chunk_start} a {progress.chunk_end}
            </span>
            <span className="font-medium">
              {progress.processed_days}/{progress.total_days} dias (
              {progressPercent}%)
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}

      {/* Result/Error messages */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
          <XCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {lastResult && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-2 rounded">
          <CheckCircle2 className="h-4 w-4" />
          {lastResult}
        </div>
      )}
    </div>
  );
}
