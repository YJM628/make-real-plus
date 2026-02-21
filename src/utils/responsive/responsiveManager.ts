/**
 * ResponsiveManager - Manages viewport-specific style overrides and media query generation
 * Feature: ai-html-visual-editor
 * 
 * Tracks which viewport each style override was created in and generates
 * appropriate CSS media queries for responsive design.
 * 
 * Requirements: 18.2, 18.4, 18.6
 */

import type { ElementOverride, ViewportConfig } from '../../types';
import { getViewportDimensions } from '../viewport/viewportConfig';

/**
 * Extended override that includes viewport information
 */
export interface ViewportOverride extends ElementOverride {
  /** The viewport this override was created in */
  viewport?: ViewportConfig;
}

/**
 * Grouped overrides by viewport
 */
export interface ViewportOverrideGroup {
  viewport: ViewportConfig;
  overrides: ElementOverride[];
}

/**
 * ResponsiveManager class for managing viewport-specific overrides
 */
export class ResponsiveManager {
  /**
   * Groups overrides by viewport
   * 
   * @param overrides - Array of viewport overrides
   * @returns Array of grouped overrides by viewport
   */
  groupOverridesByViewport(overrides: ViewportOverride[]): ViewportOverrideGroup[] {
    const groups = new Map<string, ViewportOverrideGroup>();

    for (const override of overrides) {
      if (!override.viewport) {
        continue; // Skip overrides without viewport info
      }

      const key = this.getViewportKey(override.viewport);
      
      if (!groups.has(key)) {
        groups.set(key, {
          viewport: override.viewport,
          overrides: [],
        });
      }

      // Add override without viewport property to avoid duplication
      const { viewport, ...overrideWithoutViewport } = override;
      groups.get(key)!.overrides.push(overrideWithoutViewport);
    }

    return Array.from(groups.values());
  }

  /**
   * Generates CSS media queries for viewport-specific overrides
   * 
   * Creates media queries that apply styles only at specific viewport sizes.
   * Uses max-width for mobile-first approach.
   * 
   * @param overrides - Array of viewport overrides
   * @returns CSS string with media queries
   * 
   * Requirements: 18.4, 18.6
   */
  generateMediaQueries(overrides: ViewportOverride[]): string {
    const groups = this.groupOverridesByViewport(overrides);
    
    if (groups.length === 0) {
      return '';
    }

    // Sort groups by viewport width (largest first for desktop-first approach)
    const sortedGroups = groups.sort((a, b) => {
      const widthA = getViewportDimensions(a.viewport).width;
      const widthB = getViewportDimensions(b.viewport).width;
      return widthB - widthA;
    });

    const mediaQueries: string[] = [];

    for (const group of sortedGroups) {
      const { width } = getViewportDimensions(group.viewport);
      const rules = this.generateCssRules(group.overrides);

      if (rules.length === 0) {
        continue;
      }

      // Generate media query
      const mediaQuery = this.formatMediaQuery(width, rules);
      mediaQueries.push(mediaQuery);
    }

    return mediaQueries.join('\n\n');
  }

  /**
   * Generates CSS rules from overrides
   * 
   * @param overrides - Array of element overrides
   * @returns Array of CSS rule strings
   */
  private generateCssRules(overrides: ElementOverride[]): string[] {
    const rules: string[] = [];

    for (const override of overrides) {
      if (!override.styles || Object.keys(override.styles).length === 0) {
        continue;
      }

      const declarations = this.generateCssDeclarations(override.styles);
      if (declarations.length === 0) {
        continue;
      }

      const rule = `  ${override.selector} {\n${declarations.join('\n')}\n  }`;
      rules.push(rule);
    }

    return rules;
  }

  /**
   * Generates CSS declarations from style object
   * 
   * @param styles - Style object
   * @returns Array of CSS declaration strings
   */
  private generateCssDeclarations(styles: Record<string, string>): string[] {
    const declarations: string[] = [];

    for (const [property, value] of Object.entries(styles)) {
      if (!value || value.trim() === '') {
        continue;
      }

      const kebabProperty = this.camelToKebab(property);
      declarations.push(`    ${kebabProperty}: ${value};`);
    }

    return declarations;
  }

  /**
   * Formats a media query with rules
   * 
   * @param maxWidth - Maximum width for the media query
   * @param rules - Array of CSS rules
   * @returns Formatted media query string
   */
  private formatMediaQuery(maxWidth: number, rules: string[]): string {
    return `@media (max-width: ${maxWidth}px) {\n${rules.join('\n')}\n}`;
  }

  /**
   * Gets a unique key for a viewport configuration
   * 
   * @param viewport - Viewport configuration
   * @returns Unique string key
   */
  private getViewportKey(viewport: ViewportConfig): string {
    if (typeof viewport === 'string') {
      return viewport;
    }
    return `custom-${viewport.width}x${viewport.height}`;
  }

  /**
   * Converts camelCase to kebab-case
   * 
   * @param str - String in camelCase
   * @returns String in kebab-case
   */
  private camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  }

  /**
   * Adjusts shape width based on viewport
   * 
   * When viewport changes, calculates the appropriate width for the HTML shape.
   * 
   * @param currentWidth - Current shape width
   * @param currentViewport - Current viewport configuration
   * @param newViewport - New viewport configuration
   * @returns New width for the shape
   * 
   * Requirements: 18.2
   */
  adjustShapeWidth(
    currentWidth: number,
    currentViewport: ViewportConfig,
    newViewport: ViewportConfig
  ): number {
    const currentDimensions = getViewportDimensions(currentViewport);
    const newDimensions = getViewportDimensions(newViewport);

    // Calculate scale factor
    const scaleFactor = newDimensions.width / currentDimensions.width;

    // Apply scale to current width
    return Math.round(currentWidth * scaleFactor);
  }

  /**
   * Checks if an override has viewport-specific styles
   * 
   * @param override - Element override to check
   * @returns True if override has viewport information
   */
  hasViewportInfo(override: ElementOverride): override is ViewportOverride {
    return 'viewport' in override && override.viewport !== undefined;
  }

  /**
   * Adds viewport information to an override
   * 
   * @param override - Element override
   * @param viewport - Viewport configuration
   * @returns Override with viewport information
   */
  addViewportInfo(
    override: ElementOverride,
    viewport: ViewportConfig
  ): ViewportOverride {
    return {
      ...override,
      viewport,
    };
  }

  /**
   * Filters overrides for a specific viewport
   * 
   * @param overrides - Array of viewport overrides
   * @param viewport - Viewport to filter by
   * @returns Overrides for the specified viewport
   */
  filterOverridesByViewport(
    overrides: ViewportOverride[],
    viewport: ViewportConfig
  ): ElementOverride[] {
    const key = this.getViewportKey(viewport);
    
    return overrides
      .filter(o => o.viewport && this.getViewportKey(o.viewport) === key)
      .map(({ viewport, ...override }) => override);
  }

  /**
   * Merges base overrides with viewport-specific overrides
   * 
   * Base overrides apply to all viewports, while viewport-specific
   * overrides only apply at their target viewport.
   * 
   * @param baseOverrides - Overrides without viewport info (apply to all)
   * @param viewportOverrides - Viewport-specific overrides
   * @param currentViewport - Current viewport
   * @returns Merged overrides for current viewport
   */
  mergeOverridesForViewport(
    baseOverrides: ElementOverride[],
    viewportOverrides: ViewportOverride[],
    currentViewport: ViewportConfig
  ): ElementOverride[] {
    // Start with base overrides
    const merged = [...baseOverrides];

    // Add viewport-specific overrides for current viewport
    const currentViewportOverrides = this.filterOverridesByViewport(
      viewportOverrides,
      currentViewport
    );

    // Merge by selector
    for (const viewportOverride of currentViewportOverrides) {
      const existingIndex = merged.findIndex(
        o => o.selector === viewportOverride.selector
      );

      if (existingIndex >= 0) {
        // Merge with existing override
        merged[existingIndex] = {
          ...merged[existingIndex],
          styles: {
            ...merged[existingIndex].styles,
            ...viewportOverride.styles,
          },
          timestamp: Math.max(
            merged[existingIndex].timestamp,
            viewportOverride.timestamp
          ),
        };
      } else {
        // Add new override
        merged.push(viewportOverride);
      }
    }

    return merged;
  }
}

// Export singleton instance
export const responsiveManager = new ResponsiveManager();
