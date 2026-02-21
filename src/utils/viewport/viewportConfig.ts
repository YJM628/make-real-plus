/**
 * Viewport configuration system for responsive design support
 * Feature: ai-html-visual-editor
 * Requirements: 18.1, 18.3, 18.5
 */

import type { ViewportConfig } from '../../types';

/**
 * Preset viewport configurations
 */
export const PRESET_VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
} as const;

/**
 * Get viewport dimensions from a ViewportConfig
 */
export function getViewportDimensions(viewport: ViewportConfig): {
  width: number;
  height: number;
} {
  if (typeof viewport === 'string') {
    return PRESET_VIEWPORTS[viewport];
  }
  return viewport;
}

/**
 * Check if a viewport config is a preset
 */
export function isPresetViewport(
  viewport: ViewportConfig
): viewport is 'desktop' | 'tablet' | 'mobile' {
  return typeof viewport === 'string';
}

/**
 * Check if a viewport config is custom
 */
export function isCustomViewport(
  viewport: ViewportConfig
): viewport is { width: number; height: number } {
  return typeof viewport === 'object';
}

/**
 * Validate custom viewport dimensions
 */
export function validateCustomViewport(
  width: number,
  height: number
): { valid: boolean; error?: string } {
  if (!Number.isFinite(width) || width <= 0) {
    return { valid: false, error: 'Width must be a positive number' };
  }
  if (!Number.isFinite(height) || height <= 0) {
    return { valid: false, error: 'Height must be a positive number' };
  }
  if (width < 320) {
    return { valid: false, error: 'Width must be at least 320px' };
  }
  if (height < 240) {
    return { valid: false, error: 'Height must be at least 240px' };
  }
  if (width > 7680) {
    return { valid: false, error: 'Width must not exceed 7680px (8K)' };
  }
  if (height > 4320) {
    return { valid: false, error: 'Height must not exceed 4320px (8K)' };
  }
  return { valid: true };
}

/**
 * Create a custom viewport config
 */
export function createCustomViewport(
  width: number,
  height: number
): ViewportConfig | { error: string } {
  const validation = validateCustomViewport(width, height);
  if (!validation.valid) {
    return { error: validation.error! };
  }
  return { width, height };
}

/**
 * Format viewport dimensions as a display string
 */
export function formatViewportSize(viewport: ViewportConfig): string {
  const { width, height } = getViewportDimensions(viewport);
  return `${width} × ${height}`;
}

/**
 * Get viewport name for display
 */
export function getViewportName(viewport: ViewportConfig): string {
  if (isPresetViewport(viewport)) {
    return viewport.charAt(0).toUpperCase() + viewport.slice(1);
  }
  return 'Custom';
}

/**
 * Get all preset viewport options
 */
export function getPresetViewportOptions(): Array<{
  value: 'desktop' | 'tablet' | 'mobile';
  label: string;
  dimensions: string;
}> {
  return [
    {
      value: 'desktop',
      label: 'Desktop',
      dimensions: formatViewportSize('desktop'),
    },
    {
      value: 'tablet',
      label: 'Tablet',
      dimensions: formatViewportSize('tablet'),
    },
    {
      value: 'mobile',
      label: 'Mobile',
      dimensions: formatViewportSize('mobile'),
    },
  ];
}

/**
 * Switch viewport configuration
 * Returns the new viewport config
 */
export function switchViewport(
  _currentViewport: ViewportConfig,
  newViewport: ViewportConfig
): ViewportConfig {
  return newViewport;
}

/**
 * Calculate aspect ratio from viewport
 */
export function getViewportAspectRatio(viewport: ViewportConfig): number {
  const { width, height } = getViewportDimensions(viewport);
  return width / height;
}

/**
 * Check if two viewports are equal
 */
export function areViewportsEqual(
  a: ViewportConfig,
  b: ViewportConfig
): boolean {
  const dimsA = getViewportDimensions(a);
  const dimsB = getViewportDimensions(b);
  return dimsA.width === dimsB.width && dimsA.height === dimsB.height;
}
