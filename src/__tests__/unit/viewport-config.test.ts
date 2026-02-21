/**
 * Unit tests for viewport configuration system
 * Feature: ai-html-visual-editor
 * Requirements: 18.1, 18.3, 18.5
 */

import {
  PRESET_VIEWPORTS,
  getViewportDimensions,
  isPresetViewport,
  isCustomViewport,
  validateCustomViewport,
  createCustomViewport,
  formatViewportSize,
  getViewportName,
  getPresetViewportOptions,
  switchViewport,
  getViewportAspectRatio,
  areViewportsEqual,
} from '../../utils/viewport';
import type { ViewportConfig } from '../../types';

describe('Viewport Configuration System', () => {
  describe('PRESET_VIEWPORTS', () => {
    it('should define desktop viewport as 1920x1080', () => {
      expect(PRESET_VIEWPORTS.desktop).toEqual({ width: 1920, height: 1080 });
    });

    it('should define tablet viewport as 768x1024', () => {
      expect(PRESET_VIEWPORTS.tablet).toEqual({ width: 768, height: 1024 });
    });

    it('should define mobile viewport as 375x667', () => {
      expect(PRESET_VIEWPORTS.mobile).toEqual({ width: 375, height: 667 });
    });
  });

  describe('getViewportDimensions', () => {
    it('should return dimensions for desktop preset', () => {
      const dims = getViewportDimensions('desktop');
      expect(dims).toEqual({ width: 1920, height: 1080 });
    });

    it('should return dimensions for tablet preset', () => {
      const dims = getViewportDimensions('tablet');
      expect(dims).toEqual({ width: 768, height: 1024 });
    });

    it('should return dimensions for mobile preset', () => {
      const dims = getViewportDimensions('mobile');
      expect(dims).toEqual({ width: 375, height: 667 });
    });

    it('should return custom dimensions as-is', () => {
      const custom: ViewportConfig = { width: 1024, height: 768 };
      const dims = getViewportDimensions(custom);
      expect(dims).toEqual({ width: 1024, height: 768 });
    });
  });

  describe('isPresetViewport', () => {
    it('should return true for desktop', () => {
      expect(isPresetViewport('desktop')).toBe(true);
    });

    it('should return true for tablet', () => {
      expect(isPresetViewport('tablet')).toBe(true);
    });

    it('should return true for mobile', () => {
      expect(isPresetViewport('mobile')).toBe(true);
    });

    it('should return false for custom viewport', () => {
      const custom: ViewportConfig = { width: 1024, height: 768 };
      expect(isPresetViewport(custom)).toBe(false);
    });
  });

  describe('isCustomViewport', () => {
    it('should return false for desktop', () => {
      expect(isCustomViewport('desktop')).toBe(false);
    });

    it('should return false for tablet', () => {
      expect(isCustomViewport('tablet')).toBe(false);
    });

    it('should return false for mobile', () => {
      expect(isCustomViewport('mobile')).toBe(false);
    });

    it('should return true for custom viewport', () => {
      const custom: ViewportConfig = { width: 1024, height: 768 };
      expect(isCustomViewport(custom)).toBe(true);
    });
  });

  describe('validateCustomViewport', () => {
    it('should validate valid dimensions', () => {
      const result = validateCustomViewport(1024, 768);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject zero width', () => {
      const result = validateCustomViewport(0, 768);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Width must be a positive number');
    });

    it('should reject negative width', () => {
      const result = validateCustomViewport(-100, 768);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Width must be a positive number');
    });

    it('should reject zero height', () => {
      const result = validateCustomViewport(1024, 0);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Height must be a positive number');
    });

    it('should reject negative height', () => {
      const result = validateCustomViewport(1024, -100);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Height must be a positive number');
    });

    it('should reject width below minimum (320px)', () => {
      const result = validateCustomViewport(319, 768);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Width must be at least 320px');
    });

    it('should accept width at minimum (320px)', () => {
      const result = validateCustomViewport(320, 768);
      expect(result.valid).toBe(true);
    });

    it('should reject height below minimum (240px)', () => {
      const result = validateCustomViewport(1024, 239);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Height must be at least 240px');
    });

    it('should accept height at minimum (240px)', () => {
      const result = validateCustomViewport(1024, 240);
      expect(result.valid).toBe(true);
    });

    it('should reject width above maximum (7680px)', () => {
      const result = validateCustomViewport(7681, 768);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Width must not exceed 7680px (8K)');
    });

    it('should accept width at maximum (7680px)', () => {
      const result = validateCustomViewport(7680, 768);
      expect(result.valid).toBe(true);
    });

    it('should reject height above maximum (4320px)', () => {
      const result = validateCustomViewport(1024, 4321);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Height must not exceed 4320px (8K)');
    });

    it('should accept height at maximum (4320px)', () => {
      const result = validateCustomViewport(1024, 4320);
      expect(result.valid).toBe(true);
    });

    it('should reject non-finite width', () => {
      const result = validateCustomViewport(NaN, 768);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Width must be a positive number');
    });

    it('should reject non-finite height', () => {
      const result = validateCustomViewport(1024, Infinity);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Height must be a positive number');
    });
  });

  describe('createCustomViewport', () => {
    it('should create valid custom viewport', () => {
      const result = createCustomViewport(1024, 768);
      expect(result).toEqual({ width: 1024, height: 768 });
    });

    it('should return error for invalid width', () => {
      const result = createCustomViewport(0, 768);
      expect(result).toEqual({ error: 'Width must be a positive number' });
    });

    it('should return error for invalid height', () => {
      const result = createCustomViewport(1024, 0);
      expect(result).toEqual({ error: 'Height must be a positive number' });
    });

    it('should return error for width below minimum', () => {
      const result = createCustomViewport(100, 768);
      expect(result).toEqual({ error: 'Width must be at least 320px' });
    });

    it('should return error for height below minimum', () => {
      const result = createCustomViewport(1024, 100);
      expect(result).toEqual({ error: 'Height must be at least 240px' });
    });
  });

  describe('formatViewportSize', () => {
    it('should format desktop viewport', () => {
      const formatted = formatViewportSize('desktop');
      expect(formatted).toBe('1920 × 1080');
    });

    it('should format tablet viewport', () => {
      const formatted = formatViewportSize('tablet');
      expect(formatted).toBe('768 × 1024');
    });

    it('should format mobile viewport', () => {
      const formatted = formatViewportSize('mobile');
      expect(formatted).toBe('375 × 667');
    });

    it('should format custom viewport', () => {
      const custom: ViewportConfig = { width: 1024, height: 768 };
      const formatted = formatViewportSize(custom);
      expect(formatted).toBe('1024 × 768');
    });
  });

  describe('getViewportName', () => {
    it('should return "Desktop" for desktop preset', () => {
      expect(getViewportName('desktop')).toBe('Desktop');
    });

    it('should return "Tablet" for tablet preset', () => {
      expect(getViewportName('tablet')).toBe('Tablet');
    });

    it('should return "Mobile" for mobile preset', () => {
      expect(getViewportName('mobile')).toBe('Mobile');
    });

    it('should return "Custom" for custom viewport', () => {
      const custom: ViewportConfig = { width: 1024, height: 768 };
      expect(getViewportName(custom)).toBe('Custom');
    });
  });

  describe('getPresetViewportOptions', () => {
    it('should return all preset options', () => {
      const options = getPresetViewportOptions();
      expect(options).toHaveLength(3);
      expect(options[0]).toEqual({
        value: 'desktop',
        label: 'Desktop',
        dimensions: '1920 × 1080',
      });
      expect(options[1]).toEqual({
        value: 'tablet',
        label: 'Tablet',
        dimensions: '768 × 1024',
      });
      expect(options[2]).toEqual({
        value: 'mobile',
        label: 'Mobile',
        dimensions: '375 × 667',
      });
    });
  });

  describe('switchViewport', () => {
    it('should switch from desktop to tablet', () => {
      const result = switchViewport('desktop', 'tablet');
      expect(result).toBe('tablet');
    });

    it('should switch from preset to custom', () => {
      const custom: ViewportConfig = { width: 1024, height: 768 };
      const result = switchViewport('desktop', custom);
      expect(result).toEqual(custom);
    });

    it('should switch from custom to preset', () => {
      const custom: ViewportConfig = { width: 1024, height: 768 };
      const result = switchViewport(custom, 'mobile');
      expect(result).toBe('mobile');
    });

    it('should switch between custom viewports', () => {
      const custom1: ViewportConfig = { width: 1024, height: 768 };
      const custom2: ViewportConfig = { width: 800, height: 600 };
      const result = switchViewport(custom1, custom2);
      expect(result).toEqual(custom2);
    });
  });

  describe('getViewportAspectRatio', () => {
    it('should calculate aspect ratio for desktop (16:9)', () => {
      const ratio = getViewportAspectRatio('desktop');
      expect(ratio).toBeCloseTo(1920 / 1080, 5);
    });

    it('should calculate aspect ratio for tablet (3:4)', () => {
      const ratio = getViewportAspectRatio('tablet');
      expect(ratio).toBeCloseTo(768 / 1024, 5);
    });

    it('should calculate aspect ratio for mobile', () => {
      const ratio = getViewportAspectRatio('mobile');
      expect(ratio).toBeCloseTo(375 / 667, 5);
    });

    it('should calculate aspect ratio for custom viewport', () => {
      const custom: ViewportConfig = { width: 1024, height: 768 };
      const ratio = getViewportAspectRatio(custom);
      expect(ratio).toBeCloseTo(1024 / 768, 5);
    });
  });

  describe('areViewportsEqual', () => {
    it('should return true for same preset viewports', () => {
      expect(areViewportsEqual('desktop', 'desktop')).toBe(true);
    });

    it('should return false for different preset viewports', () => {
      expect(areViewportsEqual('desktop', 'tablet')).toBe(false);
    });

    it('should return true for custom viewports with same dimensions', () => {
      const custom1: ViewportConfig = { width: 1024, height: 768 };
      const custom2: ViewportConfig = { width: 1024, height: 768 };
      expect(areViewportsEqual(custom1, custom2)).toBe(true);
    });

    it('should return false for custom viewports with different dimensions', () => {
      const custom1: ViewportConfig = { width: 1024, height: 768 };
      const custom2: ViewportConfig = { width: 800, height: 600 };
      expect(areViewportsEqual(custom1, custom2)).toBe(false);
    });

    it('should return true for preset and custom with same dimensions', () => {
      const custom: ViewportConfig = { width: 1920, height: 1080 };
      expect(areViewportsEqual('desktop', custom)).toBe(true);
    });

    it('should return false for preset and custom with different dimensions', () => {
      const custom: ViewportConfig = { width: 1024, height: 768 };
      expect(areViewportsEqual('desktop', custom)).toBe(false);
    });
  });
});
