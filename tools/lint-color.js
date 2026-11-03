#!/usr/bin/env node
/**
 * tools/lint-color.js
 * Quét toàn bộ mã nguồn để kiểm kê và giám sát số lượng:
 * 1. Mã màu HEX / RGBA viết cứng ngoài file token.
 * 2. Inline style có màu (color / background) trong JS và HTML partials.
 * 3. Class màu Tailwind không theo theme (text-*, bg-*, border-*).
 * 4. Thuộc tính SVG fill/stroke viết cứng bằng HEX.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Regex patterns
const HEX_REGEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const INLINE_COLOR_STYLE_REGEX = /style\s*=\s*["'][^"']*(?:color|background|border-color)\s*:[^"']*["']/gi;
const JS_STYLE_ASSIGN_REGEX = /\.style\.(?:color|backgroundColor|borderColor)\s*=\s*["'][^"']+["']/g;
const TAILWIND_COLOR_REGEX = /(?<![\w-])(?:text|bg|border)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\b|(?<![\w-])text-white\b|(?<![\w-])bg-white\b|(?<![\w-])(?:bg|text)-\[#[0-9a-fA-F]+\]/g;
const SVG_HEX_ATTR_REGEX = /(?:fill|stroke)\s*=\s*["']#(?:[0-9a-fA-F]{3,8})["']/gi;

export function scanCssFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(ROOT, filePath);

  // Đối với theme-light.css, chỉ đếm các hex nằm NGOÀI khối token đầu tệp (sau dòng 310)
  let scanContent = content;
  if (relPath === 'css/theme-light.css') {
    const lines = content.split('\n');
    scanContent = lines.slice(310).join('\n');
  }

  const hexMatches = scanContent.match(HEX_REGEX) || [];
  const importantMatches = scanContent.match(/!important/g) || [];

  return {
    file: relPath,
    hexCount: hexMatches.length,
    importantCount: importantMatches.length,
    hexes: [...new Set(hexMatches)]
  };
}

export function scanJsFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(ROOT, filePath);

  const inlineStyles = content.match(INLINE_COLOR_STYLE_REGEX) || [];
  const styleAssigns = content.match(JS_STYLE_ASSIGN_REGEX) || [];
  const tailwindMatches = content.match(TAILWIND_COLOR_REGEX) || [];
  const hexMatches = content.match(HEX_REGEX) || [];

  return {
    file: relPath,
    inlineColorStylesCount: inlineStyles.length + styleAssigns.length,
    tailwindCount: tailwindMatches.length,
    hexCount: hexMatches.length,
    inlineStylesSample: inlineStyles.slice(0, 5)
  };
}

export function scanHtmlFile(filePath) {
  const rawContent = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(ROOT, filePath);

  // Loại bỏ thẻ <style> nội bộ để đo chính xác các class gán trực tiếp trên thẻ HTML
  const htmlOnly = rawContent.replace(/<style[\s\S]*?<\/style>/gi, '');

  const inlineStyles = htmlOnly.match(INLINE_COLOR_STYLE_REGEX) || [];
  const tailwindMatches = htmlOnly.match(TAILWIND_COLOR_REGEX) || [];
  const svgHexMatches = htmlOnly.match(SVG_HEX_ATTR_REGEX) || [];
  const arbitraryColorMatches = htmlOnly.match(/\b(?:bg|text|border)-\[#[0-9a-fA-F]+\]/g) || [];

  return {
    file: relPath,
    inlineColorStylesCount: inlineStyles.length,
    tailwindCount: tailwindMatches.length,
    arbitraryCount: arbitraryColorMatches.length,
    svgHexCount: svgHexMatches.length
  };
}

export function runLint() {
  const cssDir = path.join(ROOT, 'css');
  const jsDir = path.join(ROOT, 'js');
  const partialsDir = path.join(ROOT, 'partials');

  const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css')).map(f => path.join(cssDir, f));
  const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).map(f => path.join(jsDir, f));
  const htmlFiles = [
    path.join(ROOT, 'src', 'index.src.html'),
    ...fs.readdirSync(partialsDir).filter(f => f.endsWith('.html')).map(f => path.join(partialsDir, f))
  ];

  const cssResults = cssFiles.map(scanCssFile);
  const jsResults = jsFiles.map(scanJsFile);
  const htmlResults = htmlFiles.map(scanHtmlFile);

  const totalCssHex = cssResults.reduce((acc, r) => acc + r.hexCount, 0);
  const totalJsInlineStyles = jsResults.reduce((acc, r) => acc + r.inlineColorStylesCount, 0);
  const totalHtmlInlineStyles = htmlResults.reduce((acc, r) => acc + r.inlineColorStylesCount, 0);
  const totalHtmlTailwind = htmlResults.reduce((acc, r) => acc + r.tailwindCount, 0);
  const totalHtmlSvgHex = htmlResults.reduce((acc, r) => acc + r.svgHexCount, 0);

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalCssHexOutsideTokens: totalCssHex,
      totalJsInlineColorStyles: totalJsInlineStyles,
      totalHtmlInlineColorStyles: totalHtmlInlineStyles,
      totalHtmlTailwindColors: totalHtmlTailwind,
      totalHtmlSvgHex: totalHtmlSvgHex
    },
    cssResults,
    jsResults,
    htmlResults
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runLint();
  console.log('='.repeat(70));
  console.log('📊 BÁO CÁO KIỂM KÊ MÃ MÀU DỰ ÁN (French Shadowing Studio)');
  console.log('='.repeat(70));
  console.log(`- Mã HEX trong CSS ngoài token:     ${result.summary.totalCssHexOutsideTokens}`);
  console.log(`- Inline style màu trong JS:        ${result.summary.totalJsInlineColorStyles}`);
  console.log(`- Inline style màu trong HTML:      ${result.summary.totalHtmlInlineColorStyles}`);
  console.log(`- Class màu Tailwind trong HTML:    ${result.summary.totalHtmlTailwindColors}`);
  console.log(`- Thuộc tính SVG fill/stroke hex:   ${result.summary.totalHtmlSvgHex}`);
  console.log('-'.repeat(70));
  console.log('Top CSS chứa nhiều HEX cứng:');
  result.cssResults
    .filter(r => r.hexCount > 0)
    .sort((a, b) => b.hexCount - a.hexCount)
    .slice(0, 7)
    .forEach(r => console.log(`  • ${r.file.padEnd(30)}: ${r.hexCount} hex, ${r.importantCount} !important`));

  console.log('\nTop JS chứa nhiều inline style màu:');
  result.jsResults
    .filter(r => r.inlineColorStylesCount > 0)
    .sort((a, b) => b.inlineColorStylesCount - a.inlineColorStylesCount)
    .slice(0, 5)
    .forEach(r => console.log(`  • ${r.file.padEnd(30)}: ${r.inlineColorStylesCount} inline styles`));

  console.log('\nTop HTML/partials chứa nhiều class Tailwind màu:');
  result.htmlResults
    .filter(r => r.tailwindCount > 0)
    .sort((a, b) => b.tailwindCount - a.tailwindCount)
    .slice(0, 5)
    .forEach(r => console.log(`  • ${r.file.padEnd(35)}: ${r.tailwindCount} classes, ${r.inlineColorStylesCount} inline`));
  console.log('='.repeat(70));
}
