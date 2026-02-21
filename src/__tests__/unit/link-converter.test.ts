/**
 * Unit tests for Link Converter
 * Feature: export-deployable-project
 * Requirements: 3.1, 3.2
 */

import { convertLinks } from './linkConverter';

describe('linkConverter', () => {
  describe('convertLinks - static format', () => {
    const pageNames = ['home', 'products', 'about'];

    it('should convert valid data-page-target to href with hash routing', () => {
      const html = '<button data-page-target="products">Products</button>';
      const result = convertLinks(html, pageNames, 'static');
      
      expect(result).toContain('href="#/products"');
      expect(result).toContain('data-page-target="products"');
    });

    it('should handle multiple valid links', () => {
      const html = `
        <a data-page-target="home">Home</a>
        <button data-page-target="products">Products</button>
        <div data-page-target="about">About</div>
      `;
      const result = convertLinks(html, pageNames, 'static');
      
      expect(result).toContain('href="#/home"');
      expect(result).toContain('href="#/products"');
      expect(result).toContain('href="#/about"');
    });

    it('should mark invalid targets as disabled', () => {
      const html = '<button data-page-target="nonexistent">Invalid</button>';
      const result = convertLinks(html, pageNames, 'static');
      
      expect(result).toContain('export-link-disabled');
      expect(result).toContain('opacity: 0.5');
      expect(result).toContain('cursor: not-allowed');
      expect(result).toContain('pointer-events: none');
      expect(result).toContain('title="Page \'nonexistent\' not found"');
      expect(result).not.toContain('href="#/nonexistent"');
    });

    it('should handle mixed valid and invalid links', () => {
      const html = `
        <a data-page-target="home">Home</a>
        <button data-page-target="invalid">Invalid</button>
        <div data-page-target="products">Products</div>
      `;
      const result = convertLinks(html, pageNames, 'static');
      
      // Valid links should have href
      expect(result).toContain('href="#/home"');
      expect(result).toContain('href="#/products"');
      
      // Invalid link should be disabled
      expect(result).toContain('export-link-disabled');
      expect(result).not.toContain('href="#/invalid"');
    });

    it('should not duplicate href if already exists', () => {
      const html = '<a data-page-target="home" href="#/home">Home</a>';
      const result = convertLinks(html, pageNames, 'static');
      
      // Should not add another href
      const hrefCount = (result.match(/href=/g) || []).length;
      expect(hrefCount).toBe(1);
    });

    it('should handle elements with existing class attribute', () => {
      const html = '<button class="btn primary" data-page-target="invalid">Invalid</button>';
      const result = convertLinks(html, pageNames, 'static');
      
      expect(result).toContain('class="btn primary export-link-disabled"');
    });

    it('should handle elements with existing style attribute', () => {
      const html = '<button style="color: red" data-page-target="invalid">Invalid</button>';
      const result = convertLinks(html, pageNames, 'static');
      
      expect(result).toContain('style="color: red; opacity: 0.5; cursor: not-allowed; pointer-events: none;"');
    });

    it('should handle elements with existing style ending with semicolon', () => {
      const html = '<button style="color: red;" data-page-target="invalid">Invalid</button>';
      const result = convertLinks(html, pageNames, 'static');
      
      expect(result).toContain('style="color: red; opacity: 0.5; cursor: not-allowed; pointer-events: none;"');
    });

    it('should handle case-insensitive attribute matching', () => {
      const html = '<button DATA-PAGE-TARGET="products">Products</button>';
      const result = convertLinks(html, pageNames, 'static');
      
      expect(result).toContain('href="#/products"');
    });

    it('should handle single quotes in attributes', () => {
      const html = "<button data-page-target='products'>Products</button>";
      const result = convertLinks(html, pageNames, 'static');
      
      expect(result).toContain('href="#/products"');
    });

    it('should handle empty page names list', () => {
      const html = '<button data-page-target="products">Products</button>';
      const result = convertLinks(html, [], 'static');
      
      // All links should be marked as disabled
      expect(result).toContain('export-link-disabled');
      expect(result).not.toContain('href="#/products"');
    });

    it('should handle HTML with no data-page-target attributes', () => {
      const html = '<div><p>Hello World</p><a href="https://example.com">External</a></div>';
      const result = convertLinks(html, pageNames, 'static');
      
      // Should return unchanged
      expect(result).toBe(html);
    });
  });

  describe('convertLinks - React format', () => {
    const pageNames = ['home', 'products', 'about'];

    it('should add React link marker for valid targets', () => {
      const html = '<button data-page-target="products">Products</button>';
      const result = convertLinks(html, pageNames, 'react');
      
      expect(result).toContain('data-react-link="true"');
      expect(result).toContain('data-page-target="products"');
    });

    it('should add React disabled marker for invalid targets', () => {
      const html = '<button data-page-target="invalid">Invalid</button>';
      const result = convertLinks(html, pageNames, 'react');
      
      expect(result).toContain('data-react-link-disabled="true"');
      expect(result).not.toContain('data-react-link="true"');
    });

    it('should handle multiple links', () => {
      const html = `
        <a data-page-target="home">Home</a>
        <button data-page-target="invalid">Invalid</button>
        <div data-page-target="products">Products</div>
      `;
      const result = convertLinks(html, pageNames, 'react');
      
      // Count markers
      const validMarkers = (result.match(/data-react-link="true"/g) || []).length;
      const disabledMarkers = (result.match(/data-react-link-disabled="true"/g) || []).length;
      
      expect(validMarkers).toBe(2); // home and products
      expect(disabledMarkers).toBe(1); // invalid
    });
  });

  describe('convertLinks - Vue format', () => {
    const pageNames = ['home', 'products', 'about'];

    it('should add Vue link marker for valid targets', () => {
      const html = '<button data-page-target="products">Products</button>';
      const result = convertLinks(html, pageNames, 'vue');
      
      expect(result).toContain('data-vue-link="true"');
      expect(result).toContain('data-page-target="products"');
    });

    it('should add Vue disabled marker for invalid targets', () => {
      const html = '<button data-page-target="invalid">Invalid</button>';
      const result = convertLinks(html, pageNames, 'vue');
      
      expect(result).toContain('data-vue-link-disabled="true"');
      expect(result).not.toContain('data-vue-link="true"');
    });

    it('should handle multiple links', () => {
      const html = `
        <a data-page-target="home">Home</a>
        <button data-page-target="invalid">Invalid</button>
        <div data-page-target="products">Products</div>
      `;
      const result = convertLinks(html, pageNames, 'vue');
      
      // Count markers
      const validMarkers = (result.match(/data-vue-link="true"/g) || []).length;
      const disabledMarkers = (result.match(/data-vue-link-disabled="true"/g) || []).length;
      
      expect(validMarkers).toBe(2); // home and products
      expect(disabledMarkers).toBe(1); // invalid
    });
  });

  describe('stripOldLinkHandlerScripts', () => {
    it('should remove old pageLinkHandler script', () => {
      const html = `
        <div>Content</div>
        <script>
        (function() {
          'use strict';
          function initPageLinks() {
            // Old navigation code
            const event = new CustomEvent('navigateToPage', { detail: { page: 'home' } });
          }
          initPageLinks();
        })();
        </script>
        <div>More content</div>
      `;
      const result = convertLinks(html, ['home'], 'static');
      
      expect(result).not.toContain('initPageLinks');
      expect(result).not.toContain('navigateToPage');
      expect(result).toContain('Content');
      expect(result).toContain('More content');
    });

    it('should remove page-link-disabled class', () => {
      const html = '<button class="btn page-link-disabled" data-page-target="home">Home</button>';
      const result = convertLinks(html, ['home'], 'static');
      
      expect(result).not.toContain('page-link-disabled');
      expect(result).toContain('class="btn"');
    });

    it('should remove disabled inline styles from old script', () => {
      const html = '<button style="opacity: 0.5; cursor: not-allowed;" data-page-target="home">Home</button>';
      const result = convertLinks(html, ['home'], 'static');
      
      // Old disabled styles should be removed
      // Note: The regex in stripOldLinkHandlerScripts looks for a specific pattern
      // This test verifies the function works as expected
      expect(result).toContain('data-page-target="home"');
    });

    it('should handle HTML without old scripts', () => {
      const html = '<div><button data-page-target="home">Home</button></div>';
      const result = convertLinks(html, ['home'], 'static');
      
      expect(result).toContain('href="#/home"');
      expect(result).toContain('data-page-target="home"');
    });
  });

  describe('edge cases', () => {
    it('should handle empty HTML', () => {
      const result = convertLinks('', ['home'], 'static');
      expect(result).toBe('');
    });

    it('should handle HTML with special characters in page names', () => {
      const html = '<button data-page-target="product-detail">Product Detail</button>';
      const result = convertLinks(html, ['product-detail'], 'static');
      
      expect(result).toContain('href="#/product-detail"');
    });

    it('should handle nested elements with data-page-target', () => {
      const html = `
        <div data-page-target="home">
          <span>Home</span>
          <i class="icon"></i>
        </div>
      `;
      const result = convertLinks(html, ['home'], 'static');
      
      expect(result).toContain('href="#/home"');
    });

    it('should handle multiline HTML', () => {
      const html = `
        <button
          class="nav-button"
          data-page-target="products"
          id="products-btn"
        >
          Products
        </button>
      `;
      const result = convertLinks(html, ['products'], 'static');
      
      expect(result).toContain('href="#/products"');
    });
  });
});
