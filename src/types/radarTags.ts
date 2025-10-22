/**
 * Radar Tags Types
 *
 * Type definitions for the RADAR tagging system.
 * These types match the database schema defined in the migration.
 */

/**
 * Tags structure for REGISTRO section
 */
export interface RegistroTags {
  panorama: 'Ruim' | 'Mediano' | 'Bom' | 'Excelente' | null;
  gasto_atual: 'Dentro do Previsto' | 'Abaixo do Previsto' | 'Acima do Previsto' | null;
}

/**
 * Tags structure for ANOMALIA section
 */
export interface AnomaliaTags {
  pontos_negativos: string[]; // Multi-select array
  pontos_positivos: string[]; // Multi-select array
}

/**
 * Tags structure for DIAGNÓSTICO section
 * Empty - this section has no tags (free text only)
 */
export interface DiagnosticoTags {
  // No tags for this section
}

/**
 * Tags structure for AÇÃO section
 */
export interface AcaoTags {
  acoes_executadas: string[]; // Multi-select array
}

/**
 * Tags structure for RESULTADO ESPERADO section
 */
export interface ResultadoEsperadoTags {
  proxima_acao: string[]; // Multi-select array
  expectativa_impacto: 'Alta' | 'Baixa' | 'Média' | null;
}

/**
 * Complete RADAR tags structure
 * Matches the JSONB structure in j_hub_optimization_extracts.tags
 */
export interface RadarTags {
  registro: RegistroTags;
  anomalia: AnomaliaTags;
  diagnostico: DiagnosticoTags;
  acao: AcaoTags;
  resultado_esperado: ResultadoEsperadoTags;
}

/**
 * Extract format type (matches database ENUM)
 */
export type ExtractFormat = 'radar' | 'legacy';

/**
 * Optimization Extract with RADAR tags
 * Extends the existing extract structure
 */
export interface OptimizationExtract {
  id: string;
  recording_id: string;
  extract_text: string;
  extract_format: ExtractFormat;
  tags: RadarTags;
  previous_version?: string | null;
  edit_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Helper type for tag updates (partial)
 */
export type TagsUpdate = Partial<RadarTags>;

/**
 * Type guard to check if tags are complete
 */
export function isTagsComplete(tags: RadarTags): boolean {
  // Check required fields
  const hasRequiredRegistro = tags.registro.panorama !== null && tags.registro.gasto_atual !== null;
  const hasRequiredAcao = tags.acao.acoes_executadas.length > 0;
  const hasRequiredResultado = tags.resultado_esperado.expectativa_impacto !== null;

  return hasRequiredRegistro && hasRequiredAcao && hasRequiredResultado;
}

/**
 * Get missing required fields
 */
export function getMissingFields(tags: RadarTags): string[] {
  const missing: string[] = [];

  if (tags.registro.panorama === null) {
    missing.push('Registro > Panorama');
  }
  if (tags.registro.gasto_atual === null) {
    missing.push('Registro > Gasto Atual');
  }
  if (tags.acao.acoes_executadas.length === 0) {
    missing.push('Ação > Ações Executadas');
  }
  if (tags.resultado_esperado.expectativa_impacto === null) {
    missing.push('Resultado Esperado > Expectativa de Impacto');
  }

  return missing;
}

/**
 * Initialize empty tags structure
 */
export function initializeEmptyTags(): RadarTags {
  return {
    registro: {
      panorama: null,
      gasto_atual: null,
    },
    anomalia: {
      pontos_negativos: [],
      pontos_positivos: [],
    },
    diagnostico: {},
    acao: {
      acoes_executadas: [],
    },
    resultado_esperado: {
      proxima_acao: [],
      expectativa_impacto: null,
    },
  };
}
