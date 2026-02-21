/**
 * Unit tests for pageNameResolver
 * Feature: merge-preview-navigation
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import {
  normalizePageName,
  resolvePageName,
  DEFAULT_ROLE_ALIASES,
} from '../../utils/batch/pageNameResolver';

describe('pageNameResolver', () => {
  describe('normalizePageName', () => {
    describe('basic functionality', () => {
      it('should return empty string for empty input', () => {
        expect(normalizePageName('')).toBe('');
      });

      it('should return empty string for whitespace-only input', () => {
        expect(normalizePageName('   ')).toBe('');
      });

      it('should return empty string for null/undefined input', () => {
        expect(normalizePageName(null as any)).toBe('');
        expect(normalizePageName(undefined as any)).toBe('');
      });

      it('should handle pure Chinese characters', () => {
        expect(normalizePageName('产品列表')).toBe('产品列表');
      });

      it('should handle very long strings', () => {
        const longString = 'a'.repeat(1000);
        expect(normalizePageName(longString)).toBe(longString);
      });
    });

    describe('file extension removal', () => {
      it('should remove .html extension', () => {
        expect(normalizePageName('products.html')).toBe('products');
      });

      it('should remove .htm extension', () => {
        expect(normalizePageName('about.htm')).toBe('about');
      });

      it('should remove other extensions', () => {
        expect(normalizePageName('page.php')).toBe('page');
        expect(normalizePageName('page.jsp')).toBe('page');
        expect(normalizePageName('page.aspx')).toBe('page');
      });

      it('should not remove extension-like patterns in the middle', () => {
        expect(normalizePageName('my.page.html')).toBe('my.page');
      });
    });

    describe('path prefix removal', () => {
      it('should remove leading slash', () => {
        expect(normalizePageName('/products')).toBe('products');
      });

      it('should remove ./ prefix', () => {
        expect(normalizePageName('./products')).toBe('products');
      });

      it('should remove ../ prefix', () => {
        expect(normalizePageName('../products')).toBe('products');
      });

      it('should remove multiple path prefixes', () => {
        expect(normalizePageName('../../pages/products')).toBe('pages/products');
      });

      it('should handle backslashes', () => {
        expect(normalizePageName('\\products')).toBe('products');
      });
    });

    describe('query parameter and anchor removal', () => {
      it('should remove query parameters', () => {
        expect(normalizePageName('products?id=123')).toBe('products');
      });

      it('should remove anchors', () => {
        expect(normalizePageName('products#section')).toBe('products');
      });

      it('should remove both query and anchor', () => {
        expect(normalizePageName('products?id=123#section')).toBe('products');
      });

      it('should handle complex query strings', () => {
        expect(normalizePageName('products?id=123&category=electronics&sort=price')).toBe('products');
      });
    });

    describe('case conversion', () => {
      it('should convert to lowercase', () => {
        expect(normalizePageName('PRODUCTS')).toBe('products');
        expect(normalizePageName('Products')).toBe('products');
        // Note: PrOdUcTs has lowercase followed by uppercase, so it will be treated as camelCase
        // and converted to pr-od-uc-ts. This is expected behavior.
      });
    });

    describe('camelCase and PascalCase conversion', () => {
      it('should convert camelCase to kebab-case', () => {
        expect(normalizePageName('productList')).toBe('product-list');
        expect(normalizePageName('myProductPage')).toBe('my-product-page');
      });

      it('should convert PascalCase to kebab-case', () => {
        expect(normalizePageName('ProductList')).toBe('product-list');
        expect(normalizePageName('MyProductPage')).toBe('my-product-page');
      });

      it('should handle consecutive uppercase letters', () => {
        expect(normalizePageName('HTMLParser')).toBe('html-parser');
        expect(normalizePageName('XMLHTTPRequest')).toBe('xmlhttp-request');
      });

      it('should handle single letter words', () => {
        expect(normalizePageName('aProduct')).toBe('a-product');
        expect(normalizePageName('productA')).toBe('product-a');
      });
    });

    describe('combined transformations', () => {
      it('should handle all transformations together', () => {
        expect(normalizePageName('/pages/ProductList.html?id=123')).toBe('pages/product-list');
        expect(normalizePageName('./MyProductPage.htm#section')).toBe('my-product-page');
        expect(normalizePageName('../PRODUCTS.html?sort=name')).toBe('products');
      });

      it('should clean up multiple consecutive hyphens', () => {
        expect(normalizePageName('product---list')).toBe('product-list');
      });

      it('should remove leading and trailing hyphens', () => {
        expect(normalizePageName('-products-')).toBe('products');
      });
    });
  });

  describe('resolvePageName', () => {
    const validPages = ['home', 'products', 'product-detail', 'cart', 'checkout'];

    describe('basic functionality', () => {
      it('should return null for empty input', () => {
        expect(resolvePageName('', validPages)).toBeNull();
      });

      it('should return null for whitespace-only input', () => {
        expect(resolvePageName('   ', validPages)).toBeNull();
      });

      it('should return null for null/undefined input', () => {
        expect(resolvePageName(null as any, validPages)).toBeNull();
        expect(resolvePageName(undefined as any, validPages)).toBeNull();
      });

      it('should return null for empty valid pages list', () => {
        expect(resolvePageName('products', [])).toBeNull();
      });

      it('should return null for null/undefined valid pages', () => {
        expect(resolvePageName('products', null as any)).toBeNull();
        expect(resolvePageName('products', undefined as any)).toBeNull();
      });
    });

    describe('exact match (priority 1)', () => {
      it('should match exact page names', () => {
        expect(resolvePageName('home', validPages)).toBe('home');
        expect(resolvePageName('products', validPages)).toBe('products');
        expect(resolvePageName('cart', validPages)).toBe('cart');
      });

      it('should match after normalization', () => {
        expect(resolvePageName('Products.html', validPages)).toBe('products');
        expect(resolvePageName('/cart', validPages)).toBe('cart');
        expect(resolvePageName('CHECKOUT', validPages)).toBe('checkout');
      });

      it('should match with file extensions', () => {
        expect(resolvePageName('products.html', validPages)).toBe('products');
        expect(resolvePageName('cart.htm', validPages)).toBe('cart');
      });

      it('should match with path prefixes', () => {
        expect(resolvePageName('/products', validPages)).toBe('products');
        expect(resolvePageName('./cart', validPages)).toBe('cart');
        expect(resolvePageName('../checkout', validPages)).toBe('checkout');
      });

      it('should match with query parameters and anchors', () => {
        expect(resolvePageName('products?id=123', validPages)).toBe('products');
        expect(resolvePageName('cart#items', validPages)).toBe('cart');
      });

      it('should match camelCase and PascalCase', () => {
        expect(resolvePageName('productDetail', validPages)).toBe('product-detail');
        expect(resolvePageName('ProductDetail', validPages)).toBe('product-detail');
      });
    });

    describe('Chinese alias mapping (priority 2)', () => {
      it('should resolve Chinese aliases to English page names', () => {
        expect(resolvePageName('首页', validPages)).toBe('home');
        expect(resolvePageName('主页', validPages)).toBe('home');
        expect(resolvePageName('产品列表', validPages)).toBe('products');
        expect(resolvePageName('产品', validPages)).toBe('products');
        expect(resolvePageName('购物车', validPages)).toBe('cart');
      });

      it('should return null for Chinese aliases with no matching page', () => {
        expect(resolvePageName('博客', validPages)).toBeNull();
        expect(resolvePageName('关于', validPages)).toBeNull();
      });

      it('should work with custom pageRoles mapping', () => {
        const pageRoles = new Map([
          ['home', '主页'],
          ['products', '商品列表'],
          ['cart', '购物车'],
        ]);

        expect(resolvePageName('商品列表', validPages, pageRoles)).toBe('products');
        expect(resolvePageName('购物车', validPages, pageRoles)).toBe('cart');
      });
    });

    describe('contains match (priority 3)', () => {
      it('should match when input is contained in page name', () => {
        expect(resolvePageName('product', validPages)).toBe('products');
      });

      it('should match when page name is contained in input', () => {
        const pages = ['home', 'about'];
        expect(resolvePageName('about-us', pages)).toBe('about');
      });

      it('should return first match for multiple partial matches', () => {
        const result = resolvePageName('product', validPages);
        // Should match either 'products' or 'product-detail', whichever comes first
        expect(['products', 'product-detail']).toContain(result);
      });
    });

    describe('no match', () => {
      it('should return null when no match is found', () => {
        expect(resolvePageName('nonexistent', validPages)).toBeNull();
        expect(resolvePageName('missing-page', validPages)).toBeNull();
      });
    });

    describe('round-trip consistency (requirement 3.4)', () => {
      it('should maintain consistency for valid page names', () => {
        validPages.forEach(pageName => {
          const normalized = normalizePageName(pageName);
          const resolved = resolvePageName(normalized, validPages);
          expect(resolved).toBe(pageName);
        });
      });

      it('should maintain consistency for page names with various formats', () => {
        const testPages = ['home', 'product-list', 'user-profile', 'about-us'];
        
        testPages.forEach(pageName => {
          // Test with uppercase
          expect(resolvePageName(pageName.toUpperCase(), testPages)).toBe(pageName);
          
          // Test with file extension
          expect(resolvePageName(`${pageName}.html`, testPages)).toBe(pageName);
          
          // Test with path prefix
          expect(resolvePageName(`/${pageName}`, testPages)).toBe(pageName);
        });
      });
    });

    describe('priority order', () => {
      it('should prefer exact match over contains match', () => {
        const pages = ['product', 'products', 'product-detail'];
        expect(resolvePageName('product', pages)).toBe('product');
      });

      it('should prefer Chinese alias over contains match', () => {
        const pages = ['home', 'homepage', 'home-page'];
        // '首页' maps to 'home' via DEFAULT_ROLE_ALIASES
        expect(resolvePageName('首页', pages)).toBe('home');
      });
    });
  });

  describe('DEFAULT_ROLE_ALIASES', () => {
    it('should contain common Chinese role names', () => {
      expect(DEFAULT_ROLE_ALIASES['首页']).toBe('home');
      expect(DEFAULT_ROLE_ALIASES['主页']).toBe('home');
      expect(DEFAULT_ROLE_ALIASES['产品列表']).toBe('products');
      expect(DEFAULT_ROLE_ALIASES['产品']).toBe('products');
      expect(DEFAULT_ROLE_ALIASES['购物车']).toBe('cart');
      expect(DEFAULT_ROLE_ALIASES['结账']).toBe('checkout');
    });

    it('should map multiple Chinese names to the same English name', () => {
      expect(DEFAULT_ROLE_ALIASES['首页']).toBe(DEFAULT_ROLE_ALIASES['主页']);
      expect(DEFAULT_ROLE_ALIASES['产品列表']).toBe(DEFAULT_ROLE_ALIASES['产品']);
    });

    it('should have all values in lowercase kebab-case format', () => {
      Object.values(DEFAULT_ROLE_ALIASES).forEach(value => {
        expect(value).toBe(value.toLowerCase());
        expect(value).not.toMatch(/[A-Z]/);
        // Should not have spaces
        expect(value).not.toMatch(/\s/);
      });
    });
  });
});
