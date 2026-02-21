/**
 * Design System Resolver
 * Feature: export-deployable-project
 * Requirements: 4.1, 4.2, 4.3
 * 
 * Collects and deduplicates design system CDN dependencies from multiple pages.
 */

import { DesignSystemRegistry } from '../../services/design-systems';
import type { ProcessedPage } from '../../types';
import type { DesignSystemType } from '../../services/design-systems';

/**
 * Resolve design system dependencies from multiple pages
 * 
 * Collects CDN links (stylesheets and scripts) from all pages' design systems,
 * deduplicates them, and returns a unified list.
 * 
 * @param pages - Array of processed pages with design system information
 * @returns Object containing deduplicated stylesheet and script CDN links
 * 
 * @example
 * ```typescript
 * const pages = [
 *   { name: 'home', html: '...', css: '...', js: '...', designSystem: 'material-ui' },
 *   { name: 'about', html: '...', css: '...', js: '...', designSystem: 'material-ui' },
 *   { name: 'contact', html: '...', css: '...', js: '...', designSystem: 'vanilla' }
 * ];
 * 
 * const deps = resolveDesignSystemDeps(pages);
 * // deps.stylesheets: ['https://...material-ui.css']
 * // deps.scripts: ['https://...material-ui.js']
 * ```
 */
export function resolveDesignSystemDeps(
  pages: ProcessedPage[]
): { stylesheets: string[]; scripts: string[] } {
  const stylesheetSet = new Set<string>();
  const scriptSet = new Set<string>();

  for (const page of pages) {
    // Skip pages without design system or with vanilla design system
    if (!page.designSystem || page.designSystem === 'vanilla') {
      continue;
    }

    try {
      // Get the design system adapter
      const adapter = DesignSystemRegistry.getAdapter(page.designSystem as DesignSystemType);
      
      // Vanilla returns null, skip it
      if (!adapter) {
        continue;
      }

      // Get required imports for this page's HTML
      const imports = adapter.getRequiredImports(page.html);

      // Add stylesheets to the set (automatic deduplication)
      imports.cdnLinks.forEach((link) => {
        // Heuristic: links ending with .css are stylesheets
        if (link.endsWith('.css') || link.includes('stylesheet')) {
          stylesheetSet.add(link);
        } else {
          // Otherwise, treat as script
          scriptSet.add(link);
        }
      });
    } catch (error) {
      // If design system type is unknown or adapter fails, skip this page
      // This handles the error case mentioned in the design doc
      console.warn(`Failed to resolve design system for page "${page.name}":`, error);
      continue;
    }
  }

  return {
    stylesheets: Array.from(stylesheetSet),
    scripts: Array.from(scriptSet),
  };
}
