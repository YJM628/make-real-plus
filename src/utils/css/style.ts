/**
 * CSS Style Utilities
 * Feature: ai-html-visual-editor
 * 
 * Provides functions for parsing, manipulating, and applying CSS styles.
 * 
 * Requirements: 6.2, 6.4, 6.7
 */

/**
 * Parses a CSS string into a style object
 * 
 * Converts CSS string like "color: red; font-size: 16px" into
 * an object like { color: "red", fontSize: "16px" }
 * 
 * @param css - CSS string to parse
 * @returns Object with camelCase property names and string values
 * 
 * Requirements: 6.2, 6.4
 */
export function parseCssString(css: string): Record<string, string> {
  const styles: Record<string, string> = {};
  
  if (!css || typeof css !== 'string') {
    return styles;
  }

  // Split by semicolon and process each declaration
  const declarations = css.split(';').map(d => d.trim()).filter(Boolean);
  
  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) {
      continue; // Skip invalid declarations
    }

    const property = declaration.substring(0, colonIndex).trim();
    const value = declaration.substring(colonIndex + 1).trim();

    if (property && value) {
      // Convert kebab-case to camelCase
      const camelProperty = kebabToCamel(property);
      styles[camelProperty] = value;
    }
  }

  return styles;
}

/**
 * Converts a style object to a CSS string
 * 
 * Converts an object like { color: "red", fontSize: "16px" } into
 * a CSS string like "color: red; font-size: 16px;"
 * 
 * @param styles - Style object with camelCase or kebab-case properties
 * @returns CSS string
 * 
 * Requirements: 6.2, 6.4
 */
export function styleToCssString(styles: Record<string, string>): string {
  if (!styles || typeof styles !== 'object') {
    return '';
  }

  const declarations: string[] = [];

  for (const [property, value] of Object.entries(styles)) {
    if (value !== undefined && value !== null && value !== '') {
      // Convert camelCase to kebab-case
      const kebabProperty = camelToKebab(property);
      declarations.push(`${kebabProperty}: ${value}`);
    }
  }

  return declarations.length > 0 ? declarations.join('; ') + ';' : '';
}

/**
 * Merges multiple style objects
 * 
 * Later objects override earlier ones. This is useful for combining
 * base styles with overrides.
 * 
 * @param styles - Variable number of style objects to merge
 * @returns Merged style object
 * 
 * Requirements: 6.2, 6.4
 */
export function mergeStyles(...styles: Record<string, string>[]): Record<string, string> {
  const merged: Record<string, string> = {};

  for (const styleObj of styles) {
    if (styleObj && typeof styleObj === 'object') {
      Object.assign(merged, styleObj);
    }
  }

  return merged;
}

/**
 * Extracts computed styles from an HTML element
 * 
 * Gets the actual computed CSS values for an element, which includes
 * styles from stylesheets, inline styles, and browser defaults.
 * 
 * @param element - The HTML element to extract styles from
 * @param properties - Optional array of specific properties to extract. If not provided, extracts common layout properties.
 * @returns Object with computed style values
 * 
 * Requirements: 6.2, 6.4
 */
export function getComputedStyles(
  element: HTMLElement,
  properties?: string[]
): Record<string, string> {
  const styles: Record<string, string> = {};

  // Get computed style
  const computed = window.getComputedStyle(element);

  // If specific properties requested, extract only those
  if (properties && properties.length > 0) {
    for (const prop of properties) {
      const kebabProp = camelToKebab(prop);
      const value = computed.getPropertyValue(kebabProp);
      if (value) {
        styles[prop] = value;
      }
    }
  } else {
    // Extract common layout and positioning properties
    const commonProperties = [
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'width',
      'height',
      'margin',
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft',
      'padding',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'display',
      'flexDirection',
      'flexWrap',
      'justifyContent',
      'alignItems',
      'gridTemplateColumns',
      'gridTemplateRows',
      'gap',
      'transform',
      'zIndex',
    ];

    for (const prop of commonProperties) {
      const kebabProp = camelToKebab(prop);
      const value = computed.getPropertyValue(kebabProp);
      if (value && value !== 'auto' && value !== 'none') {
        styles[prop] = value;
      }
    }
  }

  return styles;
}

/**
 * Applies styles to an HTML element
 * 
 * Sets the style properties on an element. Handles both camelCase
 * and kebab-case property names.
 * 
 * @param element - The HTML element to apply styles to
 * @param styles - Style object to apply
 * 
 * Requirements: 6.2, 6.4
 */
export function applyStyles(
  element: HTMLElement,
  styles: Record<string, string>
): void {
  if (!element || !styles || typeof styles !== 'object') {
    return;
  }

  for (const [property, value] of Object.entries(styles)) {
    if (value !== undefined && value !== null) {
      // TypeScript doesn't like dynamic property access on CSSStyleDeclaration
      // So we use setProperty with kebab-case
      const kebabProperty = camelToKebab(property);
      element.style.setProperty(kebabProperty, value);
    }
  }
}

/**
 * Detects the positioning type of an element
 * 
 * Determines how an element is positioned in the layout, which is
 * important for drag operations.
 * 
 * @param element - The HTML element to check
 * @returns The positioning type
 * 
 * Requirements: 6.7
 */
export function getPositioningType(
  element: HTMLElement
): 'static' | 'relative' | 'absolute' | 'fixed' | 'flex' | 'grid' {
  const computed = window.getComputedStyle(element);
  const position = computed.position;

  // Check explicit positioning first
  if (position === 'absolute' || position === 'fixed' || position === 'relative') {
    return position;
  }

  // Check if element is a flex or grid item
  const parent = element.parentElement;
  if (parent) {
    const parentComputed = window.getComputedStyle(parent);
    const parentDisplay = parentComputed.display;

    if (parentDisplay === 'flex' || parentDisplay === 'inline-flex') {
      return 'flex';
    }

    if (parentDisplay === 'grid' || parentDisplay === 'inline-grid') {
      return 'grid';
    }
  }

  // Default to static
  return 'static';
}

/**
 * Adjusts positioning strategy for drag operations
 * 
 * When dragging elements that are in flex/grid layouts, we need to
 * convert them to absolute positioning to allow free movement.
 * This function preserves the original position while changing the
 * positioning strategy.
 * 
 * @param element - The HTML element to adjust
 * 
 * Requirements: 6.7
 */
export function adjustPositioningForDrag(element: HTMLElement): void {
  const positioningType = getPositioningType(element);

  // If already absolutely positioned, no adjustment needed
  if (positioningType === 'absolute' || positioningType === 'fixed') {
    return;
  }

  // Get current position before changing positioning
  const rect = element.getBoundingClientRect();
  const parent = element.offsetParent as HTMLElement | null;
  
  let offsetX = rect.left;
  let offsetY = rect.top;

  // If there's an offset parent, calculate relative to it
  if (parent) {
    const parentRect = parent.getBoundingClientRect();
    offsetX = rect.left - parentRect.left;
    offsetY = rect.top - parentRect.top;
  }

  // For flex/grid items, convert to absolute positioning
  if (positioningType === 'flex' || positioningType === 'grid') {
    element.style.position = 'absolute';
    element.style.left = `${offsetX}px`;
    element.style.top = `${offsetY}px`;
    
    // Preserve dimensions using computed values
    const computed = window.getComputedStyle(element);
    element.style.width = computed.width;
    element.style.height = computed.height;
    
    // Remove flex/grid specific properties that might interfere
    element.style.flex = '';
    element.style.gridColumn = '';
    element.style.gridRow = '';
  } else if (positioningType === 'static') {
    // For static elements, convert to relative positioning
    // This allows using top/left for positioning
    element.style.position = 'relative';
  }
}

/**
 * Converts kebab-case to camelCase
 * 
 * @param str - String in kebab-case
 * @returns String in camelCase
 */
function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts camelCase to kebab-case
 * 
 * @param str - String in camelCase
 * @returns String in kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}
