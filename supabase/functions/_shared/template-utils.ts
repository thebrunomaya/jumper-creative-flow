/**
 * Template Utilities
 * Helpers for parsing and extracting template components
 *
 * Key Functions:
 * - extractStyleBlock: Extract CSS from template HTML (token optimization)
 * - loadPatternMetadata: Load pattern catalog JSON
 * - loadTemplateHTML: Load complete template file
 */

/**
 * Extracts only the <style>...</style> block from template HTML
 * Removes all example content, keeping only CSS rules
 *
 * Token optimization: Sending only CSS reduces tokens by ~60%
 * (116KB full template → 40KB CSS only)
 *
 * @param templateHtml - Complete template HTML string
 * @returns CSS content without <style> tags
 * @throws Error if no <style> block found
 */
export function extractStyleBlock(templateHtml: string): string {
  const styleMatch = templateHtml.match(/<style>([\s\S]*?)<\/style>/);

  if (!styleMatch) {
    throw new Error('No <style> block found in template HTML');
  }

  const css = styleMatch[1].trim();

  // Validate CSS isn't empty
  if (css.length < 100) {
    throw new Error('Extracted CSS suspiciously short (less than 100 characters)');
  }

  console.log(`[TEMPLATE_UTILS] Extracted CSS: ${(css.length / 1024).toFixed(1)}KB`);

  return css;
}

/**
 * Loads pattern metadata JSON for a given template
 *
 * Pattern metadata includes:
 * - Pattern catalog (all 17+ patterns with descriptions)
 * - Brand colors
 * - Template version info
 *
 * @param templateId - Template identifier (e.g., 'koko-classic')
 * @returns Parsed JSON object with pattern metadata
 * @throws Error if file not found or invalid JSON
 */
export async function loadPatternMetadata(templateId: string): Promise<any> {
  // Path is relative to Deno Deploy working directory
  const filePath = `./public/decks/templates/${templateId}-patterns.json`;

  try {
    const content = await Deno.readTextFile(filePath);
    const metadata = JSON.parse(content);

    // Validate structure
    if (!metadata.patterns || !Array.isArray(metadata.patterns)) {
      throw new Error('Invalid pattern metadata: missing patterns array');
    }

    console.log(`[TEMPLATE_UTILS] Loaded pattern metadata for ${templateId}:`, {
      patterns_count: metadata.patterns.length,
      template_version: metadata.template_version
    });

    return metadata;
  } catch (error) {
    console.error(`[TEMPLATE_UTILS] Failed to load pattern metadata for ${templateId}:`, error);
    throw new Error(`Pattern metadata not found or invalid: ${templateId}-patterns.json`);
  }
}

/**
 * Loads full template HTML file
 *
 * Used for:
 * - Extracting CSS with extractStyleBlock()
 * - Full template when needed (fallback)
 *
 * @param templateId - Template identifier (e.g., 'koko-classic')
 * @returns Complete HTML string
 * @throws Error if file not found
 */
export async function loadTemplateHTML(templateId: string): Promise<string> {
  const filePath = `./public/decks/templates/${templateId}.html`;

  try {
    const html = await Deno.readTextFile(filePath);

    // Validate HTML structure
    if (!html.includes('<!DOCTYPE html>') && !html.includes('<html')) {
      throw new Error('Invalid HTML: missing DOCTYPE or <html> tag');
    }

    console.log(`[TEMPLATE_UTILS] Loaded template ${templateId}:`, {
      size_kb: (html.length / 1024).toFixed(1),
      has_style: html.includes('<style>'),
      has_body: html.includes('<body>')
    });

    return html;
  } catch (error) {
    console.error(`[TEMPLATE_UTILS] Failed to load template ${templateId}:`, error);
    throw new Error(`Template not found: ${templateId}.html`);
  }
}

/**
 * Extracts font @import and @font-face declarations from CSS
 * Useful for separating fonts from layout CSS
 *
 * @param css - CSS content
 * @returns Object with fonts and remainingCSS
 */
export function extractFonts(css: string): { fonts: string; remainingCSS: string } {
  const fontImportRegex = /@import\s+url\([^)]+\);/g;
  const fontFaceRegex = /@font-face\s*\{[^}]+\}/gs;

  const fontImports = css.match(fontImportRegex) || [];
  const fontFaces = css.match(fontFaceRegex) || [];

  const fonts = [...fontImports, ...fontFaces].join('\n\n');

  // Remove fonts from CSS
  let remainingCSS = css;
  fontImports.forEach(imp => { remainingCSS = remainingCSS.replace(imp, ''); });
  fontFaces.forEach(face => { remainingCSS = remainingCSS.replace(face, ''); });

  return {
    fonts: fonts.trim(),
    remainingCSS: remainingCSS.trim()
  };
}
