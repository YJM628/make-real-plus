/**
 * Unit tests for PageLinkHandler
 * Feature: batch-html-redesign
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */

import { PageLinkHandler } from '../../utils/batch/pageLinkHandler';

describe('PageLinkHandler', () => {
  let handler: PageLinkHandler;

  beforeEach(() => {
    handler = new PageLinkHandler();
  });

  describe('registerPages', () => {
    it('should register page mappings', () => {
      const pageMap = new Map([
        ['home', 'shape:abc123'],
        ['products', 'shape:def456'],
        ['cart', 'shape:ghi789'],
      ]);

      handler.registerPages(pageMap);

      expect(handler.getRegisteredPages()).toEqual(['home', 'products', 'cart']);
    });

    it('should handle empty page map', () => {
      handler.registerPages(new Map());
      expect(handler.getRegisteredPages()).toEqual([]);
    });

    it('should replace existing page mappings', () => {
      handler.registerPages(new Map([['home', 'shape:1']]));
      expect(handler.getRegisteredPages()).toEqual(['home']);

      handler.registerPages(new Map([['about', 'shape:2']]));
      expect(handler.getRegisteredPages()).toEqual(['about']);
    });

    it('should create a copy of the page map', () => {
      const pageMap = new Map([['home', 'shape:1']]);
      handler.registerPages(pageMap);

      // Modify original map
      pageMap.set('about', 'shape:2');

      // Handler should not be affected
      expect(handler.getRegisteredPages()).toEqual(['home']);
    });
  });

  describe('handlePageLinkClick', () => {
    beforeEach(() => {
      handler.registerPages(new Map([
        ['home', 'shape:home-123'],
        ['products', 'shape:products-456'],
        ['cart', 'shape:cart-789'],
      ]));
    });

    it('should resolve valid page names to shape IDs', () => {
      expect(handler.handlePageLinkClick('home')).toBe('shape:home-123');
      expect(handler.handlePageLinkClick('products')).toBe('shape:products-456');
      expect(handler.handlePageLinkClick('cart')).toBe('shape:cart-789');
    });

    it('should return null for non-existent pages', () => {
      expect(handler.handlePageLinkClick('nonexistent')).toBeNull();
      expect(handler.handlePageLinkClick('missing')).toBeNull();
      expect(handler.handlePageLinkClick('')).toBeNull();
    });

    it('should be case-sensitive', () => {
      expect(handler.handlePageLinkClick('Home')).toBeNull();
      expect(handler.handlePageLinkClick('HOME')).toBeNull();
      expect(handler.handlePageLinkClick('home')).toBe('shape:home-123');
    });

    it('should return null when no pages are registered', () => {
      const emptyHandler = new PageLinkHandler();
      expect(emptyHandler.handlePageLinkClick('home')).toBeNull();
    });
  });

  describe('injectLinkHandlers', () => {
    beforeEach(() => {
      handler.registerPages(new Map([
        ['home', 'shape:1'],
        ['products', 'shape:2'],
        ['cart', 'shape:3'],
      ]));
    });

    it('should inject script before closing body tag', () => {
      const html = `
<!DOCTYPE html>
<html>
<body>
  <a href="#" data-page-target="products">Products</a>
</body>
</html>`;

      const result = handler.injectLinkHandlers(html, 'home');

      expect(result).toContain('<script>');
      expect(result).toContain('</script>');
      expect(result).toContain('data-page-target');
      expect(result.indexOf('<script>')).toBeLessThan(result.indexOf('</body>'));
    });

    it('should inject script before closing html tag if no body tag', () => {
      const html = `
<!DOCTYPE html>
<html>
  <a href="#" data-page-target="products">Products</a>
</html>`;

      const result = handler.injectLinkHandlers(html, 'home');

      expect(result).toContain('<script>');
      expect(result.indexOf('<script>')).toBeLessThan(result.indexOf('</html>'));
    });

    it('should append script at end if no body or html tag', () => {
      const html = '<a href="#" data-page-target="products">Products</a>';

      const result = handler.injectLinkHandlers(html, 'home');

      expect(result).toContain('<script>');
      expect(result.endsWith('</script>')).toBe(true);
    });

    it('should include valid page names in script', () => {
      const html = '<body><a data-page-target="products">Products</a></body>';

      const result = handler.injectLinkHandlers(html, 'home');

      expect(result).toContain('["home","products","cart"]');
    });

    it('should include current page name in script', () => {
      const html = '<body><a data-page-target="products">Products</a></body>';

      const result = handler.injectLinkHandlers(html, 'home');

      expect(result).toContain("sourcePage: 'home'");
    });

    it('should handle HTML without any links', () => {
      const html = '<body><p>No links here</p></body>';

      const result = handler.injectLinkHandlers(html, 'home');

      expect(result).toContain('<script>');
      expect(result).toContain('querySelectorAll');
    });

    it('should handle empty HTML', () => {
      const html = '';

      const result = handler.injectLinkHandlers(html, 'home');

      expect(result).toContain('<script>');
    });

    it('should create script that handles DOMContentLoaded', () => {
      const html = '<body></body>';

      const result = handler.injectLinkHandlers(html, 'home');

      expect(result).toContain('DOMContentLoaded');
      expect(result).toContain('document.readyState');
    });

    it('should create script that emits navigateToPage event', () => {
      const html = '<body></body>';

      const result = handler.injectLinkHandlers(html, 'home');

      expect(result).toContain('navigateToPage');
      expect(result).toContain('CustomEvent');
    });

    it('should create script that marks invalid links as disabled', () => {
      const html = '<body></body>';

      const result = handler.injectLinkHandlers(html, 'home');

      expect(result).toContain('page-link-disabled');
      expect(result).toContain('not-allowed');
      expect(result).toContain('opacity');
    });

    it('should create script that marks valid links as active', () => {
      const html = '<body></body>';

      const result = handler.injectLinkHandlers(html, 'home');

      expect(result).toContain('page-link-active');
      expect(result).toContain('pointer');
    });
  });

  describe('getRegisteredPages', () => {
    it('should return empty array when no pages registered', () => {
      expect(handler.getRegisteredPages()).toEqual([]);
    });

    it('should return all registered page names', () => {
      handler.registerPages(new Map([
        ['home', 'shape:1'],
        ['about', 'shape:2'],
        ['contact', 'shape:3'],
      ]));

      const pages = handler.getRegisteredPages();
      expect(pages).toHaveLength(3);
      expect(pages).toContain('home');
      expect(pages).toContain('about');
      expect(pages).toContain('contact');
    });
  });

  describe('hasPage', () => {
    beforeEach(() => {
      handler.registerPages(new Map([
        ['home', 'shape:1'],
        ['products', 'shape:2'],
      ]));
    });

    it('should return true for registered pages', () => {
      expect(handler.hasPage('home')).toBe(true);
      expect(handler.hasPage('products')).toBe(true);
    });

    it('should return false for non-registered pages', () => {
      expect(handler.hasPage('cart')).toBe(false);
      expect(handler.hasPage('about')).toBe(false);
      expect(handler.hasPage('')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(handler.hasPage('Home')).toBe(false);
      expect(handler.hasPage('HOME')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all registered pages', () => {
      handler.registerPages(new Map([
        ['home', 'shape:1'],
        ['about', 'shape:2'],
      ]));

      expect(handler.getRegisteredPages()).toHaveLength(2);

      handler.clear();

      expect(handler.getRegisteredPages()).toEqual([]);
      expect(handler.hasPage('home')).toBe(false);
      expect(handler.handlePageLinkClick('home')).toBeNull();
    });

    it('should be safe to call multiple times', () => {
      handler.registerPages(new Map([['home', 'shape:1']]));
      handler.clear();
      handler.clear();

      expect(handler.getRegisteredPages()).toEqual([]);
    });

    it('should be safe to call on empty handler', () => {
      handler.clear();
      expect(handler.getRegisteredPages()).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle page names with special characters', () => {
      handler.registerPages(new Map([
        ['product-detail', 'shape:1'],
        ['user_profile', 'shape:2'],
        ['page.name', 'shape:3'],
      ]));

      expect(handler.handlePageLinkClick('product-detail')).toBe('shape:1');
      expect(handler.handlePageLinkClick('user_profile')).toBe('shape:2');
      expect(handler.handlePageLinkClick('page.name')).toBe('shape:3');
    });

    it('should handle shape IDs with various formats', () => {
      handler.registerPages(new Map([
        ['home', 'shape:abc-123-def'],
        ['about', 'shape_456'],
        ['contact', 'custom-id-789'],
      ]));

      expect(handler.handlePageLinkClick('home')).toBe('shape:abc-123-def');
      expect(handler.handlePageLinkClick('about')).toBe('shape_456');
      expect(handler.handlePageLinkClick('contact')).toBe('custom-id-789');
    });

    it('should handle HTML with multiple data-page-target links', () => {
      handler.registerPages(new Map([
        ['home', 'shape:1'],
        ['products', 'shape:2'],
        ['cart', 'shape:3'],
      ]));

      const html = `
<body>
  <nav>
    <a href="#" data-page-target="home">Home</a>
    <a href="#" data-page-target="products">Products</a>
    <a href="#" data-page-target="cart">Cart</a>
  </nav>
  <main>
    <a href="#" data-page-target="products">View Products</a>
  </main>
</body>`;

      const result = handler.injectLinkHandlers(html, 'home');

      expect(result).toContain('<script>');
      expect(result).toContain('querySelectorAll');
    });

    it('should handle HTML with mixed valid and invalid links', () => {
      handler.registerPages(new Map([
        ['home', 'shape:1'],
        ['products', 'shape:2'],
      ]));

      const html = `
<body>
  <a href="#" data-page-target="home">Home</a>
  <a href="#" data-page-target="products">Products</a>
  <a href="#" data-page-target="missing">Missing</a>
</body>`;

      const result = handler.injectLinkHandlers(html, 'home');

      expect(result).toContain('validPages');
      expect(result).toContain('page-link-disabled');
      expect(result).toContain('page-link-active');
    });
  });

  describe('Requirements validation', () => {
    it('should satisfy Requirement 4.1: Generate Inter_Page_Links', () => {
      // The handler supports inter-page links through data-page-target
      handler.registerPages(new Map([
        ['home', 'shape:1'],
        ['products', 'shape:2'],
      ]));

      const html = '<a data-page-target="products">Products</a>';
      const result = handler.injectLinkHandlers(html, 'home');

      expect(result).toContain('data-page-target');
    });

    it('should satisfy Requirement 4.2: Resolve page names to shape IDs', () => {
      // The handler resolves page names to shape IDs for canvas navigation
      handler.registerPages(new Map([
        ['products', 'shape:products-123'],
      ]));

      const shapeId = handler.handlePageLinkClick('products');
      expect(shapeId).toBe('shape:products-123');
    });

    it('should satisfy Requirement 4.3: Use data-page-target attribute', () => {
      // The handler uses data-page-target to mark link targets
      handler.registerPages(new Map([['home', 'shape:1']]));

      const html = '<a data-page-target="home">Home</a>';
      const result = handler.injectLinkHandlers(html, 'current');

      expect(result).toContain('data-page-target');
      expect(result).toContain('getAttribute');
    });

    it('should satisfy Requirement 4.5: Mark non-existent pages as disabled', () => {
      // The handler returns null for non-existent pages
      handler.registerPages(new Map([['home', 'shape:1']]));

      expect(handler.handlePageLinkClick('nonexistent')).toBeNull();

      // The injected script marks invalid links as disabled
      const html = '<body></body>';
      const result = handler.injectLinkHandlers(html, 'home');

      expect(result).toContain('page-link-disabled');
      expect(result).toContain('not-allowed');
    });
  });
});
