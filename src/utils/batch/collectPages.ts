/**
 * Page collection utilities for merge preview
 * Feature: multi-page-merge-preview
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import type { Editor } from 'tldraw';
import type { PageLinkHandler } from './pageLinkHandler';
import type { HtmlShape } from '../../core/shape/HybridHtmlShapeUtil';
import { DEFAULT_ROLE_ALIASES } from './pageNameResolver';
import { DiffEngine } from '../../core/diff/DiffEngine';

/**
 * Represents a collected page with its content
 * 
 * @interface CollectedPage
 * @property {string} name - Page name (e.g., "home", "products")
 * @property {string} html - Page HTML content
 * @property {string} css - Page CSS styles
 * @property {string} js - Page JavaScript code
 */
export interface CollectedPage {
  /** Page name (e.g., "home", "products") */
  name: string;
  /** Page HTML content */
  html: string;
  /** Page CSS styles */
  css: string;
  /** Page JavaScript code */
  js: string;
}

/**
 * Collect all batch-generated pages from the canvas
 * 
 * This function retrieves page data from PageLinkHandler and tldraw Editor:
 * 1. Gets registered page names from PageLinkHandler
 * 2. Resolves each page name to its shape ID
 * 3. Reads html, css, js properties from each shape
 * 4. Filters out pages where shapes cannot be found
 * 
 * @param pageLinkHandler - PageLinkHandler instance (may be null)
 * @param editor - tldraw Editor instance (may be null)
 * @returns Array of collected pages with their content
 * 
 * @example
 * ```typescript
 * const pages = collectPages(pageLinkHandler, editor);
 * // Returns: [
 * //   { name: 'home', html: '<div>...</div>', css: '...', js: '...' },
 * //   { name: 'products', html: '<div>...</div>', css: '...', js: '...' }
 * // ]
 * ```
 * 
 * Requirements:
 * - 1.1: Get page names from PageLinkHandler's registered page mapping
 * - 1.2: Read html, css, js properties from each shape via Editor
 * - 1.3: Handle PageLinkHandler null and missing shapes gracefully
 * - 1.4: Return structured data array with page name and content
 */
export function collectPages(
  pageLinkHandler: PageLinkHandler | null,
  editor: Editor | null
): CollectedPage[] {
  // Requirement 1.3: Handle null PageLinkHandler
  if (!pageLinkHandler || !editor) {
    return [];
  }

  // Requirement 1.1: Get all registered page names
  const pageNames = pageLinkHandler.getRegisteredPages();

  // Collect pages by resolving names to shapes
  const collectedPages: CollectedPage[] = [];
  const diffEngine = new DiffEngine();

  for (const pageName of pageNames) {
    // Requirement 1.1: Resolve page name to shape ID
    const shapeId = pageLinkHandler.handlePageLinkClick(pageName);

    // Requirement 1.3: Skip if shape ID not found
    if (!shapeId) {
      continue;
    }

    // Requirement 1.2: Get shape from editor
    const shape = editor.getShape(shapeId as any) as HtmlShape | undefined;

    // Requirement 1.3: Skip if shape doesn't exist
    if (!shape) {
      continue;
    }

    // Requirement 1.2: Extract html, css, js from shape props
    const { html, css, js, overrides } = shape.props;

    // Apply overrides to HTML (e.g. navigation replacements from theme editor)
    let finalHtml = html || '';
    if (overrides && overrides.length > 0) {
      try {
        finalHtml = diffEngine.applyOverrides(finalHtml, overrides);
      } catch {
        // If override application fails, use original HTML
      }
    }

    // Requirement 1.4: Add to collected pages array
    collectedPages.push({
      name: pageName,
      html: finalHtml,
      css: css || '',
      js: js || '',
    });
  }

  return collectedPages;
}

/**
 * Normalize page name to lowercase with hyphens
 * Feature: merge-preview-fallback-fix
 * Requirements: 2.5
 * 
 * @param name - Raw page name
 * @returns Normalized page name
 */
function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Extract all data-page-target values from HTML content
 * 
 * @param html - HTML content
 * @returns Array of unique data-page-target values found
 */
function extractDataPageTargets(html: string): string[] {
  const targets = new Set<string>();
  const regex = /data-page-target=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    targets.add(match[1]);
  }
  return Array.from(targets);
}

/**
 * Extract page name from HTML content
 * Feature: merge-preview-fallback-fix
 * Requirements: 2.1, 2.2, 2.3
 * 
 * Tries to extract a meaningful page name from the HTML by:
 * 1. Cross-referencing data-page-target values with the <title> or <h1>
 *    to find the canonical page name that matches navigation links
 * 2. Looking for <title> tag (fallback)
 * 3. Looking for <h1> tag (fallback)
 * 4. Falling back to generic name
 * 
 * @param html - HTML content
 * @returns Extracted and normalized page name
 */
function extractPageName(html: string): string {
  // Priority 1: Try to identify the page by cross-referencing data-page-target
  // values with the title/h1. This ensures the page name matches what other
  // pages use in their navigation links (data-page-target attributes).
  const targets = extractDataPageTargets(html);
  
  console.debug('[extractPageName] Starting extraction', {
    targetsFound: targets.length,
    targets: targets,
  });
  
  if (targets.length > 0) {
    // Get title and h1 text for matching
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const titleText = titleMatch?.[1] || '';
    const titleLower = titleText.toLowerCase();
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const h1Text = h1Match?.[1]?.replace(/<[^>]*>/g, '') || '';
    const h1Lower = h1Text.toLowerCase();
    
    console.debug('[extractPageName] Title/H1 text', { titleText, h1Text });
    
    // Sort targets by length descending to prefer longer/more specific matches first
    // (e.g., "product-detail" before "product")
    const sortedTargets = [...targets].sort((a, b) => b.length - a.length);
    
    // Strategy 1: Direct English match — check if title/h1 contains the target name
    for (const target of sortedTargets) {
      const targetLower = target.toLowerCase();
      if (titleLower.includes(targetLower) || h1Lower.includes(targetLower)) {
        console.debug('[extractPageName] Direct match found', { target, titleText, h1Text });
        return target;
      }
    }
    
    // Strategy 2: Hyphenated to space match (e.g., "product-detail" → "product detail")
    for (const target of sortedTargets) {
      const targetWords = target.toLowerCase().replace(/-/g, ' ');
      if (titleLower.includes(targetWords) || h1Lower.includes(targetWords)) {
        console.debug('[extractPageName] Hyphen-to-space match found', { target, titleText, h1Text });
        return target;
      }
    }

    // Strategy 3: Chinese alias mapping — match Chinese title/h1 to English page names
    // Build a reverse mapping: English page name → Chinese aliases
    const reverseAliases = new Map<string, string[]>();
    for (const [chinese, english] of Object.entries(DEFAULT_ROLE_ALIASES)) {
      if (!reverseAliases.has(english)) {
        reverseAliases.set(english, []);
      }
      reverseAliases.get(english)!.push(chinese);
    }
    
    for (const target of sortedTargets) {
      const chineseAliases = reverseAliases.get(target) || [];
      for (const alias of chineseAliases) {
        if (titleText.includes(alias) || h1Text.includes(alias)) {
          console.debug('[extractPageName] Chinese alias match found', { target, alias, titleText, h1Text });
          return target;
        }
      }
    }

    // Strategy 4: Check for active/current nav link patterns
    const activePatterns = [
      /data-page-target=["']([^"']+)["'][^>]*class=["'][^"']*(?:active|current)[^"']*["']/gi,
      /class=["'][^"']*(?:active|current)[^"']*["'][^>]*data-page-target=["']([^"']+)["']/gi,
      /data-page-target=["']([^"']+)["'][^>]*(?:font-weight:\s*(?:bold|700|800|900))/gi,
      /data-page-target=["']([^"']+)["'][^>]*aria-current=["']page["']/gi,
    ];
    
    for (const pattern of activePatterns) {
      const match = pattern.exec(html);
      if (match) {
        const activePage = match[1] || match[2];
        if (activePage && targets.includes(activePage)) {
          console.debug('[extractPageName] Active nav link match found', { activePage });
          return activePage;
        }
      }
    }
    
    console.debug('[extractPageName] No cross-reference match found, targets available but unmatched');
  }

  // Fallback: use <title> tag
  const titleMatch2 = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch2 && titleMatch2[1]) {
    const result = normalizeName(titleMatch2[1]);
    console.debug('[extractPageName] Using title fallback', { title: titleMatch2[1], normalized: result });
    if (result) return result;
  }

  // Fallback: use <h1> tag
  const h1Match2 = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match2 && h1Match2[1]) {
    const result = normalizeName(h1Match2[1]);
    console.debug('[extractPageName] Using h1 fallback', { h1: h1Match2[1], normalized: result });
    if (result) return result;
  }

  // Requirement 2.3: Fallback to generic name
  const genericName = `page-${Date.now()}`;
  console.debug('[extractPageName] Using generic fallback', { name: genericName });
  return genericName;
}

/**
 * Collect pages by scanning canvas for HTML shapes (fallback method)
 * Feature: merge-preview-fallback-fix
 * Requirements: 1.2, 1.3, 2.1-2.5, 4.1-4.5
 * 
 * This function is used when PageLinkHandler is not available or has no
 * registered pages. It scans all shapes on the canvas and collects those
 * that are HTML shapes with valid content.
 * 
 * @param editor - tldraw Editor instance
 * @returns Array of collected pages from canvas shapes
 * 
 * @example
 * ```typescript
 * const pages = collectPagesFromCanvas(editor);
 * // Returns: [
 * //   { name: 'home', html: '<div>...</div>', css: '...', js: '...' },
 * //   { name: 'products', html: '<div>...</div>', css: '...', js: '...' }
 * // ]
 * ```
 */
export function collectPagesFromCanvas(editor: Editor | null): CollectedPage[] {
  // Requirement 4.1: Handle null editor
  if (!editor) {
    return [];
  }

  const allShapes = editor.getCurrentPageShapes();
  const collectedPages: CollectedPage[] = [];
  const usedNames = new Set<string>();
  const diffEngine = new DiffEngine();

  console.debug('[collectPagesFromCanvas] Scanning canvas shapes', { 
    totalShapes: allShapes.length,
    htmlShapes: allShapes.filter(s => s.type === 'html').length
  });

  for (const shape of allShapes) {
    // Requirement 1.3: Check if shape is an HTML shape
    if (shape.type !== 'html') {
      continue;
    }

    const htmlShape = shape as HtmlShape;
    const { html, css, js, overrides } = htmlShape.props;

    // Requirement 4.2: Skip shapes with empty or invalid content
    if (!html || html.trim().length === 0) {
      continue;
    }

    // Skip placeholder shapes (shimmer loading animation) and error shapes
    // These are generated by placeholderHtml.ts during batch generation
    if (isPlaceholderOrErrorHtml(html)) {
      continue;
    }

    // Apply overrides to HTML (e.g. navigation replacements from theme editor)
    // Note: CSS variable changes are already reflected in the css prop
    let finalHtml = html;
    if (overrides && overrides.length > 0) {
      try {
        finalHtml = diffEngine.applyOverrides(html, overrides);
      } catch {
        // If override application fails, use original HTML
        finalHtml = html;
      }
    }

    // Requirement 2.1-2.5: Extract page name from HTML
    let pageName = extractPageName(finalHtml);
    
    console.debug('[collectPagesFromCanvas] Extracted page name', { 
      pageName,
      htmlLength: finalHtml.length,
      hasTitle: /<title[^>]*>/i.test(finalHtml),
      titleContent: finalHtml.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] || 'N/A',
      dataPageTargets: extractDataPageTargets(finalHtml),
      overridesApplied: overrides?.length || 0,
    });
    
    // Requirement 2.4: Ensure uniqueness
    if (usedNames.has(pageName)) {
      let counter = 2;
      while (usedNames.has(`${pageName}-${counter}`)) {
        counter++;
      }
      pageName = `${pageName}-${counter}`;
    }
    
    usedNames.add(pageName);

    // Requirement 4.3: Include shape even if css/js are missing
    collectedPages.push({
      name: pageName,
      html: finalHtml || '',
      css: css || '',
      js: js || '',
    });
  }

  return collectedPages;
}

/**
 * Check if HTML content is a placeholder or error shape
 * These should be excluded from merge preview as they don't contain real page content
 */
function isPlaceholderOrErrorHtml(html: string): boolean {
  // Placeholder shapes have shimmer animation
  if (html.includes('@keyframes shimmer') && html.includes('animation:shimmer')) {
    return true;
  }
  // Error shapes have the specific error styling
  if (html.includes('生成失败:') && html.includes('#EF4444')) {
    return true;
  }
  return false;
}
