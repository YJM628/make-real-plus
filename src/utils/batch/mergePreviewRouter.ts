/**
 * Merge preview router utilities
 * Feature: multi-page-merge-preview, merge-preview-navigation
 * Requirements: 3.1, 3.5, 7.1, 7.2, 7.3, 7.4, 2.1, 2.2, 2.3, 2.4
 * 
 * This module provides client-side routing for the merge preview dialog by injecting
 * a routing script into each page's HTML. The routing script enables seamless navigation
 * between pages without full page reloads.
 * 
 * ## Architecture Overview
 * 
 * The routing system consists of three main components:
 * 
 * 1. **Event Delegation**: Uses document-level click event listener to handle all
 *    navigation clicks efficiently, including dynamically added elements
 * 
 * 2. **Fallback Resolution**: When data-page-target is missing, attempts to resolve
 *    the href attribute using fuzzy matching and Chinese alias support
 * 
 * 3. **Invalid Link Marking**: Provides visual feedback for links to non-existent pages
 * 
 * ## Event Delegation Pattern
 * 
 * Instead of attaching individual click handlers to each navigation element, the routing
 * script uses a single document-level event listener. This approach:
 * 
 * - **Improves Performance**: Only one event listener regardless of element count
 * - **Supports Dynamic Content**: Automatically handles elements added after page load
 * - **Simplifies Code**: No need to track and unbind individual listeners
 * 
 * The event delegation uses `Element.closest()` to traverse up the DOM tree from the
 * clicked element, finding the nearest ancestor with a `data-page-target` attribute.
 * This supports nested elements (e.g., clicking an icon inside a button).
 * 
 * Example:
 * ```html
 * <button data-page-target="products">
 *   <i class="icon"></i>
 *   <span>View Products</span>
 * </button>
 * ```
 * Clicking the icon or span will correctly navigate to "products" because closest()
 * finds the button element with data-page-target.
 * 
 * ## Fallback href Resolution
 * 
 * When a link doesn't have data-page-target, the router attempts to resolve the href
 * attribute as a fallback. This provides resilience when:
 * 
 * - AI doesn't generate data-page-target attributes (despite prompt instructions)
 * - User manually edits HTML and forgets to add the attribute
 * - Legacy content is imported without proper attributes
 * 
 * The fallback resolution uses the same fuzzy matching logic as pageNameResolver.ts,
 * but inlined into the routing script (since it runs in an iframe and can't import
 * external modules). The resolution process:
 * 
 * 1. Normalizes the href value (removes extensions, paths, query params)
 * 2. Attempts exact match against valid page names
 * 3. Tries Chinese alias mapping (e.g., "首页" → "home")
 * 4. Falls back to partial string matching
 * 
 * Example:
 * ```html
 * <!-- These all resolve to "products" page: -->
 * <a href="products.html">Products</a>
 * <a href="/products">Products</a>
 * <a href="产品列表">Products</a>
 * ```
 * 
 * ## Invalid Link Marking
 * 
 * On initialization, the routing script scans all navigation elements and marks those
 * pointing to non-existent pages with visual feedback:
 * 
 * - Reduced opacity (0.5)
 * - Disabled cursor (not-allowed)
 * - Pointer events disabled
 * - Tooltip showing the missing page name
 * 
 * This provides immediate visual feedback to developers and prevents confusing
 * user interactions with broken links.
 * 
 * ## PostMessage Communication
 * 
 * Navigation requests are communicated to the parent window (MergePreviewDialog) via
 * the postMessage API:
 * 
 * ```javascript
 * window.parent.postMessage({
 *   type: 'merge-navigate',
 *   targetPage: 'products'
 * }, '*');
 * ```
 * 
 * The parent window listens for these messages and updates the displayed page accordingly.
 * This approach maintains proper separation between the iframe content and the parent
 * application.
 * 
 * ## Inlined Dependencies
 * 
 * The routing script inlines the page name resolution logic from pageNameResolver.ts
 * because:
 * 
 * - The script runs inside an iframe with no access to external modules
 * - We need the same fuzzy matching capabilities for fallback resolution
 * - Inlining keeps the script self-contained and portable
 * 
 * The inlined functions (normalizePageName, resolvePageName) are kept in sync with
 * their counterparts in pageNameResolver.ts through testing.
 */

import type { CollectedPage } from './collectPages';

/**
 * Build complete HTML document with routing script injection
 * 
 * This function constructs a full HTML document for a single page and injects
 * a client-side routing script that:
 * 1. Finds all elements with data-page-target attributes
 * 2. Intercepts click events on these elements
 * 3. Sends navigation requests to the parent window via postMessage
 * 4. Marks invalid links (targets not in allPageNames) with disabled styling
 * 
 * The output HTML includes:
 * - DOCTYPE declaration
 * - Complete <head> with <style> tag containing the page's CSS
 * - <body> with the page's HTML content
 * - <script> tags containing:
 *   - The page's JavaScript code
 *   - The injected routing script
 * 
 * @param page - Page data with name, html, css, js
 * @param allPageNames - List of all valid page names for link validation
 * @returns Complete HTML document string ready for iframe srcdoc
 * 
 * @example
 * ```typescript
 * const page = {
 *   name: 'home',
 *   html: '<div><a data-page-target="products">Products</a></div>',
 *   css: 'body { margin: 0; }',
 *   js: 'console.log("Home page loaded");'
 * };
 * const allPages = ['home', 'products', 'about'];
 * 
 * const fullHtml = buildMergePageHtml(page, allPages);
 * // Returns complete HTML document with routing script
 * ```
 * 
 * Requirements:
 * - 3.1: Maintain page name to HTML content mapping
 * - 3.5: Inject routing script to intercept data-page-target links
 * - 7.1: Build complete HTML document with DOCTYPE, head, body
 * - 7.2: Inject routing script that uses postMessage for navigation
 * - 7.3: Handle postMessage navigation requests
 * - 7.4: Serialize page names as JSON for invalid link detection
 */
/**
 * Strip the old pageLinkHandler script from HTML content.
 * 
 * When pages are stored in canvas shapes, they may contain a script injected by
 * PageLinkHandler.injectLinkHandlers(). This script attaches individual click
 * handlers to [data-page-target] elements with e.stopPropagation(), which
 * prevents the merge router's document-level event delegation from seeing clicks.
 * 
 * This function removes that script so the merge router can handle all navigation.
 * It also removes any inline styles/classes added by the old script (disabled states).
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
    return match.replace(/page-link-disabled\s*/g, '').replace(/class=""\s*/g, '');
  });

  // Remove inline styles that the old script adds for disabled links
  cleaned = cleaned.replace(
    /\s*style="[^"]*opacity:\s*0\.5[^"]*cursor:\s*not-allowed[^"]*"/gi,
    ''
  );

  return cleaned;
}

export function buildMergePageHtml(
  page: CollectedPage,
  allPageNames: string[]
): string {
  console.debug('[buildMergePageHtml] Building merge page HTML', { 
    pageName: page.name,
    allPageNamesCount: allPageNames.length,
    allPageNames: allPageNames,
    htmlLength: page.html.length,
    cssLength: page.css.length,
    jsLength: page.js.length
  });

  // Strip old pageLinkHandler scripts that conflict with merge router navigation
  const cleanedHtml = stripOldLinkHandlerScripts(page.html);
  const cleanedJs = stripOldLinkHandlerScripts(page.js);

  console.debug('[buildMergePageHtml] Stripped old link handler scripts', {
    pageName: page.name,
    originalHtmlLength: page.html.length,
    cleanedHtmlLength: cleanedHtml.length,
    htmlDiff: page.html.length - cleanedHtml.length,
    originalJsLength: page.js.length,
    cleanedJsLength: cleanedJs.length,
  });

  // Requirement 7.4: Serialize page names as JSON for the routing script
  const validPagesJson = JSON.stringify(allPageNames);

  // Requirement 7.2: Create routing script that intercepts clicks and uses postMessage
  // Requirement 2.2: Use event delegation pattern for better performance and dynamic content support
  const routingScript = `
<script>
(function() {
  'use strict';
  
  // Enable debug logging for navigation
  const DEBUG = true;
  
  function log(level, message, data) {
    if (!DEBUG && level === 'debug') return;
    const prefix = '[MergeRouter]';
    const logData = data ? data : '';
    console[level](prefix + ' ' + message, logData);
  }
  
  log('info', 'Initializing merge preview router');
  
  // Requirement 7.4: Valid page names from the page registry
  const validPages = new Set(${validPagesJson});
  
  log('info', 'Valid pages loaded', { count: validPages.size, pages: Array.from(validPages) });
  
  // ============================================================================
  // CHINESE ROLE NAME TO ENGLISH PAGE NAME ALIAS MAPPING
  // ============================================================================
  // This mapping is inlined from pageNameResolver.ts (DEFAULT_ROLE_ALIASES)
  // to support Chinese page name resolution in the fallback mechanism.
  // 
  // It allows users to reference pages using common Chinese role names, which
  // are automatically resolved to their English equivalents. This is particularly
  // useful when:
  // - AI generates links with Chinese text
  // - Users manually create links using Chinese names
  // - Content is localized for Chinese-speaking users
  // 
  // The mapping must be kept in sync with DEFAULT_ROLE_ALIASES in
  // pageNameResolver.ts through testing.
  // 
  // Requirement 3.3: Chinese role name to English page name alias mapping
  // ============================================================================
  const DEFAULT_ROLE_ALIASES = {
    '首页': 'home',
    '主页': 'home',
    '产品列表': 'products',
    '产品': 'products',
    '产品详情': 'product-detail',
    '购物车': 'cart',
    '结账': 'checkout',
    '博客': 'blog',
    '文章': 'post',
    '关于': 'about',
    '联系': 'contact',
    '登录': 'login',
    '注册': 'signup',
    '仪表板': 'dashboard',
    '设置': 'settings',
    '个人资料': 'profile',
    '作品集': 'portfolio',
    '项目详情': 'project-detail'
  };
  
  // Initialize routing on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMergeRouting);
  } else {
    initMergeRouting();
  }
  
  /**
   * Normalize a page name to standard format
   * 
   * This function is inlined from pageNameResolver.ts because the routing script
   * runs inside an iframe and cannot import external modules. It must be kept in
   * sync with the original implementation through testing.
   * 
   * Normalization process:
   * 1. Removes file extensions (.html, .htm, etc.)
   * 2. Removes path prefixes (/, ./, ../, etc.)
   * 3. Removes query parameters and anchors (? and # and everything after)
   * 4. Converts camelCase/PascalCase to kebab-case
   * 5. Converts to lowercase
   * 6. Cleans up multiple consecutive hyphens
   * 
   * Examples:
   * - "Products.html" → "products"
   * - "/pages/ProductList" → "product-list"
   * - "./about.html?id=123" → "about"
   * - "myProductPage" → "my-product-page"
   * 
   * Requirements: 3.1, 3.2
   * 
   * @param {string} raw - Raw page name string to normalize
   * @returns {string} Normalized page name in lowercase kebab-case format
   */
  function normalizePageName(raw) {
    if (!raw || typeof raw !== 'string') {
      log('debug', 'normalizePageName: Invalid input', { raw: raw, type: typeof raw });
      return '';
    }
    
    var normalized = raw.trim();
    
    if (normalized === '') {
      log('debug', 'normalizePageName: Empty input after trim');
      return '';
    }
    
    log('debug', 'normalizePageName: Starting normalization', { input: raw });
    
    // Remove query parameters and anchors
    normalized = normalized.split('?')[0].split('#')[0];
    
    // Remove path prefixes (/, ./, ../, etc.)
    normalized = normalized.replace(/^(?:\\.\\.\\/|\\.\\/|\\/|\\\\)+/, '');
    
    // Remove file extensions
    normalized = normalized.replace(/\\.[a-zA-Z0-9]+$/, '');
    
    // Convert camelCase and PascalCase to kebab-case BEFORE lowercasing
    normalized = normalized.replace(/([a-z])([A-Z])/g, '$1-$2');
    normalized = normalized.replace(/([A-Z])([A-Z][a-z])/g, '$1-$2');
    
    // Convert to lowercase
    normalized = normalized.toLowerCase();
    
    // Clean up multiple consecutive hyphens
    normalized = normalized.replace(/-+/g, '-');
    
    // Remove leading/trailing hyphens
    normalized = normalized.replace(/^-+|-+$/g, '');
    
    log('debug', 'normalizePageName: Completed normalization', { input: raw, output: normalized });
    
    return normalized;
  }
  
  /**
   * Resolve a raw page name to a valid page name
   * 
   * This function is inlined from pageNameResolver.ts because the routing script
   * runs inside an iframe and cannot import external modules. It must be kept in
   * sync with the original implementation through testing.
   * 
   * Resolution strategy (three-tier priority):
   * 
   * 1. **Exact Match** (after normalization)
   *    - Normalizes both the input and valid page names
   *    - Returns the original page name if normalized versions match
   *    - Example: "Products.html" matches "products"
   * 
   * 2. **Chinese Alias Mapping**
   *    - Uses DEFAULT_ROLE_ALIASES to map Chinese role names to English page names
   *    - Example: "首页" → "home", "产品列表" → "products"
   *    - Provides localization support for Chinese users
   * 
   * 3. **Contains Match** (partial string matching)
   *    - Checks if normalized input is contained in any valid page name, or vice versa
   *    - Example: "product" matches "products", "product-detail"
   *    - Returns the first match found
   * 
   * Examples:
   * - resolvePageName("Products.html") → "products" (exact match)
   * - resolvePageName("首页") → "home" (Chinese alias)
   * - resolvePageName("product") → "products" (contains match)
   * - resolvePageName("nonexistent") → null (no match)
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4
   * 
   * @param {string} raw - Raw page name string to resolve
   * @returns {string|null} Resolved page name from validPages, or null if no match found
   */
  function resolvePageName(raw) {
    log('debug', 'resolvePageName: Starting resolution', { raw: raw });
    
    if (!raw || typeof raw !== 'string') {
      log('debug', 'resolvePageName: Invalid input', { raw: raw, type: typeof raw });
      return null;
    }
    
    var normalized = normalizePageName(raw);
    
    if (normalized === '') {
      log('debug', 'resolvePageName: Empty normalized input');
      return null;
    }
    
    // Convert validPages Set to Array for iteration
    var validPageNames = Array.from(validPages);
    
    // Normalize all valid page names for comparison
    var normalizedValidPages = validPageNames.map(function(name) {
      return {
        original: name,
        normalized: normalizePageName(name)
      };
    });
    
    // Priority 1: Exact match (after normalization)
    for (var i = 0; i < normalizedValidPages.length; i++) {
      if (normalizedValidPages[i].normalized === normalized) {
        log('debug', 'resolvePageName: Found exact match', { 
          raw: raw, 
          normalized: normalized, 
          matched: normalizedValidPages[i].original 
        });
        return normalizedValidPages[i].original;
      }
    }
    
    log('debug', 'resolvePageName: No exact match found', { normalized: normalized });
    
    // Priority 2: Chinese alias mapping
    var aliasMatch = DEFAULT_ROLE_ALIASES[raw];
    if (aliasMatch) {
      log('debug', 'resolvePageName: Found Chinese alias', { raw: raw, alias: aliasMatch });
      var aliasNormalized = normalizePageName(aliasMatch);
      for (var j = 0; j < normalizedValidPages.length; j++) {
        if (normalizedValidPages[j].normalized === aliasNormalized) {
          log('debug', 'resolvePageName: Chinese alias resolved', { 
            raw: raw, 
            alias: aliasMatch, 
            matched: normalizedValidPages[j].original 
          });
          return normalizedValidPages[j].original;
        }
      }
      log('debug', 'resolvePageName: Chinese alias not found in valid pages', { 
        alias: aliasMatch, 
        aliasNormalized: aliasNormalized 
      });
    }
    
    // Priority 3: Contains match (partial string matching)
    log('debug', 'resolvePageName: Attempting contains match', { normalized: normalized });
    for (var k = 0; k < normalizedValidPages.length; k++) {
      if (normalizedValidPages[k].normalized.indexOf(normalized) !== -1 || 
          normalized.indexOf(normalizedValidPages[k].normalized) !== -1) {
        log('debug', 'resolvePageName: Found contains match', { 
          raw: raw, 
          normalized: normalized, 
          matched: normalizedValidPages[k].original 
        });
        return normalizedValidPages[k].original;
      }
    }
    
    // No match found
    log('warn', 'resolvePageName: No match found for page name', { 
      raw: raw, 
      normalized: normalized 
    });
    return null;
  }
  
  /**
   * Check if a link should be handled by the router
   * 
   * This function filters out links that should not be intercepted by the routing
   * system, allowing them to behave normally. Links are excluded if they:
   * 
   * - Point to external domains (different hostname)
   * - Use special protocols (mailto:, tel:, javascript:)
   * - Open in new window/tab (target="_blank" or target="_new")
   * 
   * This ensures the router only handles internal page navigation and doesn't
   * interfere with external links, email links, phone links, or links that
   * explicitly request a new window.
   * 
   * @param {HTMLAnchorElement} link - The link element to check
   * @returns {boolean} True if the link should be handled by the router
   */
  function shouldHandleLink(link) {
    // Skip external links
    if (link.hostname && link.hostname !== window.location.hostname) {
      return false;
    }
    
    // Skip mailto, tel, javascript links
    const href = link.getAttribute('href') || '';
    if (href.match(/^(mailto:|tel:|javascript:)/i)) {
      return false;
    }
    
    // Skip links that open in new window/tab
    if (link.target === '_blank' || link.target === '_new') {
      return false;
    }
    
    return true;
  }
  
  /**
   * Navigate to a target page
   * 
   * Sends a navigation request to the parent window (MergePreviewDialog) via postMessage.
   * The parent window listens for 'merge-navigate' messages and updates the displayed
   * page accordingly.
   * 
   * This approach maintains proper separation between the iframe content and the parent
   * application, following the postMessage API pattern for cross-frame communication.
   * 
   * Requirement 7.2: Send navigation request via postMessage
   * Requirement 7.3: Use specific message type for merge navigation
   * 
   * @param {string} targetPage - The name of the page to navigate to
   */
  function navigate(targetPage) {
    log('info', 'Navigating to page', { targetPage: targetPage });
    
    // Requirement 7.2: Send navigation request via postMessage
    // Requirement 7.3: Use specific message type for merge navigation
    window.parent.postMessage({
      type: 'merge-navigate',
      targetPage: targetPage
    }, '*');
  }
  
  function initMergeRouting() {
    log('info', 'Initializing routing event handlers');
    
    // ============================================================================
    // EVENT DELEGATION PATTERN
    // ============================================================================
    // We use a single document-level click listener instead of attaching handlers
    // to individual elements. This provides:
    // 1. Better performance (one listener vs. many)
    // 2. Support for dynamically added elements
    // 3. Automatic handling of nested elements via event bubbling
    // 
    // Requirement 2.2: Use event delegation at document level
    // ============================================================================
    
    document.addEventListener('click', function(e) {
      log('debug', 'Click event detected', { target: e.target.tagName });
      
      // ============================================================================
      // PRIMARY NAVIGATION: data-page-target attribute
      // ============================================================================
      // Use Element.closest() to traverse up the DOM tree from the clicked element,
      // finding the nearest ancestor with a data-page-target attribute.
      // 
      // This supports nested elements. For example:
      //   <button data-page-target="products">
      //     <i class="icon"></i>
      //     <span>View Products</span>
      //   </button>
      // 
      // Clicking the icon or span will find the button and navigate correctly.
      // 
      // Requirement 2.2: Use closest() to find nearest ancestor with data-page-target
      // Requirement 2.3: Support event bubbling for nested elements
      // ============================================================================
      
      const target = e.target.closest('[data-page-target]');
      
      if (target) {
        const targetPage = target.getAttribute('data-page-target');
        
        log('debug', 'Found data-page-target element', { 
          element: target.tagName, 
          targetPage: targetPage 
        });
        
        if (targetPage && validPages.has(targetPage)) {
          log('info', 'Valid data-page-target navigation', { targetPage: targetPage });
          // Requirement 2.1: Intercept clicks on any HTML element type with data-page-target
          e.preventDefault();
          e.stopPropagation();
          navigate(targetPage);
          return;
        }
        
        // Try fuzzy resolution for data-page-target values that don't exactly match
        if (targetPage) {
          var resolved = resolvePageName(targetPage);
          if (resolved && validPages.has(resolved)) {
            log('info', 'data-page-target resolved via fuzzy match', { targetPage: targetPage, resolved: resolved });
            e.preventDefault();
            e.stopPropagation();
            navigate(resolved);
            return;
          } else {
            log('warn', 'Invalid data-page-target', { 
              targetPage: targetPage, 
              resolved: resolved,
              isValid: false 
            });
          }
        }
      }
      
      // ============================================================================
      // FALLBACK NAVIGATION: href resolution
      // ============================================================================
      // When data-page-target is not present, attempt to resolve the href attribute
      // as a fallback. This provides resilience when:
      // - AI doesn't generate data-page-target (despite prompt instructions)
      // - User manually edits HTML without adding the attribute
      // - Legacy content is imported
      // 
      // The fallback uses fuzzy matching to resolve various href formats:
      // - File paths: "products.html" → "products"
      // - Relative paths: "/products" → "products"
      // - Chinese names: "产品列表" → "products"
      // - Partial matches: "product" → "products"
      // 
      // Requirement 2.4: Fallback - check if click is on an <a> tag without data-page-target
      // ============================================================================
      
      const link = e.target.closest('a[href]');
      
      if (link && !link.hasAttribute('data-page-target')) {
        log('debug', 'Found link without data-page-target', { href: link.getAttribute('href') });
        
        // Check if we should handle this link
        if (!shouldHandleLink(link)) {
          log('debug', 'Link should not be handled by router', { 
            href: link.getAttribute('href'), 
            target: link.target 
          });
          return;
        }
        
        const href = link.getAttribute('href');
        
        log('debug', 'Attempting href fallback resolution', { href: href });
        
        // Use resolvePageName for enhanced page name resolution with fuzzy matching
        // This function is inlined from pageNameResolver.ts (see above) because
        // the routing script runs in an iframe and cannot import external modules
        const pageName = resolvePageName(href);
        
        // Only navigate if resolved page name is in valid pages list
        if (pageName && validPages.has(pageName)) {
          log('info', 'Href fallback navigation successful', { 
            href: href, 
            resolvedPage: pageName 
          });
          e.preventDefault();
          e.stopPropagation();
          navigate(pageName);
        } else {
          log('warn', 'Href fallback resolution failed', { 
            href: href, 
            resolvedPage: pageName, 
            isValid: pageName ? validPages.has(pageName) : false 
          });
        }
      }
    });
    
    // ============================================================================
    // INVALID LINK MARKING
    // ============================================================================
    // Scan all navigation elements on initialization and mark those pointing to
    // non-existent pages with visual feedback. This provides immediate feedback
    // to developers and prevents confusing user interactions.
    // 
    // Visual feedback includes:
    // - Reduced opacity (0.5)
    // - Disabled cursor (not-allowed)
    // - Pointer events disabled (prevents clicking)
    // - Tooltip showing the missing page name
    // 
    // Requirement 3.3: Check both data-page-target elements and resolvable href links
    // ============================================================================
    
    // 1. Mark elements with data-page-target
    const pageLinks = document.querySelectorAll('[data-page-target]');
    
    log('info', 'Marking invalid links', { 
      dataPageTargetCount: pageLinks.length 
    });
    
    pageLinks.forEach(function(link) {
      const targetPage = link.getAttribute('data-page-target');
      
      if (!targetPage) {
        return;
      }
      
      // Requirement 7.4: Check if target page exists in valid pages (exact or fuzzy match)
      var isValid = validPages.has(targetPage);
      if (!isValid) {
        // Try fuzzy resolution before marking as invalid
        var resolved = resolvePageName(targetPage);
        isValid = !!(resolved && validPages.has(resolved));
      }
      
      if (!isValid) {
        log('warn', 'Invalid data-page-target link found', { 
          element: link.tagName, 
          targetPage: targetPage 
        });
        // Mark invalid links with disabled styling
        link.classList.add('merge-link-disabled');
        link.style.opacity = '0.5';
        link.style.cursor = 'not-allowed';
        link.style.pointerEvents = 'none';
        link.title = 'Page "' + targetPage + '" not found';
      } else {
        log('debug', 'Valid data-page-target link', { 
          element: link.tagName, 
          targetPage: targetPage 
        });
        // Mark valid links
        link.classList.add('merge-link-active');
        link.style.cursor = 'pointer';
      }
    });
    
    // 2. Mark <a> tags with resolvable hrefs (fallback mechanism)
    const anchorLinks = document.querySelectorAll('a[href]');
    
    log('info', 'Checking anchor links for fallback resolution', { 
      anchorLinkCount: anchorLinks.length 
    });
    
    anchorLinks.forEach(function(link) {
      // Skip if already has data-page-target (already processed above)
      if (link.hasAttribute('data-page-target')) {
        return;
      }
      
      // Check if we should handle this link
      if (!shouldHandleLink(link)) {
        return;
      }
      
      const href = link.getAttribute('href');
      const resolvedPage = resolvePageName(href);
      
      // If href can be resolved to a page name
      if (resolvedPage) {
        if (validPages.has(resolvedPage)) {
          log('debug', 'Valid href fallback link', { 
            href: href, 
            resolvedPage: resolvedPage 
          });
          // Mark as valid navigable link
          link.classList.add('merge-link-active');
          link.style.cursor = 'pointer';
        } else {
          log('warn', 'Invalid href fallback link', { 
            href: href, 
            resolvedPage: resolvedPage 
          });
          // Mark as invalid link
          link.classList.add('merge-link-disabled');
          link.style.opacity = '0.5';
          link.style.cursor = 'not-allowed';
          link.style.pointerEvents = 'none';
          link.title = 'Page "' + resolvedPage + '" not found';
        }
      }
    });
    
    log('info', 'Merge preview router initialization complete');
  }
})();
</script>`;

  // Requirement 7.1: Build complete HTML document with DOCTYPE, head, style, body, script
  // Note: Only inject page.js as a separate script if the HTML body doesn't already
  // contain <script> tags (to avoid duplicate variable declarations at top-level scope).
  // We use cleanedHtml/cleanedJs which have old pageLinkHandler scripts stripped out.
  const htmlAlreadyHasScript = /<script[\s>]/i.test(cleanedHtml);
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.name)}</title>
  <style>
${page.css}
  </style>
</head>
<body>
${cleanedHtml}
${cleanedJs && !htmlAlreadyHasScript ? `<script>\n${cleanedJs}\n</script>` : ''}
${routingScript}
</body>
</html>`;

  console.debug('[buildMergePageHtml] Merge page HTML built', { 
    pageName: page.name,
    fullHtmlLength: fullHtml.length,
    hasScript: htmlAlreadyHasScript
  });

  return fullHtml;
}

/**
 * Escape HTML special characters to prevent XSS in title
 * 
 * @param text - Text to escape
 * @returns Escaped text safe for HTML
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}
