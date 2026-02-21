/**
 * Incremental Parser for streaming batch generation
 * Feature: streaming-batch-render
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6
 * 
 * Extracts complete page objects from incomplete streaming JSON buffer
 * by tracking brace depth and detecting page boundaries.
 */

/**
 * Result of incremental parsing attempt
 */
export interface IncrementalParseResult {
  /** Complete pages extracted in this iteration */
  pages: Array<{ name: string; html: string; css: string; js: string }>;
  /** Remaining unconsumed buffer */
  remainingBuffer: string;
  /** Shared theme CSS if detected */
  sharedTheme?: string;
  /** Shared navigation components if detected */
  sharedNavigation?: { header: string; footer: string };
}

/**
 * Incremental parser for extracting pages from streaming JSON buffer
 * 
 * Tracks brace depth to detect complete page objects in the "pages" array
 * and extracts them immediately without waiting for the full response.
 */
export class IncrementalParser {
  private buffer: string = '';
  private extractedPages: Array<{ name: string; html: string; css: string; js: string }> = [];
  private sharedTheme: string = '';
  private sharedNavigation: { header: string; footer: string } = { header: '', footer: '' };
  private inPagesArray: boolean = false;
  private braceDepth: number = 0;
  private currentObjectStart: number = -1;
  private insideString: boolean = false;
  private escapeNext: boolean = false;

  /**
   * Append new chunk to buffer and attempt to extract complete pages
   * 
   * @param chunk - New streaming content to append
   * @returns Parsing result with extracted pages and remaining buffer
   */
  append(chunk: string): IncrementalParseResult {
    this.buffer += chunk;
    
    // Remove markdown code block markers if present (```json and ```)
    // AI models often wrap JSON in markdown code blocks
    this.buffer = this.buffer.replace(/^```json\s*/i, '').replace(/```\s*$/,'');
    
    const newPages: Array<{ name: string; html: string; css: string; js: string }> = [];

    // Try to extract sharedTheme and sharedNavigation if not yet found
    if (!this.sharedTheme) {
      this.extractSharedTheme();
    }
    if (!this.sharedNavigation.header && !this.sharedNavigation.footer) {
      this.extractSharedNavigation();
    }

    // Find the "pages" array if not yet found
    if (!this.inPagesArray) {
      const pagesMatch = this.buffer.match(/"pages"\s*:\s*\[/);
      if (pagesMatch && pagesMatch.index !== undefined) {
        this.inPagesArray = true;
        console.log('[IncrementalParser] Found "pages" array at position', pagesMatch.index);
        // Keep the position after the opening bracket
        const startPos = pagesMatch.index + pagesMatch[0].length;
        this.buffer = this.buffer.substring(startPos);
      } else {
        // Haven't found pages array yet, keep accumulating
        if (this.buffer.length > 100) {
          console.log('[IncrementalParser] Still looking for "pages" array, buffer length:', this.buffer.length, 'first 200 chars:', this.buffer.substring(0, 200));
        }
        return {
          pages: [],
          remainingBuffer: this.buffer,
          sharedTheme: this.sharedTheme || undefined,
          sharedNavigation: this.sharedNavigation.header || this.sharedNavigation.footer 
            ? this.sharedNavigation 
            : undefined,
        };
      }
    }

    // Parse pages from the buffer
    let i = 0;
    while (i < this.buffer.length) {
      const char = this.buffer[i];

      // Handle string escaping
      if (this.escapeNext) {
        this.escapeNext = false;
        i++;
        continue;
      }

      if (char === '\\') {
        this.escapeNext = true;
        i++;
        continue;
      }

      // Track string boundaries (don't count braces inside strings)
      if (char === '"') {
        this.insideString = !this.insideString;
        i++;
        continue;
      }

      // Skip characters inside strings
      if (this.insideString) {
        i++;
        continue;
      }

      // Skip whitespace and commas between objects
      if (this.braceDepth === 0 && (char === ' ' || char === '\n' || char === '\t' || char === '\r' || char === ',')) {
        i++;
        continue;
      }

      // Track brace depth
      if (char === '{') {
        if (this.braceDepth === 0) {
          this.currentObjectStart = i;
        }
        this.braceDepth++;
      } else if (char === '}') {
        this.braceDepth--;
        
        // Complete page object detected
        if (this.braceDepth === 0 && this.currentObjectStart !== -1) {
          const pageJson = this.buffer.substring(this.currentObjectStart, i + 1);
          try {
            const page = JSON.parse(pageJson);
            if (page.name && page.html !== undefined) {
              console.log('[IncrementalParser] Successfully extracted page:', page.name);
              newPages.push({
                name: page.name,
                html: page.html || '',
                css: page.css || '',
                js: page.js || '',
              });
              this.extractedPages.push(newPages[newPages.length - 1]);
            } else {
              console.warn('[IncrementalParser] Page object missing name or html:', Object.keys(page));
            }
          } catch (error) {
            // Invalid JSON, skip this object
            console.warn('[IncrementalParser] Failed to parse page object:', error, 'JSON:', pageJson.substring(0, 100));
          }
          
          // Remove parsed content from buffer
          this.buffer = this.buffer.substring(i + 1);
          i = 0;
          this.currentObjectStart = -1;
          continue;
        }
      } else if (char === ']' && this.braceDepth === 0) {
        // End of pages array
        this.inPagesArray = false;
        this.buffer = this.buffer.substring(i + 1);
        break;
      }

      i++;
    }

    return {
      pages: newPages,
      remainingBuffer: this.buffer,
      sharedTheme: this.sharedTheme || undefined,
      sharedNavigation: this.sharedNavigation.header || this.sharedNavigation.footer 
        ? this.sharedNavigation 
        : undefined,
    };
  }

  /**
   * Extract sharedTheme from buffer
   */
  private extractSharedTheme(): void {
    const themeMatch = this.buffer.match(/"sharedTheme"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (themeMatch && themeMatch[1]) {
      this.sharedTheme = themeMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
  }

  /**
   * Extract sharedNavigation from buffer
   */
  private extractSharedNavigation(): void {
    const navMatch = this.buffer.match(/"sharedNavigation"\s*:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
    if (navMatch && navMatch[1]) {
      try {
        const navJson = `{${navMatch[1]}}`;
        const nav = JSON.parse(navJson);
        if (nav.header) {
          this.sharedNavigation.header = nav.header;
        }
        if (nav.footer) {
          this.sharedNavigation.footer = nav.footer;
        }
      } catch (error) {
        // Failed to parse navigation, will try again with more data
      }
    }
  }

  /**
   * Format a page object as pretty-printed JSON string
   * 
   * @param page - Page object to format
   * @returns Formatted JSON string
   */
  static formatPage(page: { name: string; html: string; css: string; js: string }): string {
    return JSON.stringify(page, null, 2);
  }

  /**
   * Get all pages extracted so far
   * 
   * @returns Array of all extracted pages
   */
  getAllExtractedPages(): Array<{ name: string; html: string; css: string; js: string }> {
    return this.extractedPages;
  }

  /**
   * Reset parser state
   */
  reset(): void {
    this.buffer = '';
    this.extractedPages = [];
    this.sharedTheme = '';
    this.sharedNavigation = { header: '', footer: '' };
    this.inPagesArray = false;
    this.braceDepth = 0;
    this.currentObjectStart = -1;
    this.insideString = false;
    this.escapeNext = false;
  }
}
