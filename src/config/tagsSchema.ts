/**
 * Tags Schema - Método RADAR
 *
 * Definição completa das tags disponíveis para cada seção do RADAR:
 * - REGISTRO: Panorama geral e gasto atual
 * - ANOMALIA: Pontos positivos e negativos
 * - DIAGNÓSTICO: Sem tags (texto livre)
 * - AÇÃO: Ações executadas
 * - RESULTADO ESPERADO: Próxima ação e expectativa de impacto
 *
 * Cores seguem palette Jumper Studio (hex format)
 */

export interface TagOption {
  value: string;
  label: string;
  color: string; // Hex color
}

export interface TagCategory {
  name: string;
  key: string; // JSON key
  options: TagOption[];
  multi_select: boolean;
  required: boolean;
  placeholder?: string;
}

export interface RadarSection {
  key: string;
  label: string;
  description: string;
  categories: TagCategory[];
}

/**
 * Complete Tags Schema for RADAR Method
 */
export const TAGS_SCHEMA: Record<string, RadarSection> = {
  registro: {
    key: 'registro',
    label: 'REGISTRO',
    description: 'Retrato atual: métricas, status, setup',
    categories: [
      {
        name: 'Panorama',
        key: 'panorama',
        required: true,
        multi_select: false,
        placeholder: 'Selecione o panorama geral',
        options: [
          { value: 'Ruim', label: 'Ruim', color: '#8B4513' }, // Saddle Brown
          { value: 'Mediano', label: 'Mediano', color: '#DC143C' }, // Crimson
          { value: 'Bom', label: 'Bom', color: '#4169E1' }, // Royal Blue
          { value: 'Excelente', label: 'Excelente', color: '#FFFFFF' }, // White
        ],
      },
      {
        name: 'Gasto Atual',
        key: 'gasto_atual',
        required: true,
        multi_select: false,
        placeholder: 'Selecione o status de gasto',
        options: [
          { value: 'Dentro do Previsto', label: 'Dentro do Previsto', color: '#32CD32' }, // Lime Green
          { value: 'Abaixo do Previsto', label: 'Abaixo do Previsto', color: '#9370DB' }, // Medium Purple
          { value: 'Acima do Previsto', label: 'Acima do Previsto', color: '#4169E1' }, // Royal Blue
        ],
      },
    ],
  },

  anomalia: {
    key: 'anomalia',
    label: 'ANOMALIA',
    description: 'O que mudou, fugiu do padrão',
    categories: [
      {
        name: 'Pontos Negativos',
        key: 'pontos_negativos',
        required: false,
        multi_select: true,
        placeholder: 'Selecione problemas identificados',
        options: [
          { value: 'CPA alto', label: 'CPA alto', color: '#4169E1' }, // Royal Blue
          { value: 'CTR baixo', label: 'CTR baixo', color: '#808080' }, // Gray
          { value: 'Criativo saturado', label: 'Criativo saturado', color: '#DAA520' }, // Goldenrod
          { value: 'Segmentação ruim', label: 'Segmentação ruim', color: '#CD5C5C' }, // Indian Red
          { value: 'Orçamento insuficiente', label: 'Orçamento insuficiente', color: '#9370DB' }, // Medium Purple
          { value: 'Rastreamento impreciso', label: 'Rastreamento impreciso', color: '#8B4513' }, // Saddle Brown
          { value: 'Frequência Alta', label: 'Frequência Alta', color: '#DB7093' }, // Pale Violet Red
          { value: 'Sem Problemas', label: 'Sem Problemas', color: '#808080' }, // Gray
        ],
      },
      {
        name: 'Pontos Positivos',
        key: 'pontos_positivos',
        required: false,
        multi_select: true,
        placeholder: 'Selecione aspectos positivos',
        options: [
          { value: 'CTR alto', label: 'CTR alto', color: '#FFFFFF' }, // White
          { value: 'CPA baixo', label: 'CPA baixo', color: '#DB7093' }, // Pale Violet Red
          { value: 'Criativos funcionando', label: 'Criativos funcionando', color: '#CD5C5C' }, // Indian Red
          { value: 'Taxa de Abertura da Página Alta', label: 'Taxa de Abertura da Página Alta', color: '#8B4513' }, // Saddle Brown
          { value: 'Taxonomia Perfeita', label: 'Taxonomia Perfeita', color: '#8B4513' }, // Saddle Brown
        ],
      },
    ],
  },

  diagnostico: {
    key: 'diagnostico',
    label: 'DIAGNÓSTICO',
    description: 'Por que aconteceu, causa raiz',
    categories: [], // Sem tags - apenas texto livre
  },

  acao: {
    key: 'acao',
    label: 'AÇÃO',
    description: 'O que foi feito concretamente',
    categories: [
      {
        name: 'Ações Executadas',
        key: 'acoes_executadas',
        required: true,
        multi_select: true,
        placeholder: 'Selecione as ações realizadas',
        options: [
          { value: 'Pausa de Campanhas/Criativos', label: 'Pausa de Campanhas/Criativos', color: '#808080' }, // Gray
          { value: 'Mudança de Segmentação', label: 'Mudança de Segmentação', color: '#DC143C' }, // Crimson
          { value: 'Troca de Criativos', label: 'Troca de Criativos', color: '#808080' }, // Gray
          { value: 'Ajuste de Orçamento', label: 'Ajuste de Orçamento', color: '#DB7093' }, // Pale Violet Red
          { value: 'Mudança em CBO/ABO', label: 'Mudança em CBO/ABO', color: '#DAA520' }, // Goldenrod
          { value: 'Copys Revisadas', label: 'Copys Revisadas', color: '#9370DB' }, // Medium Purple
          { value: 'Duplicação de Conjuntos', label: 'Duplicação de Conjuntos', color: '#8B4513' }, // Saddle Brown
          { value: 'Teste de novos Públicos', label: 'Teste de novos Públicos', color: '#32CD32' }, // Lime Green
          { value: 'Observar', label: 'Observar', color: '#808080' }, // Gray
          { value: 'Reativação', label: 'Reativação', color: '#808080' }, // Gray
          { value: 'Criação de Campanha', label: 'Criação de Campanha', color: '#808080' }, // Gray
        ],
      },
    ],
  },

  resultado_esperado: {
    key: 'resultado_esperado',
    label: 'RESULTADO ESPERADO',
    description: 'Projeção e próximos passos',
    categories: [
      {
        name: 'Próxima Ação',
        key: 'proxima_acao',
        required: false,
        multi_select: true,
        placeholder: 'Selecione os próximos passos',
        options: [
          { value: 'Acompanhar Impacto', label: 'Acompanhar Impacto', color: '#32CD32' }, // Lime Green
          { value: 'Informar Gerente', label: 'Informar Gerente', color: '#9370DB' }, // Medium Purple
          { value: 'Peticionar Ajuste de Verba', label: 'Peticionar Ajuste de Verba', color: '#808080' }, // Gray
          { value: 'Revisar Rastreamento', label: 'Revisar Rastreamento', color: '#CD5C5C' }, // Indian Red
          { value: 'Solicitar novos Criativos', label: 'Solicitar novos Criativos', color: '#808080' }, // Gray
        ],
      },
      {
        name: 'Expectativa de Impacto',
        key: 'expectativa_impacto',
        required: true,
        multi_select: false,
        placeholder: 'Selecione a expectativa de impacto',
        options: [
          { value: 'Alta', label: 'Alta', color: '#808080' }, // Gray
          { value: 'Baixa', label: 'Baixa', color: '#DB7093' }, // Pale Violet Red
          { value: 'Média', label: 'Média', color: '#D2691E' }, // Chocolate
        ],
      },
    ],
  },
};

/**
 * Get all sections in display order (R-A-D-A-R)
 */
export const RADAR_SECTIONS_ORDER = [
  'registro',
  'anomalia',
  'diagnostico',
  'acao',
  'resultado_esperado',
] as const;

/**
 * Helper function to get section by key
 */
export function getSection(key: string): RadarSection | undefined {
  return TAGS_SCHEMA[key];
}

/**
 * Helper function to check if a section has tags
 */
export function sectionHasTags(sectionKey: string): boolean {
  const section = getSection(sectionKey);
  return section ? section.categories.length > 0 : false;
}

/**
 * Helper function to get required categories for a section
 */
export function getRequiredCategories(sectionKey: string): TagCategory[] {
  const section = getSection(sectionKey);
  return section ? section.categories.filter((cat) => cat.required) : [];
}

/**
 * Helper function to validate if tags are complete
 */
export function validateTags(tags: any): { isComplete: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  RADAR_SECTIONS_ORDER.forEach((sectionKey) => {
    const requiredCategories = getRequiredCategories(sectionKey);

    requiredCategories.forEach((category) => {
      const value = tags?.[sectionKey]?.[category.key];

      if (category.multi_select) {
        // Multi-select: check if array has at least one item
        if (!value || !Array.isArray(value) || value.length === 0) {
          missingFields.push(`${sectionKey}.${category.key}`);
        }
      } else {
        // Single-select: check if value is not null/undefined
        if (value === null || value === undefined) {
          missingFields.push(`${sectionKey}.${category.key}`);
        }
      }
    });
  });

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}
