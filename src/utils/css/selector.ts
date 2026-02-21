/**
 * CSS Selector Utilities
 * Feature: ai-html-visual-editor
 * 
 * Provides functions for generating, validating, and using CSS selectors
 * to uniquely identify HTML elements in the DOM.
 * 
 * Requirements: 5.3, 5.5
 */

import type { ParsedElement } from '../../types';

/**
 * Generates a unique CSS selector for an element
 * 
 * Priority order:
 * 1. Use id if available: #element-id
 * 2. Use data-uuid if available: [data-uuid="..."]
 * 3. Use combination of tag + classes + nth-child
 * 4. Build path from root if needed
 * 
 * @param element - The parsed element to generate a selector for
 * @returns A CSS selector string that should uniquely identify the element
 * 
 * Validates: Property 10 - CSS Selector Uniqueness
 */
export function generateCssSelector(element: ParsedElement): string {
  // Priority 1: Use id if available
  if (element.attributes.id) {
    return `#${CSS.escape(element.attributes.id)}`;
  }

  // Priority 2: Use data-uuid if available
  if (element.attributes['data-uuid']) {
    return `[data-uuid="${CSS.escape(element.attributes['data-uuid'])}"]`;
  }

  // Priority 3: Build selector using tag, classes, and nth-child
  const selector = buildSelectorWithClasses(element);
  
  // Priority 4: If still not unique enough, build path from root
  if (element.parent) {
    const parentSelector = generateCssSelector(element.parent);
    return `${parentSelector} > ${selector}`;
  }

  return selector;
}

/**
 * Builds a selector using tag name, classes, and nth-child
 * 
 * @param element - The parsed element
 * @returns A selector string like "div.class1.class2:nth-child(2)"
 */
function buildSelectorWithClasses(element: ParsedElement): string {
  let selector = element.tagName.toLowerCase();

  // Add classes if available
  const className = element.attributes.class;
  if (className) {
    const classes = className.split(/\s+/).filter(Boolean);
    classes.forEach(cls => {
      selector += `.${CSS.escape(cls)}`;
    });
  }

  // Add nth-child if element has a parent
  if (element.parent) {
    const nthChild = getNthChildIndex(element);
    if (nthChild > 0) {
      selector += `:nth-child(${nthChild})`;
    }
  }

  return selector;
}

/**
 * Gets the nth-child index of an element among its siblings
 * 
 * @param element - The parsed element
 * @returns The 1-based index, or 0 if no parent
 */
function getNthChildIndex(element: ParsedElement): number {
  if (!element.parent) {
    return 0;
  }

  const siblings = element.parent.children;
  const index = siblings.findIndex(child => child.identifier === element.identifier);
  
  return index >= 0 ? index + 1 : 0;
}

/**
 * Validates that a CSS selector uniquely identifies a single element
 * 
 * @param selector - The CSS selector to validate
 * @param root - The root HTML element to search within
 * @returns true if the selector matches exactly one element, false otherwise
 * 
 * Validates: Property 10 - CSS Selector Uniqueness
 */
export function validateSelector(selector: string, root: HTMLElement): boolean {
  try {
    const matches = root.querySelectorAll(selector);
    return matches.length === 1;
  } catch (error) {
    // Invalid selector syntax
    console.error('Invalid selector:', selector, error);
    return false;
  }
}

/**
 * Finds an element by CSS selector with position-based fallback
 * 
 * @param selector - The CSS selector to search for
 * @param root - The root HTML element to search within
 * @param fallbackPosition - Optional position to use if selector fails
 * @returns The found HTML element, or null if not found
 * 
 * Requirements: 5.5, 14.4
 */
export function findElement(
  selector: string,
  root: HTMLElement,
  fallbackPosition?: { x: number; y: number }
): HTMLElement | null {
  try {
    // Try direct selector match first
    const element = root.querySelector(selector);
    if (element instanceof HTMLElement) {
      return element;
    }

    // If selector failed and position is provided, try position-based search
    if (fallbackPosition) {
      return findElementAtPosition(fallbackPosition.x, fallbackPosition.y, root);
    }

    return null;
  } catch (error) {
    console.error('Error finding element:', selector, error);
    
    // Try position fallback on error
    if (fallbackPosition) {
      return findElementAtPosition(fallbackPosition.x, fallbackPosition.y, root);
    }
    
    return null;
  }
}

/**
 * Finds an element at a specific position using elementFromPoint
 * 
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param root - The root element to search within
 * @returns The element at the position, or null
 */
function findElementAtPosition(
  x: number,
  y: number,
  root: HTMLElement
): HTMLElement | null {
  // Check if elementFromPoint is available (not available in some test environments)
  if (typeof document.elementFromPoint !== 'function') {
    return null;
  }

  // Get the element at the specified position
  const element = document.elementFromPoint(x, y);
  
  if (!element || !(element instanceof HTMLElement)) {
    return null;
  }

  // Check if the element is within the root
  if (root.contains(element)) {
    return element;
  }

  return null;
}

/**
 * Generates a position-based CSS selector for an element
 * 
 * Builds a path from root to element using nth-child selectors.
 * This is used as a fallback when other selector methods fail.
 * 
 * @param element - The HTML element to generate a selector for
 * @param root - The root HTML element
 * @returns A position-based CSS selector string
 * 
 * Requirements: 5.5, 14.4
 */
export function generatePositionBasedSelector(
  element: HTMLElement,
  root: HTMLElement
): string {
  const path: string[] = [];
  let current: HTMLElement | null = element;

  // Build path from element to root
  while (current && current !== root && current.parentElement) {
    const parent: HTMLElement = current.parentElement;
    const children = Array.from(parent.children);
    const index = children.indexOf(current);

    if (index >= 0) {
      const tagName = current.tagName.toLowerCase();
      path.unshift(`${tagName}:nth-child(${index + 1})`);
    }

    current = parent;
  }

  // If we reached the root, prepend it
  if (current === root) {
    path.unshift(root.tagName.toLowerCase());
  }

  return path.join(' > ');
}

/**
 * Generates a CSS selector for an HTML element (not ParsedElement)
 * 
 * This is a convenience function that works directly with DOM elements.
 * 
 * @param element - The HTML element
 * @param root - The root HTML element
 * @returns A CSS selector string
 */
export function generateCssSelectorFromElement(
  element: HTMLElement,
  root: HTMLElement
): string {
  // Priority 1: Use id if available
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  // Priority 2: Use data-uuid if available
  const dataUuid = element.getAttribute('data-uuid');
  if (dataUuid) {
    return `[data-uuid="${CSS.escape(dataUuid)}"]`;
  }

  // Priority 3: Build selector with classes
  let selector = element.tagName.toLowerCase();
  
  if (element.className) {
    const classes = element.className.split(/\s+/).filter(Boolean);
    classes.forEach(cls => {
      selector += `.${CSS.escape(cls)}`;
    });
  }

  // Add nth-child if needed
  if (element.parentElement) {
    const siblings = Array.from(element.parentElement.children);
    const index = siblings.indexOf(element);
    if (index >= 0) {
      selector += `:nth-child(${index + 1})`;
    }
  }

  // Validate uniqueness
  if (validateSelector(selector, root)) {
    return selector;
  }

  // Fallback to position-based selector
  return generatePositionBasedSelector(element, root);
}
