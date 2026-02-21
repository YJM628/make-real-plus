/**
 * Link Converter for Export Deployable Project
 * Feature: export-deployable-project
 * Requirements: 3.1, 3.2
 * 
 * This module converts data-page-target attributes to actual navigation links
 * for different export formats (static HTML, React, Vue).
 * 
 * ## Conversion Strategy
 * 
 * For static HTML export:
 * - Valid targets: `data-page-target="products"` → `href="#/products"`
 * - Invalid targets: Add disabled styling and remove navigation functionality
 * - Remove old navigateToPage event scripts (from PageLinkHandler)
 * 
 * For React export:
 * - Convert to React Router Link component markers
 * - Will be further processed by ReactConverter
 * 
 * For Vue export:
 * - Convert to Vue Router router-link component markers
 * - Will be further processed by VueConverter
 */

/**
 * Strip the old pageLinkHandler script from HTML content.
 * 
 * When pages are stored in canvas shapes, they may contain a script injected by
 * PageLinkHandler.injectLinkHandlers(). This script attaches individual click
 * handlers to [data-page-target] elements with e.stopPropagation(), which
 * prevents proper navigation in the exported project.
 * 
 * This function removes that script so the exported project can handle navigation
 * correctly. It also removes any inline styles/classes added by the old script.
 * 
 * This is adapted from stripOldLinkHandlerScripts in mergePreviewRouter.ts.
 * 
 * @param html - Raw HTML content that may contain the old script
 * @returns HTML with the old pageLinkHandler script removed
 */
function stripOldLinkHandlerScripts(html: string): string {
  // Remove the pageLinkHandler script block. It's identifiable by:
  // - Contains 'initPageLinks' function name
  // - Contains 'navigateToPage' CustomEvent
  // - Is wrapped in an IIFE with 'use strict'
  let cleaned = html.replace(
    /<script>\s*\(function\(\)\s*\{\s*['"]use strict['"][\s\S]*?initPageLinks[\s\S]*?<\/script>/gi,
    ''
  );

  // Also remove any inline disabled styles the old script may have applied
  // by cleaning up page-link-disabled class and associated inline styles
  cleaned = cleaned.replace(/\s*class="[^"]*page-link-disabled[^"]*"/gi, (match) => {
    // Remove just the page-link-disabled class, keep other classes
    const withoutDisabled = match.replace(/page-link-disabled\s*/g, '').replace(/\s+page-link-disabled/g, '');
    // Clean up empty class attributes or extra spaces
    return withoutDisabled
      .replace(/class=""\s*/g, '')
      .replace(/class="\s+/g, 'class="')
      .replace(/\s+"/g, '"');
  });

  // Remove inline styles that the old script adds for disabled links
  cleaned = cleaned.replace(
    /\s*style="[^"]*opacity:\s*0\.5[^"]*cursor:\s*not-allowed[^"]*"/gi,
    ''
  );

  return cleaned;
}

/**
 * Convert data-page-target attributes to actual navigation links
 * 
 * This function processes HTML content and converts data-page-target attributes
 * to appropriate navigation links based on the export format:
 * 
 * - **Static HTML**: Converts to hash-based navigation (#/pageName)
 * - **React**: Converts to React Router Link component markers
 * - **Vue**: Converts to Vue Router router-link component markers
 * 
 * For static HTML format:
 * - Valid targets (in pageNames list): `data-page-target="products"` → `href="#/products"`
 * - Invalid targets (not in pageNames): Add disabled styling and remove navigation
 * 
 * The function also removes old navigateToPage event scripts that may have been
 * injected by PageLinkHandler during the generation phase.
 * 
 * Requirements:
 * - 3.1: Convert data-page-target to working navigation links
 * - 3.2: Mark invalid links (targets not in pageNames) as disabled
 * 
 * @param html - HTML content to process
 * @param pageNames - List of valid page names in the exported project
 * @param format - Export format ('static', 'react', or 'vue')
 * @returns HTML with converted navigation links
 * 
 * @example
 * ```typescript
 * const html = '<button data-page-target="products">Products</button>';
 * const pageNames = ['home', 'products', 'about'];
 * 
 * // Static HTML export
 * const staticHtml = convertLinks(html, pageNames, 'static');
 * // Result: '<button data-page-target="products" href="#/products">Products</button>'
 * 
 * // Invalid target
 * const invalidHtml = '<button data-page-target="nonexistent">Invalid</button>';
 * const result = convertLinks(invalidHtml, pageNames, 'static');
 * // Result: '<button data-page-target="nonexistent" class="export-link-disabled" 
 * //          style="opacity: 0.5; cursor: not-allowed; pointer-events: none;" 
 * //          title="Page \'nonexistent\' not found">Invalid</button>'
 * ```
 */
export function convertLinks(
  html: string,
  pageNames: string[],
  format: 'static' | 'react' | 'vue'
): string {
  // First, strip old link handler scripts
  let result = stripOldLinkHandlerScripts(html);

  // Create a Set for faster lookup
  const validPages = new Set(pageNames);

  // For static HTML format, convert data-page-target to href
  if (format === 'static') {
    // Use a regex to find all elements with data-page-target attribute
    // We need to be careful to handle various HTML element types and attributes
    result = result.replace(
      /(<[^>]+data-page-target=["']([^"']+)["'][^>]*)(>)/gi,
      (match, beforeClosing, targetPage, closing) => {
        // Check if this target page is valid
        if (validPages.has(targetPage)) {
          // Valid target: add href attribute
          // Check if href already exists to avoid duplicates
          if (!/\shref=/i.test(beforeClosing)) {
            return `${beforeClosing} href="#/${targetPage}"${closing}`;
          }
          return match;
        } else {
          // Invalid target: add disabled styling
          // Check if already has disabled styling to avoid duplicates
          if (!/export-link-disabled/.test(beforeClosing)) {
            // Add disabled class and inline styles
            let disabled = beforeClosing;
            
            // Add or append to class attribute
            if (/\sclass=["']([^"']*)["']/i.test(disabled)) {
              disabled = disabled.replace(
                /\sclass=["']([^"']*)["']/i,
                (_m: string, classes: string) => ` class="${classes} export-link-disabled"`
              );
            } else {
              disabled += ' class="export-link-disabled"';
            }
            
            // Add or append to style attribute
            const disabledStyles = 'opacity: 0.5; cursor: not-allowed; pointer-events: none;';
            if (/\sstyle=["']([^"']*)["']/i.test(disabled)) {
              disabled = disabled.replace(
                /\sstyle=["']([^"']*)["']/i,
                (_m: string, styles: string) => {
                  const trimmedStyles = styles.trim();
                  const separator = trimmedStyles && !trimmedStyles.endsWith(';') ? '; ' : ' ';
                  return ` style="${trimmedStyles}${separator}${disabledStyles}"`;
                }
              );
            } else {
              disabled += ` style="${disabledStyles}"`;
            }
            
            // Add title attribute for tooltip
            if (!/\stitle=/i.test(disabled)) {
              disabled += ` title="Page '${targetPage}' not found"`;
            }
            
            return `${disabled}${closing}`;
          }
          return match;
        }
      }
    );
  } else if (format === 'react') {
    // For React, we'll add a marker attribute that ReactConverter can process
    // This keeps the conversion logic separate and focused
    result = result.replace(
      /(<[^>]+data-page-target=["']([^"']+)["'][^>]*)(>)/gi,
      (match, beforeClosing, targetPage, closing) => {
        if (validPages.has(targetPage)) {
          // Add a marker for ReactConverter to process
          if (!/\sdata-react-link=/i.test(beforeClosing)) {
            return `${beforeClosing} data-react-link="true"${closing}`;
          }
        } else {
          // Invalid target: add disabled marker
          if (!/\sdata-react-link-disabled=/i.test(beforeClosing)) {
            return `${beforeClosing} data-react-link-disabled="true"${closing}`;
          }
        }
        return match;
      }
    );
  } else if (format === 'vue') {
    // For Vue, we'll add a marker attribute that VueConverter can process
    result = result.replace(
      /(<[^>]+data-page-target=["']([^"']+)["'][^>]*)(>)/gi,
      (match, beforeClosing, targetPage, closing) => {
        if (validPages.has(targetPage)) {
          // Add a marker for VueConverter to process
          if (!/\sdata-vue-link=/i.test(beforeClosing)) {
            return `${beforeClosing} data-vue-link="true"${closing}`;
          }
        } else {
          // Invalid target: add disabled marker
          if (!/\sdata-vue-link-disabled=/i.test(beforeClosing)) {
            return `${beforeClosing} data-vue-link-disabled="true"${closing}`;
          }
        }
        return match;
      }
    );
  }

  return result;
}
