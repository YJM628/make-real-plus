/**
 * Integration tests for responsive design features
 * Feature: ai-html-visual-editor
 * 
 * Tests the complete workflow of viewport switching, style overrides,
 * and media query generation.
 * 
 * Requirements: 18.2, 18.4, 18.6
 */

import { responsiveManager } from '../../utils/responsive';
import type { ViewportOverride } from '../../utils/responsive';
import { diffEngine } from '../../core/diff/DiffEngine';
import type { ViewportConfig } from '../../types';

describe('Responsive Design Integration', () => {
  describe('Viewport switching and shape width adjustment', () => {
    it('should adjust shape width when switching viewports', () => {
      // Start with desktop viewport and full width
      let currentViewport: ViewportConfig = 'desktop';
      let shapeWidth = 1920;

      // Switch to tablet
      const newViewport: ViewportConfig = 'tablet';
      shapeWidth = responsiveManager.adjustShapeWidth(
        shapeWidth,
        currentViewport,
        newViewport
      );

      expect(shapeWidth).toBe(768);

      // Switch to mobile
      currentViewport = newViewport;
      const mobileViewport: ViewportConfig = 'mobile';
      shapeWidth = responsiveManager.adjustShapeWidth(
        shapeWidth,
        currentViewport,
        mobileViewport
      );

      expect(shapeWidth).toBe(375);
    });

    it('should restore original width when switching back', () => {
      const originalViewport: ViewportConfig = 'desktop';
      const originalWidth = 1920;

      // Switch to mobile
      let currentWidth = responsiveManager.adjustShapeWidth(
        originalWidth,
        originalViewport,
        'mobile'
      );

      expect(currentWidth).toBe(375);

      // Switch back to desktop
      currentWidth = responsiveManager.adjustShapeWidth(
        currentWidth,
        'mobile',
        originalViewport
      );

      expect(currentWidth).toBe(1920);
    });
  });

  describe('Viewport-specific style overrides', () => {
    it('should track styles for different viewports', () => {
      const overrides: ViewportOverride[] = [];

      // Add mobile styles
      overrides.push({
        selector: '.button',
        styles: { fontSize: '14px', padding: '8px' },
        timestamp: 1000,
        aiGenerated: false,
        viewport: 'mobile',
      });

      // Add tablet styles
      overrides.push({
        selector: '.button',
        styles: { fontSize: '16px', padding: '10px' },
        timestamp: 1001,
        aiGenerated: false,
        viewport: 'tablet',
      });

      // Add desktop styles
      overrides.push({
        selector: '.button',
        styles: { fontSize: '18px', padding: '12px' },
        timestamp: 1002,
        aiGenerated: false,
        viewport: 'desktop',
      });

      const groups = responsiveManager.groupOverridesByViewport(overrides);

      expect(groups).toHaveLength(3);
      expect(groups.find(g => g.viewport === 'mobile')).toBeDefined();
      expect(groups.find(g => g.viewport === 'tablet')).toBeDefined();
      expect(groups.find(g => g.viewport === 'desktop')).toBeDefined();
    });

    it('should merge base styles with viewport-specific styles', () => {
      // Base styles that apply to all viewports
      const baseOverrides = [
        {
          selector: '.button',
          styles: { color: 'blue', borderRadius: '4px' },
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      // Mobile-specific styles
      const viewportOverrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '14px' },
          timestamp: 1001,
          aiGenerated: false,
          viewport: 'mobile',
        },
      ];

      const merged = responsiveManager.mergeOverridesForViewport(
        baseOverrides,
        viewportOverrides,
        'mobile'
      );

      expect(merged).toHaveLength(1);
      expect(merged[0].styles).toEqual({
        color: 'blue',
        borderRadius: '4px',
        fontSize: '14px',
      });
    });
  });

  describe('Media query generation', () => {
    it('should generate media queries for viewport-specific styles', () => {
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '14px', padding: '8px 16px' },
          timestamp: 1000,
          aiGenerated: false,
          viewport: 'mobile',
        },
        {
          selector: '.button',
          styles: { fontSize: '16px', padding: '10px 20px' },
          timestamp: 1001,
          aiGenerated: false,
          viewport: 'tablet',
        },
        {
          selector: '.header',
          styles: { height: '60px' },
          timestamp: 1002,
          aiGenerated: false,
          viewport: 'mobile',
        },
      ];

      const css = responsiveManager.generateMediaQueries(overrides);

      // Should contain media queries for both viewports
      expect(css).toContain('@media (max-width: 768px)'); // tablet
      expect(css).toContain('@media (max-width: 375px)'); // mobile

      // Should contain all selectors and styles
      expect(css).toContain('.button');
      expect(css).toContain('.header');
      expect(css).toContain('font-size: 14px;');
      expect(css).toContain('padding: 8px 16px;');
      expect(css).toContain('height: 60px;');
    });

    it('should integrate with DiffEngine for export', () => {
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '14px' },
          timestamp: 1000,
          aiGenerated: false,
          viewport: 'mobile',
        },
      ];

      // DiffEngine should use ResponsiveManager for viewport-aware overrides
      const css = diffEngine.generateMediaQueries(overrides, []);

      expect(css).toContain('@media (max-width: 375px)');
      expect(css).toContain('.button');
      expect(css).toContain('font-size: 14px;');
    });
  });

  describe('Complete responsive workflow', () => {
    it('should handle full workflow: viewport switch -> style edit -> export', () => {
      // Step 1: Start with desktop viewport
      let currentViewport: ViewportConfig = 'desktop';
      let shapeWidth = 1920;
      const overrides: ViewportOverride[] = [];

      // Step 2: Add desktop styles
      overrides.push({
        selector: '.container',
        styles: { maxWidth: '1200px', padding: '20px' },
        timestamp: 1000,
        aiGenerated: false,
        viewport: currentViewport,
      });

      // Step 3: Switch to tablet
      currentViewport = 'tablet';
      shapeWidth = responsiveManager.adjustShapeWidth(
        shapeWidth,
        'desktop',
        currentViewport
      );

      expect(shapeWidth).toBe(768);

      // Step 4: Add tablet-specific styles
      overrides.push({
        selector: '.container',
        styles: { maxWidth: '720px', padding: '15px' },
        timestamp: 1001,
        aiGenerated: false,
        viewport: currentViewport,
      });

      // Step 5: Switch to mobile
      currentViewport = 'mobile';
      shapeWidth = responsiveManager.adjustShapeWidth(
        shapeWidth,
        'tablet',
        currentViewport
      );

      expect(shapeWidth).toBe(375);

      // Step 6: Add mobile-specific styles
      overrides.push({
        selector: '.container',
        styles: { maxWidth: '100%', padding: '10px' },
        timestamp: 1002,
        aiGenerated: false,
        viewport: currentViewport,
      });

      // Step 7: Generate media queries for export
      const css = responsiveManager.generateMediaQueries(overrides);

      // Verify all viewports are included
      expect(css).toContain('@media (max-width: 1920px)'); // desktop
      expect(css).toContain('@media (max-width: 768px)'); // tablet
      expect(css).toContain('@media (max-width: 375px)'); // mobile

      // Verify all styles are included
      expect(css).toContain('max-width: 1200px;');
      expect(css).toContain('max-width: 720px;');
      expect(css).toContain('max-width: 100%;');
    });

    it('should handle custom viewports in workflow', () => {
      const customViewport: ViewportConfig = { width: 1024, height: 768 };
      let shapeWidth = 1920;

      // Switch to custom viewport
      shapeWidth = responsiveManager.adjustShapeWidth(
        shapeWidth,
        'desktop',
        customViewport
      );

      expect(shapeWidth).toBe(1024);

      // Add styles for custom viewport
      const overrides: ViewportOverride[] = [
        {
          selector: '.content',
          styles: { fontSize: '15px' },
          timestamp: 1000,
          aiGenerated: false,
          viewport: customViewport,
        },
      ];

      // Generate media queries
      const css = responsiveManager.generateMediaQueries(overrides);

      expect(css).toContain('@media (max-width: 1024px)');
      expect(css).toContain('font-size: 15px;');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty overrides', () => {
      const css = responsiveManager.generateMediaQueries([]);
      expect(css).toBe('');
    });

    it('should handle overrides without viewport info', () => {
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '14px' },
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const css = responsiveManager.generateMediaQueries(overrides);
      expect(css).toBe('');
    });

    it('should handle mixed overrides (with and without viewport)', () => {
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { color: 'blue' },
          timestamp: 1000,
          aiGenerated: false,
        },
        {
          selector: '.button',
          styles: { fontSize: '14px' },
          timestamp: 1001,
          aiGenerated: false,
          viewport: 'mobile',
        },
      ];

      const css = responsiveManager.generateMediaQueries(overrides);

      // Should only include viewport-aware override
      expect(css).toContain('@media (max-width: 375px)');
      expect(css).toContain('font-size: 14px;');
      expect(css).not.toContain('color: blue;');
    });

    it('should handle viewport switching with zero width', () => {
      const shapeWidth = 0;
      const newWidth = responsiveManager.adjustShapeWidth(
        shapeWidth,
        'desktop',
        'mobile'
      );

      expect(newWidth).toBe(0);
    });
  });
});
