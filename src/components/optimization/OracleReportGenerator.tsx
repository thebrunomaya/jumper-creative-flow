/**
 * OracleReportGenerator - Main component for generating oracle reports
 * Allows user to select oracle type and generates adapted client reports
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JumperButton } from '@/components/ui/jumper-button';
import { Separator } from '@/components/ui/separator';
import { OracleCard, OracleType } from './OracleCard';
import { ReportViewer } from './ReportViewer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, RotateCw } from 'lucide-react';

interface OracleReportGeneratorProps {
  contextId: string;
  accountName: string;
  recordingId: string;
  existingReports?: Record<string, string>; // Already generated reports from cache
}

const oracles = [
  {
    id: 'delfos' as OracleType,
    icon: '🏛️',
    name: 'DELFOS',
    subtitle: 'Técnico',
    description: 'Direto e preciso. Para gestores experientes que falam a linguagem de métricas (CPA, ROAS, CTR).',
    color: 'red' as const,
  },
  {
    id: 'orfeu' as OracleType,
    icon: '🎵',
    name: 'ORFEU',
    subtitle: 'Narrativo',
    description: 'Educacional e claro. Transforma dados técnicos em história que qualquer cliente entende.',
    color: 'blue' as const,
  },
  {
    id: 'nostradamus' as OracleType,
    icon: '📜',
    name: 'NOSTRADAMUS',
    subtitle: 'Analítico',
    description: 'Rico em dados. Comparações detalhadas para stakeholders que querem números e contexto estratégico.',
    color: 'orange' as const,
  },
];

export function OracleReportGenerator({
  contextId,
  accountName,
  recordingId,
  existingReports = {},
}: OracleReportGeneratorProps) {
  const [selectedOracle, setSelectedOracle] = useState<OracleType | null>(null);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cached, setCached] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const handleSelectOracle = async (oracle: OracleType) => {
    setSelectedOracle(oracle);
    setIsGenerating(true);

    try {
      // Check if report already exists in cache
      if (existingReports[oracle]) {
        console.log('📦 Using cached oracle report');
        setGeneratedReport(existingReports[oracle]);
        setCached(true);
        setGeneratedAt(existingReports.generated_at || new Date().toISOString());
        toast.success('Relatório carregado do cache');
        setIsGenerating(false);
        return;
      }

      // Generate new report
      console.log(`🔮 Generating ${oracle} report...`);
      const { data, error } = await supabase.functions.invoke(
        'j_hub_optimization_generate_oracle_report',
        {
          body: {
            context_id: contextId,
            oracle,
            account_name: accountName,
          },
        }
      );

      if (error) throw error;

      setGeneratedReport(data.report);
      setCached(data.cached || false);
      setGeneratedAt(new Date().toISOString());
      toast.success(data.cached ? 'Relatório carregado do cache' : 'Relatório gerado com sucesso!');
    } catch (error: any) {
      console.error('Error generating oracle report:', error);
      toast.error(error.message || 'Erro ao gerar relatório');
      setSelectedOracle(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReport = async () => {
    if (!generatedReport) return;

    try {
      await navigator.clipboard.writeText(generatedReport);
      toast.success('Relatório copiado! Cole no WhatsApp ou email');
    } catch (error) {
      toast.error('Erro ao copiar texto');
    }
  };

  const handleGenerateAnother = () => {
    setSelectedOracle(null);
    setGeneratedReport(null);
    setCached(false);
    setGeneratedAt(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Gerar Relatório para Cliente
        </CardTitle>
        <CardDescription>
          Escolha o formato adequado ao perfil do seu cliente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!generatedReport ? (
          // Oracle Selection Grid
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {oracles.map((oracle) => (
              <OracleCard
                key={oracle.id}
                oracle={oracle.id}
                icon={oracle.icon}
                name={oracle.name}
                subtitle={oracle.subtitle}
                description={oracle.description}
                color={oracle.color}
                onSelect={() => handleSelectOracle(oracle.id)}
                isLoading={isGenerating && selectedOracle === oracle.id}
                isSelected={selectedOracle === oracle.id}
                isGenerated={!!existingReports[oracle.id]}
              />
            ))}
          </div>
        ) : (
          // Report Display
          <div className="space-y-4">
            <ReportViewer
              report={generatedReport}
              oracle={selectedOracle!}
              generatedAt={generatedAt || undefined}
              cached={cached}
            />

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <JumperButton variant="default" onClick={handleCopyReport}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Texto
              </JumperButton>

              <JumperButton variant="outline" onClick={handleGenerateAnother}>
                <RotateCw className="mr-2 h-4 w-4" />
                Gerar Outro Oráculo
              </JumperButton>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <p className="font-semibold mb-2">💡 Dica:</p>
              <p>
                Use o botão "Compartilhar" acima para enviar este relatório ao cliente via link público.
                O formato escolhido ({selectedOracle?.toUpperCase()}) será usado automaticamente.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
