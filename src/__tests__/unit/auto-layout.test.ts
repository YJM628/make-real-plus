/**
 * Unit tests for auto layout utilities
 * Feature: ai-html-visual-editor
 * Requirements: 3.3, 3.4, 3.5, 3.7
 */

import {
  calculateAutoLayout,
  calculateCanvasViewport,
  createShapesWithAutoLayout,
  sortPagesByLogicalOrder,
} from '../../utils/layout/autoLayout';

describe('Auto Layout', () => {
  describe('sortPagesByLogicalOrder', () => {
    it('should sort pages in logical order', () => {
      const pages = ['contact', 'home', 'about'];
      const sorted = sortPagesByLogicalOrder(pages);
      expect(sorted).toEqual(['home', 'about', 'contact']);
    });

    it('should handle mixed known and unknown page types', () => {
      const pages = ['page-3', 'home', 'page-1', 'about'];
      const sorted = sortPagesByLogicalOrder(pages);
      expect(sorted).toEqual(['home', 'about', 'page-1', 'page-3']);
    });

    it('should not mutate original array', () => {
      const pages = ['contact', 'home', 'about'];
      const original = [...pages];
      sortPagesByLogicalOrder(pages);
      expect(pages).toEqual(original);
    });
  });

  describe('calculateAutoLayout', () => {
    const mockPages = [
      { name: 'home', html: '<div>Home</div>', css: '', js: '' },
      { name: 'about', html: '<div>About</div>', css: '', js: '' },
      { name: 'contact', html: '<div>Contact</div>', css: '', js: '' },
    ];

    it('should calculate positions for multiple pages', () => {
      const result = calculateAutoLayout(mockPages);
      
      expect(result.shapes).toHaveLength(3);
      expect(result.shapes[0].id).toBe('shape-home');
      expect(result.shapes[1].id).toBe('shape-about');
      expect(result.shapes[2].id).toBe('shape-contact');
    });

    it('should maintain 50px spacing between shapes', () => {
      const result = calculateAutoLayout(mockPages);
      
      const spacing1 = result.shapes[1].x - (result.shapes[0].x + result.shapes[0].width);
      const spacing2 = result.shapes[2].x - (result.shapes[1].x + result.shapes[1].width);
      
      expect(spacing1).toBe(50);
      expect(spacing2).toBe(50);
    });

    it('should arrange pages in logical order', () => {
      const unorderedPages = [
        { name: 'contact', html: '<div>Contact</div>', css: '', js: '' },
        { name: 'home', html: '<div>Home</div>', css: '', js: '' },
        { name: 'about', html: '<div>About</div>', css: '', js: '' },
      ];
      
      const result = calculateAutoLayout(unorderedPages);
      
      expect(result.shapes[0].id).toBe('shape-home');
      expect(result.shapes[1].id).toBe('shape-about');
      expect(result.shapes[2].id).toBe('shape-contact');
    });

    it('should calculate correct bounding box', () => {
      const result = calculateAutoLayout(mockPages);
      
      expect(result.bounds.x).toBe(100);
      expect(result.bounds.y).toBe(100);
      expect(result.bounds.width).toBe(2500);
      expect(result.bounds.height).toBe(600);
    });
  });

  describe('calculateCanvasViewport', () => {
    it('should calculate viewport with default padding', () => {
      const bounds = { x: 100, y: 100, width: 2500, height: 600 };
      const viewport = calculateCanvasViewport(bounds);
      
      expect(viewport.x).toBe(0);
      expect(viewport.y).toBe(0);
      expect(viewport.width).toBe(2700);
      expect(viewport.height).toBe(800);
      expect(viewport.zoom).toBe(1);
    });
  });

  describe('createShapesWithAutoLayout', () => {
    const mockPages = [
      { name: 'home', html: '<div>Home</div>', css: '', js: '' },
      { name: 'about', html: '<div>About</div>', css: '', js: '' },
    ];

    it('should create shapes with auto layout', () => {
      const shapes = createShapesWithAutoLayout(mockPages);
      
      expect(shapes).toHaveLength(2);
      expect(shapes[0].id).toBe('shape-home');
      expect(shapes[1].id).toBe('shape-about');
    });
  });
});
