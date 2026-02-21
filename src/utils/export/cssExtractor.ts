/**
 * CSS Extractor - Extracts shared CSS rules from multiple pages
 * Feature: export-deployable-project
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import type { ProcessedPage, CSSExtractionResult } from '../../types';

/**
 * Extracts shared CSS rules from multiple pages
 * 
 * Strategy:
 * - Split each page's CSS by rules (using '}' as delimiter)
 * - Count how many pages each rule appears in
 * - Rules appearing in ≥2 pages are extracted to sharedCSS
 * - Page-specific rules remain in pageCSS
 * - Single page returns empty sharedCSS
 * 
 * @param pages - Array of processed pages with CSS content
 * @returns CSSExtractionResult with shared and page-specific CSS
 */
export function extractSharedCSS(pages: ProcessedPage[]): CSSExtractionResult {
  // Single page or no pages: return empty shared CSS
  if (pages.length <= 1) {
    const pageCSS = new Map<string, string>();
    if (pages.length === 1) {
      pageCSS.set(pages[0].name, pages[0].css);
    }
    return {
      sharedCSS: '',
      pageCSS,
    };
  }

  // Map to track which pages contain each CSS rule
  const ruleToPages = new Map<string, Set<string>>();

  // Parse CSS from each page and track rules
  pages.forEach((page) => {
    const rules = splitCSSRules(page.css);
    rules.forEach((rule) => {
      if (!ruleToPages.has(rule)) {
        ruleToPages.set(rule, new Set());
      }
      ruleToPages.get(rule)!.add(page.name);
    });
  });

  // Separate shared rules (≥2 pages) from page-specific rules
  const sharedRules: string[] = [];
  const pageSpecificRules = new Map<string, string[]>();

  // Initialize page-specific rules map
  pages.forEach((page) => {
    pageSpecificRules.set(page.name, []);
  });

  // Classify each rule
  ruleToPages.forEach((pageSet, rule) => {
    if (pageSet.size >= 2) {
      // Shared rule
      sharedRules.push(rule);
    } else {
      // Page-specific rule
      const pageName = Array.from(pageSet)[0];
      pageSpecificRules.get(pageName)!.push(rule);
    }
  });

  // Build result
  const sharedCSS = sharedRules.join('\n\n');
  const pageCSS = new Map<string, string>();

  pages.forEach((page) => {
    const rules = pageSpecificRules.get(page.name) || [];
    pageCSS.set(page.name, rules.join('\n\n'));
  });

  return {
    sharedCSS,
    pageCSS,
  };
}

/**
 * Splits CSS content into individual rules
 * Uses '}' as delimiter and normalizes whitespace
 * 
 * @param css - CSS content to split
 * @returns Array of normalized CSS rules
 */
function splitCSSRules(css: string): string[] {
  if (!css || css.trim() === '') {
    return [];
  }

  // Split by '}' and filter out empty rules
  const rules = css
    .split('}')
    .map((rule) => rule.trim())
    .filter((rule) => rule.length > 0)
    .map((rule) => rule + '}'); // Add back the closing brace

  // Normalize whitespace for consistent comparison
  return rules.map((rule) => normalizeRule(rule));
}

/**
 * Normalizes a CSS rule for consistent comparison
 * - Removes extra whitespace
 * - Normalizes line breaks
 * 
 * @param rule - CSS rule to normalize
 * @returns Normalized CSS rule
 */
function normalizeRule(rule: string): string {
  return rule
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\s*{\s*/g, ' { ') // Normalize around opening brace
    .replace(/\s*}\s*/g, ' }') // Normalize around closing brace
    .replace(/\s*;\s*/g, '; ') // Normalize around semicolons
    .replace(/\s*:\s*/g, ': ') // Normalize around colons
    .trim();
}
