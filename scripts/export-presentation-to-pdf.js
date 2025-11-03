#!/usr/bin/env node

/**
 * Export HTML Presentation to PDF using Playwright
 *
 * Usage:
 *   node scripts/export-presentation-to-pdf.js [path/to/file.html]
 *   npm run export:pdf [path/to/file.html]
 *
 * Examples:
 *   npm run export:pdf public/decks/output/report-molduraminuto-20251103.html
 *   npm run export:pdf decks/output/report-molduraminuto-20251103.html
 *
 * Output:
 *   Generates PDF in same directory as input HTML file
 *   Example: report-molduraminuto-20251103.html → report-molduraminuto-20251103.pdf
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve, basename } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function exportToPDF(htmlPath, outputPath) {
  console.log('🚀 Starting PDF export...');
  console.log(`📄 Input:  ${htmlPath}`);
  console.log(`📑 Output: ${outputPath}`);

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--font-render-hinting=none'] // Better font rendering
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 } // HD resolution
  });

  const page = await context.newPage();

  // Load HTML file
  const fileUrl = `file://${resolve(htmlPath)}`;
  console.log('⏳ Loading HTML...');

  await page.goto(fileUrl, {
    waitUntil: 'networkidle', // Wait for all resources
  });

  // Wait for fonts and images to load
  console.log('⏳ Loading fonts and images...');
  await page.waitForLoadState('load');

  // Extra time for @font-face loading (Haffer VF)
  await page.waitForTimeout(3000);

  // Check if fonts loaded
  const fontLoaded = await page.evaluate(() => {
    return document.fonts.check('16px Haffer');
  });

  if (fontLoaded) {
    console.log('✅ Custom font loaded successfully');
  } else {
    console.warn('⚠️  Custom font might not be loaded');
  }

  // Generate PDF
  console.log('📄 Generating PDF...');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    landscape: true,
    printBackground: true, // Essential for gradients/backgrounds
    preferCSSPageSize: true, // Respect @page CSS rules
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    scale: 1.0, // 100% scale
  });

  await browser.close();

  console.log('✅ PDF exported successfully!');
  console.log(`📑 File: ${outputPath}`);
}

// Main execution
const htmlFile = process.argv[2];

if (!htmlFile) {
  console.error('❌ Error: No HTML file specified');
  console.log('');
  console.log('Usage:');
  console.log('  npm run export:pdf <path/to/file.html>');
  console.log('');
  console.log('Example:');
  console.log('  npm run export:pdf public/decks/output/report-molduraminuto-20251103.html');
  process.exit(1);
}

// Resolve path and check if file exists
const resolvedHtmlPath = resolve(htmlFile);

if (!existsSync(resolvedHtmlPath)) {
  console.error(`❌ Error: File not found: ${htmlFile}`);
  console.error(`   Resolved path: ${resolvedHtmlPath}`);
  process.exit(1);
}

// Generate output path (replace .html with .pdf)
const outputPath = resolvedHtmlPath.replace(/\.html$/, '.pdf');

// Run export
exportToPDF(resolvedHtmlPath, outputPath)
  .then(() => {
    console.log('');
    console.log('🎉 Done! You can now view the PDF.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Export failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
