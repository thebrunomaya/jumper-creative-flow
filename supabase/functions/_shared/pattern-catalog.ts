/**
 * Pattern Catalog - TypeScript Interfaces and Formatters
 *
 * Provides type-safe interfaces for pattern metadata and
 * formatting functions for Claude prompt generation.
 */

/**
 * Pattern Definition Interface
 * Describes a single slide pattern with all metadata
 */
export interface PatternDefinition {
  id: string;
  name: string;
  css_class: string;
  best_for: string[];
  content_type: 'cover' | 'narrative' | 'metrics' | 'timeline' | 'statement' | 'divider' | 'structure' | 'chart' | 'data' | 'callout' | 'conclusion' | 'grid';
  description: string;
  when_to_use: string;
  required_elements: string[];
  example: string;
}

/**
 * Template Metadata Interface
 * Complete template metadata including patterns, colors, version
 */
export interface TemplateMetadata {
  template_id: string;
  template_version: string;
  template_name: string;
  description: string;
  brand_colors: Record<string, string>;
  patterns: PatternDefinition[];
}

/**
 * Slide Plan Interface
 * Output format from content analysis (Stage 1)
 */
export interface SlidePlan {
  slide_number: number;
  section_title: string;
  content_summary: string;
  content_type: string;
  recommended_pattern: string;
  reasoning: string;
}

/**
 * Complete Deck Plan Interface
 * Full analysis output with all slides
 */
export interface DeckPlan {
  slides: SlidePlan[];
  total_slides: number;
  pattern_diversity_score: number;
}

/**
 * Formats pattern catalog for Claude consumption in analysis prompt
 *
 * Creates a structured, readable format that Claude can use to:
 * 1. Understand what patterns are available
 * 2. Match content types to appropriate patterns
 * 3. Make informed pattern selection decisions
 *
 * @param metadata - Complete template metadata
 * @returns Formatted string for inclusion in Claude prompt
 */
export function formatPatternCatalogForPrompt(metadata: TemplateMetadata): string {
  return `
# AVAILABLE SLIDE PATTERNS

**Template:** ${metadata.template_name} (${metadata.template_id})
**Version:** ${metadata.template_version}
**Description:** ${metadata.description}

---

## Pattern Catalog (${metadata.patterns.length} patterns available)

${metadata.patterns.map((pattern, index) => `
### ${index + 1}. ${pattern.name} (ID: \`${pattern.id}\`)

- **CSS Class:** \`.${pattern.css_class}\`
- **Best For:** ${pattern.best_for.join(', ')}
- **Content Type:** ${pattern.content_type}
- **When to Use:** ${pattern.when_to_use}
- **Description:** ${pattern.description}
- **Required Elements:** ${pattern.required_elements.join(', ')}
- **Example:** ${pattern.example}
`).join('\n---\n')}

---

## Brand Color Palette

${Object.entries(metadata.brand_colors).map(([name, hex]) => `- **${name}**: ${hex}`).join('\n')}

---

## Pattern Selection Guidelines

**Content Type Mapping:**
- **Timeline data** (dates, weekly evolution, milestones) → Use \`timeline\` pattern
- **Key insights** (bold messages, critical findings) → Use \`statement-slide\` or \`statement-slide-reverse\`
- **Comparisons** (channel vs channel, before vs after) → Use \`bar-chart\` pattern
- **Percentages** (budget breakdown, market share) → Use \`donut-chart\` pattern
- **Multi-stage process** (conversion funnel, journey) → Use \`funnel\` or \`table-of-contents\`
- **Trends over time** (growth curves, evolution) → Use \`line-chart\` or \`stacked-area\`
- **General text** (explanations, lists, discussion) → Use \`content-slide\`
- **Key metrics** (KPIs, dashboard numbers) → Use \`metric-cards\`

**Diversity Rules:**
- Avoid repeating same pattern more than 2 consecutive times
- Use \`statement-slide\` for major insights (1 per 3-4 slides)
- Mix narrative + data visualization + emphasis slides
- First slide should be \`hero-slide\` (cover)
- Last slide should be \`conclusion-slide\` if applicable
`.trim();
}

/**
 * Formats approved plan for Claude generation prompt
 *
 * Creates clear instructions for Stage 3 (HTML generation)
 * showing exactly which pattern to use for each slide
 *
 * @param plan - Approved deck plan from Stage 1
 * @returns Formatted string for Claude generation prompt
 */
export function formatPlanForGenerationPrompt(plan: DeckPlan): string {
  return `
# APPROVED SLIDE PLAN

**Total Slides:** ${plan.total_slides}
**Pattern Diversity Score:** ${plan.pattern_diversity_score.toFixed(2)}

---

## Slide-by-Slide Breakdown

${plan.slides.map(slide => `
**Slide ${slide.slide_number}: ${slide.section_title}**
- **Pattern:** \`${slide.recommended_pattern}\`
- **Content Type:** ${slide.content_type}
- **Content Summary:** ${slide.content_summary}
- **Reasoning:** ${slide.reasoning}
`).join('\n')}

---

## CRITICAL GENERATION RULES

⚠️ **YOU MUST FOLLOW THIS PLAN EXACTLY:**

1. Generate ${plan.total_slides} slides total
2. For each slide, use the EXACT pattern specified above
3. If slide says pattern \`timeline\`, you MUST use the Timeline pattern CSS (\`.timeline-container\`)
4. If slide says pattern \`statement-slide-reverse\`, you MUST use Statement Reverse pattern (\`.statement-slide-reverse\`)
5. DO NOT improvise or change patterns
6. DO NOT skip slides from the plan
7. DO NOT add extra slides not in the plan

**Pattern fidelity is MANDATORY.** The plan was carefully created to match content to optimal patterns.
`.trim();
}

/**
 * Validates that a deck plan is well-formed
 *
 * @param plan - Deck plan to validate
 * @returns Validation result with errors if any
 */
export function validateDeckPlan(plan: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!plan.slides || !Array.isArray(plan.slides)) {
    errors.push('Plan must have slides array');
  }

  if (typeof plan.total_slides !== 'number' || plan.total_slides < 1) {
    errors.push('Plan must have valid total_slides number');
  }

  if (plan.slides && plan.slides.length !== plan.total_slides) {
    errors.push(`Slides array length (${plan.slides.length}) doesn't match total_slides (${plan.total_slides})`);
  }

  // Validate each slide
  plan.slides?.forEach((slide: any, index: number) => {
    if (!slide.slide_number) {
      errors.push(`Slide ${index + 1} missing slide_number`);
    }
    if (!slide.recommended_pattern) {
      errors.push(`Slide ${index + 1} missing recommended_pattern`);
    }
    if (!slide.section_title) {
      errors.push(`Slide ${index + 1} missing section_title`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculates pattern diversity score from generated HTML
 * Used for quality validation after generation
 *
 * @param html - Generated HTML content
 * @param expectedPatterns - List of expected pattern IDs from plan
 * @returns Diversity score (0-1) and pattern usage stats
 */
export function analyzePatternUsage(html: string, expectedPatterns: string[]): {
  diversity_score: number;
  patterns_found: string[];
  patterns_missing: string[];
} {
  const patternsFound: string[] = [];
  const patternsMissing: string[] = [];

  // Check for each expected pattern in HTML
  expectedPatterns.forEach(patternId => {
    // Convert pattern ID to likely CSS class
    const cssClass = patternId;

    if (html.includes(cssClass) || html.includes(`class="${cssClass}`) || html.includes(`class='${cssClass}`)) {
      patternsFound.push(patternId);
    } else {
      patternsMissing.push(patternId);
    }
  });

  const uniquePatternsUsed = new Set(patternsFound).size;
  const totalExpected = expectedPatterns.length;

  const diversityScore = totalExpected > 0 ? uniquePatternsUsed / totalExpected : 0;

  return {
    diversity_score: diversityScore,
    patterns_found: Array.from(new Set(patternsFound)),
    patterns_missing: patternsMissing
  };
}
