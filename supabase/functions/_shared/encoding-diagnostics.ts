/**
 * Encoding Diagnostics Utilities
 *
 * Helps diagnose UTF-8 corruption (mojibakes) in deck generation pipeline
 * Use these functions to log and validate encoding at each step
 */

/**
 * Common mojibake patterns (UTF-8 text interpreted as Latin-1)
 *
 * á → Ã¡
 * é → Ã©
 * í → Ã­
 * ó → Ã³
 * ú → Ãº
 * ã → Ã£
 * õ → Ãµ
 * ç → Ã§
 */
const MOJIBAKE_PATTERNS = [
  'Ã¡', 'Ã©', 'Ã­', 'Ã³', 'Ãº', 'Ã£', 'Ãµ', 'Ã§',
  'Ã ', 'Ãª', 'Ã¯', 'Ã´', 'Ã»', 'Ã¤', 'Ã¶', 'Ã¼',
  'Ã‡'
];

/**
 * Expected Portuguese characters (should NOT be corrupted)
 */
const EXPECTED_PORTUGUESE_CHARS = [
  'á', 'é', 'í', 'ó', 'ú', 'ã', 'õ', 'ç',
  'à', 'ê', 'â', 'ô', 'û', 'Á', 'É', 'Ç'
];

export interface EncodingDiagnostics {
  stage: string;
  has_mojibakes: boolean;
  has_valid_portuguese: boolean;
  sample_text: string;
  mojibake_examples: string[];
  byte_length: number;
  char_length: number;
  encoding_ok: boolean;
}

/**
 * Diagnose encoding issues in a text string
 *
 * @param text - Text to analyze
 * @param stage - Pipeline stage name (e.g., "markdown_source", "claude_response")
 * @param sample_size - How many characters to include in sample (default 200)
 * @returns Diagnostics object
 */
export function diagnoseEncoding(
  text: string,
  stage: string,
  sample_size = 200
): EncodingDiagnostics {
  // Detect mojibakes
  const mojibake_examples: string[] = [];
  for (const pattern of MOJIBAKE_PATTERNS) {
    if (text.includes(pattern)) {
      // Extract context around mojibake (10 chars before/after)
      const index = text.indexOf(pattern);
      const start = Math.max(0, index - 10);
      const end = Math.min(text.length, index + pattern.length + 10);
      mojibake_examples.push(text.substring(start, end));
    }
  }

  const has_mojibakes = mojibake_examples.length > 0;

  // Detect valid Portuguese characters
  const has_valid_portuguese = EXPECTED_PORTUGUESE_CHARS.some(char => text.includes(char));

  // Extract sample from beginning
  const sample_text = text.substring(0, sample_size);

  // Calculate byte vs char length (different if multi-byte chars)
  const encoder = new TextEncoder();
  const byte_length = encoder.encode(text).length;
  const char_length = text.length;

  // Encoding is OK if: no mojibakes AND has valid Portuguese
  const encoding_ok = !has_mojibakes && has_valid_portuguese;

  return {
    stage,
    has_mojibakes,
    has_valid_portuguese,
    sample_text,
    mojibake_examples: mojibake_examples.slice(0, 5), // Max 5 examples
    byte_length,
    char_length,
    encoding_ok
  };
}

/**
 * Log encoding diagnostics to console with color coding
 *
 * @param diagnostics - Diagnostics object from diagnoseEncoding()
 */
export function logEncodingDiagnostics(diagnostics: EncodingDiagnostics): void {
  const emoji = diagnostics.encoding_ok ? '✅' : '❌';

  console.log(`\n${emoji} [ENCODING DIAGNOSTIC] Stage: ${diagnostics.stage}`);
  console.log(`   Mojibakes detected: ${diagnostics.has_mojibakes ? '❌ YES' : '✅ NO'}`);
  console.log(`   Valid Portuguese: ${diagnostics.has_valid_portuguese ? '✅ YES' : '⚠️ NO'}`);
  console.log(`   Byte length: ${diagnostics.byte_length} bytes`);
  console.log(`   Char length: ${diagnostics.char_length} chars`);
  console.log(`   Encoding OK: ${diagnostics.encoding_ok ? '✅ YES' : '❌ NO'}`);

  if (diagnostics.mojibake_examples.length > 0) {
    console.log(`   ⚠️ Mojibake examples (${diagnostics.mojibake_examples.length}):`);
    diagnostics.mojibake_examples.forEach((example, i) => {
      console.log(`      ${i + 1}. "${example}"`);
    });
  }

  console.log(`   Sample text: "${diagnostics.sample_text.substring(0, 100)}..."`);
  console.log('');
}

/**
 * Validate that a string is properly UTF-8 encoded
 * Throws error if mojibakes detected
 *
 * @param text - Text to validate
 * @param stage - Pipeline stage name
 * @throws Error if mojibakes detected
 */
export function validateEncoding(text: string, stage: string): void {
  const diagnostics = diagnoseEncoding(text, stage);
  logEncodingDiagnostics(diagnostics);

  if (!diagnostics.encoding_ok) {
    throw new Error(
      `UTF-8 corruption detected at stage "${stage}". ` +
      `Found ${diagnostics.mojibake_examples.length} mojibake patterns. ` +
      `Examples: ${diagnostics.mojibake_examples.join(', ')}`
    );
  }
}

/**
 * Test encoding by converting a sample Portuguese text
 * Useful for debugging encoding pipelines
 *
 * @returns Test diagnostics
 */
export function testEncoding(): EncodingDiagnostics {
  const testText = 'Relatório de análise: São Paulo - Ação promocional';
  return diagnoseEncoding(testText, 'encoding_test');
}

/**
 * Common mojibake correction map (UTF-8 incorrectly decoded as Latin-1)
 * Using hex codes to avoid parsing issues with special characters
 */
const MOJIBAKE_CORRECTIONS: [string, string][] = [
  // Portuguese accented vowels (lowercase)
  ['\u00C3\u00A1', '\u00E1'], // Ã¡ → á
  ['\u00C3\u00A9', '\u00E9'], // Ã© → é
  ['\u00C3\u00AD', '\u00ED'], // Ã­ → í
  ['\u00C3\u00B3', '\u00F3'], // Ã³ → ó
  ['\u00C3\u00BA', '\u00FA'], // Ãº → ú
  ['\u00C3\u00A3', '\u00E3'], // Ã£ → ã
  ['\u00C3\u00B5', '\u00F5'], // Ãµ → õ
  ['\u00C3\u00A7', '\u00E7'], // Ã§ → ç
  ['\u00C3\u00A0', '\u00E0'], // Ã  → à
  ['\u00C3\u00AA', '\u00EA'], // Ãª → ê
  ['\u00C3\u00A2', '\u00E2'], // Ã¢ → â
  ['\u00C3\u00B4', '\u00F4'], // Ã´ → ô
  ['\u00C3\u00BB', '\u00FB'], // Ã» → û
  // German umlauts (also used in some loanwords)
  ['\u00C3\u00A4', '\u00E4'], // Ã¤ → ä
  ['\u00C3\u00B6', '\u00F6'], // Ã¶ → ö
  ['\u00C3\u00BC', '\u00FC'], // Ã¼ → ü
  // Uppercase accented vowels
  ['\u00C3\u0081', '\u00C1'], // Ã + Á → Á
  ['\u00C3\u0089', '\u00C9'], // Ã‰ → É
  ['\u00C3\u008D', '\u00CD'], // Ã + Í → Í
  ['\u00C3\u0093', '\u00D3'], // Ã" → Ó
  ['\u00C3\u009A', '\u00DA'], // Ãš → Ú
  ['\u00C3\u0083', '\u00C3'], // Ãƒ → Ã
  ['\u00C3\u0095', '\u00D5'], // Ã• → Õ
  ['\u00C3\u0087', '\u00C7'], // Ã‡ → Ç
  // Special characters - dashes and quotes
  ['\u00E2\u0080\u0094', '\u2014'], // â€" → — (em dash)
  ['\u00E2\u0080\u0093', '\u2013'], // â€" → – (en dash)
  ['\u00E2\u0080\u0099', '\u2019'], // â€™ → ' (right single quote)
  ['\u00E2\u0080\u009C', '\u201C'], // â€œ → " (left double quote)
  ['\u00E2\u0080\u009D', '\u201D'], // â€ → " (right double quote)
  // Arrows
  ['\u00E2\u0086\u0092', '\u2192'], // â†' → →
  ['\u00E2\u0086\u0090', '\u2190'], // â† → ←
  ['\u00E2\u0086\u0091', '\u2191'], // â†' → ↑
  ['\u00E2\u0086\u0093', '\u2193'], // â†" → ↓
  // Other common characters
  ['\u00E2\u0080\u00A2', '\u2022'], // â€¢ → • (bullet)
  ['\u00E2\u0080\u00A6', '\u2026'], // â€¦ → … (ellipsis)
  // Double-encoding artifacts
  ['\u00C3\u0082\u00C2', ''], // Common double-encoding artifact
];

/**
 * Fix common mojibake patterns in text
 * Attempts to correct UTF-8 text that was incorrectly decoded as Latin-1
 *
 * @param text - Text with potential mojibakes
 * @returns Corrected text
 */
export function fixMojibakes(text: string): string {
  let fixed = text;

  for (const [mojibake, correct] of MOJIBAKE_CORRECTIONS) {
    fixed = fixed.split(mojibake).join(correct);
  }

  return fixed;
}

/**
 * Validate and optionally fix encoding issues
 *
 * @param text - Text to validate
 * @param stage - Pipeline stage name
 * @param autoFix - If true, attempt to fix mojibakes automatically
 * @returns Object with original, fixed text, and diagnostics
 */
export function validateAndFixEncoding(
  text: string,
  stage: string,
  autoFix = true
): { original: string; fixed: string; wasFixed: boolean; diagnostics: EncodingDiagnostics } {
  const originalDiagnostics = diagnoseEncoding(text, stage);

  if (originalDiagnostics.encoding_ok || !autoFix) {
    return {
      original: text,
      fixed: text,
      wasFixed: false,
      diagnostics: originalDiagnostics
    };
  }

  // Attempt to fix
  const fixed = fixMojibakes(text);
  const fixedDiagnostics = diagnoseEncoding(fixed, `${stage}_after_fix`);

  console.log(`🔧 [ENCODING FIX] Stage: ${stage}`);
  console.log(`   Before: ${originalDiagnostics.mojibake_examples.length} mojibakes`);
  console.log(`   After: ${fixedDiagnostics.mojibake_examples.length} mojibakes`);

  return {
    original: text,
    fixed,
    wasFixed: true,
    diagnostics: fixedDiagnostics
  };
}
