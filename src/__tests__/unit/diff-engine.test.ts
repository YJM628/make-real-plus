/**
 * Unit tests for DiffEngine
 * Feature: ai-html-visual-editor
 * 
 * Tests the DiffEngine class functionality including:
 * - Calculating diffs between original and modified HTML
 * - Applying overrides to HTML strings
 * - Merging multiple overrides
 * - Generating exports in different formats
 * - Generating responsive media queries
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.5, 18.4, 18.6
 */

import { DiffEngine } from '../../core/diff/DiffEngine';
import type { ElementOverride, HtmlParseResult, ParsedElement, ViewportConfig } from '../../types';

describe('DiffEngine', () => {
  let diffEngine: DiffEngine;

  beforeEach(() => {
    diffEngine = new DiffEngine();
  });

  describe('mergeOverrides', () => {
    it('should merge multiple overrides for the same selector', () => {
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          text: 'First',
          timestamp: 1000,
          aiGenerated: false,
        },
        {
          selector: '.test',
          text: 'Second',
          timestamp: 2000,
          aiGenerated: false,
        },
        {
          selector: '.test',
          styles: { color: 'red' },
          timestamp: 3000,
          aiGenerated: true,
        },
      ];

      const merged = diffEngine.mergeOverrides(overrides);

      expect(merged).toHaveLength(1);
      expect(merged[0].selector).toBe('.test');
      expect(merged[0].text).toBe('Second'); // Latest text
      expect(merged[0].styles).toEqual({ color: 'red' });
      expect(merged[0].timestamp).toBe(3000); // Latest timestamp
      expect(merged[0].aiGenerated).toBe(true); // True if any was AI-generated
    });

    it('should handle empty overrides array', () => {
      const merged = diffEngine.mergeOverrides([]);
      expect(merged).toHaveLength(0);
    });

    it('should keep separate overrides for different selectors', () => {
      const overrides: ElementOverride[] = [
        {
          selector: '.test1',
          text: 'First',
          timestamp: 1000,
          aiGenerated: false,
        },
        {
          selector: '.test2',
          text: 'Second',
          timestamp: 2000,
          aiGenerated: false,
        },
      ];

      const merged = diffEngine.mergeOverrides(overrides);

      expect(merged).toHaveLength(2);
      expect(merged.find(o => o.selector === '.test1')).toBeDefined();
      expect(merged.find(o => o.selector === '.test2')).toBeDefined();
    });

    it('should merge styles from multiple overrides', () => {
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          styles: { color: 'red', fontSize: '16px' },
          timestamp: 1000,
          aiGenerated: false,
        },
        {
          selector: '.test',
          styles: { color: 'blue', fontWeight: 'bold' },
          timestamp: 2000,
          aiGenerated: false,
        },
      ];

      const merged = diffEngine.mergeOverrides(overrides);

      expect(merged).toHaveLength(1);
      expect(merged[0].styles).toEqual({
        color: 'blue', // Overridden
        fontSize: '16px', // Preserved
        fontWeight: 'bold', // Added
      });
    });

    it('should be idempotent - merging twice produces same result', () => {
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          text: 'First',
          timestamp: 1000,
          aiGenerated: false,
        },
        {
          selector: '.test',
          text: 'Second',
          timestamp: 2000,
          aiGenerated: false,
        },
      ];

      const merged1 = diffEngine.mergeOverrides(overrides);
      const merged2 = diffEngine.mergeOverrides(merged1);

      expect(merged2).toEqual(merged1);
    });
  });

  describe('applyOverrides', () => {
    it('should apply text content override', () => {
      const html = '<div class="test">Original</div>';
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          text: 'Modified',
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const result = diffEngine.applyOverrides(html, overrides);

      expect(result).toContain('Modified');
      expect(result).not.toContain('Original');
    });

    it('should apply style overrides', () => {
      const html = '<div class="test">Content</div>';
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          styles: { color: 'red', fontSize: '20px' },
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const result = diffEngine.applyOverrides(html, overrides);

      expect(result).toContain('color: red');
      expect(result).toContain('font-size: 20px');
    });

    it('should apply position overrides', () => {
      const html = '<div class="test">Content</div>';
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          position: { x: 100, y: 200 },
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const result = diffEngine.applyOverrides(html, overrides);

      expect(result).toContain('left: 100px');
      expect(result).toContain('top: 200px');
      expect(result).toContain('position: absolute');
    });

    it('should apply size overrides', () => {
      const html = '<div class="test">Content</div>';
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          size: { width: 300, height: 400 },
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const result = diffEngine.applyOverrides(html, overrides);

      expect(result).toContain('width: 300px');
      expect(result).toContain('height: 400px');
    });

    it('should apply attribute overrides', () => {
      const html = '<div class="test">Content</div>';
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          attributes: { 'data-custom': 'value', title: 'Test Title' },
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const result = diffEngine.applyOverrides(html, overrides);

      expect(result).toContain('data-custom="value"');
      expect(result).toContain('title="Test Title"');
    });

    it('should apply HTML replacement override', () => {
      const html = '<div class="test">Original</div>';
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          html: '<span>Replaced</span>',
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const result = diffEngine.applyOverrides(html, overrides);

      expect(result).toContain('<span>Replaced</span>');
      expect(result).not.toContain('Original');
    });

    it('should return original HTML when no overrides', () => {
      const html = '<div class="test">Content</div>';
      const result = diffEngine.applyOverrides(html, []);

      expect(result).toBe(html);
    });

    it('should handle empty HTML', () => {
      const result = diffEngine.applyOverrides('', []);
      expect(result).toBe('');
    });

    it('should handle invalid selector gracefully', () => {
      const html = '<div class="test">Content</div>';
      const overrides: ElementOverride[] = [
        {
          selector: '.nonexistent',
          text: 'Modified',
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      // Should not throw, just return original HTML
      const result = diffEngine.applyOverrides(html, overrides);
      expect(result).toContain('Content');
    });

    it('should apply multiple overrides to different elements', () => {
      const html = '<div class="test1">First</div><div class="test2">Second</div>';
      const overrides: ElementOverride[] = [
        {
          selector: '.test1',
          text: 'Modified First',
          timestamp: 1000,
          aiGenerated: false,
        },
        {
          selector: '.test2',
          text: 'Modified Second',
          timestamp: 2000,
          aiGenerated: false,
        },
      ];

      const result = diffEngine.applyOverrides(html, overrides);

      expect(result).toContain('Modified First');
      expect(result).toContain('Modified Second');
    });
  });

  describe('calculateDiff', () => {
    it('should identify modified elements', () => {
      const original: HtmlParseResult = {
        root: createMockElement('div', '.root'),
        elementMap: new Map([
          ['test-1', createMockElement('div', '.test')],
        ]),
        styles: '',
        scripts: '',
        externalResources: { stylesheets: [], scripts: [], images: [] },
      };

      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          text: 'Modified',
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const diff = diffEngine.calculateDiff(original, overrides);

      expect(diff.modified).toHaveLength(1);
      expect(diff.modified[0].selector).toBe('.test');
      expect(diff.modified[0].changes.text).toBe('Modified');
    });

    it('should return empty diff when no overrides', () => {
      const original: HtmlParseResult = {
        root: createMockElement('div', '.root'),
        elementMap: new Map(),
        styles: '',
        scripts: '',
        externalResources: { stylesheets: [], scripts: [], images: [] },
      };

      const diff = diffEngine.calculateDiff(original, []);

      expect(diff.added).toHaveLength(0);
      expect(diff.modified).toHaveLength(0);
      expect(diff.removed).toHaveLength(0);
    });

    it('should merge overrides before calculating diff', () => {
      const original: HtmlParseResult = {
        root: createMockElement('div', '.root'),
        elementMap: new Map([
          ['test-1', createMockElement('div', '.test')],
        ]),
        styles: '',
        scripts: '',
        externalResources: { stylesheets: [], scripts: [], images: [] },
      };

      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          text: 'First',
          timestamp: 1000,
          aiGenerated: false,
        },
        {
          selector: '.test',
          text: 'Second',
          timestamp: 2000,
          aiGenerated: false,
        },
      ];

      const diff = diffEngine.calculateDiff(original, overrides);

      expect(diff.modified).toHaveLength(1);
      expect(diff.modified[0].changes.text).toBe('Second'); // Latest value
    });
  });

  describe('generateExport', () => {
    it('should generate single file export', () => {
      const original: HtmlParseResult = {
        root: createMockElement('div', '.root', 'Content'),
        elementMap: new Map(),
        styles: 'body { margin: 0; }',
        scripts: 'console.log("test");',
        externalResources: { stylesheets: [], scripts: [], images: [] },
      };

      const result = diffEngine.generateExport(original, [], 'single');

      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('<style>');
      expect(result.html).toContain('body { margin: 0; }');
      expect(result.html).toContain('<script>');
      expect(result.html).toContain('console.log("test");');
      expect(result.html).toContain('Content');
      expect(result.css).toBeUndefined();
      expect(result.js).toBeUndefined();
    });

    it('should generate separate files export', () => {
      const original: HtmlParseResult = {
        root: createMockElement('div', '.root', 'Content'),
        elementMap: new Map(),
        styles: 'body { margin: 0; }',
        scripts: 'console.log("test");',
        externalResources: { stylesheets: [], scripts: [], images: [] },
      };

      const result = diffEngine.generateExport(original, [], 'separate');

      expect(result.html).toContain('Content');
      expect(result.html).not.toContain('<!DOCTYPE html>');
      expect(result.css).toBe('body { margin: 0; }');
      expect(result.js).toBe('console.log("test");');
    });

    it('should apply overrides before export', () => {
      const original: HtmlParseResult = {
        root: createMockElement('div', '.root', 'Original'),
        elementMap: new Map(),
        styles: '',
        scripts: '',
        externalResources: { stylesheets: [], scripts: [], images: [] },
      };

      const overrides: ElementOverride[] = [
        {
          selector: '.root',
          text: 'Modified',
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const result = diffEngine.generateExport(original, overrides, 'single');

      expect(result.html).toContain('Modified');
      expect(result.html).not.toContain('Original');
    });

    it('should export without modifications when no overrides', () => {
      const original: HtmlParseResult = {
        root: createMockElement('div', '.root', 'Content'),
        elementMap: new Map(),
        styles: '',
        scripts: '',
        externalResources: { stylesheets: [], scripts: [], images: [] },
      };

      const result = diffEngine.generateExport(original, [], 'separate');

      expect(result.html).toContain('Content');
    });
  });

  describe('generateMediaQueries', () => {
    it('should generate media queries for different viewports', () => {
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          styles: { fontSize: '14px', color: 'blue' },
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const viewports: ViewportConfig[] = ['mobile', 'tablet'];

      const result = diffEngine.generateMediaQueries(overrides, viewports);

      expect(result).toContain('@media (max-width: 375px)');
      expect(result).toContain('@media (max-width: 768px)');
      expect(result).toContain('.test');
      expect(result).toContain('font-size: 14px');
      expect(result).toContain('color: blue');
    });

    it('should handle custom viewport sizes', () => {
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          styles: { fontSize: '16px' },
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const viewports = [{ width: 1024, height: 768 }];

      const result = diffEngine.generateMediaQueries(overrides, viewports);

      expect(result).toContain('@media (max-width: 1024px)');
    });

    it('should return empty string when no style overrides', () => {
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          text: 'Content',
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const viewports: ViewportConfig[] = ['mobile'];

      const result = diffEngine.generateMediaQueries(overrides, viewports);

      expect(result).toBe('');
    });

    it('should handle empty overrides array', () => {
      const result = diffEngine.generateMediaQueries([], ['mobile']);

      expect(result).toBe('');
    });

    it('should generate queries for multiple selectors', () => {
      const overrides: ElementOverride[] = [
        {
          selector: '.test1',
          styles: { fontSize: '14px' },
          timestamp: 1000,
          aiGenerated: false,
        },
        {
          selector: '.test2',
          styles: { color: 'red' },
          timestamp: 2000,
          aiGenerated: false,
        },
      ];

      const viewports: ViewportConfig[] = ['mobile'];

      const result = diffEngine.generateMediaQueries(overrides, viewports);

      expect(result).toContain('.test1');
      expect(result).toContain('.test2');
    });
  });
});

/**
 * Helper function to create mock ParsedElement
 */
function createMockElement(
  tagName: string,
  selector: string,
  textContent: string = ''
): ParsedElement {
  return {
    identifier: `${tagName}-1`,
    tagName,
    attributes: { class: selector.replace('.', '') },
    inlineStyles: {},
    selector,
    textContent,
    children: [],
  };
}
