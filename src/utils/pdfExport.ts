/**
 * PDF Export Utility
 * Generates PDF reports for optimization recordings
 */

import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  OptimizationRecordingRow,
  OptimizationTranscriptRow,
  OptimizationContext,
} from '@/types/optimization';

export function exportOptimizationToPDF(
  recording: OptimizationRecordingRow,
  accountName: string,
  transcript: OptimizationTranscriptRow | null,
  extract: { extract_text: string; edit_count: number; updated_at: string } | null,
  context: OptimizationContext | null
) {
  const doc = new jsPDF();
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  // Helper to add text with wrapping
  const addText = (text: string, fontSize = 12, isBold = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = doc.splitTextToSize(text, maxWidth);
    
    // Check if we need a new page
    if (yPos + (lines.length * fontSize * 0.5) > doc.internal.pageSize.height - 20) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(lines, margin, yPos);
    yPos += lines.length * fontSize * 0.5 + 5;
  };

  const addSection = (title: string) => {
    yPos += 5;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 5, maxWidth, 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 2, yPos + 2);
    yPos += 12;
  };

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Otimização', margin, yPos);
  yPos += 15;

  // Account Info
  addText(`Conta: ${accountName}`, 12, true);
  addText(`Data: ${format(new Date(recording.recorded_at), "PPP 'às' HH:mm", { locale: ptBR })}`);
  addText(`Gravado por: ${recording.recorded_by}`);
  
  if (recording.duration_seconds) {
    const mins = Math.floor(recording.duration_seconds / 60);
    const secs = recording.duration_seconds % 60;
    addText(`Duração: ${mins}:${secs.toString().padStart(2, '0')}`);
  }

  // Step 1: Transcription
  if (transcript?.full_text) {
    addSection('1. Transcrição Completa');
    addText(transcript.full_text, 10);
  }

  // Step 2: Log da Otimização
  if (transcript?.processed_text) {
    addSection('2. Log da Otimização');
    addText(transcript.processed_text, 10);
  }

  // Step 3: Extrato
  if (extract?.extract_text) {
    addSection('3. Extrato de Ações');
    addText(extract.extract_text, 10);
  }

  // AI Analysis
  if (context) {
    if (context.summary) {
      addSection('Resumo');
      addText(context.summary, 10);
    }

    if (context.actions_taken && context.actions_taken.length > 0) {
      addSection('Ações Realizadas');
      context.actions_taken.forEach((action, index) => {
        const actionText = `${action.type}: ${action.target} - ${action.reason}`;
        addText(`${index + 1}. ${actionText}`, 10);
      });
    }

    if (context.metrics_mentioned && Object.keys(context.metrics_mentioned).length > 0) {
      addSection('Métricas Mencionadas');
      Object.entries(context.metrics_mentioned).forEach(([metric, value]) => {
        addText(`• ${metric}: ${value}`, 10);
      });
    }

    if (context.strategy) {
      addSection('Estratégia');
      const strategyLabels: Record<string, string> = {
        'test': 'Teste',
        'scale': 'Escala',
        'optimize': 'Otimização',
        'maintain': 'Manutenção',
        'pivot': 'Pivot'
      };
      addText(`Tipo: ${strategyLabels[context.strategy.type] || context.strategy.type}`, 10);
      addText(`Duração: ${context.strategy.duration_days} dias`, 10);
      addText(`Critério de sucesso: ${context.strategy.success_criteria}`, 10);
      
      if (context.strategy.hypothesis) {
        addText(`Hipótese: ${context.strategy.hypothesis}`, 10);
      }
      if (context.strategy.target_metric) {
        addText(`Métrica alvo: ${context.strategy.target_metric}${context.strategy.target_value ? ` (${context.strategy.target_value})` : ''}`, 10);
      }
    }

    if (context.timeline) {
      addSection('Próximos Passos');
      addText(`Reavaliar em: ${format(new Date(context.timeline.reevaluate_date), 'PPP', { locale: ptBR })}`, 10);
      
      if (context.timeline.milestones && context.timeline.milestones.length > 0) {
        addText('Marcos:', 10, true);
        context.timeline.milestones.forEach((milestone, index) => {
          addText(`${index + 1}. ${format(new Date(milestone.date), 'PP', { locale: ptBR })}: ${milestone.description}`, 10);
        });
      }
    }

    if (context.confidence_level) {
      addSection('Confiança da Análise');
      const confidenceLabels: Record<string, string> = {
        high: 'Alta',
        medium: 'Média',
        low: 'Baixa',
      };
      addText(confidenceLabels[context.confidence_level] || context.confidence_level, 10);
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${pageCount} - Gerado em ${format(new Date(), 'PPP', { locale: ptBR })}`,
      margin,
      doc.internal.pageSize.height - 10
    );
  }

  // Save
  const fileName = `otimizacao-${accountName.replace(/\s+/g, '-')}-${format(new Date(recording.recorded_at), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
