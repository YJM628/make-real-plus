/**
 * HTML Parser
 * Feature: ai-html-visual-editor
 * 
 * Parses HTML strings into structured data for tldraw shapes.
 * Extracts elements, styles, scripts, and generates unique identifiers.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 16.5
 */

import type { HtmlParseResult, ParsedElement } from '../../types';
import { generateCssSelector } from '../../utils/css/selector';
import { parseCssString } from '../../utils/css/style';

/**
 * HtmlParser class for parsing HTML strings into structured data
 * 
 * Validates: Property 5 - HTML parsing round trip preserves identifiers and structure
 * Validates: Property 18 - HTML parsing completeness
 * Validates: Property 19 - Invalid HTML error handling
 */
export class HtmlParser {
  private identifierCounter: number = 0;
  private usedIdentifiers: Set<string> = new Set();

  /**
   * Parses an HTML string into a structured result
   * 
   * @param html - HTML string to parse
   * @param css - Optional CSS string
   * @param js - Optional JavaScript string
   * @returns Parsed HTML result with element tree and metadata
   * 
   * Requirements: 11.1, 11.2
   * Validates: Property 18 - HTML parsing completeness
   */
  parse(html: string, css?: string, js?: string): HtmlParseResult {
    // Reset state for each parse
    this.identifierCounter = 0;
    this.usedIdentifiers.clear();

    // Validate HTML first
    const validation = this.validate(html);
    if (!validation.valid) {
      throw new Error(`Invalid HTML: ${validation.errors.join(', ')}`);
    }

    // Use DOMParser to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check for parser errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`HTML parsing error: ${parserError.textContent}`);
    }

    // Extract styles from <style> tags if not provided
    let extractedStyles = css || '';
    if (!css) {
      const styleTags = doc.querySelectorAll('style');
      extractedStyles = Array.from(styleTags)
        .map(tag => tag.textContent || '')
        .join('\n');
    }

    // Extract scripts from <script> tags if not provided
    let extractedScripts = js || '';
    if (!js) {
      const scriptTags = doc.querySelectorAll('script');
      extractedScripts = Array.from(scriptTags)
        .map(tag => tag.textContent || '')
        .join('\n');
    }

    // Extract external resources
    const externalResources = this.extractExternalResources(html);

    // Build element tree from body (or documentElement if no body)
    const rootElement = doc.body || doc.documentElement;
    const elementMap = new Map<string, ParsedElement>();
    
    const root = this.buildElementTree(rootElement, undefined, elementMap);

    return {
      root,
      elementMap,
      styles: extractedStyles,
      scripts: extractedScripts,
      externalResources,
    };
  }

  /**
   * Recursively builds a ParsedElement tree from a DOM element
   * 
   * @param element - DOM element to parse
   * @param parent - Parent ParsedElement (optional)
   * @param elementMap - Map to store all elements by identifier
   * @returns ParsedElement with all metadata
   * 
   * Requirements: 11.1, 11.2, 11.4
   */
  buildElementTree(
    element: Element,
    parent?: ParsedElement,
    elementMap?: Map<string, ParsedElement>
  ): ParsedElement {
    // Extract or generate identifier
    const identifier = this.extractIdentifiers(element);

    // Extract attributes
    const attributes: Record<string, string> = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }

    // Extract inline styles
    const inlineStyles = this.extractStyles(element);

    // Get text content (only direct text, not from children)
    let textContent = '';
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        textContent += node.textContent || '';
      }
    }
    textContent = textContent.trim();

    // Create ParsedElement
    const parsedElement: ParsedElement = {
      identifier,
      tagName: element.tagName,
      attributes,
      inlineStyles,
      selector: '', // Will be set after creation
      textContent,
      children: [],
      parent,
    };

    // Generate CSS selector
    parsedElement.selector = this.generateSelector(parsedElement);

    // Add to element map if provided
    if (elementMap) {
      elementMap.set(identifier, parsedElement);
    }

    // Recursively process children
    const children: ParsedElement[] = [];
    for (const child of element.children) {
      const parsedChild = this.buildElementTree(child, parsedElement, elementMap);
      children.push(parsedChild);
    }
    parsedElement.children = children;

    return parsedElement;
  }

  /**
   * Extracts or generates a unique identifier for an element
   * 
   * Priority:
   * 1. Use existing id attribute
   * 2. Use existing data-uuid attribute
   * 3. Generate new data-uuid
   * 
   * @param element - DOM element
   * @returns Unique identifier string
   * 
   * Requirements: 11.2, 11.4
   * Validates: Property 3 - Element identifier uniqueness
   */
  extractIdentifiers(element: Element): string {
    // Check for existing id
    const id = element.getAttribute('id');
    if (id && !this.usedIdentifiers.has(id)) {
      this.usedIdentifiers.add(id);
      return id;
    }

    // Check for existing data-uuid
    const dataUuid = element.getAttribute('data-uuid');
    if (dataUuid && !this.usedIdentifiers.has(dataUuid)) {
      this.usedIdentifiers.add(dataUuid);
      return dataUuid;
    }

    // Generate new identifier
    return this.generateIdentifier(element);
  }

  /**
   * Generates a unique identifier for an element
   * 
   * @param element - DOM element
   * @returns Unique identifier string (data-uuid format)
   * 
   * Requirements: 11.4
   * Validates: Property 3 - Element identifier uniqueness
   */
  generateIdentifier(element: Element): string {
    // Generate UUID-like identifier
    const tagName = element.tagName.toLowerCase();
    let identifier: string;

    do {
      this.identifierCounter++;
      identifier = `${tagName}-${this.identifierCounter}-${this.generateRandomString(8)}`;
    } while (this.usedIdentifiers.has(identifier));

    this.usedIdentifiers.add(identifier);
    return identifier;
  }

  /**
   * Generates a random string for unique identifiers
   * 
   * @param length - Length of random string
   * @returns Random alphanumeric string
   */
  private generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generates a CSS selector for a ParsedElement
   * 
   * @param element - ParsedElement to generate selector for
   * @returns CSS selector string
   * 
   * Requirements: 11.5
   * Validates: Property 10 - CSS selector uniqueness
   */
  generateSelector(element: ParsedElement): string {
    return generateCssSelector(element);
  }

  /**
   * Extracts inline and computed styles from an element
   * 
   * @param element - DOM element
   * @returns Style object with camelCase properties
   * 
   * Requirements: 11.5
   */
  extractStyles(element: Element): Record<string, string> {
    if (!(element instanceof HTMLElement)) {
      return {};
    }

    // Extract inline styles from style attribute
    const styleAttr = element.getAttribute('style');
    if (!styleAttr) {
      return {};
    }

    return parseCssString(styleAttr);
  }

  /**
   * Validates HTML syntax
   * 
   * @param html - HTML string to validate
   * @returns Validation result with errors if any
   * 
   * Requirements: 11.3
   * Validates: Property 19 - Invalid HTML error handling
   */
  validate(html: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for empty HTML
    if (!html || typeof html !== 'string') {
      errors.push('HTML is empty or not a string');
      return { valid: false, errors };
    }

    // Check for basic HTML structure issues
    const trimmedHtml = html.trim();
    if (trimmedHtml.length === 0) {
      errors.push('HTML is empty after trimming');
      return { valid: false, errors };
    }

    // Use DOMParser to check for parsing errors
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check for parser errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      errors.push(`Parser error: ${parserError.textContent || 'Unknown error'}`);
      return { valid: false, errors };
    }

    // Check for unclosed tags (basic check)
    const openTags = html.match(/<([a-z][a-z0-9]*)\b[^>]*>/gi) || [];
    const closeTags = html.match(/<\/([a-z][a-z0-9]*)>/gi) || [];
    
    // Self-closing tags that don't need closing tags
    const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    
    const openTagNames = openTags
      .map(tag => {
        const match = tag.match(/<([a-z][a-z0-9]*)/i);
        return match ? match[1].toLowerCase() : null;
      })
      .filter(tag => tag && !selfClosingTags.includes(tag) && !tag.endsWith('/'));

    const closeTagNames = closeTags
      .map(tag => {
        const match = tag.match(/<\/([a-z][a-z0-9]*)/i);
        return match ? match[1].toLowerCase() : null;
      })
      .filter(Boolean);

    // Count occurrences
    const openCounts: Record<string, number> = {};
    const closeCounts: Record<string, number> = {};

    for (const tag of openTagNames) {
      if (tag) {
        openCounts[tag] = (openCounts[tag] || 0) + 1;
      }
    }

    for (const tag of closeTagNames) {
      if (tag) {
        closeCounts[tag] = (closeCounts[tag] || 0) + 1;
      }
    }

    // Check for mismatched tags
    for (const tag in openCounts) {
      if (openCounts[tag] !== (closeCounts[tag] || 0)) {
        errors.push(`Mismatched tags: <${tag}> opened ${openCounts[tag]} times but closed ${closeCounts[tag] || 0} times`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extracts external resource links from HTML
   * 
   * @param html - HTML string
   * @returns Object with arrays of external resource URLs
   * 
   * Requirements: 16.3, 16.4
   */
  extractExternalResources(html: string): {
    stylesheets: string[];
    scripts: string[];
    images: string[];
  } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract stylesheet links
    const stylesheets: string[] = [];
    const linkTags = doc.querySelectorAll('link[rel="stylesheet"]');
    for (const link of linkTags) {
      const href = link.getAttribute('href');
      if (href) {
        stylesheets.push(href);
      }
    }

    // Extract script sources
    const scripts: string[] = [];
    const scriptTags = doc.querySelectorAll('script[src]');
    for (const script of scriptTags) {
      const src = script.getAttribute('src');
      if (src) {
        scripts.push(src);
      }
    }

    // Extract image sources
    const images: string[] = [];
    const imgTags = doc.querySelectorAll('img[src]');
    for (const img of imgTags) {
      const src = img.getAttribute('src');
      if (src) {
        images.push(src);
      }
    }

    return {
      stylesheets,
      scripts,
      images,
    };
  }

  /**
   * Injects unique identifiers into HTML for imported content
   * 
   * This is used when importing existing HTML files that may not have
   * identifiers on all interactive elements.
   * 
   * @param html - HTML string to inject identifiers into
   * @returns Modified HTML string with data-uuid attributes
   * 
   * Requirements: 16.5
   * Validates: Property 22 - Import identifier injection
   */
  injectIdentifiers(html: string): string {
    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Reset identifier state
    this.identifierCounter = 0;
    this.usedIdentifiers.clear();

    // Find all interactive elements that need identifiers
    const interactiveSelectors = [
      'button',
      'a',
      'input',
      'textarea',
      'select',
      'form',
      '[onclick]',
      '[onsubmit]',
      '[href]',
    ];

    const interactiveElements = doc.querySelectorAll(interactiveSelectors.join(','));

    // Inject identifiers for elements that don't have id or data-uuid
    for (const element of interactiveElements) {
      const hasId = element.hasAttribute('id');
      const hasDataUuid = element.hasAttribute('data-uuid');

      if (!hasId && !hasDataUuid) {
        const identifier = this.generateIdentifier(element);
        element.setAttribute('data-uuid', identifier);
      } else if (hasId) {
        // Track existing id
        const id = element.getAttribute('id');
        if (id) {
          this.usedIdentifiers.add(id);
        }
      } else if (hasDataUuid) {
        // Track existing data-uuid
        const uuid = element.getAttribute('data-uuid');
        if (uuid) {
          this.usedIdentifiers.add(uuid);
        }
      }
    }

    // Serialize back to HTML
    // Use body.innerHTML to get just the content without <html>, <head>, <body> tags
    return doc.body.innerHTML;
  }
}

// Export singleton instance
export const htmlParser = new HtmlParser();
