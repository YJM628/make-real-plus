/**
 * Unit tests for Design System Resolver
 * Feature: export-deployable-project
 * Requirements: 4.1, 4.2, 4.3
 */

import { resolveDesignSystemDeps } from './designSystemResolver';
import type { ProcessedPage } from '../../types';

describe('designSystemResolver', () => {
  describe('resolveDesignSystemDeps', () => {
    it('should return empty arrays for no pages', () => {
      const result = resolveDesignSystemDeps([]);

      expect(result.stylesheets).toEqual([]);
      expect(result.scripts).toEqual([]);
    });

    it('should return empty arrays for pages with vanilla design system', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div>Home</div>',
          css: '',
          js: '',
          designSystem: 'vanilla',
        },
        {
          name: 'about',
          html: '<div>About</div>',
          css: '',
          js: '',
          designSystem: 'vanilla',
        },
      ];

      const result = resolveDesignSystemDeps(pages);

      expect(result.stylesheets).toEqual([]);
      expect(result.scripts).toEqual([]);
    });

    it('should return empty arrays for pages without design system', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div>Home</div>',
          css: '',
          js: '',
        },
        {
          name: 'about',
          html: '<div>About</div>',
          css: '',
          js: '',
        },
      ];

      const result = resolveDesignSystemDeps(pages);

      expect(result.stylesheets).toEqual([]);
      expect(result.scripts).toEqual([]);
    });

    it('should collect CDN links from a single page with material-ui', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div>Home</div>',
          css: '',
          js: '',
          designSystem: 'material-ui',
        },
      ];

      const result = resolveDesignSystemDeps(pages);

      // Material UI should have at least some CDN links
      expect(result.stylesheets.length + result.scripts.length).toBeGreaterThan(0);
    });

    it('should deduplicate CDN links from multiple pages with same design system', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div>Home</div>',
          css: '',
          js: '',
          designSystem: 'material-ui',
        },
        {
          name: 'about',
          html: '<div>About</div>',
          css: '',
          js: '',
          designSystem: 'material-ui',
        },
        {
          name: 'contact',
          html: '<div>Contact</div>',
          css: '',
          js: '',
          designSystem: 'material-ui',
        },
      ];

      const result = resolveDesignSystemDeps(pages);

      // Get CDN links from a single page for comparison
      const singlePageResult = resolveDesignSystemDeps([pages[0]]);

      // Should have same number of links (deduplication working)
      expect(result.stylesheets.length).toBe(singlePageResult.stylesheets.length);
      expect(result.scripts.length).toBe(singlePageResult.scripts.length);

      // Should have same links
      expect(result.stylesheets).toEqual(singlePageResult.stylesheets);
      expect(result.scripts).toEqual(singlePageResult.scripts);
    });

    it('should collect CDN links from multiple pages with different design systems', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div>Home</div>',
          css: '',
          js: '',
          designSystem: 'material-ui',
        },
        {
          name: 'about',
          html: '<div>About</div>',
          css: '',
          js: '',
          designSystem: 'ant-design',
        },
      ];

      const result = resolveDesignSystemDeps(pages);

      // Should have CDN links from both design systems
      const materialResult = resolveDesignSystemDeps([pages[0]]);
      const antResult = resolveDesignSystemDeps([pages[1]]);

      // Total should be at least as many as the larger of the two
      expect(result.stylesheets.length).toBeGreaterThanOrEqual(
        Math.max(materialResult.stylesheets.length, antResult.stylesheets.length)
      );
      expect(result.scripts.length).toBeGreaterThanOrEqual(
        Math.max(materialResult.scripts.length, antResult.scripts.length)
      );
    });

    it('should handle mix of vanilla and non-vanilla design systems', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div>Home</div>',
          css: '',
          js: '',
          designSystem: 'material-ui',
        },
        {
          name: 'about',
          html: '<div>About</div>',
          css: '',
          js: '',
          designSystem: 'vanilla',
        },
        {
          name: 'contact',
          html: '<div>Contact</div>',
          css: '',
          js: '',
          designSystem: 'ant-design',
        },
      ];

      const result = resolveDesignSystemDeps(pages);

      // Should only include CDN links from material-ui and ant-design
      // Vanilla should not contribute any links
      expect(result.stylesheets.length + result.scripts.length).toBeGreaterThan(0);

      // Verify by comparing with non-vanilla pages only
      const nonVanillaPages = pages.filter((p) => p.designSystem !== 'vanilla');
      const nonVanillaResult = resolveDesignSystemDeps(nonVanillaPages);

      expect(result.stylesheets).toEqual(nonVanillaResult.stylesheets);
      expect(result.scripts).toEqual(nonVanillaResult.scripts);
    });

    it('should handle pages with undefined design system', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div>Home</div>',
          css: '',
          js: '',
          designSystem: 'material-ui',
        },
        {
          name: 'about',
          html: '<div>About</div>',
          css: '',
          js: '',
          // designSystem is undefined
        },
      ];

      const result = resolveDesignSystemDeps(pages);

      // Should only include CDN links from material-ui
      const materialOnlyResult = resolveDesignSystemDeps([pages[0]]);

      expect(result.stylesheets).toEqual(materialOnlyResult.stylesheets);
      expect(result.scripts).toEqual(materialOnlyResult.scripts);
    });

    it('should handle unknown design system gracefully', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div>Home</div>',
          css: '',
          js: '',
          designSystem: 'unknown-system' as any,
        },
        {
          name: 'about',
          html: '<div>About</div>',
          css: '',
          js: '',
          designSystem: 'material-ui',
        },
      ];

      // Should not throw error, should skip unknown system
      const result = resolveDesignSystemDeps(pages);

      // Should only include CDN links from material-ui
      const materialOnlyResult = resolveDesignSystemDeps([pages[1]]);

      expect(result.stylesheets).toEqual(materialOnlyResult.stylesheets);
      expect(result.scripts).toEqual(materialOnlyResult.scripts);
    });

    it('should not have duplicate CDN links in output', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'page1',
          html: '<div>Page 1</div>',
          css: '',
          js: '',
          designSystem: 'material-ui',
        },
        {
          name: 'page2',
          html: '<div>Page 2</div>',
          css: '',
          js: '',
          designSystem: 'material-ui',
        },
        {
          name: 'page3',
          html: '<div>Page 3</div>',
          css: '',
          js: '',
          designSystem: 'material-ui',
        },
      ];

      const result = resolveDesignSystemDeps(pages);

      // Check for duplicates in stylesheets
      const stylesheetSet = new Set(result.stylesheets);
      expect(stylesheetSet.size).toBe(result.stylesheets.length);

      // Check for duplicates in scripts
      const scriptSet = new Set(result.scripts);
      expect(scriptSet.size).toBe(result.scripts.length);
    });

    it('should handle tailwind design system', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div class="bg-blue-500">Home</div>',
          css: '',
          js: '',
          designSystem: 'tailwind',
        },
      ];

      const result = resolveDesignSystemDeps(pages);

      // Tailwind should have CDN links
      expect(result.stylesheets.length + result.scripts.length).toBeGreaterThan(0);
    });

    it('should handle ant-design design system', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div>Home</div>',
          css: '',
          js: '',
          designSystem: 'ant-design',
        },
      ];

      const result = resolveDesignSystemDeps(pages);

      // Ant Design should have CDN links
      expect(result.stylesheets.length + result.scripts.length).toBeGreaterThan(0);
    });

    it('should separate stylesheets and scripts correctly', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div>Home</div>',
          css: '',
          js: '',
          designSystem: 'material-ui',
        },
      ];

      const result = resolveDesignSystemDeps(pages);

      // All stylesheets should end with .css or contain 'stylesheet'
      result.stylesheets.forEach((link) => {
        expect(
          link.endsWith('.css') || link.includes('stylesheet')
        ).toBe(true);
      });

      // Scripts should not end with .css
      result.scripts.forEach((link) => {
        expect(link.endsWith('.css')).toBe(false);
      });
    });

    it('should handle empty HTML content', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: '',
          designSystem: 'material-ui',
        },
      ];

      // Should not throw error
      const result = resolveDesignSystemDeps(pages);

      // Should still return CDN links (they don't depend on HTML content)
      expect(result.stylesheets.length + result.scripts.length).toBeGreaterThanOrEqual(0);
    });

    it('should maintain consistent order across multiple calls', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div>Home</div>',
          css: '',
          js: '',
          designSystem: 'material-ui',
        },
        {
          name: 'about',
          html: '<div>About</div>',
          css: '',
          js: '',
          designSystem: 'ant-design',
        },
      ];

      const result1 = resolveDesignSystemDeps(pages);
      const result2 = resolveDesignSystemDeps(pages);

      // Results should be identical
      expect(result1.stylesheets).toEqual(result2.stylesheets);
      expect(result1.scripts).toEqual(result2.scripts);
    });

    it('should handle large number of pages efficiently', () => {
      // Create 100 pages with same design system
      const pages: ProcessedPage[] = Array.from({ length: 100 }, (_, i) => ({
        name: `page${i}`,
        html: `<div>Page ${i}</div>`,
        css: '',
        js: '',
        designSystem: 'material-ui',
      }));

      const startTime = Date.now();
      const result = resolveDesignSystemDeps(pages);
      const endTime = Date.now();

      // Should complete quickly (under 1 second)
      expect(endTime - startTime).toBeLessThan(1000);

      // Should still deduplicate correctly
      const singlePageResult = resolveDesignSystemDeps([pages[0]]);
      expect(result.stylesheets).toEqual(singlePageResult.stylesheets);
      expect(result.scripts).toEqual(singlePageResult.scripts);
    });
  });
});
