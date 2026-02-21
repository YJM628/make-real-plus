/**
 * Tests for inlined pageNameResolver logic in merge preview router
 * Feature: merge-preview-navigation
 * Requirements: 2.4, 3.1, 3.2, 3.3
 * 
 * This test verifies that the inlined normalizePageName and resolvePageName
 * functions in the routing script work correctly by executing the generated
 * script in a simulated environment.
 */

import { buildMergePageHtml } from '../../utils/batch/mergePreviewRouter';
import type { CollectedPage } from '../../utils/batch/collectPages';

describe('mergePreviewRouter - Inlined pageNameResolver Logic', () => {
  const mockPage: CollectedPage = {
    name: 'home',
    html: '<div><h1>Home Page</h1></div>',
    css: 'body { margin: 0; }',
    js: '',
  };

  const allPageNames = ['home', 'products', 'product-detail', 'cart', 'about'];

  /**
   * Extract and execute the routing script to test the inlined functions
   */
  function extractInlinedFunctions(html: string) {
    // Extract the script content
    const scriptMatch = html.match(/<script>\s*\(function\(\) \{([\s\S]*?)\}\)\(\);\s*<\/script>/);
    if (!scriptMatch) {
      throw new Error('Could not find routing script in HTML');
    }

    const scriptContent = scriptMatch[1];

    // Create a mock environment for the script
    const mockWindow = {
      parent: {
        postMessage: jest.fn(),
      },
      location: {
        hostname: 'localhost',
      },
    };

    const mockDocument = {
      readyState: 'complete',
      addEventListener: jest.fn(),
      querySelectorAll: jest.fn(() => []),
    };

    // Execute the script in a controlled environment
    const scriptWrapper = new Function(
      'window',
      'document',
      `
      ${scriptContent}
      
      // Return the functions we want to test
      return {
        normalizePageName: normalizePageName,
        resolvePageName: resolvePageName,
        shouldHandleLink: shouldHandleLink
      };
      `
    );

    return scriptWrapper(mockWindow, mockDocument);
  }

  describe('Requirement 2.4: Inlined normalizePageName', () => {
    it('should remove file extensions', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);
      const { normalizePageName } = extractInlinedFunctions(html);

      expect(normalizePageName('products.html')).toBe('products');
      expect(normalizePageName('about.htm')).toBe('about');
      expect(normalizePageName('page.php')).toBe('page');
    });

    it('should remove path prefixes', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);
      const { normalizePageName } = extractInlinedFunctions(html);

      expect(normalizePageName('/products')).toBe('products');
      expect(normalizePageName('./about')).toBe('about');
      expect(normalizePageName('../cart')).toBe('cart');
    });

    it('should remove query parameters and anchors', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);
      const { normalizePageName } = extractInlinedFunctions(html);

      expect(normalizePageName('products?id=123')).toBe('products');
      expect(normalizePageName('about#section')).toBe('about');
      expect(normalizePageName('cart?item=1#top')).toBe('cart');
    });

    it('should convert to lowercase', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);
      const { normalizePageName } = extractInlinedFunctions(html);

      expect(normalizePageName('PRODUCTS')).toBe('products');
      expect(normalizePageName('About')).toBe('about');
      expect(normalizePageName('CART')).toBe('cart');
    });

    it('should convert camelCase to kebab-case', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);
      const { normalizePageName } = extractInlinedFunctions(html);

      expect(normalizePageName('productDetail')).toBe('product-detail');
      expect(normalizePageName('myProductPage')).toBe('my-product-page');
      expect(normalizePageName('ProductList')).toBe('product-list');
    });

    it('should handle empty and whitespace strings', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);
      const { normalizePageName } = extractInlinedFunctions(html);

      expect(normalizePageName('')).toBe('');
      expect(normalizePageName('   ')).toBe('');
    });
  });

  describe('Requirement 2.4: Inlined resolvePageName', () => {
    it('should resolve exact matches after normalization', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);
      const { resolvePageName } = extractInlinedFunctions(html);

      expect(resolvePageName('products.html')).toBe('products');
      expect(resolvePageName('/cart')).toBe('cart');
      expect(resolvePageName('ABOUT')).toBe('about');
    });

    it('should resolve Chinese aliases', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);
      const { resolvePageName } = extractInlinedFunctions(html);

      expect(resolvePageName('首页')).toBe('home');
      expect(resolvePageName('产品列表')).toBe('products');
      expect(resolvePageName('购物车')).toBe('cart');
    });

    it('should resolve partial matches', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);
      const { resolvePageName } = extractInlinedFunctions(html);

      // 'product' should match 'products' or 'product-detail'
      const result = resolvePageName('product');
      expect(allPageNames).toContain(result);
      expect(result).toMatch(/product/);
    });

    it('should return null for non-existent pages', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);
      const { resolvePageName } = extractInlinedFunctions(html);

      expect(resolvePageName('nonexistent')).toBeNull();
      expect(resolvePageName('invalid-page')).toBeNull();
    });

    it('should handle empty and invalid inputs', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);
      const { resolvePageName } = extractInlinedFunctions(html);

      expect(resolvePageName('')).toBeNull();
      expect(resolvePageName('   ')).toBeNull();
    });
  });

  describe('Requirement 2.4: shouldHandleLink', () => {
    it('should handle internal links', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);
      const { shouldHandleLink } = extractInlinedFunctions(html);

      const internalLink = {
        hostname: 'localhost',
        getAttribute: () => 'products.html',
        target: '',
      };

      expect(shouldHandleLink(internalLink)).toBe(true);
    });

    it('should skip external links', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);
      const { shouldHandleLink } = extractInlinedFunctions(html);

      const externalLink = {
        hostname: 'example.com',
        getAttribute: () => 'https://example.com/page',
        target: '',
      };

      expect(shouldHandleLink(externalLink)).toBe(false);
    });

    it('should skip mailto, tel, and javascript links', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);
      const { shouldHandleLink } = extractInlinedFunctions(html);

      const mailtoLink = {
        hostname: 'localhost',
        getAttribute: () => 'mailto:test@example.com',
        target: '',
      };

      const telLink = {
        hostname: 'localhost',
        getAttribute: () => 'tel:1234567890',
        target: '',
      };

      const jsLink = {
        hostname: 'localhost',
        getAttribute: () => 'javascript:void(0)',
        target: '',
      };

      expect(shouldHandleLink(mailtoLink)).toBe(false);
      expect(shouldHandleLink(telLink)).toBe(false);
      expect(shouldHandleLink(jsLink)).toBe(false);
    });

    it('should skip links with target="_blank"', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);
      const { shouldHandleLink } = extractInlinedFunctions(html);

      const blankLink = {
        hostname: 'localhost',
        getAttribute: () => 'products.html',
        target: '_blank',
      };

      expect(shouldHandleLink(blankLink)).toBe(false);
    });
  });

  describe('Integration: Full href fallback resolution', () => {
    it('should include all necessary components for href fallback', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);

      // Verify all components are present
      expect(html).toContain('function normalizePageName(raw)');
      expect(html).toContain('function resolvePageName(raw)');
      expect(html).toContain('function shouldHandleLink(link)');
      expect(html).toContain('DEFAULT_ROLE_ALIASES');

      // Verify the fallback logic uses resolvePageName
      expect(html).toContain('const pageName = resolvePageName(href)');
      expect(html).toContain('if (pageName && validPages.has(pageName))');
    });

    it('should prioritize data-page-target over href resolution', () => {
      const html = buildMergePageHtml(mockPage, allPageNames);

      // The script should check for data-page-target first
      const dataPageTargetIndex = html.indexOf('e.target.closest(\'[data-page-target]\')');
      const hrefFallbackIndex = html.indexOf('e.target.closest(\'a[href]\')');

      expect(dataPageTargetIndex).toBeGreaterThan(0);
      expect(hrefFallbackIndex).toBeGreaterThan(0);
      expect(dataPageTargetIndex).toBeLessThan(hrefFallbackIndex);
    });
  });
});
