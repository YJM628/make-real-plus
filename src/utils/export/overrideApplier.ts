/**
 * Override Applier - Applies element overrides to HTML content
 * Feature: export-deployable-project
 * Requirements: 8.1, 8.2
 */

import type { CollectedPage } from '../batch/collectPages';
import type { ElementOverride, ProcessedPage } from '../../types';

/**
 * Apply element overrides to a collected page's HTML content
 * 
 * This function takes a page with its original HTML and applies all element
 * overrides (text, styles, html, attributes) to produce the final processed HTML.
 * 
 * Implementation strategy:
 * 1. Parse HTML using DOMParser to create a DOM tree
 * 2. Iterate through each override in the overrides array
 * 3. Use querySelector to locate the target element by selector
 * 4. Apply modifications in order: text → styles → html → attributes
 * 5. Handle missing elements gracefully (skip and log warning)
 * 6. Serialize the modified DOM back to HTML string
 * 
 * @param page - Collected page data with original HTML
 * @param overrides - Array of element overrides to apply
 * @returns Processed page with overrides applied to HTML
 * 
 * @example
 * ```typescript
 * const page = {
 *   name: 'home',
 *   html: '<div class="title">Original</div>',
 *   css: '...',
 *   js: '...'
 * };
 * const overrides = [{
 *   selector: '.title',
 *   text: 'Modified',
 *   styles: { color: 'red' },
 *   timestamp: Date.now(),
 *   aiGenerated: false
 * }];
 * const result = applyOverrides(page, overrides);
 * // result.html contains: '<div class="title" style="color: red;">Modified</div>'
 * ```
 * 
 * Requirements:
 * - 8.1: Apply overrides from shape's overrides property to HTML content
 * - 8.2: Use latest modified values (html, css, js) from shape props
 */
export function applyOverrides(
  page: CollectedPage,
  overrides: ElementOverride[]
): ProcessedPage {
  // If no overrides, return page as-is
  if (!overrides || overrides.length === 0) {
    return {
      name: page.name,
      html: page.html,
      css: page.css,
      js: page.js,
    };
  }

  // Parse HTML into DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(page.html, 'text/html');

  // Track applied and skipped overrides for logging
  let appliedCount = 0;
  let skippedCount = 0;

  // Apply each override in sequence
  for (const override of overrides) {
    try {
      // Locate target element using selector
      const element = doc.querySelector(override.selector);

      if (!element) {
        // Requirement 8.1: Handle selector mismatch gracefully
        console.warn(
          `[overrideApplier] Selector not found: "${override.selector}" in page "${page.name}". Skipping override.`
        );
        skippedCount++;
        continue;
      }

      // Apply modifications in order: text → styles → html → attributes

      // 1. Apply text content modification
      if (override.text !== undefined) {
        element.textContent = override.text;
      }

      // 2. Apply style modifications
      if (override.styles) {
        const htmlElement = element as HTMLElement;
        for (const [property, value] of Object.entries(override.styles)) {
          // Convert CSS property names (e.g., 'background-color' → 'backgroundColor')
          const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) =>
            letter.toUpperCase()
          );
          htmlElement.style[camelCaseProperty as any] = value;
        }
      }

      // 3. Apply HTML replacement (this replaces the entire element's innerHTML)
      if (override.html !== undefined) {
        element.innerHTML = override.html;
      }

      // 4. Apply attribute modifications
      if (override.attributes) {
        for (const [attrName, attrValue] of Object.entries(override.attributes)) {
          element.setAttribute(attrName, attrValue);
        }
      }

      appliedCount++;
    } catch (error) {
      // Catch any unexpected errors during override application
      console.error(
        `[overrideApplier] Error applying override for selector "${override.selector}" in page "${page.name}":`,
        error
      );
      skippedCount++;
    }
  }

  // Log summary
  console.debug(
    `[overrideApplier] Applied ${appliedCount} overrides, skipped ${skippedCount} for page "${page.name}"`
  );

  // Serialize modified DOM back to HTML string
  const serializer = new XMLSerializer();
  const modifiedHtml = serializer.serializeToString(doc);

  // Return processed page
  return {
    name: page.name,
    html: modifiedHtml,
    css: page.css,
    js: page.js,
  };
}
