/**
 * DiffEngine - Calculates differences between original and modified HTML
 * Feature: ai-html-visual-editor
 * 
 * Computes diffs, applies overrides to HTML, generates exports, and creates
 * responsive media queries.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.5, 18.4, 18.6
 */

import type {
  HtmlParseResult,
  ElementOverride,
  HtmlDiff,
  ExportResult,
  ViewportConfig,
  ParsedElement,
} from '../../types';
import { styleToCssString, parseCssString } from '../../utils/css/style';
import { responsiveManager } from '../../utils/responsive';
import type { ViewportOverride } from '../../utils/responsive';

/**
 * DiffEngine class for calculating HTML differences and generating exports
 * 
 * Validates: Property 20 - Export round trip consistency
 * Validates: Property 21 - Diff calculation completeness
 */
export class DiffEngine {
  /**
   * Calculates the difference between original HTML and current state with overrides
   * 
   * @param original - Original parsed HTML structure
   * @param overrides - Array of element overrides to apply
   * @returns HtmlDiff object with added, modified, and removed elements
   * 
   * Requirements: 12.1
   * Validates: Property 21 - Diff calculation completeness
   */
  calculateDiff(
    original: HtmlParseResult,
    overrides: ElementOverride[]
  ): HtmlDiff {
    const modified: Array<{ selector: string; changes: ElementOverride }> = [];
    const added: typeof original.root[] = [];
    const removed: typeof original.root[] = [];

    // Merge overrides by selector first
    const mergedOverrides = this.mergeOverrides(overrides);

    // Track which elements have been modified
    const modifiedSelectors = new Set<string>();

    // Process each override to identify modifications
    for (const override of mergedOverrides) {
      // Check if the element exists in the original
      const element = this.findElementBySelector(original, override.selector);

      if (element) {
        // Element exists and is modified
        modified.push({
          selector: override.selector,
          changes: override,
        });
        modifiedSelectors.add(override.selector);
      } else {
        // Element doesn't exist in original - it's added
        // Note: In practice, we don't track added elements through overrides
        // since overrides modify existing elements. This is here for completeness.
      }
    }

    // Note: We don't track removed elements through overrides either,
    // as overrides don't delete elements. This would require comparing
    // the original element tree with a modified tree.

    return {
      added,
      modified,
      removed,
    };
  }

  /**
   * Applies overrides to an HTML string
   * 
   * Takes the original HTML and applies all overrides to generate
   * the modified HTML string.
   * 
   * @param html - Original HTML string
   * @param overrides - Array of element overrides to apply
   * @returns Modified HTML string with all overrides applied
   * 
   * Requirements: 12.2
   * Validates: Property 21 - Applying diffs produces same result as direct override application
   */
  applyOverrides(html: string, overrides: ElementOverride[]): string {
    if (!html || overrides.length === 0) {
      return html;
    }

    // Parse HTML into DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Merge overrides by selector
    const mergedOverrides = this.mergeOverrides(overrides);

    // Apply each override
    for (const override of mergedOverrides) {
      try {
        // Find the target element
        const elements = doc.querySelectorAll(override.selector);

        // Apply override to each matching element (usually just one)
        for (const element of elements) {
          if (!(element instanceof HTMLElement)) {
            continue;
          }

          // Apply text content changes
          if (override.text !== undefined) {
            element.textContent = override.text;
          }

          // Apply style changes
          if (override.styles) {
            for (const [property, value] of Object.entries(override.styles)) {
              // Convert camelCase to kebab-case for CSS properties
              const kebabProperty = this.camelToKebab(property);
              element.style.setProperty(kebabProperty, value);
            }
          }

          // Apply HTML replacement
          if (override.html !== undefined) {
            element.innerHTML = override.html;
          }

          // Apply attribute changes
          if (override.attributes) {
            for (const [attr, value] of Object.entries(override.attributes)) {
              element.setAttribute(attr, value);
            }
          }

          // Apply position changes
          if (override.position) {
            element.style.setProperty('left', `${override.position.x}px`);
            element.style.setProperty('top', `${override.position.y}px`);
            
            // Ensure element has positioning context
            if (!element.style.position || element.style.position === 'static') {
              element.style.setProperty('position', 'absolute');
            }
          }

          // Apply size changes
          if (override.size) {
            element.style.setProperty('width', `${override.size.width}px`);
            element.style.setProperty('height', `${override.size.height}px`);
          }
        }
      } catch (error) {
        // Log error but continue processing other overrides
        console.error(`Error applying override for selector "${override.selector}":`, error);
      }
    }

    // Return modified HTML
    return doc.body.innerHTML;
  }

  /**
   * Merges multiple overrides for the same element
   * 
   * When the same element has multiple overrides, this merges them
   * into a single override with the latest values taking precedence.
   * 
   * @param overrides - Array of element overrides
   * @returns Array of merged overrides (one per selector)
   * 
   * Requirements: 12.2
   * Validates: Property 15 - Override merging idempotency
   */
  mergeOverrides(overrides: ElementOverride[]): ElementOverride[] {
    if (overrides.length === 0) {
      return [];
    }

    // Group overrides by selector
    const bySelector = new Map<string, ElementOverride[]>();

    for (const override of overrides) {
      if (!bySelector.has(override.selector)) {
        bySelector.set(override.selector, []);
      }
      bySelector.get(override.selector)!.push(override);
    }

    // Merge overrides for each selector
    const merged: ElementOverride[] = [];

    for (const [selector, selectorOverrides] of bySelector.entries()) {
      // Sort by timestamp (oldest first)
      const sorted = [...selectorOverrides].sort((a, b) => a.timestamp - b.timestamp);

      // Start with the first override
      const mergedOverride: ElementOverride = {
        selector,
        timestamp: sorted[sorted.length - 1].timestamp, // Use latest timestamp
        aiGenerated: sorted.some(o => o.aiGenerated), // True if any was AI-generated
      };

      // Merge all overrides in order (later ones override earlier ones)
      for (const override of sorted) {
        if (override.text !== undefined) {
          mergedOverride.text = override.text;
          if (!mergedOverride.original) mergedOverride.original = {};
          if (override.original?.text !== undefined) {
            mergedOverride.original.text = override.original.text;
          }
        }

        if (override.styles !== undefined) {
          mergedOverride.styles = { ...mergedOverride.styles, ...override.styles };
          if (!mergedOverride.original) mergedOverride.original = {};
          if (override.original?.styles !== undefined) {
            mergedOverride.original.styles = {
              ...mergedOverride.original.styles,
              ...override.original.styles,
            };
          }
        }

        if (override.html !== undefined) {
          mergedOverride.html = override.html;
          if (!mergedOverride.original) mergedOverride.original = {};
          if (override.original?.html !== undefined) {
            mergedOverride.original.html = override.original.html;
          }
        }

        if (override.attributes !== undefined) {
          mergedOverride.attributes = {
            ...mergedOverride.attributes,
            ...override.attributes,
          };
          if (!mergedOverride.original) mergedOverride.original = {};
          if (override.original?.attributes !== undefined) {
            mergedOverride.original.attributes = {
              ...mergedOverride.original.attributes,
              ...override.original.attributes,
            };
          }
        }

        if (override.position !== undefined) {
          mergedOverride.position = { ...override.position };
          if (!mergedOverride.original) mergedOverride.original = {};
          if (override.original?.position !== undefined) {
            mergedOverride.original.position = { ...override.original.position };
          }
        }

        if (override.size !== undefined) {
          mergedOverride.size = { ...override.size };
          if (!mergedOverride.original) mergedOverride.original = {};
          if (override.original?.size !== undefined) {
            mergedOverride.original.size = { ...override.original.size };
          }
        }
      }

      merged.push(mergedOverride);
    }

    return merged;
  }

  /**
   * Generates exportable HTML in single file or separate files format
   * 
   * @param original - Original parsed HTML structure
   * @param overrides - Array of element overrides to apply
   * @param format - Export format: 'single' for one HTML file, 'separate' for HTML/CSS/JS files
   * @returns ExportResult with HTML and optionally separate CSS/JS
   * 
   * Requirements: 12.3, 12.5
   * Validates: Property 20 - Export round trip consistency
   */
  generateExport(
    original: HtmlParseResult,
    overrides: ElementOverride[],
    format: 'single' | 'separate'
  ): ExportResult {
    // Apply overrides to the original HTML
    const modifiedHtml = this.applyOverrides(
      this.reconstructHtml(original),
      overrides
    );

    if (format === 'single') {
      // Generate single HTML file with embedded styles and scripts
      const html = this.generateSingleFileHtml(
        modifiedHtml,
        original.styles,
        original.scripts
      );

      return { html };
    } else {
      // Generate separate files
      return {
        html: modifiedHtml,
        css: original.styles,
        js: original.scripts,
      };
    }
  }

  /**
   * Generates responsive media queries for different viewports
   * 
   * Takes overrides that were made at different viewport sizes and
   * generates appropriate CSS media queries.
   * 
   * @param overrides - Array of element overrides with viewport-specific styles
   * @param viewports - Array of viewport configurations to generate queries for
   * @returns CSS string with media queries
   * 
   * Requirements: 18.4, 18.6
   */
  generateMediaQueries(
    overrides: ElementOverride[],
    viewports: ViewportConfig[]
  ): string {
    // Check if any overrides have viewport information
    const viewportOverrides = overrides.filter(o => 
      responsiveManager.hasViewportInfo(o)
    ) as ViewportOverride[];

    if (viewportOverrides.length > 0) {
      // Use ResponsiveManager for viewport-aware overrides
      return responsiveManager.generateMediaQueries(viewportOverrides);
    }

    // Fallback: Generate media queries for provided viewports
    // This is for backward compatibility when overrides don't have viewport info
    const mediaQueries: string[] = [];

    for (const viewport of viewports) {
      const viewportWidth = this.getViewportWidth(viewport);

      // Filter overrides that have style changes
      const styleOverrides = overrides.filter(o => o.styles && Object.keys(o.styles).length > 0);

      if (styleOverrides.length === 0) {
        continue;
      }

      // Generate media query for this viewport
      const rules: string[] = [];

      for (const override of styleOverrides) {
        if (!override.styles) continue;

        const cssString = styleToCssString(override.styles);
        if (cssString) {
          rules.push(`  ${override.selector} { ${cssString} }`);
        }
      }

      if (rules.length > 0) {
        const mediaQuery = `@media (max-width: ${viewportWidth}px) {\n${rules.join('\n')}\n}`;
        mediaQueries.push(mediaQuery);
      }
    }

    return mediaQueries.join('\n\n');
  }

  /**
   * Reconstructs HTML string from parsed result
   * 
   * @param parsed - Parsed HTML result
   * @returns HTML string
   */
  private reconstructHtml(parsed: HtmlParseResult): string {
    return this.elementToHtml(parsed.root);
  }

  /**
   * Converts a ParsedElement back to HTML string
   * 
   * @param element - ParsedElement to convert
   * @returns HTML string
   */
  private elementToHtml(element: ParsedElement): string {
    const { tagName, attributes, inlineStyles, textContent, children } = element;

    // Build opening tag
    let html = `<${tagName}`;

    // Add attributes
    for (const [attr, value] of Object.entries(attributes)) {
      // Skip empty attribute names
      if (!attr || attr.trim() === '') {
        continue;
      }
      html += ` ${attr}="${this.escapeHtml(String(value))}"`;
    }

    // Add inline styles
    if (Object.keys(inlineStyles).length > 0) {
      // Filter out empty values
      const validStyles: Record<string, string> = {};
      for (const [key, value] of Object.entries(inlineStyles)) {
        if (value && value.trim() !== '') {
          validStyles[key] = value;
        }
      }
      
      if (Object.keys(validStyles).length > 0) {
        const styleString = styleToCssString(validStyles);
        if (styleString) {
          html += ` style="${this.escapeHtml(styleString)}"`;
        }
      }
    }

    html += '>';

    // Add text content
    if (textContent) {
      html += this.escapeHtml(textContent);
    }

    // Add children
    for (const child of children) {
      html += this.elementToHtml(child);
    }

    // Add closing tag
    html += `</${tagName}>`;

    return html;
  }

  /**
   * Generates a single HTML file with embedded styles and scripts
   * 
   * @param html - HTML content
   * @param css - CSS styles
   * @param js - JavaScript code
   * @returns Complete HTML document
   */
  private generateSingleFileHtml(html: string, css: string, js: string): string {
    let result = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
    result += '  <meta charset="UTF-8">\n';
    result += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    result += '  <title>Generated Page</title>\n';

    // Add styles
    if (css) {
      result += '  <style>\n';
      result += this.indentText(css, 4);
      result += '\n  </style>\n';
    }

    result += '</head>\n<body>\n';

    // Add HTML content
    result += this.indentText(html, 2);
    result += '\n';

    // Add scripts
    if (js) {
      result += '  <script>\n';
      result += this.indentText(js, 4);
      result += '\n  </script>\n';
    }

    result += '</body>\n</html>';

    return result;
  }

  /**
   * Finds an element in the parsed HTML by selector
   * 
   * @param parsed - Parsed HTML result
   * @param selector - CSS selector
   * @returns ParsedElement if found, undefined otherwise
   */
  private findElementBySelector(
    parsed: HtmlParseResult,
    selector: string
  ): ParsedElement | undefined {
    // Try to find by identifier first (most efficient)
    for (const [id, element] of parsed.elementMap.entries()) {
      if (element.selector === selector) {
        return element;
      }
    }

    // If not found, search recursively
    return this.searchElementBySelector(parsed.root, selector);
  }

  /**
   * Recursively searches for an element by selector
   * 
   * @param element - Element to search from
   * @param selector - CSS selector
   * @returns ParsedElement if found, undefined otherwise
   */
  private searchElementBySelector(
    element: ParsedElement,
    selector: string
  ): ParsedElement | undefined {
    if (element.selector === selector) {
      return element;
    }

    for (const child of element.children) {
      const found = this.searchElementBySelector(child, selector);
      if (found) {
        return found;
      }
    }

    return undefined;
  }

  /**
   * Gets the width for a viewport configuration
   * 
   * @param viewport - Viewport configuration
   * @returns Width in pixels
   */
  private getViewportWidth(viewport: ViewportConfig): number {
    if (typeof viewport === 'object') {
      return viewport.width;
    }

    switch (viewport) {
      case 'desktop':
        return 1920;
      case 'tablet':
        return 768;
      case 'mobile':
        return 375;
      default:
        return 1920;
    }
  }

  /**
   * Gets the height for a viewport configuration
   * 
   * @param viewport - Viewport configuration
   * @returns Height in pixels
   */
  private getViewportHeight(viewport: ViewportConfig): number {
    if (typeof viewport === 'object') {
      return viewport.height;
    }

    switch (viewport) {
      case 'desktop':
        return 1080;
      case 'tablet':
        return 1024;
      case 'mobile':
        return 667;
      default:
        return 1080;
    }
  }

  /**
   * Converts camelCase to kebab-case
   * 
   * @param str - String in camelCase
   * @returns String in kebab-case
   */
  private camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  }

  /**
   * Escapes HTML special characters
   * 
   * @param text - Text to escape
   * @returns Escaped text
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Indents text by a specified number of spaces
   * 
   * @param text - Text to indent
   * @param spaces - Number of spaces to indent
   * @returns Indented text
   */
  private indentText(text: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return text
      .split('\n')
      .map(line => (line.trim() ? indent + line : line))
      .join('\n');
  }
}

// Export singleton instance
export const diffEngine = new DiffEngine();
