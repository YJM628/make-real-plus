/**
 * Unit tests for buildPerPagePrompt and helper functions
 * Feature: merge-preview-navigation
 * Task: 2.3 - Unit tests for prompt generation correctness
 * 
 * These unit tests focus on individual functions and specific validation rules.
 * For comprehensive integration tests, see build-per-page-prompt-integration.test.ts
 */

import {
  buildPerPagePrompt,
  buildThemeSection,
  buildNavigationSection,
  buildNavigationRules,
} from '../../utils/batch/buildPerPagePrompt';
import type { PageSpec, AppContext } from '../../types';

describe('buildPerPagePrompt - Unit Tests (Task 2.3)', () => {
  // Test fixtures
  const mockPages: PageSpec[] = [
    { name: 'home', role: '首页', linksTo: ['products', 'about'], order: 0 },
    { name: 'products', role: '产品列表', linksTo: ['home'], order: 1 },
    { name: 'about', role: '关于我们', linksTo: ['home'], order: 2 },
  ];

  const mockAppContext: AppContext = {
    appName: '测试应用',
    appType: 'ecommerce',
    pages: mockPages,
    originalPrompt: '生成测试应用',
  };

  describe('buildNavigationRules - Navigation Rules Generation (Req 1.1, 1.2, 1.3, 1.4, 1.5)', () => {
    it('should contain "导航规则" or "Navigation Rules" heading', () => {
      const rules = buildNavigationRules(mockPages[0], mockPages);
      
      expect(rules).toContain('## Navigation Rules');
    });

    it('should contain data-page-target keyword', () => {
      const rules = buildNavigationRules(mockPages[0], mockPages);
      
      expect(rules).toContain('data-page-target');
    });

    it('should contain element types checklist', () => {
      const rules = buildNavigationRules(mockPages[0], mockPages);
      
      // Verify all required element types are listed
      expect(rules).toContain('Navigation bar links');
      expect(rules).toContain('Call-to-action (CTA) buttons');
      expect(rules).toContain('Product cards');
      expect(rules).toContain('List item links');
      expect(rules).toContain('Breadcrumb navigation');
      expect(rules).toContain('Footer links');
    });

    it('should contain CRITICAL constraint declaration', () => {
      const rules = buildNavigationRules(mockPages[0], mockPages);
      
      expect(rules).toContain('CRITICAL');
      expect(rules).toMatch(/CRITICAL.*data-page-target/i);
    });

    it('should generate HTML examples for each linksTo target', () => {
      const page = mockPages[0]; // home page links to 'products' and 'about'
      const rules = buildNavigationRules(page, mockPages);
      
      // Should have examples for 'products'
      expect(rules).toContain('For page "products"');
      expect(rules).toContain('data-page-target="products"');
      
      // Should have examples for 'about'
      expect(rules).toContain('For page "about"');
      expect(rules).toContain('data-page-target="about"');
    });

    it('should provide at least two element types in examples (link and button)', () => {
      const page = mockPages[0];
      const rules = buildNavigationRules(page, mockPages);
      
      // Check for <a> tag example
      expect(rules).toMatch(/<a\s+href="#"\s+data-page-target="products"/);
      
      // Check for <button> tag example
      expect(rules).toMatch(/<button\s+data-page-target="products"/);
    });

    it('should include anti-pattern examples section', () => {
      const rules = buildNavigationRules(mockPages[0], mockPages);
      
      expect(rules).toContain('❌ WRONG vs. ✅ CORRECT');
    });

    it('should show wrong usage with file paths in anti-patterns', () => {
      const rules = buildNavigationRules(mockPages[0], mockPages);
      
      // Should show wrong examples with .html extension
      expect(rules).toContain('href="products.html"');
      // Should show wrong examples with relative paths
      expect(rules).toContain('href="/products"');
    });

    it('should show correct usage with href="#" and data-page-target', () => {
      const rules = buildNavigationRules(mockPages[0], mockPages);
      
      expect(rules).toMatch(/href="#"\s+data-page-target="products"/);
    });

    it('should handle pages with no linksTo targets', () => {
      const pageWithoutLinks: PageSpec = {
        name: 'standalone',
        role: '独立页面',
        linksTo: [],
        order: 10,
      };
      
      const rules = buildNavigationRules(pageWithoutLinks, mockPages);
      
      // Should still contain navigation rules
      expect(rules).toContain('## Navigation Rules');
      expect(rules).toContain('data-page-target');
      
      // Should not have HTML examples section
      expect(rules).not.toContain('### HTML Examples for This Page\'s Link Targets');
    });

    it('should handle pages with many linksTo targets', () => {
      const hubPage: PageSpec = {
        name: 'hub',
        role: '中心页',
        linksTo: ['home', 'products', 'about'],
        order: 0,
      };
      
      const rules = buildNavigationRules(hubPage, mockPages);
      
      // Should have examples for all targets
      expect(rules).toContain('For page "home"');
      expect(rules).toContain('For page "products"');
      expect(rules).toContain('For page "about"');
    });
  });

  describe('buildNavigationSection - Navigation Structure (Req 1.3)', () => {
    it('should generate navigation links with href="#"', () => {
      const navHTML = buildNavigationSection(mockPages);
      
      // All <a> tags should have href="#"
      const hrefMatches = navHTML.match(/href="[^"]*"/g);
      expect(hrefMatches).toBeTruthy();
      
      hrefMatches?.forEach(href => {
        expect(href).toBe('href="#"');
      });
    });

    it('should include data-page-target for all pages', () => {
      const navHTML = buildNavigationSection(mockPages);
      
      mockPages.forEach(page => {
        expect(navHTML).toContain(`data-page-target="${page.name}"`);
      });
    });

    it('should use page role as link text', () => {
      const navHTML = buildNavigationSection(mockPages);
      
      mockPages.forEach(page => {
        expect(navHTML).toContain(`>${page.role}</a>`);
      });
    });

    it('should wrap links in <nav> element', () => {
      const navHTML = buildNavigationSection(mockPages);
      
      expect(navHTML).toMatch(/^<nav>/);
      expect(navHTML).toMatch(/<\/nav>$/);
    });
  });

  describe('buildPerPagePrompt - Complete Prompt Structure', () => {
    it('should include navigation rules section in the prompt', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      expect(prompt).toContain('## Navigation Rules (MANDATORY)');
    });

    it('should include data-page-target keyword in the prompt', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      expect(prompt).toContain('data-page-target');
    });

    it('should include element types checklist in the prompt', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      expect(prompt).toContain('Navigation bar links');
      expect(prompt).toContain('Call-to-action (CTA) buttons');
      expect(prompt).toContain('Product cards');
    });

    it('should include CRITICAL constraint in the prompt', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      expect(prompt).toContain('CRITICAL');
      expect(prompt).toMatch(/CRITICAL.*data-page-target/i);
    });

    it('should include linksTo target examples in the prompt', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      // Home page links to 'products' and 'about'
      expect(prompt).toContain('For page "products"');
      expect(prompt).toContain('For page "about"');
      expect(prompt).toContain('data-page-target="products"');
      expect(prompt).toContain('data-page-target="about"');
    });

    it('should include anti-pattern examples in the prompt', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      expect(prompt).toContain('❌ WRONG vs. ✅ CORRECT');
      expect(prompt).toContain('href="products.html"');
      expect(prompt).toContain('href="#" data-page-target="products"');
    });

    it('should have Navigation Structure with href="#"', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      // Extract navigation structure section
      const navMatch = prompt.match(/## Navigation Structure[\s\S]*?```html([\s\S]*?)```/);
      expect(navMatch).toBeTruthy();
      
      if (navMatch) {
        const navHTML = navMatch[1];
        // All href attributes should be "#"
        const hrefMatches = navHTML.match(/href="[^"]*"/g);
        expect(hrefMatches).toBeTruthy();
        hrefMatches?.forEach(href => {
          expect(href).toBe('href="#"');
        });
      }
    });

    it('should include CRITICAL constraint in Output Requirements', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      // Extract output requirements section
      const outputMatch = prompt.match(/## Output Requirements[\s\S]*$/);
      expect(outputMatch).toBeTruthy();
      
      if (outputMatch) {
        const outputSection = outputMatch[0];
        expect(outputSection).toContain('CRITICAL');
        expect(outputSection).toContain('data-page-target');
      }
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle empty linksTo array', () => {
      const pageWithoutLinks: PageSpec = {
        name: 'standalone',
        role: '独立页面',
        linksTo: [],
        order: 0,
      };
      
      const context: AppContext = {
        ...mockAppContext,
        pages: [pageWithoutLinks],
      };
      
      const prompt = buildPerPagePrompt(pageWithoutLinks, context);
      
      // Should still include navigation rules
      expect(prompt).toContain('## Navigation Rules');
      expect(prompt).toContain('data-page-target');
    });

    it('should handle single page application', () => {
      const singlePage: PageSpec = {
        name: 'home',
        role: '首页',
        linksTo: [],
        order: 0,
      };
      
      const singlePageContext: AppContext = {
        appName: '单页应用',
        appType: 'portfolio',
        pages: [singlePage],
        originalPrompt: '生成单页应用',
      };
      
      const prompt = buildPerPagePrompt(singlePage, singlePageContext);
      
      expect(prompt).toContain('## Navigation Rules');
      expect(prompt).toContain('data-page-target');
    });

    it('should handle pages with special characters in names', () => {
      const specialPage: PageSpec = {
        name: 'product-detail',
        role: '产品详情',
        linksTo: ['home'],
        order: 0,
      };
      
      const rules = buildNavigationRules(specialPage, [specialPage, mockPages[0]]);
      
      expect(rules).toContain('data-page-target="home"');
    });

    it('should maintain correct section order', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      const navStructureIndex = prompt.indexOf('## Navigation Structure');
      const navRulesIndex = prompt.indexOf('## Navigation Rules');
      const linkTargetsIndex = prompt.indexOf('## Page Link Targets');
      
      // Navigation Rules should come after Navigation Structure
      expect(navRulesIndex).toBeGreaterThan(navStructureIndex);
      
      // If Page Link Targets exists, Navigation Rules should come before it
      if (linkTargetsIndex > -1) {
        expect(navRulesIndex).toBeLessThan(linkTargetsIndex);
      }
    });
  });

  describe('buildThemeSection - Theme CSS Variables', () => {
    it('should generate CSS variables for known app types', () => {
      const css = buildThemeSection('ecommerce');
      
      expect(css).toContain(':root {');
      expect(css).toContain('--primary-color:');
      expect(css).toContain('--secondary-color:');
      expect(css).toContain('}');
    });

    it('should use default scheme for unknown app types', () => {
      const css = buildThemeSection('unknown-type');
      
      expect(css).toContain(':root {');
      expect(css).toContain('--primary-color:');
    });
  });
});
