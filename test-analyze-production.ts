#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

import { loadPatternMetadata } from './supabase/functions/_shared/template-utils.ts';
import { formatPatternCatalogForPrompt } from './supabase/functions/_shared/pattern-catalog.ts';

// Simulate production environment (NOT local)
Deno.env.set('SUPABASE_URL', 'https://biwwowendjuzvpttyrlb.supabase.co');

console.log('🧪 Testing j_hub_deck_analyze with PRODUCTION URLs...\n');

try {
  console.log('1️⃣ Loading pattern metadata (from hub.jumper.studio)...');
  const patternMetadata = await loadPatternMetadata('koko-classic');

  console.log('✅ Pattern metadata loaded:', {
    patterns_count: patternMetadata.patterns.length,
    template_version: patternMetadata.template_version,
    first_pattern: patternMetadata.patterns[0].id
  });

  console.log('\n2️⃣ Formatting pattern catalog...');
  const patternCatalog = formatPatternCatalogForPrompt(patternMetadata);

  console.log('✅ Pattern catalog formatted:', {
    catalog_size_chars: patternCatalog.length,
    first_200_chars: patternCatalog.substring(0, 200).replace(/\n/g, ' ') + '...'
  });

  console.log('\n✅ ALL TESTS PASSED! Production URLs work correctly.');

} catch (error) {
  console.error('\n❌ TEST FAILED:', error);
  console.error('\nError details:', {
    message: error.message,
    name: error.name,
    cause: error.cause
  });
  Deno.exit(1);
}
