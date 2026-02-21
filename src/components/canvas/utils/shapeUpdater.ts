/**
 * shapeUpdater - Utility for batch updating HTML shapes
 * Feature: editor-canvas-refactor
 * Requirements: 6.1, 6.4
 * 
 * Provides a shared utility function to eliminate the repetitive pattern
 * of "iterate all HTML shapes and update properties" found throughout EditorCanvas.
 */

import type { Editor } from 'tldraw';

/**
 * Batch update all HTML shapes on the current page with specified properties
 * 
 * This function filters the current page's shapes to only HTML type shapes,
 * then updates each one by merging the provided properties update object.
 * 
 * Requirements:
 * - 6.1: Accept editor instance and properties update object, batch update all HTML shapes
 * - 6.4: Only update shapes with type 'html', ignore other types
 * 
 * @param editor - tldraw Editor instance
 * @param propsUpdate - Properties to merge into each HTML shape's props
 * 
 * @example
 * // Update all HTML shapes to preview mode
 * updateAllHtmlShapes(editor, { mode: 'preview' });
 * 
 * @example
 * // Update all HTML shapes to mobile viewport
 * updateAllHtmlShapes(editor, { viewport: 'mobile' });
 */
export function updateAllHtmlShapes(
  editor: Editor,
  propsUpdate: Record<string, unknown>
): void {
  // Get all shapes on the current page
  const shapes = editor.getCurrentPageShapes();
  
  // Filter to only HTML type shapes (Requirement 6.4)
  // Use type assertion since 'html' is a custom shape type
  const htmlShapes = shapes.filter(shape => shape.type === 'html' as any);
  
  // Update each HTML shape with the merged properties (Requirement 6.1)
  htmlShapes.forEach(shape => {
    editor.updateShape({
      id: shape.id,
      type: shape.type as any,
      props: { ...shape.props, ...propsUpdate },
    });
  });
}
