/**
 * Auto layout utilities for arranging multiple HTML shapes on the canvas
 * Feature: ai-html-visual-editor
 * Requirements: 3.3, 3.4, 3.5, 3.7
 */

import type { HtmlShapeProps } from '../../types';

/**
 * Configuration for auto layout
 */
export interface AutoLayoutConfig {
  /** Horizontal spacing between shapes (default: 50px) */
  spacing?: number;
  /** Starting X position (default: 100px) */
  startX?: number;
  /** Starting Y position (default: 100px) */
  startY?: number;
  /** Default shape width (default: 800px) */
  defaultWidth?: number;
  /** Default shape height (default: 600px) */
  defaultHeight?: number;
}

/**
 * Result of auto layout calculation
 */
export interface AutoLayoutResult {
  /** Shapes with calculated positions */
  shapes: HtmlShapeProps[];
  /** Bounding box of all shapes */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Logical order for common page types
 * Pages are arranged left to right in this order
 */
const PAGE_TYPE_ORDER: Record<string, number> = {
  home: 0,
  index: 0,
  landing: 0,
  about: 1,
  services: 2,
  products: 3,
  portfolio: 4,
  pricing: 5,
  blog: 6,
  contact: 7,
  faq: 8,
  login: 9,
  signup: 10,
  dashboard: 11,
  profile: 12,
  settings: 13,
  detail: 14,
};

/**
 * Get the logical order index for a page type
 * 
 * @param pageType - Page type name (e.g., 'home', 'about', 'contact')
 * @returns Order index (lower numbers come first)
 */
function getPageTypeOrder(pageType: string): number {
  const normalized = pageType.toLowerCase().trim();
  
  // Check for exact match
  if (normalized in PAGE_TYPE_ORDER) {
    return PAGE_TYPE_ORDER[normalized];
  }
  
  // Check for partial match (e.g., 'homepage' matches 'home')
  for (const [key, value] of Object.entries(PAGE_TYPE_ORDER)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Unknown page types go to the end
  return 999;
}

/**
 * Sort page names by logical order
 * 
 * @param pageNames - Array of page names to sort
 * @returns Sorted array of page names
 * 
 * @example
 * ```typescript
 * sortPagesByLogicalOrder(['contact', 'home', 'about'])
 * // => ['home', 'about', 'contact']
 * 
 * sortPagesByLogicalOrder(['page-3', 'home', 'page-1', 'about'])
 * // => ['home', 'about', 'page-1', 'page-3']
 * ```
 * 
 * Requirements:
 * - 3.4: Arrange by logical order (e.g., home, about, contact)
 */
export function sortPagesByLogicalOrder(pageNames: string[]): string[] {
  return [...pageNames].sort((a, b) => {
    const orderA = getPageTypeOrder(a);
    const orderB = getPageTypeOrder(b);
    
    // If both have defined order, sort by order
    if (orderA !== 999 && orderB !== 999) {
      return orderA - orderB;
    }
    
    // If only one has defined order, it comes first
    if (orderA !== 999) return -1;
    if (orderB !== 999) return 1;
    
    // Both are unknown, sort alphabetically
    return a.localeCompare(b);
  });
}

/**
 * Calculate positions for multiple HTML shapes arranged left to right
 * 
 * @param pages - Array of page data with name, html, css, js
 * @param config - Auto layout configuration
 * @returns Auto layout result with positioned shapes and bounds
 * 
 * @example
 * ```typescript
 * const pages = [
 *   { name: 'home', html: '<div>Home</div>', css: '', js: '' },
 *   { name: 'about', html: '<div>About</div>', css: '', js: '' },
 *   { name: 'contact', html: '<div>Contact</div>', css: '', js: '' }
 * ];
 * 
 * const result = calculateAutoLayout(pages);
 * // => {
 * //   shapes: [
 * //     { id: 'shape-home', x: 100, y: 100, width: 800, height: 600, ... },
 * //     { id: 'shape-about', x: 950, y: 100, width: 800, height: 600, ... },
 * //     { id: 'shape-contact', x: 1800, y: 100, width: 800, height: 600, ... }
 * //   ],
 * //   bounds: { x: 100, y: 100, width: 2550, height: 600 }
 * // }
 * ```
 * 
 * Requirements:
 * - 3.3: Calculate shape positions (left to right arrangement)
 * - 3.4: Maintain 50px spacing between shapes
 * - 3.5: Arrange by logical order (home, about, contact, etc.)
 */
export function calculateAutoLayout(
  pages: Array<{ name: string; html: string; css: string; js: string }>,
  config: AutoLayoutConfig = {}
): AutoLayoutResult {
  const {
    spacing = 50,
    startX = 100,
    startY = 100,
    defaultWidth = 800,
    defaultHeight = 600,
  } = config;

  // Sort pages by logical order
  const sortedPageNames = sortPagesByLogicalOrder(pages.map(p => p.name));
  const pageMap = new Map(pages.map(p => [p.name, p]));
  
  // Calculate positions for each shape
  const shapes: HtmlShapeProps[] = [];
  let currentX = startX;
  
  for (const pageName of sortedPageNames) {
    const page = pageMap.get(pageName);
    if (!page) continue;
    
    const shape: HtmlShapeProps = {
      id: `shape-${pageName}`,
      type: 'html',
      x: currentX,
      y: startY,
      width: defaultWidth,
      height: defaultHeight,
      props: {
        html: page.html,
        css: page.css,
        js: page.js,
        mode: 'preview',
        overrides: [],
      },
    };
    
    shapes.push(shape);
    
    // Move to next position (current position + width + spacing)
    currentX += defaultWidth + spacing;
  }
  
  // Calculate bounding box
  if (shapes.length === 0) {
    return {
      shapes: [],
      bounds: { x: startX, y: startY, width: 0, height: 0 },
    };
  }
  
  const lastShape = shapes[shapes.length - 1];
  const totalWidth = (lastShape.x + lastShape.width) - startX;
  const totalHeight = defaultHeight;
  
  return {
    shapes,
    bounds: {
      x: startX,
      y: startY,
      width: totalWidth,
      height: totalHeight,
    },
  };
}

/**
 * Calculate canvas viewport to fit all shapes with padding
 * 
 * @param bounds - Bounding box of all shapes
 * @param padding - Padding around shapes (default: 100px)
 * @returns Viewport configuration { x, y, width, height, zoom }
 * 
 * @example
 * ```typescript
 * const bounds = { x: 100, y: 100, width: 2550, height: 600 };
 * const viewport = calculateCanvasViewport(bounds);
 * // => { x: 0, y: 0, width: 2750, height: 800, zoom: 1 }
 * ```
 * 
 * Requirements:
 * - 3.7: Auto-adjust canvas view to display all generated shapes
 */
export function calculateCanvasViewport(
  bounds: { x: number; y: number; width: number; height: number },
  padding: number = 100
): { x: number; y: number; width: number; height: number; zoom: number } {
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
    zoom: 1,
  };
}

/**
 * Create HTML shapes with auto layout from batch generation result
 * 
 * This is a convenience function that combines calculateAutoLayout and
 * returns ready-to-use shapes with proper positioning.
 * 
 * @param pages - Array of page data from batch generation
 * @param config - Auto layout configuration
 * @returns Array of positioned HTML shapes
 * 
 * @example
 * ```typescript
 * const batchResult = await aiService.generateBatch(context);
 * const shapes = createShapesWithAutoLayout(batchResult.pages);
 * // Add shapes to tldraw canvas
 * ```
 * 
 * Requirements:
 * - 3.2: Create independent HTML_Shape for each page
 * - 3.3: Calculate shape positions (left to right)
 * - 3.4: Maintain 50px spacing
 * - 3.5: Arrange by logical order
 */
export function createShapesWithAutoLayout(
  pages: Array<{ name: string; html: string; css: string; js: string }>,
  config?: AutoLayoutConfig
): HtmlShapeProps[] {
  const result = calculateAutoLayout(pages, config);
  return result.shapes;
}
