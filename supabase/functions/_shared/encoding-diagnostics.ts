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
