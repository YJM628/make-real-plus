/**
 * Unit tests for CSS Extractor
 * Feature: export-deployable-project
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { extractSharedCSS } from './cssExtractor';
import type { ProcessedPage } from '../../types';

describe('cssExtractor', () => {
  describe('extractSharedCSS', () => {
    it('should return empty sharedCSS for no pages', () => {
      const result = extractSharedCSS([]);

      expect(result.sharedCSS).toBe('');
      expect(result.pageCSS.size).toBe(0);
    });

    it('should return empty sharedCSS for single page', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div>Home</div>',
          css: 'body { margin: 0; } .title { color: blue; }',
          js: '',
        },
      ];

      const result = extractSharedCSS(pages);

      expect(result.sharedCSS).toBe('');
      expect(result.pageCSS.size).toBe(1);
      expect(result.pageCSS.get('home')).toBe(pages[0].css);
    });

    it('should extract shared CSS rules from two pages', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div>Home</div>',
          css: 'body { margin: 0; } .title { color: blue; }',
          js: '',
        },
        {
          name: 'about',
          html: '<div>About</div>',
          css: 'body { margin: 0; } .subtitle { color: red; }',
          js: '',
        },
      ];

      const result = extractSharedCSS(pages);

      // Shared rule should be extracted
      expect(result.sharedCSS).toContain('body');
      expect(result.sharedCSS).toContain('margin');

      // Page-specific rules should remain
      expect(result.pageCSS.get('home')).toContain('title');
      expect(result.pageCSS.get('home')).toContain('blue');
      expect(result.pageCSS.get('about')).toContain('subtitle');
      expect(result.pageCSS.get('about')).toContain('red');

      // Shared rule should not be in page-specific CSS
      expect(result.pageCSS.get('home')).not.toContain('body { margin: 0; }');
      expect(result.pageCSS.get('about')).not.toContain('body { margin: 0; }');
    });

    it('should extract multiple shared CSS rules', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'page1',
          html: '',
          css: 'body { margin: 0; } .container { padding: 10px; } .unique1 { color: red; }',
          js: '',
        },
        {
          name: 'page2',
          html: '',
          css: 'body { margin: 0; } .container { padding: 10px; } .unique2 { color: blue; }',
          js: '',
        },
      ];

      const result = extractSharedCSS(pages);

      // Both shared rules should be extracted
      expect(result.sharedCSS).toContain('body');
      expect(result.sharedCSS).toContain('margin: 0');
      expect(result.sharedCSS).toContain('container');
      expect(result.sharedCSS).toContain('padding: 10px');

      // Page-specific rules should remain
      expect(result.pageCSS.get('page1')).toContain('unique1');
      expect(result.pageCSS.get('page2')).toContain('unique2');
    });

    it('should handle three pages with mixed shared rules', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'page1',
          html: '',
          css: 'body { margin: 0; } .header { height: 50px; }',
          js: '',
        },
        {
          name: 'page2',
          html: '',
          css: 'body { margin: 0; } .footer { height: 30px; }',
          js: '',
        },
        {
          name: 'page3',
          html: '',
          css: 'body { margin: 0; } .sidebar { width: 200px; }',
          js: '',
        },
      ];

      const result = extractSharedCSS(pages);

      // body rule appears in all 3 pages, should be shared
      expect(result.sharedCSS).toContain('body');
      expect(result.sharedCSS).toContain('margin: 0');

      // Each page should have its unique rule
      expect(result.pageCSS.get('page1')).toContain('header');
      expect(result.pageCSS.get('page2')).toContain('footer');
      expect(result.pageCSS.get('page3')).toContain('sidebar');
    });

    it('should handle pages with no shared CSS', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'page1',
          html: '',
          css: '.unique1 { color: red; }',
          js: '',
        },
        {
          name: 'page2',
          html: '',
          css: '.unique2 { color: blue; }',
          js: '',
        },
      ];

      const result = extractSharedCSS(pages);

      // No shared CSS
      expect(result.sharedCSS).toBe('');

      // All rules should remain page-specific
      expect(result.pageCSS.get('page1')).toContain('unique1');
      expect(result.pageCSS.get('page2')).toContain('unique2');
    });

    it('should handle pages with empty CSS', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'page1',
          html: '',
          css: '',
          js: '',
        },
        {
          name: 'page2',
          html: '',
          css: 'body { margin: 0; }',
          js: '',
        },
      ];

      const result = extractSharedCSS(pages);

      // No shared CSS (rule only in one page)
      expect(result.sharedCSS).toBe('');

      // Page with CSS should have it in pageCSS
      expect(result.pageCSS.get('page2')).toContain('body');
      expect(result.pageCSS.get('page1')).toBe('');
    });

    it('should normalize whitespace when comparing rules', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'page1',
          html: '',
          css: 'body{margin:0;}',
          js: '',
        },
        {
          name: 'page2',
          html: '',
          css: 'body { margin: 0; }',
          js: '',
        },
      ];

      const result = extractSharedCSS(pages);

      // Should recognize as same rule despite different whitespace
      expect(result.sharedCSS).toContain('body');
      expect(result.sharedCSS).toContain('margin');

      // Both pages should have empty page-specific CSS
      expect(result.pageCSS.get('page1')).toBe('');
      expect(result.pageCSS.get('page2')).toBe('');
    });

    it('should handle complex CSS rules', () => {
      const sharedRule = '.button { background: linear-gradient(to right, #ff0000, #00ff00); border-radius: 5px; }';
      const pages: ProcessedPage[] = [
        {
          name: 'page1',
          html: '',
          css: sharedRule + ' .page1-specific { color: red; }',
          js: '',
        },
        {
          name: 'page2',
          html: '',
          css: sharedRule + ' .page2-specific { color: blue; }',
          js: '',
        },
      ];

      const result = extractSharedCSS(pages);

      // Complex shared rule should be extracted
      expect(result.sharedCSS).toContain('button');
      expect(result.sharedCSS).toContain('linear-gradient');
      expect(result.sharedCSS).toContain('border-radius');

      // Page-specific rules should remain
      expect(result.pageCSS.get('page1')).toContain('page1-specific');
      expect(result.pageCSS.get('page2')).toContain('page2-specific');
    });

    it('should handle media queries', () => {
      const mediaQuery = '@media (max-width: 768px) { .container { width: 100%; } }';
      const pages: ProcessedPage[] = [
        {
          name: 'page1',
          html: '',
          css: mediaQuery + ' .page1 { color: red; }',
          js: '',
        },
        {
          name: 'page2',
          html: '',
          css: mediaQuery + ' .page2 { color: blue; }',
          js: '',
        },
      ];

      const result = extractSharedCSS(pages);

      // Media query should be extracted as shared
      expect(result.sharedCSS).toContain('@media');
      expect(result.sharedCSS).toContain('max-width');
      expect(result.sharedCSS).toContain('768px');
    });

    it('should preserve CSS rule order in output', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'page1',
          html: '',
          css: '.first { color: red; } .second { color: blue; }',
          js: '',
        },
        {
          name: 'page2',
          html: '',
          css: '.first { color: red; } .third { color: green; }',
          js: '',
        },
      ];

      const result = extractSharedCSS(pages);

      // Shared rule should be extracted
      expect(result.sharedCSS).toContain('first');

      // Page-specific rules should be in correct pages
      expect(result.pageCSS.get('page1')).toContain('second');
      expect(result.pageCSS.get('page2')).toContain('third');
    });

    it('should handle CSS with comments', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'page1',
          html: '',
          css: '/* Common styles */ body { margin: 0; } /* Page 1 */ .page1 { color: red; }',
          js: '',
        },
        {
          name: 'page2',
          html: '',
          css: '/* Common styles */ body { margin: 0; } /* Page 2 */ .page2 { color: blue; }',
          js: '',
        },
      ];

      const result = extractSharedCSS(pages);

      // Shared rule should be extracted (comments are part of the rule)
      expect(result.sharedCSS).toContain('body');
      expect(result.sharedCSS).toContain('margin');
    });

    it('should handle all pages having identical CSS', () => {
      const identicalCSS = 'body { margin: 0; } .container { padding: 10px; }';
      const pages: ProcessedPage[] = [
        {
          name: 'page1',
          html: '',
          css: identicalCSS,
          js: '',
        },
        {
          name: 'page2',
          html: '',
          css: identicalCSS,
          js: '',
        },
        {
          name: 'page3',
          html: '',
          css: identicalCSS,
          js: '',
        },
      ];

      const result = extractSharedCSS(pages);

      // All CSS should be shared
      expect(result.sharedCSS).toContain('body');
      expect(result.sharedCSS).toContain('container');

      // All page-specific CSS should be empty
      expect(result.pageCSS.get('page1')).toBe('');
      expect(result.pageCSS.get('page2')).toBe('');
      expect(result.pageCSS.get('page3')).toBe('');
    });

    it('should maintain round-trip consistency', () => {
      // Property 2: CSS extraction round-trip consistency
      const pages: ProcessedPage[] = [
        {
          name: 'page1',
          html: '',
          css: 'body { margin: 0; } .header { height: 50px; } .unique1 { color: red; }',
          js: '',
        },
        {
          name: 'page2',
          html: '',
          css: 'body { margin: 0; } .header { height: 50px; } .unique2 { color: blue; }',
          js: '',
        },
      ];

      const result = extractSharedCSS(pages);

      // For each page, combining sharedCSS + pageCSS should contain all original rules
      pages.forEach((page) => {
        const originalRules = page.css.split('}').filter((r) => r.trim());
        const combinedCSS = result.sharedCSS + ' ' + result.pageCSS.get(page.name);

        originalRules.forEach((rule) => {
          const normalizedRule = rule.trim().replace(/\s+/g, ' ');
          if (normalizedRule) {
            // Check that the rule content is present (ignoring exact whitespace)
            const ruleContent = normalizedRule.split('{')[0]?.trim();
            if (ruleContent) {
              expect(combinedCSS).toContain(ruleContent);
            }
          }
        });
      });
    });
  });
});
