/**
 * Unit tests for useInteractiveMode hook
 * Feature: html-interactive-preview
 * Requirements: 1.1, 1.3, 2.1, 2.2, 2.3, 5.3
 */

import { renderHook, act } from '@testing-library/react';
import { useInteractiveMode } from '../../components/canvas/hooks/useInteractiveMode';
import type { Editor, TLShape } from 'tldraw';

describe('useInteractiveMode', () => {
  const mockEditor = { 
    id: 'test-editor',
    getContainer: jest.fn(() => null), // Return null to skip event listener setup
  } as unknown as Editor;

  it('should initialize with null interactiveShapeId', () => {
    // Requirement 1.3: Track single interactive shape ID
    const { result } = renderHook(() => useInteractiveMode(mockEditor));

    expect(result.current.interactiveShapeId).toBeNull();
    expect(result.current.enterInteractiveMode).toBeInstanceOf(Function);
    expect(result.current.exitInteractiveMode).toBeInstanceOf(Function);
  });

  it('should enter interactive mode for a shape', () => {
    // Requirement 1.1: Enter interactive mode for a shape
    const { result } = renderHook(() => useInteractiveMode(mockEditor));

    act(() => {
      result.current.enterInteractiveMode('shape-123');
    });

    expect(result.current.interactiveShapeId).toBe('shape-123');
  });

  it('should exit interactive mode', () => {
    // Requirements 2.1, 2.2, 2.3: Exit interactive mode
    const { result } = renderHook(() => useInteractiveMode(mockEditor));

    act(() => {
      result.current.enterInteractiveMode('shape-123');
    });

    expect(result.current.interactiveShapeId).toBe('shape-123');

    act(() => {
      result.current.exitInteractiveMode();
    });

    expect(result.current.interactiveShapeId).toBeNull();
  });

  it('should ensure only one shape is in interactive mode at a time', () => {
    // Requirement 1.3: Only one shape can be in interactive mode
    const { result } = renderHook(() => useInteractiveMode(mockEditor));

    act(() => {
      result.current.enterInteractiveMode('shape-1');
    });

    expect(result.current.interactiveShapeId).toBe('shape-1');

    act(() => {
      result.current.enterInteractiveMode('shape-2');
    });

    // Should replace the previous interactive shape
    expect(result.current.interactiveShapeId).toBe('shape-2');
  });

  it('should handle null editor gracefully', () => {
    // Edge case: editor is null during initialization
    const { result } = renderHook(() => useInteractiveMode(null));

    expect(result.current.interactiveShapeId).toBeNull();
    expect(result.current.enterInteractiveMode).toBeInstanceOf(Function);
    expect(result.current.exitInteractiveMode).toBeInstanceOf(Function);

    // Should still work even with null editor
    act(() => {
      result.current.enterInteractiveMode('shape-123');
    });

    expect(result.current.interactiveShapeId).toBe('shape-123');

    act(() => {
      result.current.exitInteractiveMode();
    });

    expect(result.current.interactiveShapeId).toBeNull();
  });

  it('should maintain stable callback references', () => {
    // Verify callbacks don't change between renders
    const { result, rerender } = renderHook(() => useInteractiveMode(mockEditor));

    const firstEnter = result.current.enterInteractiveMode;
    const firstExit = result.current.exitInteractiveMode;

    rerender();

    expect(result.current.enterInteractiveMode).toBe(firstEnter);
    expect(result.current.exitInteractiveMode).toBe(firstExit);
  });

  it('should handle entering interactive mode for the same shape (idempotent)', () => {
    // Edge case: entering interactive mode for already interactive shape
    const { result } = renderHook(() => useInteractiveMode(mockEditor));

    act(() => {
      result.current.enterInteractiveMode('shape-123');
    });

    expect(result.current.interactiveShapeId).toBe('shape-123');

    act(() => {
      result.current.enterInteractiveMode('shape-123');
    });

    // Should remain the same
    expect(result.current.interactiveShapeId).toBe('shape-123');
  });

  it('should handle multiple exit calls gracefully', () => {
    // Edge case: calling exitInteractiveMode when already in canvas mode
    const { result } = renderHook(() => useInteractiveMode(mockEditor));

    act(() => {
      result.current.enterInteractiveMode('shape-123');
    });

    act(() => {
      result.current.exitInteractiveMode();
    });

    expect(result.current.interactiveShapeId).toBeNull();

    // Should handle multiple exit calls
    act(() => {
      result.current.exitInteractiveMode();
    });

    expect(result.current.interactiveShapeId).toBeNull();
  });

  it('should satisfy all requirements', () => {
    // Comprehensive test validating Requirements 1.1, 1.3, 2.1, 2.2, 2.3
    const { result } = renderHook(() => useInteractiveMode(mockEditor));

    // 1.3: Track single interactive shape ID (initially null)
    expect(result.current.interactiveShapeId).toBeNull();

    // 1.1: Enter interactive mode for a shape
    act(() => {
      result.current.enterInteractiveMode('shape-abc');
    });

    expect(result.current.interactiveShapeId).toBe('shape-abc');

    // 1.3: Only one shape can be in interactive mode
    act(() => {
      result.current.enterInteractiveMode('shape-xyz');
    });

    expect(result.current.interactiveShapeId).toBe('shape-xyz');

    // 2.1, 2.2, 2.3: Exit interactive mode
    act(() => {
      result.current.exitInteractiveMode();
    });

    expect(result.current.interactiveShapeId).toBeNull();

    // Verify return type structure
    expect(result.current).toHaveProperty('interactiveShapeId');
    expect(result.current).toHaveProperty('enterInteractiveMode');
    expect(result.current).toHaveProperty('exitInteractiveMode');
    expect(typeof result.current.enterInteractiveMode).toBe('function');
    expect(typeof result.current.exitInteractiveMode).toBe('function');
  });

  describe('Escape key exit handling', () => {
    let mockContainer: HTMLDivElement;
    let mockEditor: Editor;

    beforeEach(() => {
      // Create a mock container element
      mockContainer = document.createElement('div');
      document.body.appendChild(mockContainer);

      // Create mock editor with necessary methods
      mockEditor = {
        getContainer: jest.fn(() => mockContainer),
        screenToPage: jest.fn((point) => point),
        getShapeAtPoint: jest.fn(),
      } as unknown as Editor;
    });

    afterEach(() => {
      document.body.removeChild(mockContainer);
    });

    it('should exit interactive mode when Escape key is pressed', () => {
      // Requirement 2.2: Escape key exits interactive mode
      const { result } = renderHook(() => useInteractiveMode(mockEditor));

      // Enter interactive mode
      act(() => {
        result.current.enterInteractiveMode('shape-123');
      });

      expect(result.current.interactiveShapeId).toBe('shape-123');

      // Simulate Escape key press
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        });
        window.dispatchEvent(event);
      });

      expect(result.current.interactiveShapeId).toBeNull();
    });

    it('should not exit interactive mode when other keys are pressed', () => {
      // Requirement 2.2: Only Escape key exits interactive mode
      const { result } = renderHook(() => useInteractiveMode(mockEditor));

      // Enter interactive mode
      act(() => {
        result.current.enterInteractiveMode('shape-123');
      });

      expect(result.current.interactiveShapeId).toBe('shape-123');

      // Simulate other key presses
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      // Should remain in interactive mode
      expect(result.current.interactiveShapeId).toBe('shape-123');

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true,
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      // Should still remain in interactive mode
      expect(result.current.interactiveShapeId).toBe('shape-123');
    });

    it('should not listen for Escape key when not in interactive mode', () => {
      // Requirement 2.2: Only listen when in interactive mode
      const { result } = renderHook(() => useInteractiveMode(mockEditor));

      expect(result.current.interactiveShapeId).toBeNull();

      // Simulate Escape key press
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        });
        window.dispatchEvent(event);
      });

      // Should remain null (no effect)
      expect(result.current.interactiveShapeId).toBeNull();
    });

    it('should clean up Escape key listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { result, unmount } = renderHook(() => useInteractiveMode(mockEditor));

      // Enter interactive mode to register listener
      act(() => {
        result.current.enterInteractiveMode('shape-123');
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Click outside exit handling', () => {
    let mockContainer: HTMLDivElement;
    let mockEditor: Editor;
    let mockHtmlShape: TLShape;
    let mockOtherShape: TLShape;

    beforeEach(() => {
      // Create a mock container element
      mockContainer = document.createElement('div');
      document.body.appendChild(mockContainer);

      // Create mock shapes
      mockHtmlShape = {
        id: 'html-shape-123',
        type: 'html',
      } as TLShape;

      mockOtherShape = {
        id: 'other-shape-456',
        type: 'geo',
      } as TLShape;

      // Create mock editor with necessary methods
      mockEditor = {
        getContainer: jest.fn(() => mockContainer),
        screenToPage: jest.fn((point) => point),
        getShapeAtPoint: jest.fn(),
      } as unknown as Editor;
    });

    afterEach(() => {
      document.body.removeChild(mockContainer);
    });

    it('should exit interactive mode when clicking outside the interactive shape', () => {
      // Requirement 2.1: Click outside exits interactive mode
      const { result } = renderHook(() => useInteractiveMode(mockEditor));

      // Enter interactive mode
      act(() => {
        result.current.enterInteractiveMode('html-shape-123');
      });

      expect(result.current.interactiveShapeId).toBe('html-shape-123');

      // Simulate click on empty area (no shape)
      (mockEditor.getShapeAtPoint as any).mockReturnValue(null);

      act(() => {
        const event = new MouseEvent('pointerdown', {
          clientX: 500,
          clientY: 500,
          bubbles: true,
        });
        mockContainer.dispatchEvent(event);
      });

      expect(result.current.interactiveShapeId).toBeNull();
    });

    it('should exit interactive mode when clicking a different shape', () => {
      // Requirement 2.1: Click on different shape exits interactive mode
      const { result } = renderHook(() => useInteractiveMode(mockEditor));

      // Enter interactive mode
      act(() => {
        result.current.enterInteractiveMode('html-shape-123');
      });

      expect(result.current.interactiveShapeId).toBe('html-shape-123');

      // Simulate click on a different shape
      (mockEditor.getShapeAtPoint as any).mockReturnValue(mockOtherShape);

      act(() => {
        const event = new MouseEvent('pointerdown', {
          clientX: 300,
          clientY: 300,
          bubbles: true,
        });
        mockContainer.dispatchEvent(event);
      });

      expect(result.current.interactiveShapeId).toBeNull();
    });

    it('should maintain interactive mode when clicking the same interactive shape', () => {
      // Requirement 2.1: Click on same shape maintains interactive mode
      const { result } = renderHook(() => useInteractiveMode(mockEditor));

      // Enter interactive mode
      act(() => {
        result.current.enterInteractiveMode('html-shape-123');
      });

      expect(result.current.interactiveShapeId).toBe('html-shape-123');

      // Simulate click on the same interactive shape
      (mockEditor.getShapeAtPoint as any).mockReturnValue(mockHtmlShape);

      act(() => {
        const event = new MouseEvent('pointerdown', {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        });
        mockContainer.dispatchEvent(event);
      });

      // Should maintain interactive mode
      expect(result.current.interactiveShapeId).toBe('html-shape-123');
    });

    it('should not listen for pointerdown when not in interactive mode', () => {
      // Requirement 2.1: Only listen when in interactive mode
      const { result } = renderHook(() => useInteractiveMode(mockEditor));

      expect(result.current.interactiveShapeId).toBeNull();

      // Simulate click
      (mockEditor.getShapeAtPoint as any).mockReturnValue(null);

      act(() => {
        const event = new MouseEvent('pointerdown', {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        });
        mockContainer.dispatchEvent(event);
      });

      // Should remain null (no effect)
      expect(result.current.interactiveShapeId).toBeNull();
    });

    it('should clean up pointerdown listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(mockContainer, 'removeEventListener');

      const { result, unmount } = renderHook(() => useInteractiveMode(mockEditor));

      // Enter interactive mode to register listener
      act(() => {
        result.current.enterInteractiveMode('shape-123');
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    });
  });

  describe('Double-click event handling', () => {
    let mockContainer: HTMLDivElement;
    let mockEditor: Editor;
    let mockHtmlShape: TLShape;
    let mockNonHtmlShape: TLShape;

    beforeEach(() => {
      // Create a mock container element
      mockContainer = document.createElement('div');
      document.body.appendChild(mockContainer);

      // Create mock shapes
      mockHtmlShape = {
        id: 'html-shape-123',
        type: 'html',
      } as TLShape;

      mockNonHtmlShape = {
        id: 'rect-shape-456',
        type: 'geo',
      } as TLShape;

      // Create mock editor with necessary methods
      mockEditor = {
        getContainer: jest.fn(() => mockContainer),
        screenToPage: jest.fn((point) => point),
        getShapeAtPoint: jest.fn(),
      } as unknown as Editor;
    });

    afterEach(() => {
      document.body.removeChild(mockContainer);
    });

    it('should enter interactive mode when double-clicking an HtmlShape', () => {
      // Requirement 1.1: Double-click HtmlShape enters interactive mode
      (mockEditor.getShapeAtPoint as any).mockReturnValue(mockHtmlShape);

      const { result } = renderHook(() => useInteractiveMode(mockEditor));

      expect(result.current.interactiveShapeId).toBeNull();

      // Simulate double-click event
      act(() => {
        const event = new MouseEvent('dblclick', {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        });
        mockContainer.dispatchEvent(event);
      });

      expect(result.current.interactiveShapeId).toBe('html-shape-123');
      expect(mockEditor.screenToPage).toHaveBeenCalledWith({ x: 100, y: 100 });
      expect(mockEditor.getShapeAtPoint).toHaveBeenCalled();
    });

    it('should not enter interactive mode when double-clicking a non-HtmlShape', () => {
      // Requirement 1.1: Only HtmlShapes trigger interactive mode
      (mockEditor.getShapeAtPoint as any).mockReturnValue(mockNonHtmlShape);

      const { result } = renderHook(() => useInteractiveMode(mockEditor));

      expect(result.current.interactiveShapeId).toBeNull();

      // Simulate double-click event
      act(() => {
        const event = new MouseEvent('dblclick', {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        });
        mockContainer.dispatchEvent(event);
      });

      // Should remain null
      expect(result.current.interactiveShapeId).toBeNull();
    });

    it('should not enter interactive mode when double-clicking empty area', () => {
      // Requirement 1.1: Empty area doesn't trigger interactive mode
      (mockEditor.getShapeAtPoint as any).mockReturnValue(null);

      const { result } = renderHook(() => useInteractiveMode(mockEditor));

      expect(result.current.interactiveShapeId).toBeNull();

      // Simulate double-click event
      act(() => {
        const event = new MouseEvent('dblclick', {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        });
        mockContainer.dispatchEvent(event);
      });

      // Should remain null
      expect(result.current.interactiveShapeId).toBeNull();
    });

    it('should maintain interactive mode when double-clicking the same shape (idempotent)', () => {
      // Requirement 5.3: Double-clicking already interactive shape maintains state
      (mockEditor.getShapeAtPoint as any).mockReturnValue(mockHtmlShape);

      const { result } = renderHook(() => useInteractiveMode(mockEditor));

      // First double-click to enter interactive mode
      act(() => {
        const event = new MouseEvent('dblclick', {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        });
        mockContainer.dispatchEvent(event);
      });

      expect(result.current.interactiveShapeId).toBe('html-shape-123');

      // Second double-click on the same shape
      act(() => {
        const event = new MouseEvent('dblclick', {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        });
        mockContainer.dispatchEvent(event);
      });

      // Should maintain the same interactive shape
      expect(result.current.interactiveShapeId).toBe('html-shape-123');
    });

    it('should switch interactive mode when double-clicking a different HtmlShape', () => {
      // Requirement 1.3: Only one shape can be in interactive mode at a time
      const anotherHtmlShape = {
        id: 'html-shape-789',
        type: 'html',
      } as TLShape;

      (mockEditor.getShapeAtPoint as any).mockReturnValueOnce(mockHtmlShape);

      const { result } = renderHook(() => useInteractiveMode(mockEditor));

      // First double-click
      act(() => {
        const event = new MouseEvent('dblclick', {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        });
        mockContainer.dispatchEvent(event);
      });

      expect(result.current.interactiveShapeId).toBe('html-shape-123');

      // Double-click on a different HtmlShape
      (mockEditor.getShapeAtPoint as any).mockReturnValueOnce(anotherHtmlShape);

      act(() => {
        const event = new MouseEvent('dblclick', {
          clientX: 200,
          clientY: 200,
          bubbles: true,
        });
        mockContainer.dispatchEvent(event);
      });

      // Should switch to the new shape
      expect(result.current.interactiveShapeId).toBe('html-shape-789');
    });

    it('should not register event listeners when editor is null', () => {
      const { result } = renderHook(() => useInteractiveMode(null));

      expect(result.current.interactiveShapeId).toBeNull();

      // Should not throw error when trying to dispatch events
      // (no listeners registered)
      expect(() => {
        const event = new MouseEvent('dblclick', {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        });
        document.body.dispatchEvent(event);
      }).not.toThrow();
    });

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(mockContainer, 'removeEventListener');

      const { unmount } = renderHook(() => useInteractiveMode(mockEditor));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('dblclick', expect.any(Function));
    });

    it('should handle missing container gracefully', () => {
      const editorWithoutContainer = {
        getContainer: jest.fn(() => null),
        screenToPage: jest.fn(),
        getShapeAtPoint: jest.fn(),
      } as unknown as Editor;

      const { result } = renderHook(() => useInteractiveMode(editorWithoutContainer));

      expect(result.current.interactiveShapeId).toBeNull();
      // Should not throw error
    });
  });
});
