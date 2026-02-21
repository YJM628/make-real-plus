/**
 * useCanvasEditor Hook
 * Feature: editor-canvas-refactor
 * Requirements: 1.1, 1.2, 1.3
 * 
 * Manages the tldraw Editor instance lifecycle:
 * - Stores editor state after mount
 * - Exposes editor to window for testing
 * - Provides mount callback for Tldraw component
 */

import { useState, useCallback } from 'react';
import type { Editor } from 'tldraw';

/**
 * Return type for useCanvasEditor hook
 */
interface UseCanvasEditorReturn {
  /** The tldraw Editor instance, null until mounted */
  editor: Editor | null;
  /** Callback to be passed to Tldraw's onMount prop */
  handleMount: (editor: Editor) => void;
}

/**
 * Hook to manage tldraw Editor instance initialization and state
 * 
 * Requirements:
 * - 1.1: Manage editor state (useState<Editor | null>)
 * - 1.2: handleMount callback sets editor and exposes to window.__tldraw_editor__
 * - 1.3: Return { editor, handleMount }
 * 
 * @returns Object containing editor instance and mount handler
 * 
 * @example
 * ```tsx
 * const { editor, handleMount } = useCanvasEditor();
 * 
 * return (
 *   <Tldraw onMount={handleMount} />
 * );
 * ```
 */
export function useCanvasEditor(): UseCanvasEditorReturn {
  // Requirement 1.1: Manage editor state
  const [editor, setEditor] = useState<Editor | null>(null);

  // Requirement 1.2: handleMount callback sets editor and exposes to window
  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
    // Expose editor to window for testing
    (window as any).__tldraw_editor__ = editor;
  }, []);

  // Requirement 1.3: Return { editor, handleMount }
  return {
    editor,
    handleMount,
  };
}
