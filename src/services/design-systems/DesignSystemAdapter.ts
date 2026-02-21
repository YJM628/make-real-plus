/**
 * Design System Adapter Interface
 * Feature: ai-html-visual-editor
 * Requirements: 1.5, 1.7, 13.1, 13.2, 13.3, 13.4, 13.5
 */

/**
 * Component syntax information for a design system
 */
export interface ComponentSyntax {
  /**
   * Component name (e.g., 'Button', 'TextField', 'Card')
   */
  name: string;

  /**
   * Example usage of the component
   */
  example: string;

  /**
   * Common props/attributes for the component
   */
  props?: string[];

  /**
   * Required imports or dependencies
   */
  imports?: string[];
}

/**
 * Design system configuration
 */
export interface DesignSystemConfig {
  /**
   * Name of the design system
   */
  name: string;

  /**
   * Version of the design system
   */
  version?: string;

  /**
   * CDN links for stylesheets
   */
  stylesheets?: string[];

  /**
   * CDN links for scripts
   */
  scripts?: string[];

  /**
   * NPM package names
   */
  packages?: string[];

  /**
   * Additional setup instructions
   */
  setup?: string;
}

/**
 * Design System Adapter Interface
 * 
 * Adapters provide design system-specific information to the AI generator,
 * including component syntax, styling conventions, and setup requirements.
 */
export interface DesignSystemAdapter {
  /**
   * Get the design system configuration
   */
  getConfig(): DesignSystemConfig;

  /**
   * Get component syntax examples for common components
   */
  getComponentSyntax(): ComponentSyntax[];

  /**
   * Generate AI prompt instructions for this design system
   * This is included in the AI generation context to guide code generation
   */
  getPromptInstructions(): string;

  /**
   * Validate generated HTML uses correct component syntax
   * @param html - Generated HTML to validate
   * @returns Validation result with errors if any
   */
  validateSyntax(html: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };

  /**
   * Get required imports/dependencies for the generated code
   * @param html - Generated HTML
   * @returns Import statements or CDN links
   */
  getRequiredImports(html: string): {
    imports: string[];
    cdnLinks: string[];
  };
}

/**
 * Base adapter with common functionality
 */
export abstract class BaseDesignSystemAdapter implements DesignSystemAdapter {
  abstract getConfig(): DesignSystemConfig;
  abstract getComponentSyntax(): ComponentSyntax[];
  abstract getPromptInstructions(): string;

  /**
   * Default validation - checks for common issues
   */
  validateSyntax(html: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for basic HTML validity
    if (!html.trim()) {
      errors.push('HTML is empty');
    }

    // Check for unclosed tags (basic check)
    const openTags = html.match(/<(\w+)[^>]*>/g) || [];
    const closeTags = html.match(/<\/(\w+)>/g) || [];
    if (openTags.length !== closeTags.length) {
      warnings.push('Possible unclosed tags detected');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Default import detection - override for specific design systems
   */
  getRequiredImports(html: string): {
    imports: string[];
    cdnLinks: string[];
  } {
    const config = this.getConfig();
    return {
      imports: config.packages || [],
      cdnLinks: [...(config.stylesheets || []), ...(config.scripts || [])],
    };
  }

  /**
   * Helper: Check if HTML contains a specific class pattern
   */
  protected containsClass(html: string, pattern: RegExp): boolean {
    return pattern.test(html);
  }

  /**
   * Helper: Extract all class names from HTML
   */
  protected extractClasses(html: string): string[] {
    const classMatches = html.match(/class="([^"]*)"/g) || [];
    const classes: string[] = [];
    
    for (const match of classMatches) {
      const classNames = match.match(/class="([^"]*)"/)?.[1].split(/\s+/) || [];
      classes.push(...classNames);
    }
    
    return classes;
  }

  /**
   * Helper: Check if HTML contains a specific component tag
   * Note: This is case-sensitive to distinguish React components from HTML tags
   */
  protected containsComponent(html: string, componentName: string): boolean {
    const regex = new RegExp(`<${componentName}[\\s>/]`);
    return regex.test(html);
  }
}
