/**
 * End-to-end integration tests for merge preview navigation
 * Feature: merge-preview-navigation
 * Task: 4.1 - Integration tests for complete navigation flow
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4
 * 
 * These integration tests verify the complete navigation flow from prompt generation
 * through HTML generation to routing script injection and page name resolution.
 */

import {
  buildPerPagePrompt,
  buildNavigationRules,
  buildNavigationSection,
} from '../../utils/batch/buildPerPagePrompt';
import { buildMergePageHtml } from '../../utils/batch/mergePreviewRouter';
import { normalizePageName, resolvePageName, DEFAULT_ROLE_ALIASES } from '../../utils/batch/pageNameResolver';
import type { PageSpec, AppContext } from '../../types';
import type { CollectedPage } from '../../utils/batch/collectPages';

describe('Merge Preview Navigation - End-to-End Integration (Task 4.1)', () => {
  // Test fixtures representing a typical multi-page application
  const mockPages: PageSpec[] = [
    { name: 'home', role: '首页', linksTo: ['products', 'about'], order: 0 },
    { name: 'products', role: '产品列表', linksTo: ['home', 'product-detail'], order: 1 },
    { name: 'product-detail', role: '产品详情', linksTo: ['products', 'cart'], order: 2 },
    { name: 'cart', role: '购物车', linksTo: ['home', 'checkout'], order: 3 },
    { name: 'checkout', role: '结账', linksTo: ['cart'], order: 4 },
    { name: 'about', role: '关于我们', linksTo: ['home'], order: 5 },
  ];

  const mockAppContext: AppContext = {
    appName: '电商网站',
    appType: 'ecommerce',
    pages: mockPages,
    originalPrompt: '创建一个电商网站，包含首页、产品列表、产品详情、购物车、结账和关于页面',
  };

  describe('Scenario 1: AI generates HTML with correct data-page-target attributes (Req 1.1, 1.2, 1.3)', () => {
    it('should generate prompt with comprehensive navigation instructions', () => {
      const homePage = mockPages[0];
      const prompt = buildPerPagePrompt(homePage, mockAppContext);

      // Verify prompt contains all required navigation guidance
      expect(prompt).toContain('## Navigation Rules (MANDATORY)');
      expect(prompt).toContain('data-page-target');
      expect(prompt).toContain('CRITICAL');
      
      // Verify element types checklist is present
      expect(prompt).toContain('Navigation bar links');
      expect(prompt).toContain('Call-to-action (CTA) buttons');
      expect(prompt).toContain('Product cards');
      expect(prompt).toContain('List item links');
      expect(prompt).toContain('Breadcrumb navigation');
      expect(prompt).toContain('Footer links');
      
      // Verify examples for linksTo targets
      expect(prompt).toContain('For page "products"');
      expect(prompt).toContain('For page "about"');
      expect(prompt).toContain('data-page-target="products"');
      expect(prompt).toContain('data-page-target="about"');
      
      // Verify anti-pattern examples
      expect(prompt).toContain('❌ WRONG vs. ✅ CORRECT');
      expect(prompt).toContain('href="products.html"');
      expect(prompt).toContain('href="#" data-page-target="products"');
    });

    it('should generate HTML with routing script that handles data-page-target clicks (Req 2.1, 2.2)', () => {
      // Simulate AI-generated HTML with correct data-page-target attributes
      const collectedPage: CollectedPage = {
        name: 'home',
        html: `
          <div class="container">
            <nav>
              <a href="#" data-page-target="home">首页</a>
              <a href="#" data-page-target="products">产品列表</a>
              <a href="#" data-page-target="about">关于我们</a>
            </nav>
            <section class="hero">
              <h1>欢迎来到我们的电商网站</h1>
              <button data-page-target="products" class="cta-button">浏览产品</button>
            </section>
            <div class="product-cards">
              <div class="card" data-page-target="product-detail">
                <h3>热门产品</h3>
                <p>点击查看详情</p>
              </div>
            </div>
          </div>
        `,
        css: 'body { margin: 0; }',
        js: '',
      };

      const allPageNames = mockPages.map(p => p.name);
      const fullHtml = buildMergePageHtml(collectedPage, allPageNames);

      // Verify complete HTML structure
      expect(fullHtml).toContain('<!DOCTYPE html>');
      expect(fullHtml).toContain('<html lang="en">');
      expect(fullHtml).toContain('</html>');
      
      // Verify routing script is injected
      expect(fullHtml).toContain('function initMergeRouting()');
      expect(fullHtml).toContain('document.addEventListener(\'click\'');
      
      // Verify event delegation pattern (Req 2.2)
      expect(fullHtml).toContain('e.target.closest(\'[data-page-target]\')');
      
      // Verify postMessage navigation
      expect(fullHtml).toContain('window.parent.postMessage');
      expect(fullHtml).toContain('type: \'merge-navigate\'');
      
      // Verify valid pages are serialized
      expect(fullHtml).toContain('"home"');
      expect(fullHtml).toContain('"products"');
      expect(fullHtml).toContain('"cart"');
    });

    it('should handle nested elements with event bubbling (Req 2.3)', () => {
      // Simulate HTML with nested clickable elements
      const collectedPage: CollectedPage = {
        name: 'products',
        html: `
          <div class="product-grid">
            <div class="product-card" data-page-target="product-detail">
              <img src="product.jpg" alt="Product">
              <h3>Product Name</h3>
              <p>Product description with <strong>nested elements</strong></p>
              <button class="view-details">View Details</button>
            </div>
          </div>
        `,
        css: '',
        js: '',
      };

      const allPageNames = mockPages.map(p => p.name);
      const fullHtml = buildMergePageHtml(collectedPage, allPageNames);

      // Verify routing script uses closest() for ancestor lookup
      expect(fullHtml).toContain('e.target.closest(\'[data-page-target]\')');
      
      // Verify the script handles clicks on nested elements
      // The routing script should find the parent element with data-page-target
      expect(fullHtml).toContain('const target = e.target.closest(\'[data-page-target]\')');
      expect(fullHtml).toContain('if (target)');
      expect(fullHtml).toContain('const targetPage = target.getAttribute(\'data-page-target\')');
    });
  });

  describe('Scenario 2: AI generates HTML missing data-page-target but with parseable href (Req 2.4)', () => {
    it('should include fallback href parsing logic in routing script', () => {
      // Simulate AI-generated HTML with href but missing data-page-target
      const collectedPage: CollectedPage = {
        name: 'home',
        html: `
          <nav>
            <a href="products.html">产品列表</a>
            <a href="/cart">购物车</a>
            <a href="./about.html">关于我们</a>
          </nav>
        `,
        css: '',
        js: '',
      };

      const allPageNames = mockPages.map(p => p.name);
      const fullHtml = buildMergePageHtml(collectedPage, allPageNames);

      // Verify routing script includes fallback logic
      expect(fullHtml).toContain('const link = e.target.closest(\'a[href]\')');
      expect(fullHtml).toContain('function normalizePageName(raw)');
      expect(fullHtml).toContain('function resolvePageName(raw)');
      
      // Verify the script checks for links without data-page-target
      expect(fullHtml).toContain('!link.hasAttribute(\'data-page-target\')');
      
      // Verify href resolution logic
      expect(fullHtml).toContain('const href = link.getAttribute(\'href\')');
      expect(fullHtml).toContain('const pageName = resolvePageName(href)');
      
      // Verify navigation only happens for valid resolved pages
      expect(fullHtml).toContain('if (pageName && validPages.has(pageName))');
    });

    it('should inline pageNameResolver logic for iframe context', () => {
      const collectedPage: CollectedPage = {
        name: 'home',
        html: '<div>Test</div>',
        css: '',
        js: '',
      };

      const allPageNames = mockPages.map(p => p.name);
      const fullHtml = buildMergePageHtml(collectedPage, allPageNames);

      // Verify normalizePageName is inlined
      expect(fullHtml).toContain('function normalizePageName(raw)');
      expect(fullHtml).toContain('normalized.split(\'?\')[0].split(\'#\')[0]');
      // Check for file extension removal logic
      expect(fullHtml).toContain('// Remove file extensions');
      expect(fullHtml).toContain('normalized.toLowerCase()');
      
      // Verify resolvePageName is inlined
      expect(fullHtml).toContain('function resolvePageName(raw)');
      expect(fullHtml).toContain('var normalized = normalizePageName(raw)');
      
      // Verify Chinese alias mapping is inlined
      expect(fullHtml).toContain('const DEFAULT_ROLE_ALIASES');
      expect(fullHtml).toContain('\'首页\': \'home\'');
      expect(fullHtml).toContain('\'产品列表\': \'products\'');
      expect(fullHtml).toContain('\'购物车\': \'cart\'');
    });
  });

  describe('Scenario 3: Page name resolution with various formats (Req 3.1, 3.2, 3.3)', () => {
    const validPageNames = mockPages.map(p => p.name);

    it('should resolve page names with file extensions', () => {
      expect(resolvePageName('products.html', validPageNames)).toBe('products');
      expect(resolvePageName('cart.htm', validPageNames)).toBe('cart');
      expect(resolvePageName('about.php', validPageNames)).toBe('about');
    });

    it('should resolve page names with path prefixes', () => {
      expect(resolvePageName('/products', validPageNames)).toBe('products');
      expect(resolvePageName('./cart', validPageNames)).toBe('cart');
      expect(resolvePageName('../about', validPageNames)).toBe('about');
    });

    it('should resolve page names with query parameters and anchors', () => {
      expect(resolvePageName('products?id=123', validPageNames)).toBe('products');
      expect(resolvePageName('cart#checkout', validPageNames)).toBe('cart');
      expect(resolvePageName('about.html?section=team#contact', validPageNames)).toBe('about');
    });

    it('should resolve camelCase and PascalCase page names', () => {
      expect(resolvePageName('productDetail', validPageNames)).toBe('product-detail');
      expect(resolvePageName('ProductDetail', validPageNames)).toBe('product-detail');
    });

    it('should resolve Chinese role names using alias mapping', () => {
      expect(resolvePageName('首页', validPageNames)).toBe('home');
      expect(resolvePageName('产品列表', validPageNames)).toBe('products');
      expect(resolvePageName('购物车', validPageNames)).toBe('cart');
      expect(resolvePageName('产品详情', validPageNames)).toBe('product-detail');
    });

    it('should handle case-insensitive matching', () => {
      expect(resolvePageName('PRODUCTS', validPageNames)).toBe('products');
      expect(resolvePageName('Cart', validPageNames)).toBe('cart');
      expect(resolvePageName('HOME', validPageNames)).toBe('home');
    });

    it('should handle partial matches', () => {
      expect(resolvePageName('product', validPageNames)).toBe('products');
      expect(resolvePageName('check', validPageNames)).toBe('checkout');
    });

    it('should return null for invalid page names', () => {
      expect(resolvePageName('nonexistent', validPageNames)).toBeNull();
      expect(resolvePageName('invalid-page', validPageNames)).toBeNull();
      expect(resolvePageName('', validPageNames)).toBeNull();
    });
  });

  describe('Scenario 4: Complete navigation flow integration', () => {
    it('should generate consistent navigation across all pages', () => {
      // Generate prompts for all pages
      const prompts = mockPages.map(page => buildPerPagePrompt(page, mockAppContext));

      // Verify all prompts contain navigation rules
      prompts.forEach((prompt, index) => {
        expect(prompt).toContain('## Navigation Rules (MANDATORY)');
        expect(prompt).toContain('data-page-target');
        expect(prompt).toContain('CRITICAL');
        
        // Verify page-specific linksTo targets
        const page = mockPages[index];
        page.linksTo.forEach(target => {
          expect(prompt).toContain(`data-page-target="${target}"`);
        });
      });
    });

    it('should generate navigation structure with all pages', () => {
      const navHTML = buildNavigationSection(mockPages);

      // Verify all pages are included in navigation
      mockPages.forEach(page => {
        expect(navHTML).toContain(`data-page-target="${page.name}"`);
        expect(navHTML).toContain(page.role);
      });

      // Verify all links use href="#"
      const hrefMatches = navHTML.match(/href="[^"]*"/g);
      expect(hrefMatches).toBeTruthy();
      hrefMatches?.forEach(href => {
        expect(href).toBe('href="#"');
      });
    });

    it('should build complete HTML with routing for all pages', () => {
      const allPageNames = mockPages.map(p => p.name);
      
      // Simulate collected pages with various navigation patterns
      const collectedPages: CollectedPage[] = [
        {
          name: 'home',
          html: '<nav><a href="#" data-page-target="products">产品</a></nav>',
          css: 'body { margin: 0; }',
          js: '',
        },
        {
          name: 'products',
          html: '<div><a href="product-detail.html">详情</a></div>',
          css: '',
          js: '',
        },
        {
          name: 'cart',
          html: '<button data-page-target="checkout">结账</button>',
          css: '',
          js: '',
        },
      ];

      // Build HTML for each page
      const fullHtmlPages = collectedPages.map(page => 
        buildMergePageHtml(page, allPageNames)
      );

      // Verify all pages have routing script
      fullHtmlPages.forEach(html => {
        expect(html).toContain('function initMergeRouting()');
        expect(html).toContain('document.addEventListener(\'click\'');
        expect(html).toContain('window.parent.postMessage');
      });

      // Verify all pages have the same valid pages list
      fullHtmlPages.forEach(html => {
        allPageNames.forEach(pageName => {
          expect(html).toContain(`"${pageName}"`);
        });
      });
    });

    it('should mark invalid links with disabled styling', () => {
      const collectedPage: CollectedPage = {
        name: 'home',
        html: `
          <nav>
            <a href="#" data-page-target="products">Valid Link</a>
            <a href="#" data-page-target="nonexistent">Invalid Link</a>
          </nav>
        `,
        css: '',
        js: '',
      };

      const allPageNames = ['home', 'products', 'about'];
      const fullHtml = buildMergePageHtml(collectedPage, allPageNames);

      // Verify routing script includes invalid link marking logic
      expect(fullHtml).toContain('if (!validPages.has(targetPage))');
      expect(fullHtml).toContain('link.classList.add(\'merge-link-disabled\')');
      expect(fullHtml).toContain('link.style.opacity = \'0.5\'');
      expect(fullHtml).toContain('link.style.cursor = \'not-allowed\'');
      expect(fullHtml).toContain('link.style.pointerEvents = \'none\'');
    });
  });

  describe('Scenario 5: Navigation rules generation for different page configurations', () => {
    it('should generate rules for page with multiple linksTo targets', () => {
      const hubPage: PageSpec = {
        name: 'hub',
        role: '中心页',
        linksTo: ['home', 'products', 'cart', 'about'],
        order: 0,
      };

      const rules = buildNavigationRules(hubPage, mockPages);

      // Verify examples for all targets
      expect(rules).toContain('For page "home"');
      expect(rules).toContain('For page "products"');
      expect(rules).toContain('For page "cart"');
      expect(rules).toContain('For page "about"');

      // Verify each target has multiple element type examples
      hubPage.linksTo.forEach(target => {
        expect(rules).toContain(`data-page-target="${target}"`);
        // Should have both <a> and <button> examples
        expect(rules).toMatch(new RegExp(`<a\\s+href="#"\\s+data-page-target="${target}"`));
        expect(rules).toMatch(new RegExp(`<button\\s+data-page-target="${target}"`));
      });
    });

    it('should generate rules for page with no linksTo targets', () => {
      const standalonePage: PageSpec = {
        name: 'standalone',
        role: '独立页面',
        linksTo: [],
        order: 0,
      };

      const rules = buildNavigationRules(standalonePage, mockPages);

      // Should still contain core navigation rules
      expect(rules).toContain('## Navigation Rules (MANDATORY)');
      expect(rules).toContain('data-page-target');
      expect(rules).toContain('CRITICAL');
      expect(rules).toContain('Navigation bar links');

      // Should not have HTML examples section
      expect(rules).not.toContain('### HTML Examples for This Page\'s Link Targets');
    });

    it('should generate rules with proper element type examples', () => {
      const page = mockPages[0]; // home page
      const rules = buildNavigationRules(page, mockPages);

      // Verify all required element types are mentioned
      const elementTypes = [
        'Navigation bar links',
        'Call-to-action (CTA) buttons',
        'Product cards',
        'List item links',
        'Breadcrumb navigation',
        'Footer links',
      ];

      elementTypes.forEach(type => {
        expect(rules).toContain(type);
      });

      // Verify examples include different element types
      expect(rules).toMatch(/<a\s+href="#"\s+data-page-target="/);
      expect(rules).toMatch(/<button\s+data-page-target="/);
      expect(rules).toMatch(/<div\s+class="card"\s+data-page-target="/);
    });
  });

  describe('Scenario 6: Round-trip consistency for page name resolution', () => {
    it('should maintain consistency when normalizing and resolving valid page names', () => {
      const validPageNames = mockPages.map(p => p.name);

      // Test round-trip for each valid page name
      validPageNames.forEach(pageName => {
        const normalized = normalizePageName(pageName);
        const resolved = resolvePageName(normalized, validPageNames);
        
        // Resolved name should match original
        expect(resolved).toBe(pageName);
      });
    });

    it('should handle various input formats and resolve to correct page', () => {
      const validPageNames = mockPages.map(p => p.name);

      const testCases = [
        { input: 'products.html', expected: 'products' },
        { input: '/cart', expected: 'cart' },
        { input: './about.html', expected: 'about' },
        { input: 'ProductDetail', expected: 'product-detail' },
        { input: 'product-detail.html?id=123', expected: 'product-detail' },
        { input: 'CHECKOUT', expected: 'checkout' },
        { input: '首页', expected: 'home' },
        { input: '产品列表', expected: 'products' },
      ];

      testCases.forEach(({ input, expected }) => {
        const resolved = resolvePageName(input, validPageNames);
        expect(resolved).toBe(expected);
      });
    });
  });

  describe('Scenario 7: Routing script handles external and special links', () => {
    it('should include logic to skip external links', () => {
      const collectedPage: CollectedPage = {
        name: 'home',
        html: '<a href="https://example.com">External Link</a>',
        css: '',
        js: '',
      };

      const allPageNames = mockPages.map(p => p.name);
      const fullHtml = buildMergePageHtml(collectedPage, allPageNames);

      // Verify routing script includes shouldHandleLink function
      expect(fullHtml).toContain('function shouldHandleLink(link)');
      expect(fullHtml).toContain('if (link.hostname && link.hostname !== window.location.hostname)');
      expect(fullHtml).toContain('return false');
    });

    it('should include logic to skip mailto and tel links', () => {
      const collectedPage: CollectedPage = {
        name: 'contact',
        html: `
          <a href="mailto:info@example.com">Email</a>
          <a href="tel:+1234567890">Phone</a>
        `,
        css: '',
        js: '',
      };

      const allPageNames = mockPages.map(p => p.name);
      const fullHtml = buildMergePageHtml(collectedPage, allPageNames);

      // Verify routing script checks for special protocols
      expect(fullHtml).toContain('href.match(/^(mailto:|tel:|javascript:)/i)');
    });

    it('should include logic to skip links with target="_blank"', () => {
      const collectedPage: CollectedPage = {
        name: 'home',
        html: '<a href="products.html" target="_blank">Open in New Tab</a>',
        css: '',
        js: '',
      };

      const allPageNames = mockPages.map(p => p.name);
      const fullHtml = buildMergePageHtml(collectedPage, allPageNames);

      // Verify routing script checks for target attribute
      expect(fullHtml).toContain('if (link.target === \'_blank\' || link.target === \'_new\')');
    });
  });

  describe('Scenario 8: Chinese alias mapping integration', () => {
    it('should include all default Chinese aliases in routing script', () => {
      const collectedPage: CollectedPage = {
        name: 'home',
        html: '<div>Test</div>',
        css: '',
        js: '',
      };

      const allPageNames = mockPages.map(p => p.name);
      const fullHtml = buildMergePageHtml(collectedPage, allPageNames);

      // Verify all default aliases are included
      Object.entries(DEFAULT_ROLE_ALIASES).forEach(([chinese, english]) => {
        expect(fullHtml).toContain(`'${chinese}': '${english}'`);
      });
    });

    it('should resolve Chinese role names in page name resolver', () => {
      const validPageNames = mockPages.map(p => p.name);

      // Test common Chinese aliases
      expect(resolvePageName('首页', validPageNames)).toBe('home');
      expect(resolvePageName('主页', validPageNames)).toBe('home');
      expect(resolvePageName('产品', validPageNames)).toBe('products');
      expect(resolvePageName('购物车', validPageNames)).toBe('cart');
      expect(resolvePageName('结账', validPageNames)).toBe('checkout');
    });
  });
});
