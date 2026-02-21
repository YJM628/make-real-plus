/**
 * Unit tests for Override Applier
 * Feature: export-deployable-project
 * Requirements: 8.1, 8.2
 */

import { applyOverrides } from './overrideApplier';
import type { CollectedPage } from '../batch/collectPages';
import type { ElementOverride } from '../../types';

describe('overrideApplier', () => {
  describe('applyOverrides', () => {
    it('should return page as-is when no overrides provided', () => {
      const page: CollectedPage = {
        name: 'test',
        html: '<div class="title">Original</div>',
        css: 'body { margin: 0; }',
        js: 'console.log("test");',
      };

      const result = applyOverrides(page, []);

      expect(result.name).toBe('test');
      expect(result.html).toBe(page.html);
      expect(result.css).toBe(page.css);
      expect(result.js).toBe(page.js);
    });

    it('should apply text content override', () => {
      const page: CollectedPage = {
        name: 'test',
        html: '<html><body><div class="title">Original</div></body></html>',
        css: '',
        js: '',
      };

      const overrides: ElementOverride[] = [
        {
          selector: '.title',
          text: 'Modified Text',
          timestamp: Date.now(),
          aiGenerated: false,
        },
      ];

      const result = applyOverrides(page, overrides);

      expect(result.html).toContain('Modified Text');
      expect(result.html).not.toContain('Original');
    });

    it('should apply style overrides', () => {
      const page: CollectedPage = {
        name: 'test',
        html: '<html><body><div class="box">Content</div></body></html>',
        css: '',
        js: '',
      };

      const overrides: ElementOverride[] = [
        {
          selector: '.box',
          styles: {
            color: 'red',
            'background-color': 'blue',
            'font-size': '16px',
          },
          timestamp: Date.now(),
          aiGenerated: false,
        },
      ];

      const result = applyOverrides(page, overrides);

      expect(result.html).toContain('color');
      expect(result.html).toContain('red');
      expect(result.html).toContain('background-color');
      expect(result.html).toContain('blue');
    });

    it('should apply HTML replacement override', () => {
      const page: CollectedPage = {
        name: 'test',
        html: '<html><body><div class="container"><p>Old content</p></div></body></html>',
        css: '',
        js: '',
      };

      const overrides: ElementOverride[] = [
        {
          selector: '.container',
          html: '<span>New content</span>',
          timestamp: Date.now(),
          aiGenerated: false,
        },
      ];

      const result = applyOverrides(page, overrides);

      expect(result.html).toContain('<span>New content</span>');
      expect(result.html).not.toContain('<p>Old content</p>');
    });

    it('should apply attribute overrides', () => {
      const page: CollectedPage = {
        name: 'test',
        html: '<html><body><a class="link" href="#">Link</a></body></html>',
        css: '',
        js: '',
      };

      const overrides: ElementOverride[] = [
        {
          selector: '.link',
          attributes: {
            href: 'https://example.com',
            target: '_blank',
            'data-custom': 'value',
          },
          timestamp: Date.now(),
          aiGenerated: false,
        },
      ];

      const result = applyOverrides(page, overrides);

      expect(result.html).toContain('href="https://example.com"');
      expect(result.html).toContain('target="_blank"');
      expect(result.html).toContain('data-custom="value"');
    });

    it('should apply multiple types of overrides to same element', () => {
      const page: CollectedPage = {
        name: 'test',
        html: '<html><body><div class="multi">Original</div></body></html>',
        css: '',
        js: '',
      };

      const overrides: ElementOverride[] = [
        {
          selector: '.multi',
          text: 'Modified',
          styles: { color: 'green' },
          attributes: { 'data-test': 'value' },
          timestamp: Date.now(),
          aiGenerated: false,
        },
      ];

      const result = applyOverrides(page, overrides);

      expect(result.html).toContain('Modified');
      expect(result.html).toContain('color');
      expect(result.html).toContain('green');
      expect(result.html).toContain('data-test="value"');
    });

    it('should apply multiple overrides to different elements', () => {
      const page: CollectedPage = {
        name: 'test',
        html: '<html><body><div class="first">First</div><div class="second">Second</div></body></html>',
        css: '',
        js: '',
      };

      const overrides: ElementOverride[] = [
        {
          selector: '.first',
          text: 'Modified First',
          timestamp: Date.now(),
          aiGenerated: false,
        },
        {
          selector: '.second',
          text: 'Modified Second',
          timestamp: Date.now(),
          aiGenerated: false,
        },
      ];

      const result = applyOverrides(page, overrides);

      expect(result.html).toContain('Modified First');
      expect(result.html).toContain('Modified Second');
    });

    it('should skip override when selector not found and log warning', () => {
      const page: CollectedPage = {
        name: 'test',
        html: '<html><body><div class="exists">Content</div></body></html>',
        css: '',
        js: '',
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const overrides: ElementOverride[] = [
        {
          selector: '.does-not-exist',
          text: 'Should not apply',
          timestamp: Date.now(),
          aiGenerated: false,
        },
        {
          selector: '.exists',
          text: 'Should apply',
          timestamp: Date.now(),
          aiGenerated: false,
        },
      ];

      const result = applyOverrides(page, overrides);

      // Should apply the valid override
      expect(result.html).toContain('Should apply');
      expect(result.html).not.toContain('Should not apply');

      // Should log warning for missing selector
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Selector not found: ".does-not-exist"')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle complex selectors', () => {
      const page: CollectedPage = {
        name: 'test',
        html: '<html><body><div id="main"><p class="text">Content</p></div></body></html>',
        css: '',
        js: '',
      };

      const overrides: ElementOverride[] = [
        {
          selector: '#main .text',
          text: 'Modified via complex selector',
          timestamp: Date.now(),
          aiGenerated: false,
        },
      ];

      const result = applyOverrides(page, overrides);

      expect(result.html).toContain('Modified via complex selector');
    });

    it('should preserve CSS and JS properties unchanged', () => {
      const page: CollectedPage = {
        name: 'test',
        html: '<html><body><div class="title">Original</div></body></html>',
        css: 'body { margin: 0; padding: 10px; }',
        js: 'console.log("test"); alert("hello");',
      };

      const overrides: ElementOverride[] = [
        {
          selector: '.title',
          text: 'Modified',
          timestamp: Date.now(),
          aiGenerated: false,
        },
      ];

      const result = applyOverrides(page, overrides);

      expect(result.css).toBe(page.css);
      expect(result.js).toBe(page.js);
    });

    it('should handle empty HTML gracefully', () => {
      const page: CollectedPage = {
        name: 'test',
        html: '',
        css: '',
        js: '',
      };

      const overrides: ElementOverride[] = [
        {
          selector: '.anything',
          text: 'Should not crash',
          timestamp: Date.now(),
          aiGenerated: false,
        },
      ];

      const result = applyOverrides(page, overrides);

      expect(result.name).toBe('test');
      expect(result.html).toBeDefined();
    });

    it('should handle HTML without body tag', () => {
      const page: CollectedPage = {
        name: 'test',
        html: '<div class="title">Content</div>',
        css: '',
        js: '',
      };

      const overrides: ElementOverride[] = [
        {
          selector: '.title',
          text: 'Modified',
          timestamp: Date.now(),
          aiGenerated: false,
        },
      ];

      const result = applyOverrides(page, overrides);

      expect(result.html).toContain('Modified');
    });
  });
});
