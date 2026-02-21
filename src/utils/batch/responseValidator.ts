/**
 * Response validator for AI-parsed AppContext
 * Feature: intelligent-app-context-parsing
 * Requirements: 5.2, 7.2, 6.1, 6.2
 * 
 * Validates and sanitizes AppContext objects returned by AI parsers
 * to ensure they meet structural and semantic requirements.
 */

import type { AppContext, PageSpec } from '../../types';

/**
 * Validation result interface
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** List of validation errors */
  errors: string[];
  
  /** Sanitized context (only present if valid) */
  context?: AppContext;
}

/**
 * Page spec validation result
 */
export interface PageSpecValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** List of validation errors */
  errors: string[];
}

/**
 * Response validator for AppContext objects
 * 
 * Provides methods to validate and sanitize AppContext objects
 * returned by AI parsers, ensuring they meet all structural
 * and semantic requirements.
 */
export class ResponseValidator {
  /**
   * Validate an AppContext object
   * 
   * Checks that the context has all required fields with valid values:
   * - appName: non-empty string
   * - appType: non-empty string
   * - pages: array with at least 2 valid PageSpec objects
   * - originalPrompt: non-empty string
   * 
   * @param context - Context to validate
   * @returns Validation result with errors and sanitized context
   * 
   * Requirements: 5.2, 7.2
   */
  static validateAppContext(context: unknown): ValidationResult {
    const errors: string[] = [];

    // Check if context is an object
    if (!context || typeof context !== 'object') {
      return {
        valid: false,
        errors: ['Context must be an object'],
      };
    }

    const ctx = context as Record<string, unknown>;

    // Validate appName
    if (!ctx.appName || typeof ctx.appName !== 'string' || ctx.appName.trim() === '') {
      errors.push('appName must be a non-empty string');
    }

    // Validate appType
    if (!ctx.appType || typeof ctx.appType !== 'string' || ctx.appType.trim() === '') {
      errors.push('appType must be a non-empty string');
    }

    // Validate pages array
    if (!Array.isArray(ctx.pages)) {
      errors.push('pages must be an array');
    } else if (ctx.pages.length < 2) {
      errors.push('pages must contain at least 2 pages');
    } else if (ctx.pages.length > 8) {
      errors.push('pages must contain at most 8 pages');
    } else {
      // Validate each page spec
      const pageValidation = this.validatePageSpecs(ctx.pages);
      if (!pageValidation.valid) {
        errors.push(...pageValidation.errors);
      }
    }

    // Validate originalPrompt
    if (!ctx.originalPrompt || typeof ctx.originalPrompt !== 'string' || ctx.originalPrompt.trim() === '') {
      errors.push('originalPrompt must be a non-empty string');
    }

    // If there are errors, return invalid
    if (errors.length > 0) {
      return {
        valid: false,
        errors,
      };
    }

    // Sanitize and return valid context
    const sanitized = this.sanitizeAppContext(ctx as unknown as AppContext);
    
    return {
      valid: true,
      errors: [],
      context: sanitized,
    };
  }

  /**
   * Validate an array of PageSpec objects
   * 
   * Checks that each page has:
   * - name: non-empty string in kebab-case format
   * - role: non-empty string
   * - linksTo: array of strings
   * - order: non-negative number
   * 
   * Also checks that all page names are unique and all linksTo
   * references point to valid pages.
   * 
   * @param pages - Array of pages to validate
   * @returns Validation result with errors
   * 
   * Requirements: 6.1, 6.2
   */
  static validatePageSpecs(pages: unknown): PageSpecValidationResult {
    const errors: string[] = [];

    if (!Array.isArray(pages)) {
      return {
        valid: false,
        errors: ['pages must be an array'],
      };
    }

    const pageNames = new Set<string>();
    const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

    pages.forEach((page, index) => {
      if (!page || typeof page !== 'object') {
        errors.push(`Page at index ${index} must be an object`);
        return;
      }

      const p = page as Record<string, unknown>;

      // Validate name
      if (!p.name || typeof p.name !== 'string' || p.name.trim() === '') {
        errors.push(`Page at index ${index}: name must be a non-empty string`);
      } else {
        const name = p.name.trim();
        
        // Check kebab-case format
        if (!kebabCaseRegex.test(name)) {
          errors.push(`Page at index ${index}: name "${name}" must be in kebab-case format (lowercase letters, numbers, and hyphens only)`);
        }
        
        // Check uniqueness
        if (pageNames.has(name)) {
          errors.push(`Page at index ${index}: duplicate page name "${name}"`);
        } else {
          pageNames.add(name);
        }
      }

      // Validate role
      if (!p.role || typeof p.role !== 'string' || p.role.trim() === '') {
        errors.push(`Page at index ${index}: role must be a non-empty string`);
      }

      // Validate linksTo
      if (!Array.isArray(p.linksTo)) {
        errors.push(`Page at index ${index}: linksTo must be an array`);
      } else {
        p.linksTo.forEach((link, linkIndex) => {
          if (typeof link !== 'string' || link.trim() === '') {
            errors.push(`Page at index ${index}: linksTo[${linkIndex}] must be a non-empty string`);
          }
        });
      }

      // Validate order
      if (typeof p.order !== 'number' || p.order < 0 || !Number.isInteger(p.order)) {
        errors.push(`Page at index ${index}: order must be a non-negative integer`);
      }
    });

    // Validate linksTo references
    if (errors.length === 0) {
      pages.forEach((page, index) => {
        const p = page as PageSpec;
        p.linksTo.forEach((link) => {
          if (!pageNames.has(link)) {
            errors.push(`Page at index ${index}: linksTo references non-existent page "${link}"`);
          }
        });
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize and normalize an AppContext object
   * 
   * Performs the following operations:
   * - Trims all string fields
   * - Normalizes page names to kebab-case
   * - Removes duplicate linksTo entries
   * - Sorts pages by order
   * - Removes invalid linksTo references
   * 
   * @param context - Context to sanitize
   * @returns Sanitized context
   * 
   * Requirements: 7.2
   */
  static sanitizeAppContext(context: AppContext): AppContext {
    // Trim string fields
    const appName = context.appName.trim();
    const appType = context.appType.trim();
    const originalPrompt = context.originalPrompt.trim();

    // Sanitize pages
    const pageNames = new Set(context.pages.map(p => p.name.trim().toLowerCase()));
    
    const sanitizedPages = context.pages.map(page => {
      // Normalize name to kebab-case
      const name = page.name.trim().toLowerCase().replace(/\s+/g, '-');
      
      // Trim role
      const role = page.role.trim();
      
      // Remove duplicates and invalid references from linksTo
      const linksTo = Array.from(new Set(
        page.linksTo
          .map(link => link.trim().toLowerCase())
          .filter(link => link !== name && pageNames.has(link))
      ));
      
      return {
        name,
        role,
        linksTo,
        order: page.order,
      };
    });

    // Sort pages by order
    sanitizedPages.sort((a, b) => a.order - b.order);

    return {
      appName,
      appType,
      pages: sanitizedPages,
      originalPrompt,
      designSystem: context.designSystem,
    };
  }
}
