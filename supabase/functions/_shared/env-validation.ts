/**
 * Environment Variable Validation Utility
 *
 * Provides explicit validation for required environment variables
 * with clear, actionable error messages.
 *
 * @module env-validation
 */

/**
 * Required environment variables for Decks Edge Functions
 */
export interface DeckEnvironmentVariables {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ANTHROPIC_API_KEY: string;
}

/**
 * Validates that all required environment variables are present and non-empty.
 *
 * @throws {Error} If any required environment variable is missing or empty
 * @returns {DeckEnvironmentVariables} Validated environment variables
 *
 * @example
 * ```typescript
 * const env = validateEnvironment();
 * console.log('Using Supabase URL:', env.SUPABASE_URL);
 * ```
 */
export function validateEnvironment(): DeckEnvironmentVariables {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
  ] as const;

  const missingVars: string[] = [];
  const emptyVars: string[] = [];

  for (const varName of requiredVars) {
    const value = Deno.env.get(varName);

    if (value === undefined) {
      missingVars.push(varName);
    } else if (value.trim() === '') {
      emptyVars.push(varName);
    }
  }

  // Build detailed error message
  if (missingVars.length > 0 || emptyVars.length > 0) {
    const errorParts: string[] = ['Environment validation failed:'];

    if (missingVars.length > 0) {
      errorParts.push(`\n  Missing variables: ${missingVars.join(', ')}`);
    }

    if (emptyVars.length > 0) {
      errorParts.push(`\n  Empty variables: ${emptyVars.join(', ')}`);
    }

    errorParts.push('\n\nPlease check your Edge Function environment configuration.');
    errorParts.push('For local development: supabase/functions/.env');
    errorParts.push('For production: Supabase Dashboard > Edge Functions > Secrets');

    throw new Error(errorParts.join('\n'));
  }

  // Return validated variables (TypeScript guarantees they exist now)
  return {
    SUPABASE_URL: Deno.env.get('SUPABASE_URL')!,
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    ANTHROPIC_API_KEY: Deno.env.get('ANTHROPIC_API_KEY')!,
  };
}

/**
 * Validates environment with custom required variables.
 *
 * @param varNames - Array of environment variable names to validate
 * @throws {Error} If any specified variable is missing or empty
 * @returns {Record<string, string>} Validated environment variables
 *
 * @example
 * ```typescript
 * const env = validateCustomEnvironment(['MY_API_KEY', 'MY_SECRET']);
 * console.log('API Key:', env.MY_API_KEY);
 * ```
 */
export function validateCustomEnvironment(varNames: string[]): Record<string, string> {
  const missingVars: string[] = [];
  const emptyVars: string[] = [];
  const result: Record<string, string> = {};

  for (const varName of varNames) {
    const value = Deno.env.get(varName);

    if (value === undefined) {
      missingVars.push(varName);
    } else if (value.trim() === '') {
      emptyVars.push(varName);
    } else {
      result[varName] = value;
    }
  }

  if (missingVars.length > 0 || emptyVars.length > 0) {
    const errorParts: string[] = ['Environment validation failed:'];

    if (missingVars.length > 0) {
      errorParts.push(`\n  Missing variables: ${missingVars.join(', ')}`);
    }

    if (emptyVars.length > 0) {
      errorParts.push(`\n  Empty variables: ${emptyVars.join(', ')}`);
    }

    throw new Error(errorParts.join('\n'));
  }

  return result;
}
