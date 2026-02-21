/**
 * OverrideStore - Manages element overrides for HTML shapes
 * Feature: ai-html-visual-editor
 * Requirements: 9.1, 9.2, 9.3
 */

import type { ElementOverride } from '../../types';

/**
 * Store for managing element overrides
 * Tracks modifications to HTML elements without changing the original code
 */
export class OverrideStore {
  private overrides: Map<string, ElementOverride[]>;

  constructor() {
    this.overrides = new Map();
  }

  /**
   * Add a new override to the store
   * If an override for the same selector already exists, it will be added to the list
   * 
   * @param override - The element override to add
   * @returns The added override
   * 
   * Requirements: 9.1 - When user modifies element, Visual_Editor should create Element_Override record
   */
  addOverride(override: ElementOverride): ElementOverride {
    const { selector } = override;
    
    if (!this.overrides.has(selector)) {
      this.overrides.set(selector, []);
    }
    
    const selectorOverrides = this.overrides.get(selector)!;
    selectorOverrides.push(override);
    
    return override;
  }

  /**
   * Merge multiple overrides for the same element
   * Later overrides (by timestamp) take precedence over earlier ones
   * 
   * @param selector - The CSS selector to merge overrides for
   * @returns A single merged override, or undefined if no overrides exist
   * 
   * Requirements: 9.3 - When same element is modified multiple times, Visual_Editor should merge them into single Element_Override
   */
  mergeOverrides(selector: string): ElementOverride | undefined {
    const selectorOverrides = this.overrides.get(selector);
    
    if (!selectorOverrides || selectorOverrides.length === 0) {
      return undefined;
    }
    
    // Sort by timestamp (oldest first)
    const sorted = [...selectorOverrides].sort((a, b) => a.timestamp - b.timestamp);
    
    // Start with the first override
    const merged: ElementOverride = {
      selector,
      timestamp: sorted[sorted.length - 1].timestamp, // Use latest timestamp
      aiGenerated: sorted.some(o => o.aiGenerated), // True if any was AI-generated
    };
    
    // Merge all overrides in order (later ones override earlier ones)
    for (const override of sorted) {
      if (override.text !== undefined) {
        merged.text = override.text;
        if (!merged.original) merged.original = {};
        if (override.original?.text !== undefined) {
          merged.original.text = override.original.text;
        }
      }
      
      if (override.styles !== undefined) {
        merged.styles = { ...merged.styles, ...override.styles };
        if (!merged.original) merged.original = {};
        if (override.original?.styles !== undefined) {
          merged.original.styles = { ...merged.original.styles, ...override.original.styles };
        }
      }
      
      if (override.html !== undefined) {
        merged.html = override.html;
        if (!merged.original) merged.original = {};
        if (override.original?.html !== undefined) {
          merged.original.html = override.original.html;
        }
      }
      
      if (override.attributes !== undefined) {
        merged.attributes = { ...merged.attributes, ...override.attributes };
        if (!merged.original) merged.original = {};
        if (override.original?.attributes !== undefined) {
          merged.original.attributes = { ...merged.original.attributes, ...override.original.attributes };
        }
      }
      
      if (override.position !== undefined) {
        merged.position = { ...override.position };
        if (!merged.original) merged.original = {};
        if (override.original?.position !== undefined) {
          merged.original.position = { ...override.original.position };
        }
      }
      
      if (override.size !== undefined) {
        merged.size = { ...override.size };
        if (!merged.original) merged.original = {};
        if (override.original?.size !== undefined) {
          merged.original.size = { ...override.original.size };
        }
      }
    }
    
    return merged;
  }

  /**
   * Get all overrides for a specific selector
   * 
   * @param selector - The CSS selector to query
   * @returns Array of overrides for the selector, or empty array if none exist
   * 
   * Requirements: 9.2 - Element_Override should contain CSS_Selector, modification type, new value, timestamp, and AI generation flag
   */
  getOverridesBySelector(selector: string): ElementOverride[] {
    return this.overrides.get(selector) || [];
  }

  /**
   * Remove a specific override
   * 
   * @param selector - The CSS selector of the override
   * @param timestamp - The timestamp of the specific override to remove
   * @returns True if the override was removed, false if it wasn't found
   * 
   * Requirements: 9.5 - Visual_Editor should support reverting single Element_Override without affecting other modifications
   */
  removeOverride(selector: string, timestamp: number): boolean {
    const selectorOverrides = this.overrides.get(selector);
    
    if (!selectorOverrides) {
      return false;
    }
    
    const initialLength = selectorOverrides.length;
    const filtered = selectorOverrides.filter(o => o.timestamp !== timestamp);
    
    if (filtered.length === 0) {
      this.overrides.delete(selector);
    } else {
      this.overrides.set(selector, filtered);
    }
    
    return filtered.length < initialLength;
  }

  /**
   * Get all overrides from the store
   * Returns a flat array of all overrides across all selectors
   * 
   * @returns Array of all overrides
   * 
   * Requirements: 9.4 - When rendering HTML, Visual_Editor should apply all Element_Override in chronological order
   */
  getAllOverrides(): ElementOverride[] {
    const allOverrides: ElementOverride[] = [];
    
    for (const selectorOverrides of this.overrides.values()) {
      allOverrides.push(...selectorOverrides);
    }
    
    // Sort by timestamp (oldest first) for chronological application
    return allOverrides.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Clear all overrides from the store
   * 
   * Requirements: 9.1 - Support for clearing all modifications
   */
  clearOverrides(): void {
    this.overrides.clear();
  }

  /**
   * Get the number of overrides in the store
   * 
   * @returns Total count of all overrides
   */
  getOverrideCount(): number {
    let count = 0;
    for (const selectorOverrides of this.overrides.values()) {
      count += selectorOverrides.length;
    }
    return count;
  }

  /**
   * Get all unique selectors that have overrides
   * 
   * @returns Array of CSS selectors
   */
  getSelectors(): string[] {
    return Array.from(this.overrides.keys());
  }

  /**
   * Check if a selector has any overrides
   * 
   * @param selector - The CSS selector to check
   * @returns True if the selector has overrides
   */
  hasOverrides(selector: string): boolean {
    const selectorOverrides = this.overrides.get(selector);
    return selectorOverrides !== undefined && selectorOverrides.length > 0;
  }
}
