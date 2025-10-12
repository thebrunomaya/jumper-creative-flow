/**
 * Prompt Builder
 *
 * Builds complete prompts with few-shot examples for each oracle.
 */

import { DELFOS_PROMPT } from './delfos.ts';
import { ORFEU_PROMPT } from './orfeu.ts';
import { NOSTRADAMUS_PROMPT } from './nostradamus.ts';

import { DELFOS_EXAMPLES } from '../examples/delfos-examples.ts';
import { ORFEU_EXAMPLES } from '../examples/orfeu-examples.ts';
import { NOSTRADAMUS_EXAMPLES } from '../examples/nostradamus-examples.ts';

/**
 * Builds a complete prompt by injecting examples and context
 */
export function buildPromptWithExamples(
  basePrompt: string,
  examples: any[],
  accountName: string,
  context: any
): string {
  // Build few-shot examples section
  const examplesSection = examples.map((example, index) => {
    return `
<example_${index + 1}>
Scenario: ${example.scenario}

Input Context:
${JSON.stringify(example.input.context, null, 2)}

Expected Output:
${example.expected_output}
</example_${index + 1}>`;
  }).join('\n\n');

  // Insert examples into prompt
  let fullPrompt = basePrompt;

  // Find the position to insert examples (after </instructions>)
  const instructionsEnd = fullPrompt.indexOf('</instructions>');
  if (instructionsEnd !== -1) {
    fullPrompt =
      fullPrompt.slice(0, instructionsEnd + '</instructions>'.length) +
      '\n\n<examples>\nHere are examples of excellent reports to guide your output:\n' +
      examplesSection +
      '\n</examples>\n\n' +
      fullPrompt.slice(instructionsEnd + '</instructions>'.length);
  }

  // Replace placeholders
  const date = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  fullPrompt = fullPrompt
    .replace(/\{\{ACCOUNT_NAME\}\}/g, accountName)
    .replace(/\{\{DATE\}\}/g, date)
    .replace(/\{\{CONTEXT\}\}/g, JSON.stringify(context, null, 2));

  return fullPrompt;
}

/**
 * Builds DELFOS prompt with examples
 */
export function buildDelfosPrompt(accountName: string, context: any): string {
  return buildPromptWithExamples(
    DELFOS_PROMPT,
    DELFOS_EXAMPLES,
    accountName,
    context
  );
}

/**
 * Builds ORFEU prompt with examples
 */
export function buildOrfeuPrompt(accountName: string, context: any): string {
  return buildPromptWithExamples(
    ORFEU_PROMPT,
    ORFEU_EXAMPLES,
    accountName,
    context
  );
}

/**
 * Builds NOSTRADAMUS prompt with examples
 */
export function buildNostradamusPrompt(accountName: string, context: any): string {
  return buildPromptWithExamples(
    NOSTRADAMUS_PROMPT,
    NOSTRADAMUS_EXAMPLES,
    accountName,
    context
  );
}

/**
 * Build prompt for any oracle type
 */
export function buildOraclePrompt(
  oracle: 'delfos' | 'orfeu' | 'nostradamus',
  accountName: string,
  context: any
): string {
  switch (oracle) {
    case 'delfos':
      return buildDelfosPrompt(accountName, context);
    case 'orfeu':
      return buildOrfeuPrompt(accountName, context);
    case 'nostradamus':
      return buildNostradamusPrompt(accountName, context);
    default:
      throw new Error(`Unknown oracle type: ${oracle}`);
  }
}

export default {
  buildDelfosPrompt,
  buildOrfeuPrompt,
  buildNostradamusPrompt,
  buildOraclePrompt,
  buildPromptWithExamples
};
