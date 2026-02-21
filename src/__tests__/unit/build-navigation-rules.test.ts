/**
 * Unit tests for buildNavigationRules function
 * Feature: merge-preview-navigation
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { buildNavigationRules } from '../../utils/batch/buildPerPagePrompt';
import type { PageSpec } from '../../types';

describe('buildNavigationRules', () => {
  const mockPages: PageSpec[] = [
    { name: 'home', role: '首页', linksTo: ['products', 'about'], order: 0 },
    { name: 'products', role: '产品列表', linksTo: ['home', 'product-detail'], order: 1 },
    { name: 'product-detail', role: '产品详情', linksTo: ['products', 'cart'], order: 2 },
    { name: 'cart', role: '购物车', linksTo: ['products', 'checkout'], order: 3 },
    { name: 'checkout', role: '结账', linksTo: ['cart'], order: 4 },
    { name: 'about', role: '关于我们', linksTo: ['home'], order: 5 },
  ];

  describe('Basic Structure', () => {
    it('should include the mandatory navigation rules header', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('## Navigation Rules (MANDATORY)');
      expect(result).toContain('CRITICAL REQUIREMENT');
    });

    it('should include data-page-target keyword', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('data-page-target');
    });

    it('should include CRITICAL constraint declaration', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('🚨 CRITICAL CONSTRAINT');
      expect(result).toContain('Every clickable inter-page navigation element MUST include');
    });
  });

  describe('Element Types Checklist (Req 1.1)', () => {
    it('should list all required element types', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      const requiredTypes = [
        'Navigation bar links',
        'Call-to-action (CTA) buttons',
        'Product cards',
        'List item links',
        'Breadcrumb navigation',
        'Footer links',
      ];

      requiredTypes.forEach(type => {
        expect(result).toContain(type);
      });
    });

    it('should have an "Element Types Requiring data-page-target" section', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('Element Types Requiring data-page-target');
    });
  });

  describe('HTML Examples for linksTo Targets (Req 1.2)', () => {
    it('should generate examples for each linksTo target', () => {
      const page = mockPages[0]; // home page links to 'products' and 'about'
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('For page "products"');
      expect(result).toContain('For page "about"');
    });

    it('should provide at least two element types per target (link and button)', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      // Check for products target
      expect(result).toContain('data-page-target="products"');
      expect(result).toContain('<!-- Example 1: Link element -->');
      expect(result).toContain('<!-- Example 2: Button element -->');
      expect(result).toContain('<a href="#" data-page-target="products">');
      expect(result).toContain('<button data-page-target="products">');
    });

    it('should include card example as a third element type', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('<!-- Example 3: Card with nested content -->');
      expect(result).toContain('<div class="card" data-page-target=');
    });

    it('should not include examples section when linksTo is empty', () => {
      const pageWithNoLinks: PageSpec = {
        name: 'standalone',
        role: '独立页面',
        linksTo: [],
        order: 0,
      };
      const result = buildNavigationRules(pageWithNoLinks, [pageWithNoLinks]);
      
      expect(result).not.toContain('HTML Examples for This Page\'s Link Targets');
    });

    it('should use target page role as display name in examples', () => {
      const page = mockPages[0]; // links to 'products' (产品列表)
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('产品列表');
    });
  });

  describe('Anti-pattern Examples (Req 1.3, 1.5)', () => {
    it('should include wrong vs correct examples section', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('❌ WRONG vs. ✅ CORRECT Examples');
    });

    it('should show wrong usage with file paths', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('❌ WRONG: Using file path');
      expect(result).toContain('<a href="products.html">Products</a>');
    });

    it('should show wrong usage with relative paths', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('❌ WRONG: Using relative path');
      expect(result).toContain('<a href="/products">Products</a>');
    });

    it('should show correct usage with data-page-target and href="#"', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('✅ CORRECT: Link with data-page-target');
      expect(result).toContain('<a href="#" data-page-target="products">Products</a>');
    });

    it('should show correct usage with button elements', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('✅ CORRECT: Button with data-page-target');
      expect(result).toContain('<button data-page-target="products">Products</button>');
    });
  });

  describe('Usage Rules (Req 1.3, 1.4)', () => {
    it('should include usage rules section', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('### Usage Rules');
    });

    it('should specify mandatory attribute requirement', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('Mandatory Attribute');
      expect(result).toContain('data-page-target="page-name"');
    });

    it('should specify exact page names requirement', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('Exact Page Names');
    });

    it('should specify href="#" for link tags', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('href="#"');
      expect(result).toContain('do NOT use file paths');
    });

    it('should specify any element type can be used', () => {
      const page = mockPages[0];
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('Any Element Type');
      expect(result).toContain('any HTML element');
    });
  });

  describe('Edge Cases', () => {
    it('should handle page with single linksTo target', () => {
      const page = mockPages[5]; // about page links only to 'home'
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('For page "home"');
      expect(result).toContain('data-page-target="home"');
    });

    it('should handle page with multiple linksTo targets', () => {
      const page = mockPages[1]; // products page links to 'home' and 'product-detail'
      const result = buildNavigationRules(page, mockPages);
      
      expect(result).toContain('For page "home"');
      expect(result).toContain('For page "product-detail"');
    });

    it('should handle target page not found in pages array', () => {
      const pageWithInvalidTarget: PageSpec = {
        name: 'test',
        role: '测试页',
        linksTo: ['nonexistent'],
        order: 0,
      };
      const result = buildNavigationRules(pageWithInvalidTarget, mockPages);
      
      // Should use target name as fallback when page not found
      expect(result).toContain('For page "nonexistent"');
      expect(result).toContain('data-page-target="nonexistent"');
    });
  });
});
