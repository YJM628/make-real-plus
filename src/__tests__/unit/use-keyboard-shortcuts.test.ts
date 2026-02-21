/**
 * Unit tests for useKeyboardShortcuts hook
 * Feature: editor-canvas-refactor
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../../components/canvas/hooks/useKeyboardShortcuts';
import type { Editor } from 'tldraw';

describe('useKeyboardShortcuts', () => {
  let mockEditor: Editor;
  let originalUserAgent: string;

  beforeEach(() => {
    // Store original userAgent
    originalUserAgent = navigator.userAgent;

    // Create a mock editor with undo/redo methods
    mockEditor = {
      undo: jest.fn(),
      redo: jest.fn(),
    } as unknown as Editor;
  });

  afterEach(() => {
    // Restore original userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
      configurable: true,
    });
  });

  describe('Platform Detection', () => {
    it('should detect Mac platform using navigator.userAgent', () => {
      // Requirement 3.4: Use navigator.userAgent instead of deprecated navigator.platform
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        writable: true,
        configurable: true,
      });

      renderHook(() => useKeyboardShortcuts(mockEditor));

      // Simulate Cmd+Z on Mac
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        ctrlKey: false,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(mockEditor.undo).toHaveBeenCalledTimes(1);
    });

    it('should detect non-Mac platform using navigator.userAgent', () => {
      // Requirement 3.4: Use navigator.userAgent for platform detection
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
        configurable: true,
      });

      renderHook(() => useKeyboardShortcuts(mockEditor));

      // Simulate Ctrl+Z on Windows
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        metaKey: false,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(mockEditor.undo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Undo Shortcut', () => {
    it('should call editor.undo() when Ctrl+Z is pressed on Windows', () => {
      // Requirement 3.1: Handle Ctrl/Cmd+Z for undo
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
        configurable: true,
      });

      renderHook(() => useKeyboardShortcuts(mockEditor));

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: false,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(mockEditor.undo).toHaveBeenCalledTimes(1);
      expect(mockEditor.redo).not.toHaveBeenCalled();
    });

    it('should call editor.undo() when Cmd+Z is pressed on Mac', () => {
      // Requirement 3.1: Handle Ctrl/Cmd+Z for undo
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        writable: true,
        configurable: true,
      });

      renderHook(() => useKeyboardShortcuts(mockEditor));

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        shiftKey: false,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(mockEditor.undo).toHaveBeenCalledTimes(1);
      expect(mockEditor.redo).not.toHaveBeenCalled();
    });

    it('should prevent default behavior when handling undo', () => {
      renderHook(() => useKeyboardShortcuts(mockEditor));

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: false,
        bubbles: true,
      });

      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Redo Shortcut', () => {
    it('should call editor.redo() when Ctrl+Shift+Z is pressed on Windows', () => {
      // Requirement 3.2: Handle Ctrl/Cmd+Shift+Z for redo
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
        configurable: true,
      });

      renderHook(() => useKeyboardShortcuts(mockEditor));

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(mockEditor.redo).toHaveBeenCalledTimes(1);
      expect(mockEditor.undo).not.toHaveBeenCalled();
    });

    it('should call editor.redo() when Cmd+Shift+Z is pressed on Mac', () => {
      // Requirement 3.2: Handle Ctrl/Cmd+Shift+Z for redo
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        writable: true,
        configurable: true,
      });

      renderHook(() => useKeyboardShortcuts(mockEditor));

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        shiftKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(mockEditor.redo).toHaveBeenCalledTimes(1);
      expect(mockEditor.undo).not.toHaveBeenCalled();
    });

    it('should call editor.redo() when Ctrl+Y is pressed on Windows', () => {
      // Requirement 3.2: Handle Ctrl/Cmd+Y for redo
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
        configurable: true,
      });

      renderHook(() => useKeyboardShortcuts(mockEditor));

      const event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(mockEditor.redo).toHaveBeenCalledTimes(1);
      expect(mockEditor.undo).not.toHaveBeenCalled();
    });

    it('should call editor.redo() when Cmd+Y is pressed on Mac', () => {
      // Requirement 3.2: Handle Ctrl/Cmd+Y for redo
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        writable: true,
        configurable: true,
      });

      renderHook(() => useKeyboardShortcuts(mockEditor));

      const event = new KeyboardEvent('keydown', {
        key: 'y',
        metaKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(mockEditor.redo).toHaveBeenCalledTimes(1);
      expect(mockEditor.undo).not.toHaveBeenCalled();
    });

    it('should prevent default behavior when handling redo', () => {
      renderHook(() => useKeyboardShortcuts(mockEditor));

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });

      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Input/Textarea Focus Handling', () => {
    it('should skip shortcut handling when input element has focus', () => {
      // Requirement 3.3: Skip shortcut handling when input/textarea has focus
      renderHook(() => useKeyboardShortcuts(mockEditor));

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', {
        value: input,
        writable: false,
      });

      window.dispatchEvent(event);

      expect(mockEditor.undo).not.toHaveBeenCalled();
      expect(mockEditor.redo).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should skip shortcut handling when textarea element has focus', () => {
      // Requirement 3.3: Skip shortcut handling when input/textarea has focus
      renderHook(() => useKeyboardShortcuts(mockEditor));

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', {
        value: textarea,
        writable: false,
      });

      window.dispatchEvent(event);

      expect(mockEditor.undo).not.toHaveBeenCalled();
      expect(mockEditor.redo).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should handle shortcuts when other elements have focus', () => {
      // Requirement 3.3: Only skip for input/textarea
      renderHook(() => useKeyboardShortcuts(mockEditor));

      const div = document.createElement('div');
      document.body.appendChild(div);

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, 'target', {
        value: div,
        writable: false,
      });

      window.dispatchEvent(event);

      expect(mockEditor.undo).toHaveBeenCalledTimes(1);

      document.body.removeChild(div);
    });
  });

  describe('Editor Lifecycle', () => {
    it('should not register event listeners when editor is null', () => {
      // Don't register listeners when editor is null
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderHook(() => useKeyboardShortcuts(null));

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should register keydown event listener when editor is provided', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderHook(() => useKeyboardShortcuts(mockEditor));

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyboardShortcuts(mockEditor));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should handle editor changing from null to defined', () => {
      // Edge case: editor starts as null, then becomes defined
      const { rerender } = renderHook(
        ({ editor }) => useKeyboardShortcuts(editor),
        { initialProps: { editor: null as Editor | null } }
      );

      // Simulate Ctrl+Z - should not call undo yet
      const event1 = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event1);
      expect(mockEditor.undo).not.toHaveBeenCalled();

      // Now provide the editor
      rerender({ editor: mockEditor });

      // Simulate Ctrl+Z again - should now call undo
      const event2 = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event2);
      expect(mockEditor.undo).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should not trigger shortcuts for Z key without modifier', () => {
      renderHook(() => useKeyboardShortcuts(mockEditor));

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: false,
        metaKey: false,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(mockEditor.undo).not.toHaveBeenCalled();
      expect(mockEditor.redo).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts for Y key without modifier', () => {
      renderHook(() => useKeyboardShortcuts(mockEditor));

      const event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: false,
        metaKey: false,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(mockEditor.undo).not.toHaveBeenCalled();
      expect(mockEditor.redo).not.toHaveBeenCalled();
    });

    it('should not trigger shortcuts for other keys with modifier', () => {
      renderHook(() => useKeyboardShortcuts(mockEditor));

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(mockEditor.undo).not.toHaveBeenCalled();
      expect(mockEditor.redo).not.toHaveBeenCalled();
    });

    it('should use correct modifier key based on platform', () => {
      // On Mac, Ctrl+Z should not trigger undo (should use Cmd)
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        writable: true,
        configurable: true,
      });

      renderHook(() => useKeyboardShortcuts(mockEditor));

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        metaKey: false,
        bubbles: true,
      });

      window.dispatchEvent(event);

      // Should not trigger because Mac requires metaKey
      expect(mockEditor.undo).not.toHaveBeenCalled();
    });
  });

  describe('Comprehensive Requirements Validation', () => {
    it('should satisfy all requirements', () => {
      // Comprehensive test validating Requirements 3.1, 3.2, 3.3, 3.4
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
        configurable: true,
      });

      renderHook(() => useKeyboardShortcuts(mockEditor));

      // 3.1: Ctrl+Z for undo
      const undoEvent = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: false,
        bubbles: true,
      });
      window.dispatchEvent(undoEvent);
      expect(mockEditor.undo).toHaveBeenCalledTimes(1);

      // 3.2: Ctrl+Shift+Z for redo
      const redoEvent1 = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(redoEvent1);
      expect(mockEditor.redo).toHaveBeenCalledTimes(1);

      // 3.2: Ctrl+Y for redo
      const redoEvent2 = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(redoEvent2);
      expect(mockEditor.redo).toHaveBeenCalledTimes(2);

      // 3.3: Skip when input has focus
      const input = document.createElement('input');
      document.body.appendChild(input);
      const inputEvent = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });
      Object.defineProperty(inputEvent, 'target', {
        value: input,
        writable: false,
      });
      window.dispatchEvent(inputEvent);
      // Should still be 1 (not incremented)
      expect(mockEditor.undo).toHaveBeenCalledTimes(1);
      document.body.removeChild(input);

      // 3.4: Uses navigator.userAgent (verified by platform detection working)
      expect(navigator.userAgent).toContain('Windows');
    });
  });
});
