/**
 * Tests for collectPagesFromCanvas fallback functionality
 * Feature: merge-preview-fallback-fix
 * Requirements: 1.2, 1.3, 2.1-2.5, 4.1-4.5
 */

import { collectPagesFromCanvas } from '../../utils/batch/collectPages';
import type { Editor } from 'tldraw';

describe('collectPagesFromCanvas', () => {
  let mockEditor: Partial<Editor>;

  beforeEach(() => {
    mockEditor = {
      getCurrentPageShapes: jest.fn(() => []),
    };
  });

  describe('basic functionality', () => {
    it('should collect HTML shapes from canvas', () => {
      // Requirement 1.2, 1.3: Scan canvas for HTML shapes
      const mockShapes = [
        {
          type: 'html',
          props: {
            html: '<html><head><title>Home</title></head><body><h1>Home Page</h1></body></html>',
            css: 'body { margin: 0; }',
            js: 'console.log("home");',
          },
        },
        {
          type: 'html',
          props: {
            html: '<html><head><title>About</title></head><body><h1>About Page</h1></body></html>',
            css: '',
            js: '',
          },
        },
      ];

      (mockEditor.getCurrentPageShapes as any) = jest.fn(() => mockShapes);

      const result = collectPagesFromCanvas(mockEditor as Editor);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('home');
      expect(result[0].html).toContain('Home Page');
      expect(result[1].name).toBe('about');
      expect(result[1].html).toContain('About Page');
    });

    it('should extract page name from title tag', () => {
      // Requirement 2.1, 2.2: Extract from title tag
      const mockShapes = [
        {
          type: 'html',
          props: {
            html: '<html><head><title>My Product Page</title></head><body></body></html>',
            css: '',
            js: '',
          },
        },
      ];

      (mockEditor.getCurrentPageShapes as any) = jest.fn(() => mockShapes);

      const result = collectPagesFromCanvas(mockEditor as Editor);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('my-product-page');
    });

    it('should extract page name from h1 tag when title is missing', () => {
      // Requirement 2.2: Fallback to h1 tag
      const mockShapes = [
        {
          type: 'html',
          props: {
            html: '<html><body><h1>Contact Us</h1></body></html>',
            css: '',
            js: '',
          },
        },
      ];

      (mockEditor.getCurrentPageShapes as any) = jest.fn(() => mockShapes);

      const result = collectPagesFromCanvas(mockEditor as Editor);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('contact-us');
    });

    it('should use fallback naming when no title or h1 exists', () => {
      // Requirement 2.3: Fallback naming scheme
      const mockShapes = [
        {
          type: 'html',
          props: {
            html: '<html><body><div>Content</div></body></html>',
            css: '',
            js: '',
          },
        },
      ];

      (mockEditor.getCurrentPageShapes as any) = jest.fn(() => mockShapes);

      const result = collectPagesFromCanvas(mockEditor as Editor);

      expect(result).toHaveLength(1);
      expect(result[0].name).toMatch(/^page-\d+$/);
    });
  });

  describe('name normalization', () => {
    it('should normalize page names to lowercase with hyphens', () => {
      // Requirement 2.5: Normalize page names
      const mockShapes = [
        {
          type: 'html',
          props: {
            html: '<html><head><title>My Product Page!</title></head><body></body></html>',
            css: '',
            js: '',
          },
        },
      ];

      (mockEditor.getCurrentPageShapes as any) = jest.fn(() => mockShapes);

      const result = collectPagesFromCanvas(mockEditor as Editor);

      expect(result[0].name).toBe('my-product-page');
    });

    it('should handle duplicate page names with numeric suffixes', () => {
      // Requirement 2.4: Ensure uniqueness
      const mockShapes = [
        {
          type: 'html',
          props: {
            html: '<html><head><title>Home</title></head><body></body></html>',
            css: '',
            js: '',
          },
        },
        {
          type: 'html',
          props: {
            html: '<html><head><title>Home</title></head><body></body></html>',
            css: '',
            js: '',
          },
        },
        {
          type: 'html',
          props: {
            html: '<html><head><title>Home</title></head><body></body></html>',
            css: '',
            js: '',
          },
        },
      ];

      (mockEditor.getCurrentPageShapes as any) = jest.fn(() => mockShapes);

      const result = collectPagesFromCanvas(mockEditor as Editor);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('home');
      expect(result[1].name).toBe('home-2');
      expect(result[2].name).toBe('home-3');
    });
  });

  describe('edge cases', () => {
    it('should return empty array when editor is null', () => {
      // Requirement 4.1: Handle null editor
      const result = collectPagesFromCanvas(null);

      expect(result).toEqual([]);
    });

    it('should return empty array when canvas has no shapes', () => {
      // Requirement 4.4: Handle empty canvas
      (mockEditor.getCurrentPageShapes as any) = jest.fn(() => []);

      const result = collectPagesFromCanvas(mockEditor as Editor);

      expect(result).toEqual([]);
    });

    it('should skip non-HTML shapes', () => {
      // Requirement 1.3: Only collect HTML shapes
      const mockShapes = [
        { type: 'rectangle', props: {} },
        { type: 'text', props: {} },
        {
          type: 'html',
          props: {
            html: '<html><head><title>Valid</title></head><body></body></html>',
            css: '',
            js: '',
          },
        },
      ];

      (mockEditor.getCurrentPageShapes as any) = jest.fn(() => mockShapes);

      const result = collectPagesFromCanvas(mockEditor as Editor);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('valid');
    });

    it('should skip HTML shapes with empty content', () => {
      // Requirement 4.2: Skip shapes with empty content
      const mockShapes = [
        {
          type: 'html',
          props: {
            html: '',
            css: '',
            js: '',
          },
        },
        {
          type: 'html',
          props: {
            html: '   ',
            css: '',
            js: '',
          },
        },
        {
          type: 'html',
          props: {
            html: '<html><head><title>Valid</title></head><body></body></html>',
            css: '',
            js: '',
          },
        },
      ];

      (mockEditor.getCurrentPageShapes as any) = jest.fn(() => mockShapes);

      const result = collectPagesFromCanvas(mockEditor as Editor);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('valid');
    });

    it('should include shapes with missing css or js', () => {
      // Requirement 4.3: Handle partial data
      const mockShapes = [
        {
          type: 'html',
          props: {
            html: '<html><head><title>Partial</title></head><body></body></html>',
            css: undefined,
            js: undefined,
          },
        },
      ];

      (mockEditor.getCurrentPageShapes as any) = jest.fn(() => mockShapes);

      const result = collectPagesFromCanvas(mockEditor as Editor);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('partial');
      expect(result[0].css).toBe('');
      expect(result[0].js).toBe('');
    });
  });
});
