/**
 * Tests for merge preview router utilities
 * Feature: multi-page-merge-preview
 * Requirements: 3.1, 3.5, 7.1, 7.2, 7.3, 7.4
 */

import { buildMergePageHtml } from '../../utils/batch/mergePreviewRouter';
import type { CollectedPage } from '../../utils/batch/collectPages';

describe('buildMergePageHtml', () => {
  const mockPage: CollectedPage = {
    name: 'home',
    html: '<div><h1>Home Page</h1></div>',
    css: 'body { margin: 0; }',
    js: 'console.log("Home loaded");',
  };

  const allPageNames = ['home', 'products', 'about', 'contact'];

  describe('basic HTML structure', () => {
    it('should build complete HTML document with DOCTYPE', () => {
      // Requirement 7.1: Build complete HTML document
      const result = buildMergePageHtml(mockPage, allPageNames);

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html lang="en">');
      expect(result).toContain('</html>');
    });

    it('should include page name in title', () => {
      // Requirement 7.1: Include page name in title
      const result = buildMergePageHtml(mockPage, allPageNames);

      expect(result).toContain('<title>home</title>');
    });

    it('should include page CSS in style tag', () => {
      // Requirement 7.1: Include CSS in style tag
      const result = buildMergePageHtml(mockPage, allPageNames);

      expect(result).toContain('<style>');
      expect(result).toContain('body { margin: 0; }');
      expect(result).toContain('</style>');
    });

    it('should include page HTML in body', () => {
      // Requirement 7.1: Include HTML in body
      const result = buildMergePageHtml(mockPage, allPageNames);

      expect(result).toContain('<body>');
      expect(result).toContain('<div><h1>Home Page</h1></div>');
      expect(result).toContain('</body>');
    });

    it('should include page JS in script tag', () => {
      // Requirement 7.1: Include JS in script tag
      const result = buildMergePageHtml(mockPage, allPageNames);

      expect(result).toContain('<script>');
      expect(result).toContain('console.log("Home loaded");');
      expect(result).toContain('</script>');
    });
  });

  describe('routing script injection', () => {
    it('should inject routing script', () => {
      // Requirement 7.2: Inject routing script
      const result = buildMergePageHtml(mockPage, allPageNames);

      expect(result).toContain('initMergeRouting');
      expect(result).toContain('data-page-target');
    });

    it('should include valid page names in routing script', () => {
      // Requirement 7.4: Serialize page names as JSON
      const result = buildMergePageHtml(mockPage, allPageNames);

      expect(result).toContain('"home"');
      expect(result).toContain('"products"');
      expect(result).toContain('"about"');
      expect(result).toContain('"contact"');
    });

    it('should include postMessage navigation logic', () => {
      // Requirement 7.2: Use postMessage for navigation
      const result = buildMergePageHtml(mockPage, allPageNames);

      expect(result).toContain('window.parent.postMessage');
      expect(result).toContain('merge-navigate');
    });

    it('should include link extraction logic for regular links', () => {
      // NEW: Test automatic link routing with enhanced page name resolution
      const result = buildMergePageHtml(mockPage, allPageNames);

      expect(result).toContain('normalizePageName');
      expect(result).toContain('resolvePageName');
      expect(result).toContain('shouldHandleLink');
      expect(result).toContain('a[href]');
    });

    it('should use event delegation at document level', () => {
      // Requirement 2.2: Use event delegation pattern
      const result = buildMergePageHtml(mockPage, allPageNames);

      expect(result).toContain('document.addEventListener(\'click\'');
    });

    it('should use closest() to find data-page-target elements', () => {
      // Requirement 2.2: Use closest() for ancestor element lookup
      // Requirement 2.3: Support event bubbling for nested elements
      const result = buildMergePageHtml(mockPage, allPageNames);

      expect(result).toContain('e.target.closest(\'[data-page-target]\')');
    });

    it('should have navigate helper function', () => {
      // Verify navigate function exists for cleaner code
      const result = buildMergePageHtml(mockPage, allPageNames);

      expect(result).toContain('function navigate(targetPage)');
    });

    it('should handle clicks on any element type with data-page-target', () => {
      // Requirement 2.1: Support any HTML element type
      const result = buildMergePageHtml(mockPage, allPageNames);

      // Should use closest() which works with any element type
      expect(result).toContain('e.target.closest(\'[data-page-target]\')');
      // Should not be limited to specific element types like 'a' or 'button'
      expect(result).not.toContain('querySelectorAll(\'a[data-page-target]\')');
      expect(result).not.toContain('querySelectorAll(\'button[data-page-target]\')');
    });
  });

  describe('edge cases', () => {
    it('should handle page with no CSS', () => {
      const pageWithoutCss: CollectedPage = {
        ...mockPage,
        css: '',
      };

      const result = buildMergePageHtml(pageWithoutCss, allPageNames);

      expect(result).toContain('<style>');
      expect(result).toContain('</style>');
    });

    it('should handle page with no JS', () => {
      const pageWithoutJs: CollectedPage = {
        ...mockPage,
        js: '',
      };

      const result = buildMergePageHtml(pageWithoutJs, allPageNames);

      // Should not include empty script tag for page JS
      expect(result).not.toContain('<script>\n\n</script>');
      // But should still include routing script
      expect(result).toContain('initMergeRouting');
    });

    it('should escape HTML special characters in page name', () => {
      const pageWithSpecialChars: CollectedPage = {
        ...mockPage,
        name: 'test<script>alert("xss")</script>',
      };

      const result = buildMergePageHtml(pageWithSpecialChars, allPageNames);

      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>alert("xss")</script>');
    });

    it('should handle empty page names list', () => {
      const result = buildMergePageHtml(mockPage, []);

      expect(result).toContain('const validPages = new Set([]);');
    });

    it('should not duplicate script tags if HTML already has scripts', () => {
      const pageWithScript: CollectedPage = {
        ...mockPage,
        html: '<div><script>console.log("inline");</script></div>',
        js: 'console.log("page js");',
      };

      const result = buildMergePageHtml(pageWithScript, allPageNames);

      // Should not inject page.js as separate script
      expect(result).not.toContain('<script>\nconsole.log("page js");\n</script>');
      // But should still include routing script
      expect(result).toContain('initMergeRouting');
    });
  });

  describe('script structure and syntax', () => {
    it('should generate syntactically valid JavaScript', () => {
      // Task 3.4: Verify script structure is complete and syntax is correct
      const result = buildMergePageHtml(mockPage, allPageNames);

      // Extract the routing script
      const scriptMatch = result.match(/<script>\s*\(function\(\) \{[\s\S]*?\}\)\(\);\s*<\/script>/);
      expect(scriptMatch).toBeTruthy();
      
      if (scriptMatch) {
        const script = scriptMatch[0];
        
        // Verify IIFE structure
        expect(script).toMatch(/\(function\(\) \{[\s\S]*?\}\)\(\);/);
        
        // Verify 'use strict' directive
        expect(script).toContain("'use strict';");
        
        // Verify all required functions are defined
        expect(script).toContain('function normalizePageName(raw)');
        expect(script).toContain('function resolvePageName(raw)');
        expect(script).toContain('function shouldHandleLink(link)');
        expect(script).toContain('function navigate(targetPage)');
        expect(script).toContain('function initMergeRouting()');
        
        // Verify proper function calls
        expect(script).toContain('initMergeRouting()');
        expect(script).toContain('document.addEventListener(\'DOMContentLoaded\', initMergeRouting)');
        
        // Verify no obvious syntax errors (basic checks)
        // Note: We allow 'return null;' as it's valid JavaScript
        expect(script).not.toContain('undefined;'); // Likely indicates missing value
        expect(script).not.toContain('= null;'); // Likely indicates uninitialized variable
        
        // Verify balanced braces and parentheses
        const openBraces = (script.match(/\{/g) || []).length;
        const closeBraces = (script.match(/\}/g) || []).length;
        expect(openBraces).toBe(closeBraces);
        
        const openParens = (script.match(/\(/g) || []).length;
        const closeParens = (script.match(/\)/g) || []).length;
        expect(openParens).toBe(closeParens);
      }
    });

    it('should include all required components in correct order', () => {
      // Task 3.4: Verify script structure completeness
      const result = buildMergePageHtml(mockPage, allPageNames);

      // Find positions of key components
      const validPagesPos = result.indexOf('const validPages = new Set(');
      const aliasesPos = result.indexOf('const DEFAULT_ROLE_ALIASES');
      const normalizePos = result.indexOf('function normalizePageName(raw)');
      const resolvePos = result.indexOf('function resolvePageName(raw)');
      const shouldHandlePos = result.indexOf('function shouldHandleLink(link)');
      const navigatePos = result.indexOf('function navigate(targetPage)');
      const initPos = result.indexOf('function initMergeRouting()');
      const eventDelegationPos = result.indexOf("document.addEventListener('click'");
      const markLinksPos = result.indexOf("querySelectorAll('[data-page-target]')");

      // Verify all components exist
      expect(validPagesPos).toBeGreaterThan(-1);
      expect(aliasesPos).toBeGreaterThan(-1);
      expect(normalizePos).toBeGreaterThan(-1);
      expect(resolvePos).toBeGreaterThan(-1);
      expect(shouldHandlePos).toBeGreaterThan(-1);
      expect(navigatePos).toBeGreaterThan(-1);
      expect(initPos).toBeGreaterThan(-1);
      expect(eventDelegationPos).toBeGreaterThan(-1);
      expect(markLinksPos).toBeGreaterThan(-1);

      // Verify logical order (definitions before usage)
      expect(validPagesPos).toBeLessThan(initPos);
      expect(aliasesPos).toBeLessThan(resolvePos);
      expect(normalizePos).toBeLessThan(resolvePos);
      expect(resolvePos).toBeLessThan(initPos);
      expect(shouldHandlePos).toBeLessThan(initPos);
      expect(navigatePos).toBeLessThan(initPos);
      expect(initPos).toBeLessThan(eventDelegationPos);
      expect(eventDelegationPos).toBeLessThan(markLinksPos);
    });
  });

  describe('link handling logic', () => {
    it('should include inlined pageNameResolver logic', () => {
      // Task 3.4: Verify script contains inlined pageNameResolver logic
      const result = buildMergePageHtml(mockPage, allPageNames);

      // Check that normalizePageName function is present
      expect(result).toContain('function normalizePageName(raw)');
      
      // Check that resolvePageName function is present
      expect(result).toContain('function resolvePageName(raw)');
      
      // Check for normalization logic
      expect(result).toContain("normalized.split('?')[0].split('#')[0]"); // Remove query params
      expect(result).toContain('.toLowerCase()'); // Normalize case
      expect(result).toContain('([a-z])([A-Z])'); // camelCase to kebab-case
    });

    it('should include Chinese alias mapping', () => {
      const result = buildMergePageHtml(mockPage, allPageNames);

      // Check that DEFAULT_ROLE_ALIASES is present
      expect(result).toContain('DEFAULT_ROLE_ALIASES');
      
      // Check for some common Chinese aliases
      expect(result).toContain('首页');
      expect(result).toContain('产品列表');
      expect(result).toContain('购物车');
    });

    it('should use resolvePageName for href fallback', () => {
      const result = buildMergePageHtml(mockPage, allPageNames);

      // Check that resolvePageName is called in the fallback logic
      expect(result).toContain('resolvePageName(href)');
      
      // Should check if resolved page is in valid pages
      expect(result).toContain('validPages.has(pageName)');
    });

    it('should check if links should be handled', () => {
      const result = buildMergePageHtml(mockPage, allPageNames);

      // Check that the shouldHandleLink function is present
      expect(result).toContain('function shouldHandleLink(link)');
      
      // Check for external link detection
      expect(result).toContain('link.hostname');
      
      // Check for special protocol detection
      expect(result).toContain('mailto:');
      expect(result).toContain('tel:');
      expect(result).toContain('javascript:');
      
      // Check for target="_blank" detection
      expect(result).toContain('link.target');
    });

    it('should mark invalid links with disabled styling', () => {
      // Requirement 7.4: Mark invalid links
      const result = buildMergePageHtml(mockPage, allPageNames);

      // Check that we still query for data-page-target elements to mark them
      expect(result).toContain('querySelectorAll(\'[data-page-target]\')');
      expect(result).toContain('merge-link-disabled');
      expect(result).toContain('merge-link-active');
    });

    it('should mark both data-page-target and resolvable href links', () => {
      // Task 3.3: Mark invalid links for both data-page-target and resolvable hrefs
      const result = buildMergePageHtml(mockPage, allPageNames);

      // Should check data-page-target elements
      expect(result).toContain('querySelectorAll(\'[data-page-target]\')');
      
      // Should also check anchor links with href
      expect(result).toContain('querySelectorAll(\'a[href]\')');
      
      // Should skip links that already have data-page-target
      expect(result).toContain('link.hasAttribute(\'data-page-target\')');
      
      // Should use resolvePageName for href resolution
      expect(result).toContain('resolvePageName(href)');
      
      // Should mark invalid resolved links
      expect(result).toContain('opacity');
      expect(result).toContain('cursor');
      expect(result).toContain('not-allowed');
      expect(result).toContain('pointerEvents');
    });

    it('should use event delegation for click handling', () => {
      // Requirement 2.2: Event delegation instead of per-element binding
      const result = buildMergePageHtml(mockPage, allPageNames);

      // Should NOT bind click listeners to individual elements
      expect(result).not.toContain('link.addEventListener(\'click\'');
      
      // Should use document-level event delegation for click handling
      expect(result).toContain('document.addEventListener(\'click\'');
      
      // Note: We still use forEach to mark invalid links with styling,
      // but this is for visual feedback only, not for click handling
      expect(result).toContain('pageLinks.forEach(function(link)');
    });

    it('should handle fallback for regular links without data-page-target', () => {
      // Requirement 2.4: Fallback for <a> tags
      const result = buildMergePageHtml(mockPage, allPageNames);

      // Check for fallback logic
      expect(result).toContain('e.target.closest(\'a[href]\')');
      expect(result).toContain('!link.hasAttribute(\'data-page-target\')');
    });
  });

  describe('old pageLinkHandler script stripping', () => {
    it('should strip the old pageLinkHandler script from page HTML', () => {
      const oldScript = `<script>
(function() {
  'use strict';
  const validPages = new Set(["home","products"]);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageLinks);
  } else {
    initPageLinks();
  }
  function initPageLinks() {
    const pageLinks = document.querySelectorAll('[data-page-target]');
    pageLinks.forEach(function(link) {
      const targetPage = link.getAttribute('data-page-target');
      if (!targetPage) return;
      if (!validPages.has(targetPage)) {
        link.classList.add('page-link-disabled');
        link.style.opacity = '0.5';
        link.style.cursor = 'not-allowed';
        link.title = 'Page "' + targetPage + '" not found';
        link.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
        });
      } else {
        link.classList.add('page-link-active');
        link.style.cursor = 'pointer';
        link.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const event = new CustomEvent('navigateToPage', {
            detail: { targetPage: targetPage, sourcePage: 'home' },
            bubbles: true
          });
          document.dispatchEvent(event);
        });
      }
    });
  }
})();
</script>`;

      const pageWithOldScript: CollectedPage = {
        ...mockPage,
        html: `<div><a data-page-target="products">Products</a></div>${oldScript}`,
      };

      const result = buildMergePageHtml(pageWithOldScript, allPageNames);

      // Old script should be stripped
      expect(result).not.toContain('navigateToPage');
      expect(result).not.toContain('initPageLinks');
      // Merge router script should still be present
      expect(result).toContain('initMergeRouting');
      expect(result).toContain('merge-navigate');
    });

    it('should preserve page HTML content when stripping old script', () => {
      const oldScript = `<script>
(function() {
  'use strict';
  function initPageLinks() { /* old handler */ }
  initPageLinks();
})();
</script>`;

      const pageWithOldScript: CollectedPage = {
        ...mockPage,
        html: `<div><h1>Home Page</h1><a data-page-target="products">Products</a></div>${oldScript}`,
      };

      const result = buildMergePageHtml(pageWithOldScript, allPageNames);

      // Original content should be preserved
      expect(result).toContain('<h1>Home Page</h1>');
      expect(result).toContain('data-page-target="products"');
    });

    it('should handle page HTML without old script (no-op)', () => {
      const result = buildMergePageHtml(mockPage, allPageNames);

      // Should work normally without old script
      expect(result).toContain('<div><h1>Home Page</h1></div>');
      expect(result).toContain('initMergeRouting');
    });
  });
});
