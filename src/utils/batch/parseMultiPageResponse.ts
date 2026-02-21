/**
 * Multi-page response parser for cohesive batch generation
 * Feature: batch-html-redesign
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import type { CohesiveBatchResult, AppContext } from '../../types';

/**
 * Parse AI-generated multi-page response into structured result
 * 
 * Supports two formats:
 * 1. JSON format: Direct JSON object with sharedTheme, sharedNavigation, and pages
 * 2. Markdown format: JSON wrapped in markdown code blocks
 * 
 * @param rawResponse - Raw AI response string
 * @returns Parsed cohesive batch result with shared theme, navigation, and pages
 * 
 * @example
 * ```typescript
 * // JSON format
 * const response = '{"appName":"Shop","sharedTheme":"...","pages":[...]}';
 * const result = parseMultiPageResponse(response);
 * 
 * // Markdown format
 * const mdResponse = '```json\n{"appName":"Shop","pages":[...]}\n```';
 * const result = parseMultiPageResponse(mdResponse);
 * ```
 * 
 * Requirements:
 * - 7.1: Parse page name, HTML, CSS, and JavaScript from structured response
 * - 7.4: Fallback to text extraction when JSON parsing fails
 */
export function parseMultiPageResponse(rawResponse: string): CohesiveBatchResult {
  try {
    // Try direct JSON parsing first
    const parsed = tryParseJSON(rawResponse);
    if (parsed) {
      return buildResultFromParsed(parsed);
    }

    // Try extracting JSON from markdown code blocks
    const extracted = extractJSONFromMarkdown(rawResponse);
    if (extracted) {
      const parsed = tryParseJSON(extracted);
      if (parsed) {
        return buildResultFromParsed(parsed);
      }
    }

    // Fallback: try to extract HTML from markdown code blocks
    return fallbackExtractHTML(rawResponse);
  } catch (error) {
    return {
      sharedTheme: '',
      sharedNavigation: { header: '', footer: '' },
      pages: [],
      error: `Failed to parse response: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Try to parse a string as JSON with error recovery
 */
function tryParseJSON(str: string): any {
  try {
    // Try direct parse
    return JSON.parse(str);
  } catch {
    try {
      // Try fixing common JSON issues
      const fixed = str
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/(\w+):/g, '"$1":') // Quote unquoted keys
        .replace(/\n/g, '\\n') // Escape newlines in strings
        .replace(/\t/g, '\\t'); // Escape tabs
      
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}

/**
 * Extract JSON from markdown code blocks
 */
function extractJSONFromMarkdown(markdown: string): string | null {
  // Try to find JSON code block
  const jsonBlockMatch = markdown.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    return jsonBlockMatch[1].trim();
  }

  // Try to find any code block that looks like JSON
  const codeBlockMatch = markdown.match(/```\s*\n(\{[\s\S]*?\})\n```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }

  return null;
}

/**
 * Build CohesiveBatchResult from parsed JSON object
 */
function buildResultFromParsed(parsed: any): CohesiveBatchResult {
  // Validate required fields
  if (!parsed.pages || !Array.isArray(parsed.pages)) {
    throw new Error('Invalid response: missing or invalid "pages" array');
  }

  // Extract shared theme
  const sharedTheme = typeof parsed.sharedTheme === 'string' ? parsed.sharedTheme : '';

  // Extract shared navigation
  const sharedNavigation = {
    header: parsed.sharedNavigation?.header || '',
    footer: parsed.sharedNavigation?.footer || '',
  };

  // Extract pages
  const pages = parsed.pages
    .filter((page: any) => page && typeof page === 'object')
    .map((page: any) => ({
      name: page.name || 'unnamed',
      html: page.html || '',
      css: page.css || '',
      js: page.js || '',
    }))
    .filter((page: any) => page.html.trim() !== ''); // Filter out empty pages

  if (pages.length === 0) {
    throw new Error('No valid pages found in response');
  }

  return {
    sharedTheme,
    sharedNavigation,
    pages,
  };
}

/**
 * Fallback: extract HTML from markdown code blocks
 * Used when JSON parsing fails completely
 */
function fallbackExtractHTML(rawResponse: string): CohesiveBatchResult {
  const pages: Array<{ name: string; html: string; css: string; js: string }> = [];

  // Try to extract HTML code blocks
  const htmlBlockRegex = /```html\s*\n([\s\S]*?)\n```/g;
  let match;
  let index = 0;

  while ((match = htmlBlockRegex.exec(rawResponse)) !== null) {
    const html = match[1].trim();
    if (html) {
      pages.push({
        name: `page-${index + 1}`,
        html,
        css: '',
        js: '',
      });
      index++;
    }
  }

  // If no HTML blocks found, try to extract any HTML-like content
  if (pages.length === 0) {
    const htmlMatch = rawResponse.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
    if (htmlMatch) {
      pages.push({
        name: 'page-1',
        html: htmlMatch[0],
        css: '',
        js: '',
      });
    }
  }

  return {
    sharedTheme: '',
    sharedNavigation: { header: '', footer: '' },
    pages,
    error: pages.length === 0 ? 'Could not extract any valid HTML from response' : undefined,
  };
}

/**
 * Inject shared theme CSS into each page's CSS
 * 
 * The shared theme is prepended to each page's CSS to ensure
 * CSS variables and common styles are available.
 * 
 * @param pages - Array of pages with individual CSS
 * @param sharedTheme - Shared theme CSS to inject
 * @returns Pages with shared theme injected into their CSS
 * 
 * @example
 * ```typescript
 * const pages = [
 *   { name: 'home', html: '...', css: '.home { color: var(--primary); }', js: '' }
 * ];
 * const sharedTheme = ':root { --primary: #2563eb; }';
 * const result = injectSharedTheme(pages, sharedTheme);
 * // result[0].css === ':root { --primary: #2563eb; }\n\n.home { color: var(--primary); }'
 * ```
 * 
 * Requirements:
 * - 7.2: Extract and inject shared theme into each page's CSS
 * - 3.2: Ensure all pages reference the same shared theme CSS variables
 */
export function injectSharedTheme(
  pages: CohesiveBatchResult['pages'],
  sharedTheme: string
): CohesiveBatchResult['pages'] {
  if (!sharedTheme || sharedTheme.trim() === '') {
    return pages;
  }

  return pages.map(page => ({
    ...page,
    css: page.css
      ? `${sharedTheme}\n\n${page.css}`
      : sharedTheme,
  }));
}

/**
 * Validate that all inter-page links point to existing pages
 * 
 * Scans all pages for data-page-target attributes and verifies
 * that the target page names exist in the page collection.
 * 
 * @param pages - Array of pages to validate
 * @param appContext - Application context with page specifications
 * @returns Validation result with list of missing targets
 * 
 * @example
 * ```typescript
 * const pages = [
 *   { name: 'home', html: '<a data-page-target="about">About</a>', css: '', js: '' },
 *   { name: 'about', html: '<a data-page-target="home">Home</a>', css: '', js: '' }
 * ];
 * const appContext = {
 *   appName: 'Site',
 *   appType: 'website',
 *   pages: [
 *     { name: 'home', role: 'Home', linksTo: ['about'], order: 0 },
 *     { name: 'about', role: 'About', linksTo: ['home'], order: 1 }
 *   ],
 *   originalPrompt: 'Create site'
 * };
 * const result = validateInterPageLinks(pages, appContext);
 * // result.valid === true, result.missingTargets === []
 * ```
 * 
 * Requirements:
 * - 7.3: Verify navigation links point to pages that exist in the result
 * - 4.5: Mark links to non-existent pages as invalid
 */
export function validateInterPageLinks(
  pages: CohesiveBatchResult['pages'],
  appContext: AppContext
): { valid: boolean; missingTargets: string[] } {
  const pageNames = new Set(pages.map(p => p.name));
  const missingTargets = new Set<string>();

  // Extract all data-page-target attributes from all pages
  for (const page of pages) {
    const targetRegex = /data-page-target=["']([^"']+)["']/g;
    let match;

    while ((match = targetRegex.exec(page.html)) !== null) {
      const targetName = match[1];
      if (!pageNames.has(targetName)) {
        missingTargets.add(targetName);
      }
    }
  }

  return {
    valid: missingTargets.size === 0,
    missingTargets: Array.from(missingTargets),
  };
}
