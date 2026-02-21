/**
 * Integration tests for buildPerPagePrompt with navigation rules
 * Feature: merge-preview-navigation
 * Task: 2.2 - Integration of navigation rules into buildPerPagePrompt
 */

import { buildPerPagePrompt } from '../../utils/batch/buildPerPagePrompt';
import type { PageSpec, AppContext } from '../../types';

describe('buildPerPagePrompt - Navigation Rules Integration (Task 2.2)', () => {
  const mockPages: PageSpec[] = [
    { name: 'home', role: '首页', linksTo: ['products', 'about'], order: 0 },
    { name: 'products', role: '产品列表', linksTo: ['home', 'product-detail'], order: 1 },
    { name: 'product-detail', role: '产品详情', linksTo: ['products', 'cart'], order: 2 },
    { name: 'cart', role: '购物车', linksTo: ['products', 'checkout'], order: 3 },
    { name: 'checkout', role: '结账', linksTo: ['cart'], order: 4 },
    { name: 'about', role: '关于我们', linksTo: ['home'], order: 5 },
  ];

  const mockAppContext: AppContext = {
    appName: '电商网站',
    appType: 'ecommerce',
    pages: mockPages,
    originalPrompt: '生成一个电商网站',
  };

  describe('Navigation Rules Section Integration (Req 1.1, 1.3, 1.4)', () => {
    it('should include navigation rules section in the prompt', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      expect(prompt).toContain('## Navigation Rules (MANDATORY)');
      expect(prompt).toContain('data-page-target');
    });

    it('should place navigation rules between Navigation Structure and Page Link Targets', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      const navStructureIndex = prompt.indexOf('## Navigation Structure');
      const navRulesIndex = prompt.indexOf('## Navigation Rules (MANDATORY)');
      const linkTargetsIndex = prompt.indexOf('## Page Link Targets');
      
      expect(navStructureIndex).toBeGreaterThan(-1);
      expect(navRulesIndex).toBeGreaterThan(-1);
      expect(linkTargetsIndex).toBeGreaterThan(-1);
      
      // Navigation Rules should come after Navigation Structure
      expect(navRulesIndex).toBeGreaterThan(navStructureIndex);
      // Navigation Rules should come before Page Link Targets
      expect(navRulesIndex).toBeLessThan(linkTargetsIndex);
    });

    it('should include CRITICAL constraint in navigation rules', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      expect(prompt).toContain('CRITICAL REQUIREMENT');
      expect(prompt).toContain('MUST use the `data-page-target` attribute');
    });

    it('should include element types checklist in navigation rules', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      expect(prompt).toContain('Navigation bar links');
      expect(prompt).toContain('Call-to-action (CTA) buttons');
      expect(prompt).toContain('Product cards');
      expect(prompt).toContain('List item links');
      expect(prompt).toContain('Breadcrumb navigation');
      expect(prompt).toContain('Footer links');
    });

    it('should include HTML examples for linksTo targets', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      // Home page links to 'products' and 'about'
      expect(prompt).toContain('For page "products"');
      expect(prompt).toContain('For page "about"');
      expect(prompt).toContain('data-page-target="products"');
      expect(prompt).toContain('data-page-target="about"');
    });

    it('should include anti-pattern examples', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      expect(prompt).toContain('❌ WRONG vs. ✅ CORRECT Examples');
      expect(prompt).toContain('href="products.html"');
      expect(prompt).toContain('href="/products"');
      expect(prompt).toContain('href="#" data-page-target="products"');
    });
  });

  describe('Navigation Section href Attribute (Req 1.3)', () => {
    it('should generate navigation links with href="#"', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      // Check that navigation structure uses href="#"
      const navStructureMatch = prompt.match(/## Navigation Structure[\s\S]*?```html([\s\S]*?)```/);
      expect(navStructureMatch).toBeTruthy();
      
      if (navStructureMatch) {
        const navHTML = navStructureMatch[1];
        // All <a> tags should have href="#"
        const hrefMatches = navHTML.match(/href="[^"]*"/g);
        expect(hrefMatches).toBeTruthy();
        hrefMatches?.forEach(href => {
          expect(href).toBe('href="#"');
        });
      }
    });

    it('should include data-page-target in navigation links', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      const navStructureMatch = prompt.match(/## Navigation Structure[\s\S]*?```html([\s\S]*?)```/);
      expect(navStructureMatch).toBeTruthy();
      
      if (navStructureMatch) {
        const navHTML = navStructureMatch[1];
        // All pages should have data-page-target attributes
        mockPages.forEach(page => {
          expect(navHTML).toContain(`data-page-target="${page.name}"`);
        });
      }
    });
  });

  describe('Output Requirements Section (Req 1.4)', () => {
    it('should include CRITICAL constraint in output requirements', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      const outputMatch = prompt.match(/## Output Requirements[\s\S]*$/);
      expect(outputMatch).toBeTruthy();
      
      if (outputMatch) {
        const outputSection = outputMatch[0];
        expect(outputSection).toContain('CRITICAL');
        expect(outputSection).toContain('data-page-target');
        expect(outputSection).toContain('Navigation elements without this attribute will NOT work');
      }
    });

    it('should list navigation attribute requirement as item 8', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      expect(prompt).toContain('8. **CRITICAL**: Every clickable inter-page navigation element MUST include');
    });
  });

  describe('Complete Prompt Structure', () => {
    it('should include all required sections in correct order', () => {
      const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);
      
      const sections = [
        '# Page Generation Task',
        '## Application Context',
        '## Current Page',
        '## Shared Theme (CSS Variables)',
        '## Navigation Structure',
        '## Navigation Rules (MANDATORY)',
        '## Page Link Targets',
        '## Output Requirements',
      ];
      
      let lastIndex = -1;
      sections.forEach(section => {
        const index = prompt.indexOf(section);
        expect(index).toBeGreaterThan(lastIndex);
        lastIndex = index;
      });
    });

    it('should work correctly for pages without linksTo', () => {
      const pageWithoutLinks: PageSpec = {
        name: 'standalone',
        role: '独立页面',
        linksTo: [],
        order: 10,
      };
      
      const contextWithStandalone: AppContext = {
        ...mockAppContext,
        pages: [...mockPages, pageWithoutLinks],
      };
      
      const prompt = buildPerPagePrompt(pageWithoutLinks, contextWithStandalone);
      
      // Should still include navigation rules
      expect(prompt).toContain('## Navigation Rules (MANDATORY)');
      // But should not have HTML examples section for linksTo targets
      expect(prompt).not.toContain('### HTML Examples for This Page\'s Link Targets');
    });

    it('should work correctly with design system', () => {
      const contextWithDesignSystem: AppContext = {
        ...mockAppContext,
        designSystem: 'Tailwind CSS',
      };
      
      const prompt = buildPerPagePrompt(mockPages[0], contextWithDesignSystem);
      
      expect(prompt).toContain('## Design System');
      expect(prompt).toContain('Tailwind CSS');
      // Navigation rules should still be present
      expect(prompt).toContain('## Navigation Rules (MANDATORY)');
    });
  });

  describe('Edge Cases', () => {
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
      
      expect(prompt).toContain('## Navigation Rules (MANDATORY)');
      expect(prompt).toContain('data-page-target');
    });

    it('should handle page with many linksTo targets', () => {
      const hubPage: PageSpec = {
        name: 'hub',
        role: '中心页',
        linksTo: mockPages.map(p => p.name),
        order: 0,
      };
      
      const prompt = buildPerPagePrompt(hubPage, mockAppContext);
      
      // Should include examples for all targets
      mockPages.forEach(page => {
        expect(prompt).toContain(`For page "${page.name}"`);
      });
    });
  });
});
