#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

import { loadPatternMetadata } from './supabase/functions/_shared/template-utils.ts';
import { formatPatternCatalogForPrompt } from './supabase/functions/_shared/pattern-catalog.ts';

// Set local environment
Deno.env.set('SUPABASE_URL', 'http://127.0.0.1:54321');

console.log('🧪 Testing j_hub_deck_analyze locally...\n');

try {
  console.log('1️⃣ Loading pattern metadata...');
  const patternMetadata = await loadPatternMetadata('koko-classic');

  console.log('✅ Pattern metadata loaded:', {
    patterns_count: patternMetadata.patterns.length,
    template_version: patternMetadata.template_version
  });

  console.log('\n2️⃣ Formatting pattern catalog...');
  const patternCatalog = formatPatternCatalogForPrompt(patternMetadata);

  console.log('✅ Pattern catalog formatted:', {
    catalog_size_chars: patternCatalog.length,
    first_100_chars: patternCatalog.substring(0, 100) + '...'
  });

  console.log('\n✅ ALL TESTS PASSED! j_hub_deck_analyze should work.');

} catch (error) {
  console.error('\n❌ TEST FAILED:', error);
  console.error('Error details:', {
    message: error.message,
    stack: error.stack
  });
  Deno.exit(1);
}
