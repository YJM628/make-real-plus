/**
 * Unit tests for collectPages
 * Feature: multi-page-merge-preview
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { collectPages } from '../../utils/batch/collectPages';
import { PageLinkHandler } from '../../utils/batch/pageLinkHandler';
import type { Editor } from 'tldraw';
import type { HtmlShape } from '../../core/shape/HybridHtmlShapeUtil';

describe('collectPages', () => {
  let pageLinkHandler: PageLinkHandler;
  let mockEditor: Partial<Editor>;

  beforeEach(() => {
    pageLinkHandler = new PageLinkHandler();
    mockEditor = {
      getShape: jest.fn(),
    };
  });

  describe('basic functionality', () => {
    it('should collect pages with html, css, and js from registered shapes', () => {
      // Requirement 1.1, 1.2, 1.4: Collect page data from PageLinkHandler and Editor
      const pageMap = new Map([
        ['home', 'shape:home-123'],
        ['products', 'shape:products-456'],
      ]);
      pageLinkHandler.registerPages(pageMap);

      // Mock shapes with html, css, js properties
      const homeShape = {
        id: 'shape:home-123' as any,
        type: 'html' as const,
        props: {
          html: '<div>Home Page</div>',
          css: 'body { margin: 0; }',
          js: 'console.log("home");',
          mode: 'preview' as const,
          overrides: [],
          w: 800,
          h: 600,
        },
      };

      const productsShape = {
        id: 'shape:products-456' as any,
        type: 'html' as const,
        props: {
          html: '<div>Products Page</div>',
          css: '.product { padding: 10px; }',
          js: 'console.log("products");',
          mode: 'preview' as const,
          overrides: [],
          w: 800,
          h: 600,
        },
      };

      (mockEditor.getShape as any) = jest.fn((shapeId: string) => {
        if (shapeId === 'shape:home-123') return homeShape;
        if (shapeId === 'shape:products-456') return productsShape;
        return undefined;
      });

      const result = collectPages(pageLinkHandler, mockEditor as Editor);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'home',
        html: '<div>Home Page</div>',
        css: 'body { margin: 0; }',
        js: 'console.log("home");',
      });
      expect(result[1]).toEqual({
        name: 'products',
        html: '<div>Products Page</div>',
        css: '.product { padding: 10px; }',
        js: 'console.log("products");',
      });
    });

    it('should return empty array when no pages are registered', () => {
      // Requirement 1.3: Handle empty page list
      const result = collectPages(pageLinkHandler, mockEditor as Editor);

      expect(result).toEqual([]);
    });

    it('should handle pages with empty html, css, or js', () => {
      // Requirement 1.2: Handle empty content properties
      const pageMap = new Map([['empty', 'shape:empty-123']]);
      pageLinkHandler.registerPages(pageMap);

      const emptyShape = {
        id: 'shape:empty-123' as any,
        type: 'html' as const,
        props: {
          html: '',
          css: '',
          js: '',
          mode: 'preview' as const,
          overrides: [],
          w: 800,
          h: 600,
        },
      };

      (mockEditor.getShape as any) = jest.fn(() => emptyShape);

      const result = collectPages(pageLinkHandler, mockEditor as Editor);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'empty',
        html: '',
        css: '',
        js: '',
      });
    });
  });

  describe('null handling', () => {
    it('should return empty array when PageLinkHandler is null', () => {
      // Requirement 1.3: Handle PageLinkHandler null
      const result = collectPages(null, mockEditor as Editor);

      expect(result).toEqual([]);
    });

    it('should return empty array when Editor is null', () => {
      // Requirement 1.3: Handle Editor null
      const pageMap = new Map([['home', 'shape:home-123']]);
      pageLinkHandler.registerPages(pageMap);

      const result = collectPages(pageLinkHandler, null);

      expect(result).toEqual([]);
    });

    it('should return empty array when both are null', () => {
      // Requirement 1.3: Handle both null
      const result = collectPages(null, null);

      expect(result).toEqual([]);
    });
  });

  describe('missing shapes', () => {
    it('should skip pages where shape is not found', () => {
      // Requirement 1.3: Skip missing shapes
      const pageMap = new Map([
        ['home', 'shape:home-123'],
        ['missing', 'shape:missing-456'],
        ['products', 'shape:products-789'],
      ]);
      pageLinkHandler.registerPages(pageMap);

      const homeShape = {
        id: 'shape:home-123' as any,
        type: 'html' as const,
        props: {
          html: '<div>Home</div>',
          css: '',
          js: '',
          mode: 'preview' as const,
          overrides: [],
          w: 800,
          h: 600,
        },
      };

      const productsShape = {
        id: 'shape:products-789' as any,
        type: 'html' as const,
        props: {
          html: '<div>Products</div>',
          css: '',
          js: '',
          mode: 'preview' as const,
          overrides: [],
          w: 800,
          h: 600,
        },
      };

      (mockEditor.getShape as any) = jest.fn((shapeId: string) => {
        if (shapeId === 'shape:home-123') return homeShape;
        if (shapeId === 'shape:products-789') return productsShape;
        return undefined; // missing shape returns undefined
      });

      const result = collectPages(pageLinkHandler, mockEditor as Editor);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('home');
      expect(result[1].name).toBe('products');
      expect(result.find((p) => p.name === 'missing')).toBeUndefined();
    });

    it('should skip pages where PageLinkHandler returns null shape ID', () => {
      // Requirement 1.3: Skip when shape ID is null
      const pageMap = new Map([
        ['home', 'shape:home-123'],
      ]);
      pageLinkHandler.registerPages(pageMap);

      // Mock handlePageLinkClick to return null for some pages
      const originalHandlePageLinkClick = pageLinkHandler.handlePageLinkClick.bind(pageLinkHandler);
      pageLinkHandler.handlePageLinkClick = jest.fn((pageName: string) => {
        if (pageName === 'home') return originalHandlePageLinkClick(pageName);
        return null;
      });

      const homeShape = {
        id: 'shape:home-123' as any,
        type: 'html' as const,
        props: {
          html: '<div>Home</div>',
          css: '',
          js: '',
          mode: 'preview' as const,
          overrides: [],
          w: 800,
          h: 600,
        },
      };

      (mockEditor.getShape as any) = jest.fn(() => homeShape);

      const result = collectPages(pageLinkHandler, mockEditor as Editor);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('home');
    });

    it('should return empty array when all shapes are missing', () => {
      // Requirement 1.3: Handle all shapes missing
      const pageMap = new Map([
        ['missing1', 'shape:missing1-123'],
        ['missing2', 'shape:missing2-456'],
      ]);
      pageLinkHandler.registerPages(pageMap);

      (mockEditor.getShape as any) = jest.fn(() => undefined);

      const result = collectPages(pageLinkHandler, mockEditor as Editor);

      expect(result).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle page names with special characters', () => {
      // Requirement 1.1: Handle various page name formats
      const pageMap = new Map([
        ['product-detail', 'shape:1'],
        ['user_profile', 'shape:2'],
        ['page.name', 'shape:3'],
      ]);
      pageLinkHandler.registerPages(pageMap);

      const createShape = (id: string, name: string) => ({
        id: id as any,
        type: 'html' as const,
        props: {
          html: `<div>${name}</div>`,
          css: '',
          js: '',
          mode: 'preview' as const,
          overrides: [],
          w: 800,
          h: 600,
        },
      });

      (mockEditor.getShape as any) = jest.fn((shapeId: string) => {
        if (shapeId === 'shape:1') return createShape('shape:1', 'product-detail');
        if (shapeId === 'shape:2') return createShape('shape:2', 'user_profile');
        if (shapeId === 'shape:3') return createShape('shape:3', 'page.name');
        return undefined;
      });

      const result = collectPages(pageLinkHandler, mockEditor as Editor);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('product-detail');
      expect(result[1].name).toBe('user_profile');
      expect(result[2].name).toBe('page.name');
    });

    it('should handle large number of pages', () => {
      // Requirement 1.1, 1.2: Handle multiple pages efficiently
      const pageMap = new Map();
      for (let i = 0; i < 50; i++) {
        pageMap.set(`page${i}`, `shape:${i}`);
      }
      pageLinkHandler.registerPages(pageMap);

      (mockEditor.getShape as any) = jest.fn((shapeId: string) => {
        const id = shapeId.split(':')[1];
        return {
          id: shapeId as any,
          type: 'html' as const,
          props: {
            html: `<div>Page ${id}</div>`,
            css: '',
            js: '',
            mode: 'preview' as const,
            overrides: [],
            w: 800,
            h: 600,
          },
        };
      });

      const result = collectPages(pageLinkHandler, mockEditor as Editor);

      expect(result).toHaveLength(50);
      expect(result[0].name).toBe('page0');
      expect(result[49].name).toBe('page49');
    });

    it('should handle shapes with complex HTML, CSS, and JS', () => {
      // Requirement 1.2: Handle complex content
      const pageMap = new Map([['complex', 'shape:complex-123']]);
      pageLinkHandler.registerPages(pageMap);

      const complexShape = {
        id: 'shape:complex-123' as any,
        type: 'html' as const,
        props: {
          html: `
            <div class="container">
              <header><h1>Title</h1></header>
              <main><p>Content with <a href="#">links</a></p></main>
              <footer>Footer</footer>
            </div>
          `,
          css: `
            .container { max-width: 1200px; margin: 0 auto; }
            header { background: #333; color: white; }
            main { padding: 20px; }
            footer { text-align: center; }
          `,
          js: `
            document.addEventListener('DOMContentLoaded', () => {
              console.log('Page loaded');
              const links = document.querySelectorAll('a');
              links.forEach(link => {
                link.addEventListener('click', (e) => {
                  e.preventDefault();
                  console.log('Link clicked');
                });
              });
            });
          `,
          mode: 'preview' as const,
          overrides: [],
          w: 800,
          h: 600,
        },
      };

      (mockEditor.getShape as any) = jest.fn(() => complexShape);

      const result = collectPages(pageLinkHandler, mockEditor as Editor);

      expect(result).toHaveLength(1);
      expect(result[0].html).toContain('<div class="container">');
      expect(result[0].css).toContain('.container');
      expect(result[0].js).toContain('DOMContentLoaded');
    });
  });

  describe('Requirements validation', () => {
    it('should satisfy Requirement 1.1: Get page names from PageLinkHandler', () => {
      const pageMap = new Map([
        ['home', 'shape:1'],
        ['about', 'shape:2'],
      ]);
      pageLinkHandler.registerPages(pageMap);

      const createShape = (id: string) => ({
        id: id as any,
        type: 'html' as const,
        props: {
          html: '<div>Content</div>',
          css: '',
          js: '',
          mode: 'preview' as const,
          overrides: [],
          w: 800,
          h: 600,
        },
      });

      (mockEditor.getShape as any) = jest.fn((shapeId: string) => createShape(shapeId));

      const result = collectPages(pageLinkHandler, mockEditor as Editor);

      // Should get page names from PageLinkHandler
      expect(result.map((p) => p.name)).toEqual(['home', 'about']);
    });

    it('should satisfy Requirement 1.2: Read html, css, js from shapes', () => {
      const pageMap = new Map([['test', 'shape:test-123']]);
      pageLinkHandler.registerPages(pageMap);

      const testShape = {
        id: 'shape:test-123' as any,
        type: 'html' as const,
        props: {
          html: '<div>Test HTML</div>',
          css: '.test { color: red; }',
          js: 'console.log("test");',
          mode: 'preview' as const,
          overrides: [],
          w: 800,
          h: 600,
        },
      };

      (mockEditor.getShape as any) = jest.fn(() => testShape);

      const result = collectPages(pageLinkHandler, mockEditor as Editor);

      // Should read html, css, js from shape props
      expect(result[0].html).toBe('<div>Test HTML</div>');
      expect(result[0].css).toBe('.test { color: red; }');
      expect(result[0].js).toBe('console.log("test");');
    });

    it('should satisfy Requirement 1.3: Handle null and missing shapes', () => {
      // Test null PageLinkHandler
      expect(collectPages(null, mockEditor as Editor)).toEqual([]);

      // Test null Editor
      expect(collectPages(pageLinkHandler, null)).toEqual([]);

      // Test missing shape
      const pageMap = new Map([['missing', 'shape:missing-123']]);
      pageLinkHandler.registerPages(pageMap);
      (mockEditor.getShape as any) = jest.fn(() => undefined);

      expect(collectPages(pageLinkHandler, mockEditor as Editor)).toEqual([]);
    });

    it('should satisfy Requirement 1.4: Return structured data array', () => {
      const pageMap = new Map([['home', 'shape:home-123']]);
      pageLinkHandler.registerPages(pageMap);

      const homeShape = {
        id: 'shape:home-123' as any,
        type: 'html' as const,
        props: {
          html: '<div>Home</div>',
          css: 'body { margin: 0; }',
          js: 'console.log("home");',
          mode: 'preview' as const,
          overrides: [],
          w: 800,
          h: 600,
        },
      };

      (mockEditor.getShape as any) = jest.fn(() => homeShape);

      const result = collectPages(pageLinkHandler, mockEditor as Editor);

      // Should return array with structured data
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('html');
      expect(result[0]).toHaveProperty('css');
      expect(result[0]).toHaveProperty('js');
    });
  });
});
