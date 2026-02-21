/**
 * useKeyboardShortcuts Hook
 * Feature: editor-canvas-refactor
 * Requirements: 3.1, 3.2, 3.3, 3.4
 * 
 * Manages keyboard shortcuts for undo/redo operations:
 * - Registers keydown event listener
 * - Detects Mac platform using navigator.userAgent (non-deprecated)
 * - Skips shortcut handling when input/textarea has focus
 * - Handles Ctrl/Cmd+Z (undo) and Ctrl/Cmd+Shift+Z/Y (redo)
 */

import { useEffect } from 'react';
import type { Editor } from 'tldraw';

/**
 * Hook to manage keyboard shortcuts for canvas operations
 * 
 * Requirements:
 * - 3.1: Handle Ctrl/Cmd+Z for undo
 * - 3.2: Handle Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y for redo
 * - 3.3: Skip shortcut handling when focus is on input/textarea
 * - 3.4: Use navigator.userAgent instead of deprecated navigator.platform
 * 
 * @param editor - The tldraw Editor instance, or null if not yet mounted
 * 
 * @example
 * ```tsx
 * const { editor } = useCanvasEditor();
 * useKeyboardShortcuts(editor);
 * ```
 */
export function useKeyboardShortcuts(editor: Editor | null): void {
  useEffect(() => {
    // Don't register listeners when editor is null
    if (!editor) return;

    /**
     * Detect if the current platform is Mac
     * Requirement 3.4: Use navigator.userAgent instead of deprecated navigator.platform
     */
    const isMac = navigator.userAgent.includes('Mac');

    /**
     * Handle keyboard shortcuts
     * Requirements: 3.1, 3.2, 3.3
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      // Requirement 3.3: Skip shortcut handling when input/textarea has focus
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Determine if the modifier key is pressed (Cmd on Mac, Ctrl on others)
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;

      // Requirement 3.1: Handle Ctrl/Cmd+Z (undo)
      if (modifierKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        editor.undo();
        return;
      }

      // Requirement 3.2: Handle Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y (redo)
      if (
        (modifierKey && e.key === 'z' && e.shiftKey) ||
        (modifierKey && e.key === 'y')
      ) {
        e.preventDefault();
        editor.redo();
        return;
      }
    };

    // Register keydown event listener
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor]);
}
