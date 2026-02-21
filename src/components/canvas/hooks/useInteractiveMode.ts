/**
 * useInteractiveMode Hook
 * Feature: html-interactive-preview
 * Requirements: 1.1, 1.3, 2.1, 2.2, 2.3, 5.3
 * 
 * Manages interactive mode for HTML shapes:
 * - Tracks which shape is in interactive mode (interactiveShapeId)
 * - Provides methods to enter/exit interactive mode
 * - Ensures only one shape can be in interactive mode at a time
 * - Listens for double-click events to enter interactive mode
 */

import { useState, useCallback, useEffect, createContext } from 'react';
import type { Editor } from 'tldraw';

/**
 * Context type for interactive mode
 * - null: Canvas mode (no shape in interactive mode)
 * - string: Shape ID currently in interactive mode
 */
export type InteractiveModeContextType = string | null;

/**
 * React Context for sharing interactive mode state with shape components
 * Default value is null (canvas mode)
 */
export const InteractiveModeContext = createContext<InteractiveModeContextType>(null);

/**
 * Return type for useInteractiveMode hook
 */
export interface UseInteractiveModeReturn {
  /** Current shape ID in interactive mode, null if none */
  interactiveShapeId: string | null;
  /** Enter interactive mode for a specific shape */
  enterInteractiveMode: (shapeId: string) => void;
  /** Exit interactive mode and return to canvas mode */
  exitInteractiveMode: () => void;
}

/**
 * Hook to manage interactive mode state for HTML shapes
 * 
 * Requirements:
 * - 1.1: Double-click HtmlShape enters interactive mode
 * - 1.3: Only one shape can be in interactive mode at a time
 * - 2.1: Click outside exits interactive mode
 * - 2.2: Escape key exits interactive mode
 * - 2.3: Exit restores pointerEvents to 'none'
 * - 5.3: Double-clicking already interactive shape maintains interactive mode
 * 
 * @param editor - The tldraw Editor instance (can be null during initialization)
 * @returns Object containing interactive state and control methods
 * 
 * @example
 * ```tsx
 * const { interactiveShapeId, enterInteractiveMode, exitInteractiveMode } = useInteractiveMode(editor);
 * 
 * // Enter interactive mode
 * enterInteractiveMode('shape-123');
 * 
 * // Exit interactive mode
 * exitInteractiveMode();
 * 
 * // Check if a shape is interactive
 * const isInteractive = interactiveShapeId === 'shape-123';
 * ```
 */
export function useInteractiveMode(editor: Editor | null): UseInteractiveModeReturn {
  // Requirement 1.3: Track single interactive shape ID
  const [interactiveShapeId, setInteractiveShapeId] = useState<string | null>(null);

  // Requirement 1.1: Enter interactive mode for a shape
  // Requirement 1.3: Ensures only one shape is interactive (replaces previous)
  const enterInteractiveMode = useCallback((shapeId: string) => {
    // Cancel tldraw's editing state to prevent it from intercepting
    // the first click/interaction inside the iframe.
    // Without this, double-click triggers tldraw's "editing" mode for the shape,
    // which captures the first click as a text-editing focus event.
    if (editor) {
      editor.setEditingShape(null);
    }
    setInteractiveShapeId(shapeId);
  }, [editor]);

  // Requirements 2.1, 2.2, 2.3: Exit interactive mode
  const exitInteractiveMode = useCallback(() => {
    setInteractiveShapeId(null);
  }, []);

  // Requirement 1.1, 5.3: Listen for double-click events to enter interactive mode
  useEffect(() => {
    if (!editor) return;

    const handleDoubleClick = (event: MouseEvent) => {
      // Get the shape at the clicked position
      const point = editor.screenToPage({ x: event.clientX, y: event.clientY });
      const shape = editor.getShapeAtPoint(point);

      // Requirement 1.1: If clicked shape is an HtmlShape, enter interactive mode
      // Requirement 5.3: If already interactive, maintain interactive mode (idempotent)
      if (shape && shape.type === 'html') {
        enterInteractiveMode(shape.id);
      }
      // If not an HtmlShape or empty area, do nothing (don't trigger interactive mode)
    };

    // Get the editor container element
    const container = editor.getContainer();
    if (!container) return;

    // Listen for double-click events on the editor container
    container.addEventListener('dblclick', handleDoubleClick);

    return () => {
      container.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [editor, enterInteractiveMode]);

  // Requirement 2.2: Listen for Escape key to exit interactive mode
  useEffect(() => {
    if (!editor || !interactiveShapeId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Requirement 2.2: Exit interactive mode when Escape is pressed
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        exitInteractiveMode();
      }
    };

    // Listen for keydown events on window
    // Note: This doesn't conflict with useKeyboardShortcuts because:
    // 1. We only listen when interactiveShapeId is set
    // 2. We only handle Escape key (useKeyboardShortcuts handles Ctrl/Cmd+Z/Y)
    // 3. We call preventDefault and stopPropagation to prevent further handling
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, interactiveShapeId, exitInteractiveMode]);

  // Requirement 2.1: Listen for clicks outside interactive shape to exit
  useEffect(() => {
    if (!editor || !interactiveShapeId) return;

    const handlePointerDown = (event: PointerEvent) => {
      // Get the shape at the clicked position
      const point = editor.screenToPage({ x: event.clientX, y: event.clientY });
      const shape = editor.getShapeAtPoint(point);

      // Requirement 2.1: If clicked outside the interactive shape, exit interactive mode
      // Exit if:
      // - No shape was clicked (clicked on empty canvas)
      // - A different shape was clicked
      if (!shape || shape.id !== interactiveShapeId) {
        exitInteractiveMode();
      }
      // If clicked on the same interactive shape, maintain interactive mode
    };

    // Get the editor container element
    const container = editor.getContainer();
    if (!container) return;

    // Listen for pointerdown events on the editor container
    container.addEventListener('pointerdown', handlePointerDown);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [editor, interactiveShapeId, exitInteractiveMode]);

  // Requirement 1.3: Return state and methods
  return {
    interactiveShapeId,
    enterInteractiveMode,
    exitInteractiveMode,
  };
}
