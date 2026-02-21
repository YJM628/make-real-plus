/**
 * Unit tests for buildCohesivePrompt
 * Feature: batch-html-redesign
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { buildCohesivePrompt } from '../../utils/batch/buildCohesivePrompt';
import type { AppContext } from '../../types';

describe('buildCohesivePrompt', () => {
  describe('Basic prompt structure', () => {
    it('should include application name and type', () => {
      const context: AppContext = {
        appName: 'Test Website',
        appType: 'ecommerce',
        pages: [
          { name: 'home', role: 'Home Page', linksTo: ['products'], order: 0 },
          { name: 'products', role: 'Products Page', linksTo: ['home'], order: 1 },
        ],
        originalPrompt: 'Create an ecommerce website',
      };

      const prompt = buildCohesivePrompt(context);

      expect(prompt).toContain('Test Website');
      expect(prompt).toContain('ecommerce');
    });

    it('should include original user prompt', () => {
      const context: AppContext = {
        appName: 'Blog Site',
        appType: 'blog',
        pages: [
          { name: 'home', role: 'Home', linksTo: [], order: 0 },
          { name: 'blog', role: 'Blog List', linksTo: [], order: 1 },
        ],
        originalPrompt: 'Generate a blog website with home and blog pages',
      };

      const prompt = buildCohesivePrompt(context);

      expect(prompt).toContain('Generate a blog website with home and blog pages');
    });

    it('should include all page names and roles', () => {
      const context: AppContext = {
        appName: 'Portfolio',
        appType: 'portfolio',
        pages: [
          { name: 'home', role: '首页', linksTo: ['portfolio', 'about'], order: 0 },
          { name: 'portfolio', role: '作品集', linksTo: ['home'], order: 1 },
          { name: 'about', role: '关于', linksTo: ['home'], order: 2 },
        ],
        originalPrompt: 'Create portfolio site',
      };

      const prompt = buildCohesivePrompt(context);

      expect(prompt).toContain('home');
      expect(prompt).toContain('首页');
      expect(prompt).toContain('portfolio');
      expect(prompt).toContain('作品集');
      expect(prompt).toContain('about');
      expect(prompt).toContain('关于');
    });
  });

  describe('Shared theme requirements (Requirement 6.2)', () => {
    it('should require unified shared theme with CSS variables', () => {
      const context: AppContext = {
        appName: 'Test App',
        appType: 'website',
        pages: [
          { name: 'page1', role: 'Page 1', linksTo: [], order: 0 },
          { name: 'page2', role: 'Page 2', linksTo: [], order: 1 },
        ],
        originalPrompt: 'test',
      };

      const prompt = buildCohesivePrompt(context);

      expect(prompt).toContain('Shared Theme');
      expect(prompt).toContain('CSS custom properties');
      expect(prompt).toContain('--primary-color');
      expect(prompt).toContain('--secondary-color');
      expect(prompt).toContain('--background-color');
      expect(prompt).toContain('--text-color');
      expect(prompt).toContain('--font-family');
      expect(prompt).toContain('--spacing-unit');
    });

    it('should require shared navigation components', () => {
      const context: AppContext = {
        appName: 'Test App',
        appType: 'website',
        pages: [
          { name: 'page1', role: 'Page 1', linksTo: [], order: 0 },
          { name: 'page2', role: 'Page 2', linksTo: [], order: 1 },
        ],
        originalPrompt: 'test',
      };

      const prompt = buildCohesivePrompt(context);

      expect(prompt).toContain('Shared Navigation');
      expect(prompt).toContain('Header');
      expect(prompt).toContain('Footer');
      expect(prompt).toContain('navigation bar');
    });
  });

  describe('Inter-page links (Requirement 6.3)', () => {
    it('should specify link targets for each page', () => {
      const context: AppContext = {
        appName: 'Shop',
        appType: 'ecommerce',
        pages: [
          { name: 'home', role: 'Home', linksTo: ['products', 'cart'], order: 0 },
          { name: 'products', role: 'Products', linksTo: ['home', 'cart'], order: 1 },
          { name: 'cart', role: 'Cart', linksTo: ['home', 'checkout'], order: 2 },
        ],
        originalPrompt: 'Create shop',
      };

      const prompt = buildCohesivePrompt(context);

      // Check that link targets are mentioned
      expect(prompt).toContain('products, cart');
      expect(prompt).toContain('home, cart');
      expect(prompt).toContain('home, checkout');
    });

    it('should require data-page-target attribute for links', () => {
      const context: AppContext = {
        appName: 'Test',
        appType: 'website',
        pages: [
          { name: 'page1', role: 'Page 1', linksTo: ['page2'], order: 0 },
          { name: 'page2', role: 'Page 2', linksTo: ['page1'], order: 1 },
        ],
        originalPrompt: 'test',
      };

      const prompt = buildCohesivePrompt(context);

      expect(prompt).toContain('data-page-target');
      expect(prompt).toContain('data-page-target="page-name"');
    });

    it('should handle pages with no link targets', () => {
      const context: AppContext = {
        appName: 'Test',
        appType: 'website',
        pages: [
          { name: 'page1', role: 'Page 1', linksTo: [], order: 0 },
          { name: 'page2', role: 'Page 2', linksTo: [], order: 1 },
        ],
        originalPrompt: 'test',
      };

      const prompt = buildCohesivePrompt(context);

      // Should still generate valid prompt
      expect(prompt).toContain('page1');
      expect(prompt).toContain('page2');
      expect(prompt).toContain('Inter-Page Links');
    });
  });

  describe('Output format specification (Requirement 6.4)', () => {
    it('should require structured JSON format', () => {
      const context: AppContext = {
        appName: 'Test',
        appType: 'website',
        pages: [
          { name: 'page1', role: 'Page 1', linksTo: [], order: 0 },
          { name: 'page2', role: 'Page 2', linksTo: [], order: 1 },
        ],
        originalPrompt: 'test',
      };

      const prompt = buildCohesivePrompt(context);

      expect(prompt).toContain('JSON');
      expect(prompt).toContain('sharedTheme');
      expect(prompt).toContain('sharedNavigation');
      expect(prompt).toContain('pages');
      expect(prompt).toContain('"name"');
      expect(prompt).toContain('"html"');
      expect(prompt).toContain('"css"');
      expect(prompt).toContain('"js"');
    });

    it('should include example JSON structure', () => {
      const context: AppContext = {
        appName: 'Test App',
        appType: 'website',
        pages: [
          { name: 'page1', role: 'Page 1', linksTo: [], order: 0 },
          { name: 'page2', role: 'Page 2', linksTo: [], order: 1 },
        ],
        originalPrompt: 'test',
      };

      const prompt = buildCohesivePrompt(context);

      expect(prompt).toContain('```json');
      expect(prompt).toContain('"appName": "Test App"');
      expect(prompt).toContain('"header"');
      expect(prompt).toContain('"footer"');
    });
  });

  describe('Design system integration (Requirement 6.5)', () => {
    it('should include design system when specified', () => {
      const context: AppContext = {
        appName: 'Test',
        appType: 'website',
        pages: [
          { name: 'page1', role: 'Page 1', linksTo: [], order: 0 },
          { name: 'page2', role: 'Page 2', linksTo: [], order: 1 },
        ],
        originalPrompt: 'test',
        designSystem: 'tailwind',
      };

      const prompt = buildCohesivePrompt(context);

      expect(prompt).toContain('Design System');
      expect(prompt).toContain('tailwind');
      expect(prompt).toContain('component patterns');
      expect(prompt).toContain('utility classes');
    });

    it('should not include design system section when not specified', () => {
      const context: AppContext = {
        appName: 'Test',
        appType: 'website',
        pages: [
          { name: 'page1', role: 'Page 1', linksTo: [], order: 0 },
          { name: 'page2', role: 'Page 2', linksTo: [], order: 1 },
        ],
        originalPrompt: 'test',
      };

      const prompt = buildCohesivePrompt(context);

      expect(prompt).not.toContain('Design System');
    });

    it('should work with different design systems', () => {
      const designSystems = ['tailwind', 'material-ui', 'bootstrap', 'ant-design'];

      designSystems.forEach(ds => {
        const context: AppContext = {
          appName: 'Test',
          appType: 'website',
          pages: [
            { name: 'page1', role: 'Page 1', linksTo: [], order: 0 },
            { name: 'page2', role: 'Page 2', linksTo: [], order: 1 },
          ],
          originalPrompt: 'test',
          designSystem: ds,
        };

        const prompt = buildCohesivePrompt(context);

        expect(prompt).toContain(ds);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle single page (minimum 2 pages for batch)', () => {
      const context: AppContext = {
        appName: 'Single Page',
        appType: 'website',
        pages: [
          { name: 'home', role: 'Home', linksTo: [], order: 0 },
        ],
        originalPrompt: 'test',
      };

      const prompt = buildCohesivePrompt(context);

      // Should still generate valid prompt
      expect(prompt).toContain('home');
      expect(prompt).toContain('Home');
    });

    it('should handle many pages', () => {
      const pages = Array.from({ length: 10 }, (_, i) => ({
        name: `page${i + 1}`,
        role: `Page ${i + 1}`,
        linksTo: [] as string[],
        order: i,
      }));

      const context: AppContext = {
        appName: 'Large Site',
        appType: 'website',
        pages,
        originalPrompt: 'test',
      };

      const prompt = buildCohesivePrompt(context);

      // Should include all pages
      pages.forEach(page => {
        expect(prompt).toContain(page.name);
      });
    });

    it('should handle Chinese characters in page roles', () => {
      const context: AppContext = {
        appName: '电商网站',
        appType: 'ecommerce',
        pages: [
          { name: 'home', role: '首页', linksTo: ['products'], order: 0 },
          { name: 'products', role: '产品列表', linksTo: ['home'], order: 1 },
          { name: 'cart', role: '购物车', linksTo: ['home'], order: 2 },
        ],
        originalPrompt: '生成电商网站',
      };

      const prompt = buildCohesivePrompt(context);

      expect(prompt).toContain('首页');
      expect(prompt).toContain('产品列表');
      expect(prompt).toContain('购物车');
    });

    it('should handle special characters in app name', () => {
      const context: AppContext = {
        appName: "John's E-Commerce & More!",
        appType: 'ecommerce',
        pages: [
          { name: 'home', role: 'Home', linksTo: [], order: 0 },
          { name: 'shop', role: 'Shop', linksTo: [], order: 1 },
        ],
        originalPrompt: 'test',
      };

      const prompt = buildCohesivePrompt(context);

      expect(prompt).toContain("John's E-Commerce & More!");
    });
  });

  describe('Prompt completeness (Requirement 6.1)', () => {
    it('should include all required sections', () => {
      const context: AppContext = {
        appName: 'Complete Test',
        appType: 'ecommerce',
        pages: [
          { name: 'home', role: 'Home', linksTo: ['products'], order: 0 },
          { name: 'products', role: 'Products', linksTo: ['home'], order: 1 },
        ],
        originalPrompt: 'Create ecommerce site',
        designSystem: 'tailwind',
      };

      const prompt = buildCohesivePrompt(context);

      // Check all major sections are present
      expect(prompt).toContain('Application Overview');
      expect(prompt).toContain('Pages to Generate');
      expect(prompt).toContain('Requirements');
      expect(prompt).toContain('Shared Theme');
      expect(prompt).toContain('Shared Navigation');
      expect(prompt).toContain('Inter-Page Links');
      expect(prompt).toContain('Page-Specific Content');
      expect(prompt).toContain('Design Consistency');
      expect(prompt).toContain('Design System');
      expect(prompt).toContain('Output Format');
      expect(prompt).toContain('Important Notes');
    });
  });
});
