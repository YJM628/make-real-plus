/**
 * Page link handler for inter-page navigation in batch-generated applications
 * Feature: batch-html-redesign
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */

/**
 * PageLinkHandler manages inter-page navigation for batch-generated HTML shapes
 * 
 * It maintains a mapping from page names to their corresponding HTML shape IDs
 * and provides functionality to:
 * - Register page mappings
 * - Resolve page names to shape IDs
 * - Inject click handlers into HTML for inter-page links
 * 
 * @example
 * ```typescript
 * const handler = new PageLinkHandler();
 * 
 * // Register pages
 * const pageMap = new Map([
 *   ['home', 'shape-id-1'],
 *   ['products', 'shape-id-2'],
 *   ['cart', 'shape-id-3']
 * ]);
 * handler.registerPages(pageMap);
 * 
 * // Resolve a page link
 * const shapeId = handler.handlePageLinkClick('products');
 * // Returns 'shape-id-2'
 * 
 * // Inject link handlers into HTML
 * const html = '<a data-page-target="products">View Products</a>';
 * const enhanced = handler.injectLinkHandlers(html, 'home');
 * // Returns HTML with click event handlers attached
 * ```
 * 
 * Requirements:
 * - 4.1: Generate Inter_Page_Links in shared navigation
 * - 4.2: Scroll canvas to target shape when link is clicked
 * - 4.3: Use data-page-target attribute to mark link targets
 * - 4.5: Display disabled state for links to non-existent pages
 */
export class PageLinkHandler {
  private pageMap: Map<string, string> = new Map();

  /**
   * Register page name to shape ID mappings
   * 
   * This should be called after batch generation completes,
   * with a map of all generated page names to their shape IDs.
   * 
   * @param pageMap - Map from page name to HTML shape ID
   * 
   * @example
   * ```typescript
   * const handler = new PageLinkHandler();
   * const pageMap = new Map([
   *   ['home', 'shape:abc123'],
   *   ['about', 'shape:def456']
   * ]);
   * handler.registerPages(pageMap);
   * ```
   * 
   * Requirements:
   * - 4.2: Maintain mapping for canvas navigation
   */
  registerPages(pageMap: Map<string, string>): void {
    this.pageMap = new Map(pageMap);
  }

  /**
   * Handle page link click by resolving target page name to shape ID
   * 
   * Returns the shape ID for the target page, or null if the page
   * doesn't exist in the registered page map.
   * 
   * @param targetPageName - Name of the target page
   * @returns Shape ID of the target page, or null if not found
   * 
   * @example
   * ```typescript
   * const handler = new PageLinkHandler();
   * handler.registerPages(new Map([['products', 'shape:123']]));
   * 
   * const shapeId = handler.handlePageLinkClick('products');
   * // Returns 'shape:123'
   * 
   * const missing = handler.handlePageLinkClick('nonexistent');
   * // Returns null
   * ```
   * 
   * Requirements:
   * - 4.2: Resolve page name to shape ID for canvas navigation
   * - 4.5: Return null for non-existent pages
   */
  handlePageLinkClick(targetPageName: string): string | null {
    return this.pageMap.get(targetPageName) || null;
  }

  /**
   * Inject link handlers into HTML for data-page-target links
   * 
   * This function scans the HTML for elements with data-page-target attributes
   * and injects a script that handles clicks on these links. The script will:
   * - Prevent default link behavior
   * - Emit a custom event with the target page name
   * - Mark links to non-existent pages as disabled
   * 
   * The injected script should be used in conjunction with a canvas-level
   * event listener that scrolls to the target shape.
   * 
   * @param html - HTML content to process
   * @param pageName - Name of the current page (for context)
   * @returns HTML with injected link handler script
   * 
   * @example
   * ```typescript
   * const handler = new PageLinkHandler();
   * handler.registerPages(new Map([
   *   ['home', 'shape:1'],
   *   ['products', 'shape:2']
   * ]));
   * 
   * const html = `
   *   <a href="#" data-page-target="products">Products</a>
   *   <a href="#" data-page-target="missing">Missing</a>
   * `;
   * 
   * const enhanced = handler.injectLinkHandlers(html, 'home');
   * // Returns HTML with script that:
   * // - Handles clicks on the products link
   * // - Marks the missing link as disabled
   * ```
   * 
   * Requirements:
   * - 4.3: Handle data-page-target links
   * - 4.5: Mark links to non-existent pages as disabled
   */
  injectLinkHandlers(html: string, pageName: string): string {
    // Build a list of valid page names for the script
    const validPages = Array.from(this.pageMap.keys());
    const validPagesJson = JSON.stringify(validPages);

    // Create the link handler script
    const script = `
<script>
(function() {
  'use strict';
  
  // Valid page names from the page map
  const validPages = new Set(${validPagesJson});
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageLinks);
  } else {
    initPageLinks();
  }
  
  function initPageLinks() {
    // Find all elements with data-page-target attribute
    const pageLinks = document.querySelectorAll('[data-page-target]');
    
    pageLinks.forEach(function(link) {
      const targetPage = link.getAttribute('data-page-target');
      
      if (!targetPage) {
        return;
      }
      
      // Check if target page exists
      if (!validPages.has(targetPage)) {
        // Mark as disabled for non-existent pages
        link.classList.add('page-link-disabled');
        link.style.opacity = '0.5';
        link.style.cursor = 'not-allowed';
        link.title = 'Page "' + targetPage + '" not found';
        
        // Prevent clicks on disabled links
        link.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
        });
      } else {
        // Add click handler for valid links
        link.classList.add('page-link-active');
        link.style.cursor = 'pointer';
        
        link.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // Emit custom event for canvas navigation
          const event = new CustomEvent('navigateToPage', {
            detail: {
              targetPage: targetPage,
              sourcePage: '${pageName}'
            },
            bubbles: true
          });
          
          document.dispatchEvent(event);
        });
      }
    });
  }
})();
</script>`;

    // Inject the script before the closing </body> tag
    // If no </body> tag exists, append to the end
    if (html.includes('</body>')) {
      return html.replace('</body>', `${script}\n</body>`);
    } else if (html.includes('</html>')) {
      return html.replace('</html>', `${script}\n</html>`);
    } else {
      return html + script;
    }
  }

  /**
   * Get all registered page names
   * 
   * @returns Array of registered page names
   * 
   * @example
   * ```typescript
   * const handler = new PageLinkHandler();
   * handler.registerPages(new Map([
   *   ['home', 'shape:1'],
   *   ['about', 'shape:2']
   * ]));
   * 
   * const pages = handler.getRegisteredPages();
   * // Returns ['home', 'about']
   * ```
   */
  getRegisteredPages(): string[] {
    return Array.from(this.pageMap.keys());
  }

  /**
   * Check if a page name is registered
   * 
   * @param pageName - Page name to check
   * @returns True if the page is registered
   * 
   * @example
   * ```typescript
   * const handler = new PageLinkHandler();
   * handler.registerPages(new Map([['home', 'shape:1']]));
   * 
   * handler.hasPage('home'); // Returns true
   * handler.hasPage('missing'); // Returns false
   * ```
   */
  hasPage(pageName: string): boolean {
    return this.pageMap.has(pageName);
  }

  /**
   * Clear all registered pages
   * 
   * @example
   * ```typescript
   * const handler = new PageLinkHandler();
   * handler.registerPages(new Map([['home', 'shape:1']]));
   * handler.clear();
   * handler.getRegisteredPages(); // Returns []
   * ```
   */
  clear(): void {
    this.pageMap.clear();
  }
}
