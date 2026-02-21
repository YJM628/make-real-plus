/**
 * Design System Registry and Factory
 * Feature: ai-html-visual-editor
 * Requirements: 1.5, 1.7, 13.1, 13.2, 13.3, 13.4, 13.5
 */

import type { DesignSystemAdapter } from './DesignSystemAdapter';
import { MaterialUIAdapter } from './MaterialUIAdapter';
import { AntDesignAdapter } from './AntDesignAdapter';
import { TailwindAdapter } from './TailwindAdapter';

/**
 * Supported design systems
 */
export type DesignSystemType = 'material-ui' | 'ant-design' | 'tailwind' | 'vanilla';

/**
 * Design System Registry
 * 
 * Manages available design system adapters and provides
 * factory methods to create adapter instances.
 */
export class DesignSystemRegistry {
  private static adapters = new Map<DesignSystemType, () => DesignSystemAdapter>([
    ['material-ui', () => new MaterialUIAdapter()],
    ['ant-design', () => new AntDesignAdapter()],
    ['tailwind', () => new TailwindAdapter()],
  ]);

  /**
   * Get a design system adapter by type
   * @param type - Design system type
   * @returns Design system adapter instance
   * @throws Error if design system is not supported
   */
  static getAdapter(type: DesignSystemType): DesignSystemAdapter | null {
    if (type === 'vanilla') {
      return null; // No adapter needed for vanilla HTML/CSS
    }

    const factory = this.adapters.get(type);
    if (!factory) {
      throw new Error(`Unsupported design system: ${type}`);
    }

    return factory();
  }

  /**
   * Register a custom design system adapter
   * @param type - Design system type identifier
   * @param factory - Factory function to create adapter instance
   */
  static registerAdapter(
    type: string,
    factory: () => DesignSystemAdapter
  ): void {
    this.adapters.set(type as DesignSystemType, factory);
  }

  /**
   * Get all supported design system types
   * @returns Array of supported design system types
   */
  static getSupportedTypes(): DesignSystemType[] {
    return ['vanilla', ...Array.from(this.adapters.keys())];
  }

  /**
   * Check if a design system is supported
   * @param type - Design system type to check
   * @returns true if supported, false otherwise
   */
  static isSupported(type: string): type is DesignSystemType {
    return type === 'vanilla' || this.adapters.has(type as DesignSystemType);
  }
}

/**
 * Get design system adapter by type
 * Convenience function for getting adapters
 * 
 * @param type - Design system type
 * @returns Design system adapter instance or null for vanilla
 * 
 * @example
 * ```typescript
 * const adapter = getDesignSystemAdapter('material-ui');
 * const instructions = adapter.getPromptInstructions();
 * ```
 */
export function getDesignSystemAdapter(
  type: DesignSystemType
): DesignSystemAdapter | null {
  return DesignSystemRegistry.getAdapter(type);
}

/**
 * Get AI prompt instructions for a design system
 * 
 * @param type - Design system type
 * @returns Prompt instructions string, or empty string for vanilla
 * 
 * @example
 * ```typescript
 * const instructions = getDesignSystemInstructions('tailwind');
 * const prompt = `${userPrompt}\n\n${instructions}`;
 * ```
 */
export function getDesignSystemInstructions(type: DesignSystemType): string {
  const adapter = getDesignSystemAdapter(type);
  return adapter ? adapter.getPromptInstructions() : '';
}

/**
 * Validate HTML against design system conventions
 * 
 * @param html - HTML to validate
 * @param type - Design system type
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const result = validateDesignSystemSyntax(html, 'material-ui');
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateDesignSystemSyntax(
  html: string,
  type: DesignSystemType
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const adapter = getDesignSystemAdapter(type);
  
  if (!adapter) {
    // Vanilla HTML - basic validation only
    return {
      valid: html.trim().length > 0,
      errors: html.trim().length === 0 ? ['HTML is empty'] : [],
      warnings: [],
    };
  }

  return adapter.validateSyntax(html);
}

/**
 * Get required imports for generated HTML
 * 
 * @param html - Generated HTML
 * @param type - Design system type
 * @returns Required imports and CDN links
 * 
 * @example
 * ```typescript
 * const { imports, cdnLinks } = getRequiredImports(html, 'ant-design');
 * console.log('Add these imports:', imports);
 * console.log('Add these CDN links:', cdnLinks);
 * ```
 */
export function getRequiredImports(
  html: string,
  type: DesignSystemType
): {
  imports: string[];
  cdnLinks: string[];
} {
  const adapter = getDesignSystemAdapter(type);
  
  if (!adapter) {
    return { imports: [], cdnLinks: [] };
  }

  return adapter.getRequiredImports(html);
}

// Re-export types and classes
export type { DesignSystemAdapter, ComponentSyntax, DesignSystemConfig } from './DesignSystemAdapter';
export { BaseDesignSystemAdapter } from './DesignSystemAdapter';
export { MaterialUIAdapter } from './MaterialUIAdapter';
export { AntDesignAdapter } from './AntDesignAdapter';
export { TailwindAdapter } from './TailwindAdapter';
