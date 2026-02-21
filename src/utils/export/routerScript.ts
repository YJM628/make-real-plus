/**
 * Router Script Generator
 * 
 * Generates a hash-based client-side router script for multi-page static exports.
 * The router listens to hashchange events and shows/hides page containers accordingly.
 * 
 * Requirements: 3.3, 3.4, 3.5
 */

/**
 * Generates a hash router script for static HTML export
 * 
 * @param pageNames - Array of page names (e.g., ['home', 'products', 'about'])
 * @param defaultPage - The page to display by default (typically the first page)
 * @returns JavaScript code as a string that implements hash-based routing
 * 
 * The generated script:
 * - Listens to hashchange events (Requirement 3.5)
 * - Shows/hides page containers based on URL hash (Requirement 3.3)
 * - Updates hash when navigation links are clicked (Requirement 3.4)
 * - Displays the default page on initial load
 */
export function generateRouterScript(
  pageNames: string[],
  defaultPage: string
): string {
  // Validate inputs
  if (!pageNames || pageNames.length === 0) {
    throw new Error('pageNames array cannot be empty');
  }
  
  if (!defaultPage || !pageNames.includes(defaultPage)) {
    throw new Error('defaultPage must be one of the pageNames');
  }

  // Generate the router script
  return `
(function() {
  'use strict';
  
  // Page configuration
  const pages = ${JSON.stringify(pageNames)};
  const defaultPage = ${JSON.stringify(defaultPage)};
  
  /**
   * Shows the specified page and hides all others
   * @param {string} pageName - The name of the page to show
   */
  function showPage(pageName) {
    // Hide all pages
    pages.forEach(function(page) {
      const pageElement = document.getElementById('page-' + page);
      if (pageElement) {
        pageElement.style.display = 'none';
      }
    });
    
    // Show the requested page
    const targetPage = document.getElementById('page-' + pageName);
    if (targetPage) {
      targetPage.style.display = 'block';
    }
  }
  
  /**
   * Handles hash changes and routes to the appropriate page
   */
  function handleRoute() {
    // Get the hash without the '#/' prefix
    let hash = window.location.hash;
    
    // Remove leading '#/' or '#'
    if (hash.startsWith('#/')) {
      hash = hash.substring(2);
    } else if (hash.startsWith('#')) {
      hash = hash.substring(1);
    }
    
    // If hash is empty or invalid, use default page
    if (!hash || pages.indexOf(hash) === -1) {
      hash = defaultPage;
      // Update URL to reflect default page (without triggering hashchange)
      if (window.location.hash !== '#/' + defaultPage) {
        window.history.replaceState(null, '', '#/' + defaultPage);
      }
    }
    
    // Show the target page
    showPage(hash);
  }
  
  // Listen to hashchange events (for browser back/forward buttons)
  window.addEventListener('hashchange', handleRoute);
  
  // Handle initial page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleRoute);
  } else {
    // DOM is already ready
    handleRoute();
  }
})();
`.trim();
}
