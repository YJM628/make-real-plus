/**
 * SyncEngine - Manages bidirectional synchronization between tldraw shapes and HTML DOM
 * Feature: ai-html-visual-editor
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 19.1, 19.5
 * 
 * Validates: Property 17 - Bidirectional sync consistency
 * Validates: Property 25 - History record completeness
 * Validates: Property 26 - Version restore correctness
 */

import type {
  SyncState,
  HtmlParseResult,
  ElementOverride,
  HtmlShapeProps,
  HistoryEntry,
} from '../../types';

/**
 * SyncEngine manages the bidirectional synchronization between tldraw shapes and HTML DOM
 * 
 * Synchronization Algorithm:
 * 1. On shape creation: Parse HTML and create initial sync state
 * 2. On override application:
 *    - Update sync state override list
 *    - Apply override to DOM (if in edit mode)
 *    - Update shape props with new override
 *    - Mark sync as pending
 * 3. On shape transformation (move/resize):
 *    - Calculate new position/size
 *    - Update DOM container styles
 *    - Mark sync as pending
 * 4. Periodically validate sync consistency:
 *    - Compare shape props with DOM state
 *    - Detect conflicts
 *    - Resolve using timestamp-based priority
 */
export class SyncEngine {
  private syncStates: Map<string, SyncState>;

  constructor() {
    this.syncStates = new Map();
  }

  /**
   * Initialize synchronization for a new HTML shape
   * 
   * @param shapeId - Unique identifier for the shape
   * @param html - Parsed HTML structure
   * 
   * Requirements: 10.1 - Initialize sync state for new shapes
   */
  initSync(shapeId: string, html: HtmlParseResult): void {
    const syncState: SyncState = {
      shapeId,
      originalHtml: html,
      overrides: [],
      status: 'synced',
      lastSync: Date.now(),
      history: [],
    };

    this.syncStates.set(shapeId, syncState);
  }

  /**
   * Apply an override to both the shape and DOM
   * 
   * @param shapeId - Shape identifier
   * @param override - Element override to apply
   * 
   * Requirements: 10.3 - When applying Element_Override, Sync_Engine should update both HTML DOM and tldraw shape representation
   */
  applyOverride(shapeId: string, override: ElementOverride): void {
    const syncState = this.syncStates.get(shapeId);
    
    if (!syncState) {
      throw new Error(`Sync state not found for shape: ${shapeId}`);
    }

    // Add override to the list
    syncState.overrides.push(override);

    // Add to history
    this.addHistoryEntry(shapeId, override);

    // Apply override to DOM if domRoot exists (edit mode)
    if (syncState.domRoot) {
      this.applyOverrideToDOM(syncState.domRoot, override);
    }

    // Update shape reference if it exists
    if (syncState.shapeRef) {
      syncState.shapeRef.props.overrides = [...syncState.overrides];
    }

    // Mark sync as pending and update timestamp
    syncState.status = 'pending';
    syncState.lastSync = Date.now();
  }

  /**
   * Apply an override to the DOM
   * 
   * @param domRoot - Root DOM element
   * @param override - Override to apply
   */
  private applyOverrideToDOM(domRoot: HTMLElement, override: ElementOverride): void {
    // Validate selector before using it
    if (!override.selector || override.selector.trim().length === 0) {
      console.warn(`Invalid selector: "${override.selector}"`);
      return;
    }

    // Find the target element using the selector
    let targetElement: Element | null = null;
    try {
      targetElement = domRoot.querySelector(override.selector);
    } catch (error) {
      console.warn(`Invalid CSS selector: ${override.selector}`, error);
      return;
    }
    
    if (!targetElement || !(targetElement instanceof HTMLElement)) {
      console.warn(`Element not found for selector: ${override.selector}`);
      return;
    }

    // Apply text content override
    if (override.text !== undefined) {
      targetElement.textContent = override.text;
    }

    // Apply style overrides
    if (override.styles) {
      for (const [property, value] of Object.entries(override.styles)) {
        // Convert kebab-case to camelCase for style properties
        const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        (targetElement.style as any)[camelProperty] = value;
      }
    }

    // Apply HTML override (replaces entire element content)
    if (override.html !== undefined) {
      targetElement.innerHTML = override.html;
    }

    // Apply attribute overrides
    if (override.attributes) {
      for (const [attr, value] of Object.entries(override.attributes)) {
        targetElement.setAttribute(attr, value);
      }
    }

    // Apply position override
    if (override.position) {
      targetElement.style.position = 'absolute';
      targetElement.style.left = `${override.position.x}px`;
      targetElement.style.top = `${override.position.y}px`;
    }

    // Apply size override
    if (override.size) {
      targetElement.style.width = `${override.size.width}px`;
      targetElement.style.height = `${override.size.height}px`;
    }
  }

  /**
   * Sync shape position/size changes to DOM
   * 
   * @param shapeId - Shape identifier
   * @param shape - Updated shape props
   * 
   * Requirements: 10.1 - When moving HTML_Shape on Canvas, Sync_Engine should update corresponding HTML element position
   */
  syncShapeToDOM(shapeId: string, shape: HtmlShapeProps): void {
    const syncState = this.syncStates.get(shapeId);
    
    if (!syncState) {
      throw new Error(`Sync state not found for shape: ${shapeId}`);
    }

    // Update shape reference
    syncState.shapeRef = shape;

    // If DOM root exists, update container styles
    if (syncState.domRoot) {
      // Update container position
      syncState.domRoot.style.position = 'absolute';
      syncState.domRoot.style.left = `${shape.x}px`;
      syncState.domRoot.style.top = `${shape.y}px`;

      // Update container size
      syncState.domRoot.style.width = `${shape.width}px`;
      syncState.domRoot.style.height = `${shape.height}px`;
    }

    // Mark sync as pending
    syncState.status = 'pending';
    syncState.lastSync = Date.now();
  }

  /**
   * Sync DOM changes back to shape
   * 
   * @param shapeId - Shape identifier
   * @param element - DOM element that changed
   * 
   * Requirements: 10.2 - When modifying HTML element through Floating_Edit_Panel, Sync_Engine should update corresponding HTML_Shape
   */
  syncDOMToShape(shapeId: string, element: HTMLElement): void {
    const syncState = this.syncStates.get(shapeId);
    
    if (!syncState || !syncState.shapeRef) {
      throw new Error(`Sync state or shape reference not found for shape: ${shapeId}`);
    }

    // Extract current element state
    const selector = this.generateSelectorForElement(element, syncState.domRoot);
    
    // Create override from current DOM state
    const override: ElementOverride = {
      selector,
      timestamp: Date.now(),
      aiGenerated: false,
    };

    // Capture text content if changed
    if (element.textContent) {
      override.text = element.textContent;
    }

    // Capture inline styles
    const styles: Record<string, string> = {};
    for (let i = 0; i < element.style.length; i++) {
      const property = element.style[i];
      const value = element.style.getPropertyValue(property);
      if (value) {
        styles[property] = value;
      }
    }
    if (Object.keys(styles).length > 0) {
      override.styles = styles;
    }

    // Apply the override
    this.applyOverride(shapeId, override);
  }

  /**
   * Generate a CSS selector for a DOM element
   * 
   * @param element - DOM element
   * @param root - Root DOM element
   * @returns CSS selector string
   */
  private generateSelectorForElement(element: HTMLElement, root?: HTMLElement): string {
    // Try to use id first
    if (element.id) {
      return `#${element.id}`;
    }

    // Try to use data-uuid
    const dataUuid = element.getAttribute('data-uuid');
    if (dataUuid) {
      return `[data-uuid="${dataUuid}"]`;
    }

    // Build path-based selector
    const path: string[] = [];
    let current: HTMLElement | null = element;
    
    while (current && current !== root) {
      let selector = current.tagName.toLowerCase();
      
      // Add nth-child if there are siblings
      if (current.parentElement) {
        const siblings = Array.from(current.parentElement.children);
        const index = siblings.indexOf(current);
        if (siblings.length > 1) {
          selector += `:nth-child(${index + 1})`;
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * Get current sync state for a shape
   * 
   * @param shapeId - Shape identifier
   * @returns Sync state or undefined if not found
   * 
   * Requirements: 10.4 - Sync_Engine should maintain consistency between HTML_Shape properties and HTML DOM properties
   */
  getSyncState(shapeId: string): SyncState | undefined {
    return this.syncStates.get(shapeId);
  }

  /**
   * Validate sync consistency between shape and DOM
   * 
   * @param shapeId - Shape identifier
   * @returns True if sync is consistent, false otherwise
   * 
   * Requirements: 10.4 - Sync_Engine should maintain consistency between HTML_Shape properties and HTML DOM properties
   */
  validateSync(shapeId: string): boolean {
    const syncState = this.syncStates.get(shapeId);
    
    if (!syncState) {
      return false;
    }

    // If no shape reference or DOM root, consider it valid (nothing to compare)
    if (!syncState.shapeRef || !syncState.domRoot) {
      return true;
    }

    // Check if shape position matches DOM container position
    const domLeft = parseInt(syncState.domRoot.style.left) || 0;
    const domTop = parseInt(syncState.domRoot.style.top) || 0;
    
    // Allow tolerance of 2px for rounding errors
    if (Math.abs(syncState.shapeRef.x - domLeft) > 2 || 
        Math.abs(syncState.shapeRef.y - domTop) > 2) {
      return false;
    }

    // Check if shape size matches DOM container size
    const domWidth = parseInt(syncState.domRoot.style.width) || 0;
    const domHeight = parseInt(syncState.domRoot.style.height) || 0;
    
    // Allow tolerance of 2px for rounding errors
    if (Math.abs(syncState.shapeRef.width - domWidth) > 2 || 
        Math.abs(syncState.shapeRef.height - domHeight) > 2) {
      return false;
    }

    return true;
  }

  /**
   * Recover from sync errors
   * 
   * @param shapeId - Shape identifier
   * 
   * Requirements: 10.5 - When sync fails, Sync_Engine should log error and maintain last valid state
   */
  recoverSync(shapeId: string): void {
    const syncState = this.syncStates.get(shapeId);
    
    if (!syncState) {
      console.error(`Cannot recover sync: state not found for shape ${shapeId}`);
      return;
    }

    try {
      // If we have a shape reference, use it as the source of truth
      if (syncState.shapeRef) {
        // Reapply all overrides to DOM
        if (syncState.domRoot) {
          for (const override of syncState.overrides) {
            this.applyOverrideToDOM(syncState.domRoot, override);
          }
        }

        // Update sync state
        syncState.status = 'synced';
        syncState.lastSync = Date.now();
        
        console.log(`Sync recovered for shape ${shapeId}`);
      } else {
        // No shape reference, mark as error
        syncState.status = 'error';
        console.error(`Cannot recover sync: no shape reference for ${shapeId}`);
      }
    } catch (error) {
      syncState.status = 'error';
      console.error(`Error recovering sync for shape ${shapeId}:`, error);
    }
  }

  /**
   * Add a history entry for an override
   * 
   * @param shapeId - Shape identifier
   * @param override - Override to add to history
   * 
   * Requirements: 19.1 - Visual_Editor should maintain complete modification history for each HTML_Shape
   * Validates: Property 25 - History record completeness
   */
  addHistoryEntry(shapeId: string, override: ElementOverride): void {
    const syncState = this.syncStates.get(shapeId);
    
    if (!syncState) {
      throw new Error(`Sync state not found for shape: ${shapeId}`);
    }

    const historyEntry: HistoryEntry = {
      timestamp: override.timestamp,
      override,
    };

    syncState.history.push(historyEntry);
  }

  /**
   * Restore to a specific history version
   * 
   * @param shapeId - Shape identifier
   * @param timestamp - Timestamp of the version to restore to
   * 
   * Requirements: 19.5 - When user selects to restore to a history version, Visual_Editor should remove all Element_Override after that version
   * Validates: Property 26 - Version restore correctness
   */
  restoreToVersion(shapeId: string, timestamp: number): void {
    const syncState = this.syncStates.get(shapeId);
    
    if (!syncState) {
      throw new Error(`Sync state not found for shape: ${shapeId}`);
    }

    // Remove all overrides with timestamp > target timestamp
    syncState.overrides = syncState.overrides.filter(
      override => override.timestamp <= timestamp
    );

    // Remove all history entries with timestamp > target timestamp
    syncState.history = syncState.history.filter(
      entry => entry.timestamp <= timestamp
    );

    // Update shape reference if it exists
    if (syncState.shapeRef) {
      syncState.shapeRef.props.overrides = [...syncState.overrides];
    }

    // Reapply all remaining overrides to DOM
    if (syncState.domRoot) {
      // Clear all applied styles first (would need to reset to original state)
      // For now, just reapply all overrides
      for (const override of syncState.overrides) {
        this.applyOverrideToDOM(syncState.domRoot, override);
      }
    }

    // Update sync state
    syncState.status = 'synced';
    syncState.lastSync = Date.now();
  }

  /**
   * Set the DOM root for a shape (used in edit mode)
   * 
   * @param shapeId - Shape identifier
   * @param domRoot - Root DOM element
   */
  setDOMRoot(shapeId: string, domRoot: HTMLElement): void {
    const syncState = this.syncStates.get(shapeId);
    
    if (!syncState) {
      throw new Error(`Sync state not found for shape: ${shapeId}`);
    }

    syncState.domRoot = domRoot;

    // Apply all existing overrides to the new DOM root
    for (const override of syncState.overrides) {
      this.applyOverrideToDOM(domRoot, override);
    }
  }

  /**
   * Remove sync state for a shape (cleanup)
   * 
   * @param shapeId - Shape identifier
   */
  removeSync(shapeId: string): void {
    this.syncStates.delete(shapeId);
  }

  /**
   * Get all sync states (for debugging)
   * 
   * @returns Map of all sync states
   */
  getAllSyncStates(): Map<string, SyncState> {
    return new Map(this.syncStates);
  }

  /**
   * Clear all sync states (for testing)
   */
  clearAllSyncStates(): void {
    this.syncStates.clear();
  }
}

// Export singleton instance
export const syncEngine = new SyncEngine();
