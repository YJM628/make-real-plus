/**
 * InteractionOverlay Component
 * Feature: html-interactive-preview
 * Requirements: 4.1, 4.2, 4.3
 * 
 * Visual indicator for interactive mode:
 * - Displays a blue highlight border around the interactive shape
 * - Shows exit instructions ("按 Esc 退出交互模式")
 * - Positioned based on shape's canvas position and size
 */

import * as React from 'react';
import type { Editor } from 'tldraw';

/**
 * Props for InteractionOverlay component
 */
export interface InteractionOverlayProps {
  /** ID of the shape currently in interactive mode */
  shapeId: string;
  /** tldraw Editor instance for accessing shape data */
  editor: Editor;
  /** Callback to exit interactive mode */
  onExit: () => void;
}

/**
 * InteractionOverlay - Visual indicator for interactive mode
 * 
 * Requirements:
 * - 4.1: Display prominent visual border around interactive shape
 * - 4.2: Show instructions for exiting interactive mode
 * - 4.3: Remove visual indicators when interactive mode exits
 * 
 * @example
 * ```tsx
 * {interactiveShapeId && (
 *   <InteractionOverlay
 *     shapeId={interactiveShapeId}
 *     editor={editor}
 *     onExit={exitInteractiveMode}
 *   />
 * )}
 * ```
 */
export const InteractionOverlay: React.FC<InteractionOverlayProps> = ({
  shapeId,
  editor,
  onExit,
}) => {
  const [bounds, setBounds] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Update bounds when shape position/size changes
  React.useEffect(() => {
    if (!editor) return;

    const updateBounds = () => {
      const shape = editor.getShape(shapeId as any);
      if (!shape) {
        // Shape was deleted, exit interactive mode
        onExit();
        return;
      }

      // Get shape page bounds (includes position and size)
      const pageTransform = editor.getShapePageTransform(shapeId as any);
      if (!pageTransform) return;

      // Get shape geometry bounds
      const geometry = editor.getShapeGeometry(shape);
      const shapeBounds = geometry.bounds;
      
      // Extract position from transform matrix
      // Mat is a 6-element array: [a, b, c, d, e, f] where e and f are x and y translations
      const shapeX = pageTransform.e;
      const shapeY = pageTransform.f;

      // Convert page coordinates to screen coordinates
      const topLeft = editor.pageToScreen({
        x: shapeX,
        y: shapeY,
      });

      const bottomRight = editor.pageToScreen({
        x: shapeX + shapeBounds.width,
        y: shapeY + shapeBounds.height,
      });

      setBounds({
        x: topLeft.x,
        y: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
      });
    };

    // Initial bounds calculation
    updateBounds();

    // Listen for shape changes (move, resize, etc.)
    const unsubscribe = editor.store.listen(() => {
      updateBounds();
    });

    return () => {
      unsubscribe();
    };
  }, [editor, shapeId, onExit]);

  // Don't render if bounds not calculated yet
  if (!bounds) return null;

  return (
    <>
      {/* Requirement 4.1: Blue highlight border around interactive shape */}
      <div
        style={{
          position: 'fixed',
          left: bounds.x,
          top: bounds.y,
          width: bounds.width,
          height: bounds.height,
          border: '3px solid #3b82f6',
          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.5)',
          pointerEvents: 'none',
          zIndex: 9999,
          borderRadius: '4px',
        }}
      />

      {/* Requirement 4.2: Exit instructions */}
      <div
        style={{
          position: 'fixed',
          left: bounds.x,
          top: bounds.y - 40,
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          pointerEvents: 'none',
          zIndex: 10000,
          whiteSpace: 'nowrap',
        }}
      >
        按 Esc 退出交互模式
      </div>
    </>
  );
};
