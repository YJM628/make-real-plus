/**
 * Unit tests for ResponsiveManager
 * Feature: ai-html-visual-editor
 * 
 * Tests viewport-specific override management and media query generation.
 * 
 * Requirements: 18.2, 18.4, 18.6
 */

import {
  ResponsiveManager,
  ViewportOverride,
} from '../../utils/responsive/responsiveManager';
import type { ElementOverride, ViewportConfig } from '../../types';

describe('ResponsiveManager', () => {
  let manager: ResponsiveManager;

  beforeEach(() => {
    manager = new ResponsiveManager();
  });

  describe('groupOverridesByViewport', () => {
    it('should group overrides by viewport', () => {
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '16px' },
          timestamp: 1000,
          aiGenerated: false,
          viewport: 'mobile',
        },
        {
          selector: '.header',
          styles: { padding: '10px' },
          timestamp: 1001,
          aiGenerated: false,
          viewport: 'mobile',
        },
        {
          selector: '.button',
          styles: { fontSize: '18px' },
          timestamp: 1002,
          aiGenerated: false,
          viewport: 'tablet',
        },
      ];

      const groups = manager.groupOverridesByViewport(overrides);

      expect(groups).toHaveLength(2);
      expect(groups.find(g => g.viewport === 'mobile')?.overrides).toHaveLength(2);
      expect(groups.find(g => g.viewport === 'tablet')?.overrides).toHaveLength(1);
    });

    it('should skip overrides without viewport info', () => {
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '16px' },
          timestamp: 1000,
          aiGenerated: false,
          viewport: 'mobile',
        },
        {
          selector: '.header',
          styles: { padding: '10px' },
          timestamp: 1001,
          aiGenerated: false,
        },
      ];

      const groups = manager.groupOverridesByViewport(overrides);

      expect(groups).toHaveLength(1);
      expect(groups[0].viewport).toBe('mobile');
    });

    it('should handle custom viewports', () => {
      const customViewport: ViewportConfig = { width: 1024, height: 768 };
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '16px' },
          timestamp: 1000,
          aiGenerated: false,
          viewport: customViewport,
        },
      ];

      const groups = manager.groupOverridesByViewport(overrides);

      expect(groups).toHaveLength(1);
      expect(groups[0].viewport).toEqual(customViewport);
    });

    it('should return empty array for empty input', () => {
      const groups = manager.groupOverridesByViewport([]);
      expect(groups).toEqual([]);
    });
  });

  describe('generateMediaQueries', () => {
    it('should generate media queries for viewport overrides', () => {
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '14px', padding: '8px' },
          timestamp: 1000,
          aiGenerated: false,
          viewport: 'mobile',
        },
        {
          selector: '.header',
          styles: { height: '50px' },
          timestamp: 1001,
          aiGenerated: false,
          viewport: 'mobile',
        },
      ];

      const css = manager.generateMediaQueries(overrides);

      expect(css).toContain('@media (max-width: 375px)');
      expect(css).toContain('.button');
      expect(css).toContain('font-size: 14px;');
      expect(css).toContain('padding: 8px;');
      expect(css).toContain('.header');
      expect(css).toContain('height: 50px;');
    });

    it('should sort viewports by width (largest first)', () => {
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '14px' },
          timestamp: 1000,
          aiGenerated: false,
          viewport: 'mobile',
        },
        {
          selector: '.button',
          styles: { fontSize: '16px' },
          timestamp: 1001,
          aiGenerated: false,
          viewport: 'tablet',
        },
        {
          selector: '.button',
          styles: { fontSize: '18px' },
          timestamp: 1002,
          aiGenerated: false,
          viewport: 'desktop',
        },
      ];

      const css = manager.generateMediaQueries(overrides);

      // Desktop should come first (largest width)
      const desktopIndex = css.indexOf('@media (max-width: 1920px)');
      const tabletIndex = css.indexOf('@media (max-width: 768px)');
      const mobileIndex = css.indexOf('@media (max-width: 375px)');

      expect(desktopIndex).toBeLessThan(tabletIndex);
      expect(tabletIndex).toBeLessThan(mobileIndex);
    });

    it('should handle custom viewports', () => {
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '15px' },
          timestamp: 1000,
          aiGenerated: false,
          viewport: { width: 1024, height: 768 },
        },
      ];

      const css = manager.generateMediaQueries(overrides);

      expect(css).toContain('@media (max-width: 1024px)');
      expect(css).toContain('font-size: 15px;');
    });

    it('should skip overrides without styles', () => {
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          text: 'Click me',
          timestamp: 1000,
          aiGenerated: false,
          viewport: 'mobile',
        },
      ];

      const css = manager.generateMediaQueries(overrides);

      expect(css).toBe('');
    });

    it('should skip overrides with empty styles', () => {
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: {},
          timestamp: 1000,
          aiGenerated: false,
          viewport: 'mobile',
        },
      ];

      const css = manager.generateMediaQueries(overrides);

      expect(css).toBe('');
    });

    it('should convert camelCase to kebab-case', () => {
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '14px', backgroundColor: 'blue' },
          timestamp: 1000,
          aiGenerated: false,
          viewport: 'mobile',
        },
      ];

      const css = manager.generateMediaQueries(overrides);

      expect(css).toContain('font-size: 14px;');
      expect(css).toContain('background-color: blue;');
      expect(css).not.toContain('fontSize');
      expect(css).not.toContain('backgroundColor');
    });

    it('should return empty string for empty input', () => {
      const css = manager.generateMediaQueries([]);
      expect(css).toBe('');
    });

    it('should return empty string for overrides without viewport', () => {
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '14px' },
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const css = manager.generateMediaQueries(overrides);
      expect(css).toBe('');
    });
  });

  describe('adjustShapeWidth', () => {
    it('should scale width when switching from desktop to mobile', () => {
      const currentWidth = 1920;
      const newWidth = manager.adjustShapeWidth(currentWidth, 'desktop', 'mobile');

      // 1920 * (375 / 1920) = 375
      expect(newWidth).toBe(375);
    });

    it('should scale width when switching from mobile to tablet', () => {
      const currentWidth = 375;
      const newWidth = manager.adjustShapeWidth(currentWidth, 'mobile', 'tablet');

      // 375 * (768 / 375) ≈ 768
      expect(newWidth).toBe(768);
    });

    it('should scale width when switching from tablet to desktop', () => {
      const currentWidth = 768;
      const newWidth = manager.adjustShapeWidth(currentWidth, 'tablet', 'desktop');

      // 768 * (1920 / 768) = 1920
      expect(newWidth).toBe(1920);
    });

    it('should handle custom viewports', () => {
      const currentWidth = 1024;
      const newWidth = manager.adjustShapeWidth(
        currentWidth,
        { width: 1024, height: 768 },
        { width: 512, height: 384 }
      );

      // 1024 * (512 / 1024) = 512
      expect(newWidth).toBe(512);
    });

    it('should return same width when viewport unchanged', () => {
      const currentWidth = 1920;
      const newWidth = manager.adjustShapeWidth(currentWidth, 'desktop', 'desktop');

      expect(newWidth).toBe(currentWidth);
    });

    it('should round to nearest integer', () => {
      const currentWidth = 1000;
      const newWidth = manager.adjustShapeWidth(
        currentWidth,
        { width: 1000, height: 800 },
        { width: 333, height: 266 }
      );

      // 1000 * (333 / 1000) = 333
      expect(Number.isInteger(newWidth)).toBe(true);
    });
  });

  describe('hasViewportInfo', () => {
    it('should return true for override with viewport', () => {
      const override: ViewportOverride = {
        selector: '.button',
        styles: { fontSize: '14px' },
        timestamp: 1000,
        aiGenerated: false,
        viewport: 'mobile',
      };

      expect(manager.hasViewportInfo(override)).toBe(true);
    });

    it('should return false for override without viewport', () => {
      const override: ElementOverride = {
        selector: '.button',
        styles: { fontSize: '14px' },
        timestamp: 1000,
        aiGenerated: false,
      };

      expect(manager.hasViewportInfo(override)).toBe(false);
    });
  });

  describe('addViewportInfo', () => {
    it('should add viewport to override', () => {
      const override: ElementOverride = {
        selector: '.button',
        styles: { fontSize: '14px' },
        timestamp: 1000,
        aiGenerated: false,
      };

      const withViewport = manager.addViewportInfo(override, 'mobile');

      expect(withViewport.viewport).toBe('mobile');
      expect(withViewport.selector).toBe('.button');
      expect(withViewport.styles).toEqual({ fontSize: '14px' });
    });

    it('should not mutate original override', () => {
      const override: ElementOverride = {
        selector: '.button',
        styles: { fontSize: '14px' },
        timestamp: 1000,
        aiGenerated: false,
      };

      const withViewport = manager.addViewportInfo(override, 'mobile');

      expect('viewport' in override).toBe(false);
      expect(withViewport).not.toBe(override);
    });
  });

  describe('filterOverridesByViewport', () => {
    it('should filter overrides for specific viewport', () => {
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '14px' },
          timestamp: 1000,
          aiGenerated: false,
          viewport: 'mobile',
        },
        {
          selector: '.header',
          styles: { padding: '10px' },
          timestamp: 1001,
          aiGenerated: false,
          viewport: 'tablet',
        },
        {
          selector: '.footer',
          styles: { height: '50px' },
          timestamp: 1002,
          aiGenerated: false,
          viewport: 'mobile',
        },
      ];

      const mobileOverrides = manager.filterOverridesByViewport(overrides, 'mobile');

      expect(mobileOverrides).toHaveLength(2);
      expect(mobileOverrides[0].selector).toBe('.button');
      expect(mobileOverrides[1].selector).toBe('.footer');
      expect('viewport' in mobileOverrides[0]).toBe(false);
    });

    it('should return empty array when no matches', () => {
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '14px' },
          timestamp: 1000,
          aiGenerated: false,
          viewport: 'mobile',
        },
      ];

      const desktopOverrides = manager.filterOverridesByViewport(overrides, 'desktop');

      expect(desktopOverrides).toEqual([]);
    });

    it('should handle custom viewports', () => {
      const customViewport: ViewportConfig = { width: 1024, height: 768 };
      const overrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '14px' },
          timestamp: 1000,
          aiGenerated: false,
          viewport: customViewport,
        },
      ];

      const filtered = manager.filterOverridesByViewport(overrides, customViewport);

      expect(filtered).toHaveLength(1);
    });
  });

  describe('mergeOverridesForViewport', () => {
    it('should merge base and viewport-specific overrides', () => {
      const baseOverrides: ElementOverride[] = [
        {
          selector: '.button',
          styles: { color: 'blue' },
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const viewportOverrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '14px' },
          timestamp: 1001,
          aiGenerated: false,
          viewport: 'mobile',
        },
      ];

      const merged = manager.mergeOverridesForViewport(
        baseOverrides,
        viewportOverrides,
        'mobile'
      );

      expect(merged).toHaveLength(1);
      expect(merged[0].styles).toEqual({
        color: 'blue',
        fontSize: '14px',
      });
    });

    it('should only include overrides for current viewport', () => {
      const baseOverrides: ElementOverride[] = [];

      const viewportOverrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '14px' },
          timestamp: 1000,
          aiGenerated: false,
          viewport: 'mobile',
        },
        {
          selector: '.header',
          styles: { padding: '20px' },
          timestamp: 1001,
          aiGenerated: false,
          viewport: 'tablet',
        },
      ];

      const merged = manager.mergeOverridesForViewport(
        baseOverrides,
        viewportOverrides,
        'mobile'
      );

      expect(merged).toHaveLength(1);
      expect(merged[0].selector).toBe('.button');
    });

    it('should add viewport overrides that do not exist in base', () => {
      const baseOverrides: ElementOverride[] = [
        {
          selector: '.button',
          styles: { color: 'blue' },
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const viewportOverrides: ViewportOverride[] = [
        {
          selector: '.header',
          styles: { fontSize: '20px' },
          timestamp: 1001,
          aiGenerated: false,
          viewport: 'mobile',
        },
      ];

      const merged = manager.mergeOverridesForViewport(
        baseOverrides,
        viewportOverrides,
        'mobile'
      );

      expect(merged).toHaveLength(2);
      expect(merged.find(o => o.selector === '.button')).toBeDefined();
      expect(merged.find(o => o.selector === '.header')).toBeDefined();
    });

    it('should use latest timestamp when merging', () => {
      const baseOverrides: ElementOverride[] = [
        {
          selector: '.button',
          styles: { color: 'blue' },
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const viewportOverrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '14px' },
          timestamp: 2000,
          aiGenerated: false,
          viewport: 'mobile',
        },
      ];

      const merged = manager.mergeOverridesForViewport(
        baseOverrides,
        viewportOverrides,
        'mobile'
      );

      expect(merged[0].timestamp).toBe(2000);
    });

    it('should not mutate original arrays', () => {
      const baseOverrides: ElementOverride[] = [
        {
          selector: '.button',
          styles: { color: 'blue' },
          timestamp: 1000,
          aiGenerated: false,
        },
      ];

      const viewportOverrides: ViewportOverride[] = [
        {
          selector: '.button',
          styles: { fontSize: '14px' },
          timestamp: 1001,
          aiGenerated: false,
          viewport: 'mobile',
        },
      ];

      const originalBaseLength = baseOverrides.length;
      const originalViewportLength = viewportOverrides.length;

      manager.mergeOverridesForViewport(baseOverrides, viewportOverrides, 'mobile');

      expect(baseOverrides).toHaveLength(originalBaseLength);
      expect(viewportOverrides).toHaveLength(originalViewportLength);
    });
  });
});
