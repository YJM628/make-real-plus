/**
 * Shared Theme Manager
 * Manages cross-page theme synchronization and batch modifications
 * Feature: batch-html-redesign
 */

import type { ElementOverride, PageGroup } from '../../types';

/**
 * SharedThemeManager class
 * Tracks related page groups and synchronizes shared component modifications
 */
export class SharedThemeManager {
  private pageGroups: Map<string, PageGroup> = new Map();

  /**
   * Register a group of related pages
   * @param groupId - Unique identifier for the page group
   * @param shapeIds - Array of shape IDs belonging to this group
   * @param sharedTheme - Shared theme CSS (CSS variables and common styles)
   * @param sharedNavigation - Shared navigation components (header and footer)
   */
  registerPageGroup(
    groupId: string,
    shapeIds: string[],
    sharedTheme: string,
    sharedNavigation: { header: string; footer: string }
  ): void {
    const pageNameToShapeId = new Map<string, string>();
    
    this.pageGroups.set(groupId, {
      groupId,
      shapeIds,
      sharedTheme,
      sharedNavigation,
      pageNameToShapeId,
    });
  }

  /**
   * Update the page name to shape ID mapping for a group
   * @param groupId - Group identifier
   * @param pageName - Page name
   * @param shapeId - Shape ID
   */
  mapPageToShape(groupId: string, pageName: string, shapeId: string): void {
    const group = this.pageGroups.get(groupId);
    if (group) {
      group.pageNameToShapeId.set(pageName, shapeId);
    }
  }

  /**
   * Modify shared theme and generate overrides for all related pages
   * @param groupId - Group identifier
   * @param themeChanges - CSS variable changes (e.g., { '--primary': '#ff0000' })
   * @returns Map of shape ID to array of ElementOverride
   */
  updateSharedTheme(
    groupId: string,
    themeChanges: Record<string, string>
  ): Map<string, ElementOverride[]> {
    const group = this.pageGroups.get(groupId);
    if (!group) {
      return new Map();
    }

    const overridesMap = new Map<string, ElementOverride[]>();
    const timestamp = Date.now();

    // Generate overrides for each page in the group
    for (const shapeId of group.shapeIds) {
      const overrides: ElementOverride[] = [];

      // Create an override for the :root selector to update CSS variables
      const styleOverride: ElementOverride = {
        selector: ':root',
        styles: { ...themeChanges },
        timestamp,
        aiGenerated: false,
        original: {
          styles: this.extractOriginalThemeValues(group.sharedTheme, Object.keys(themeChanges)),
        },
      };

      overrides.push(styleOverride);
      overridesMap.set(shapeId, overrides);
    }

    // Update the stored shared theme
    group.sharedTheme = this.applyThemeChanges(group.sharedTheme, themeChanges);

    return overridesMap;
  }

  /**
   * Modify shared navigation and generate overrides for all related pages
   * @param groupId - Group identifier
   * @param navChanges - Navigation changes (header and/or footer HTML)
   * @returns Map of shape ID to array of ElementOverride
   */
  updateSharedNavigation(
    groupId: string,
    navChanges: { header?: string; footer?: string }
  ): Map<string, ElementOverride[]> {
    const group = this.pageGroups.get(groupId);
    if (!group) {
      return new Map();
    }

    const overridesMap = new Map<string, ElementOverride[]>();
    const timestamp = Date.now();

    // Generate overrides for each page in the group
    for (const shapeId of group.shapeIds) {
      const overrides: ElementOverride[] = [];

      // Create override for header if changed
      if (navChanges.header !== undefined) {
        const headerOverride: ElementOverride = {
          selector: 'nav[data-shared="header"], header[data-shared="header"]',
          html: navChanges.header,
          timestamp,
          aiGenerated: false,
          original: {
            html: group.sharedNavigation.header,
          },
        };
        overrides.push(headerOverride);
      }

      // Create override for footer if changed
      if (navChanges.footer !== undefined) {
        const footerOverride: ElementOverride = {
          selector: 'footer[data-shared="footer"]',
          html: navChanges.footer,
          timestamp,
          aiGenerated: false,
          original: {
            html: group.sharedNavigation.footer,
          },
        };
        overrides.push(footerOverride);
      }

      overridesMap.set(shapeId, overrides);
    }

    // Update the stored shared navigation
    if (navChanges.header !== undefined) {
      group.sharedNavigation.header = navChanges.header;
    }
    if (navChanges.footer !== undefined) {
      group.sharedNavigation.footer = navChanges.footer;
    }

    return overridesMap;
  }

  /**
   * Check if a selector matches a shared component
   * @param groupId - Group identifier
   * @param selector - CSS selector to check
   * @returns true if the selector matches a shared component
   */
  isSharedComponent(groupId: string, selector: string): boolean {
    const group = this.pageGroups.get(groupId);
    if (!group) {
      return false;
    }

    // Check if selector matches shared navigation components
    const sharedSelectors = [
      'nav[data-shared="header"]',
      'header[data-shared="header"]',
      'footer[data-shared="footer"]',
      ':root',
    ];

    // Exact match
    if (sharedSelectors.includes(selector)) {
      return true;
    }

    // Check if selector targets elements within shared components
    for (const sharedSelector of sharedSelectors) {
      if (selector.startsWith(sharedSelector + ' ') || selector.includes(sharedSelector)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get a page group by ID
   * @param groupId - Group identifier
   * @returns PageGroup or undefined
   */
  getPageGroup(groupId: string): PageGroup | undefined {
    return this.pageGroups.get(groupId);
  }

  /**
   * Get all registered page groups
   * @returns Array of all page groups
   */
  getAllPageGroups(): PageGroup[] {
    return Array.from(this.pageGroups.values());
  }

  /**
   * Remove a page group
   * @param groupId - Group identifier
   */
  removePageGroup(groupId: string): void {
    this.pageGroups.delete(groupId);
  }

  /**
   * Extract original theme values from shared theme CSS
   * @param sharedTheme - Shared theme CSS string
   * @param variableNames - Array of CSS variable names to extract
   * @returns Record of variable names to their original values
   */
  private extractOriginalThemeValues(
    sharedTheme: string,
    variableNames: string[]
  ): Record<string, string> {
    const original: Record<string, string> = {};

    for (const varName of variableNames) {
      // Match CSS variable definition: --varName: value;
      const regex = new RegExp(`${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*([^;]+);`, 'i');
      const match = sharedTheme.match(regex);
      if (match) {
        original[varName] = match[1].trim();
      }
    }

    return original;
  }

  /**
   * Apply theme changes to the shared theme CSS
   * @param sharedTheme - Original shared theme CSS
   * @param themeChanges - CSS variable changes
   * @returns Updated shared theme CSS
   */
  private applyThemeChanges(
    sharedTheme: string,
    themeChanges: Record<string, string>
  ): string {
    let updatedTheme = sharedTheme;

    for (const [varName, newValue] of Object.entries(themeChanges)) {
      // Replace existing variable definition
      const regex = new RegExp(
        `(${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*)([^;]+)(;)`,
        'gi'
      );
      
      if (regex.test(updatedTheme)) {
        updatedTheme = updatedTheme.replace(regex, `$1${newValue}$3`);
      } else {
        // If variable doesn't exist, add it to :root
        const rootMatch = updatedTheme.match(/:root\s*\{/i);
        if (rootMatch) {
          const insertPos = rootMatch.index! + rootMatch[0].length;
          updatedTheme =
            updatedTheme.slice(0, insertPos) +
            `\n  ${varName}: ${newValue};` +
            updatedTheme.slice(insertPos);
        } else {
          // No :root block, create one
          updatedTheme = `:root {\n  ${varName}: ${newValue};\n}\n\n` + updatedTheme;
        }
      }
    }

    return updatedTheme;
  }
}

/**
 * Singleton instance of SharedThemeManager
 */
export const sharedThemeManager = new SharedThemeManager();
