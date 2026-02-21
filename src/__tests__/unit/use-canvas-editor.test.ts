/**
 * Unit tests for useCanvasEditor hook
 * Feature: editor-canvas-refactor
 * Requirements: 1.1, 1.2, 1.3
 */

import { renderHook, act } from '@testing-library/react';
import { useCanvasEditor } from '../../components/canvas/hooks/useCanvasEditor';
import type { Editor } from 'tldraw';

describe('useCanvasEditor', () => {
  beforeEach(() => {
    // Clean up window.__tldraw_editor__ before each test
    delete (window as any).__tldraw_editor__;
  });

  afterEach(() => {
    // Clean up after tests
    delete (window as any).__tldraw_editor__;
  });

  it('should initialize with null editor', () => {
    // Requirement 1.1: Manage editor state
    const { result } = renderHook(() => useCanvasEditor());

    expect(result.current.editor).toBeNull();
    expect(result.current.handleMount).toBeInstanceOf(Function);
  });

  it('should set editor when handleMount is called', () => {
    // Requirement 1.2: handleMount callback sets editor
    const { result } = renderHook(() => useCanvasEditor());

    const mockEditor = { id: 'test-editor' } as unknown as Editor;

    act(() => {
      result.current.handleMount(mockEditor);
    });

    expect(result.current.editor).toBe(mockEditor);
  });

  it('should expose editor to window.__tldraw_editor__ for testing', () => {
    // Requirement 1.2: expose to window object
    const { result } = renderHook(() => useCanvasEditor());

    const mockEditor = { id: 'test-editor' } as unknown as Editor;

    act(() => {
      result.current.handleMount(mockEditor);
    });

    expect((window as any).__tldraw_editor__).toBe(mockEditor);
  });

  it('should return stable handleMount callback', () => {
    // Verify handleMount reference doesn't change between renders
    const { result, rerender } = renderHook(() => useCanvasEditor());

    const firstHandleMount = result.current.handleMount;

    rerender();

    expect(result.current.handleMount).toBe(firstHandleMount);
  });

  it('should handle multiple mount calls (edge case)', () => {
    // Edge case: handleMount called multiple times
    const { result } = renderHook(() => useCanvasEditor());

    const mockEditor1 = { id: 'editor-1' } as unknown as Editor;
    const mockEditor2 = { id: 'editor-2' } as unknown as Editor;

    act(() => {
      result.current.handleMount(mockEditor1);
    });

    expect(result.current.editor).toBe(mockEditor1);

    act(() => {
      result.current.handleMount(mockEditor2);
    });

    // Should update to the new editor
    expect(result.current.editor).toBe(mockEditor2);
    expect((window as any).__tldraw_editor__).toBe(mockEditor2);
  });

  it('should satisfy all requirements', () => {
    // Comprehensive test validating Requirements 1.1, 1.2, 1.3
    const { result } = renderHook(() => useCanvasEditor());

    // 1.1: Manage editor state (useState<Editor | null>)
    expect(result.current.editor).toBeNull();

    const mockEditor = { 
      id: 'test-editor',
      getCurrentPageShapes: jest.fn(),
    } as unknown as Editor;

    // 1.2: handleMount callback sets editor and exposes to window
    act(() => {
      result.current.handleMount(mockEditor);
    });

    expect(result.current.editor).toBe(mockEditor);
    expect((window as any).__tldraw_editor__).toBe(mockEditor);

    // 1.3: Return { editor, handleMount }
    expect(result.current).toHaveProperty('editor');
    expect(result.current).toHaveProperty('handleMount');
    expect(typeof result.current.handleMount).toBe('function');
  });
});
