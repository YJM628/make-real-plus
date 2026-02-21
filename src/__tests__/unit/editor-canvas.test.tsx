/**
 * Unit tests for EditorCanvas component
 * Feature: ai-html-visual-editor
 * Requirements: 15.1, 15.2, 15.5
 */

import * as React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditorCanvas } from '../../components/canvas/EditorCanvas';

// Mock tldraw
let mockContainer: HTMLElement;
const mockEditor = {
  inputs: {
    currentPagePoint: { x: 100, y: 200 },
  },
  createShape: jest.fn(),
  select: jest.fn(),
  getContainer: jest.fn(() => mockContainer),
  undo: jest.fn(),
  redo: jest.fn(),
};

jest.mock('tldraw', () => ({
  Tldraw: ({ onMount }: any) => {
    // Simulate mounting with a mock editor
    React.useEffect(() => {
      if (onMount) {
        onMount(mockEditor);
      }
    }, [onMount]);

    return (
      <div 
        data-testid="tldraw-canvas" 
        className="tl-canvas"
        ref={(el) => {
          if (el) {
            mockContainer = el;
          }
        }}
      >
        Tldraw Canvas
      </div>
    );
  },
  createShapeId: () => 'test-shape-id',
}));

// Mock AIInputDialog
jest.mock('../../components/dialogs/AIInputDialog', () => ({
  AIInputDialog: ({ open, onClose, onSubmit }: any) => {
    if (!open) return null;
    return (
      <div data-testid="ai-input-dialog">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSubmit({ prompt: 'test prompt' })}>Submit</button>
      </div>
    );
  },
}));

// Mock useAI hook
const mockGenerate = jest.fn();
jest.mock('../../hooks/useAI', () => ({
  useAI: () => ({
    generate: mockGenerate,
  }),
}));

// Mock HybridHtmlShapeUtil
jest.mock('../../core/shape/HybridHtmlShapeUtil', () => ({
  HybridHtmlShapeUtil: class MockHybridHtmlShapeUtil {},
}));

describe('EditorCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 15.1: Listen for double-click and show dialog', () => {
    it('should render tldraw canvas', () => {
      render(<EditorCanvas />);
      
      expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument();
    });

    it('should not show AI input dialog initially', () => {
      render(<EditorCanvas />);
      
      expect(screen.queryByTestId('ai-input-dialog')).not.toBeInTheDocument();
    });

    it('should show AI input dialog when canvas is double-clicked', async () => {
      render(<EditorCanvas />);
      
      const canvas = screen.getByTestId('tldraw-canvas');
      
      // Simulate double-click
      fireEvent.doubleClick(canvas);
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-input-dialog')).toBeInTheDocument();
      });
    });

    it('should hide dialog when close button is clicked', async () => {
      render(<EditorCanvas />);
      
      const canvas = screen.getByTestId('tldraw-canvas');
      fireEvent.doubleClick(canvas); // Open dialog
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-input-dialog')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByText('Close');
      closeButton.click();
      
      await waitFor(() => {
        expect(screen.queryByTestId('ai-input-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Requirement 15.2: Handle AI generation and create shape', () => {
    it('should call AI generate when dialog is submitted', async () => {
      // Mock async generator
      mockGenerate.mockImplementation(async function* () {
        yield { type: 'html', content: '<div>Test</div>', isComplete: false };
        yield { type: 'css', content: 'body { margin: 0; }', isComplete: false };
        yield { type: 'js', content: 'console.log("test");', isComplete: true };
      });

      render(<EditorCanvas />);
      
      const canvas = screen.getByTestId('tldraw-canvas');
      fireEvent.doubleClick(canvas); // Open dialog
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-input-dialog')).toBeInTheDocument();
      });
      
      const submitButton = screen.getByText('Submit');
      submitButton.click();
      
      await waitFor(() => {
        expect(mockGenerate).toHaveBeenCalledWith({ prompt: 'test prompt' });
      });
    });

    it('should create shape with generated content', async () => {
      // Mock async generator
      mockGenerate.mockImplementation(async function* () {
        yield { type: 'html', content: '<div>Test</div>', isComplete: false };
        yield { type: 'css', content: 'body { margin: 0; }', isComplete: false };
        yield { type: 'js', content: 'console.log("test");', isComplete: true };
      });

      render(<EditorCanvas />);
      
      const canvas = screen.getByTestId('tldraw-canvas');
      fireEvent.doubleClick(canvas); // Open dialog
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-input-dialog')).toBeInTheDocument();
      });
      
      const submitButton = screen.getByText('Submit');
      submitButton.click();
      
      await waitFor(() => {
        expect(mockEditor.createShape).toHaveBeenCalledWith({
          id: 'test-shape-id',
          type: 'html',
          x: 100,
          y: 200,
          props: {
            html: '<div>Test</div>',
            css: 'body { margin: 0; }',
            js: 'console.log("test");',
            mode: 'preview',
            overrides: [],
            designSystem: undefined,
            viewport: 'desktop',
            w: 800,
            h: 600,
          },
        });
      });
    });

    it('should select the newly created shape', async () => {
      // Mock async generator
      mockGenerate.mockImplementation(async function* () {
        yield { type: 'html', content: '<div>Test</div>', isComplete: true };
      });

      render(<EditorCanvas />);
      
      const canvas = screen.getByTestId('tldraw-canvas');
      fireEvent.doubleClick(canvas); // Open dialog
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-input-dialog')).toBeInTheDocument();
      });
      
      const submitButton = screen.getByText('Submit');
      submitButton.click();
      
      await waitFor(() => {
        expect(mockEditor.select).toHaveBeenCalledWith('test-shape-id');
      });
    });

    it('should close dialog after successful generation', async () => {
      // Mock async generator
      mockGenerate.mockImplementation(async function* () {
        yield { type: 'html', content: '<div>Test</div>', isComplete: true };
      });

      render(<EditorCanvas />);
      
      const canvas = screen.getByTestId('tldraw-canvas');
      fireEvent.doubleClick(canvas); // Open dialog
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-input-dialog')).toBeInTheDocument();
      });
      
      const submitButton = screen.getByText('Submit');
      submitButton.click();
      
      await waitFor(() => {
        expect(screen.queryByTestId('ai-input-dialog')).not.toBeInTheDocument();
      });
    });

    it('should handle AI generation errors gracefully', async () => {
      // Mock async generator that throws error
      mockGenerate.mockImplementation(async function* () {
        throw new Error('Network timeout');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<EditorCanvas />);
      
      const canvas = screen.getByTestId('tldraw-canvas');
      fireEvent.doubleClick(canvas); // Open dialog
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-input-dialog')).toBeInTheDocument();
      });
      
      const submitButton = screen.getByText('Submit');
      submitButton.click();
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'AI generation failed:',
          expect.any(Error)
        );
      });

      // Error notification should be displayed
      await waitFor(() => {
        expect(screen.getByText(/AI generation failed: Network timeout/i)).toBeInTheDocument();
      });

      // Dialog should close even on error
      await waitFor(() => {
        expect(screen.queryByTestId('ai-input-dialog')).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should auto-hide error notification after 5 seconds', async () => {
      jest.useFakeTimers();
      
      // Mock async generator that throws error
      mockGenerate.mockImplementation(async function* () {
        throw new Error('Test error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<EditorCanvas />);
      
      const canvas = screen.getByTestId('tldraw-canvas');
      fireEvent.doubleClick(canvas);
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-input-dialog')).toBeInTheDocument();
      });
      
      const submitButton = screen.getByText('Submit');
      submitButton.click();
      
      // Error notification should be displayed
      await waitFor(() => {
        expect(screen.getByText(/AI generation failed: Test error/i)).toBeInTheDocument();
      });

      // Fast-forward time by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Error notification should be hidden
      await waitFor(() => {
        expect(screen.queryByText(/AI generation failed: Test error/i)).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe('Integration', () => {
    it('should accumulate HTML, CSS, and JS chunks from AI generation', async () => {
      // Mock async generator with multiple chunks
      mockGenerate.mockImplementation(async function* () {
        yield { type: 'html', content: '<div>', isComplete: false };
        yield { type: 'html', content: 'Hello', isComplete: false };
        yield { type: 'html', content: '</div>', isComplete: false };
        yield { type: 'css', content: 'div { color: red; }', isComplete: false };
        yield { type: 'js', content: 'console.log("test");', isComplete: true };
      });

      render(<EditorCanvas />);
      
      const canvas = screen.getByTestId('tldraw-canvas');
      fireEvent.doubleClick(canvas); // Open dialog
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-input-dialog')).toBeInTheDocument();
      });
      
      const submitButton = screen.getByText('Submit');
      submitButton.click();
      
      await waitFor(() => {
        expect(mockEditor.createShape).toHaveBeenCalledWith(
          expect.objectContaining({
            props: expect.objectContaining({
              html: '<div>Hello</div>',
              css: 'div { color: red; }',
              js: 'console.log("test");',
            }),
          })
        );
      });
    });

    it('should handle empty AI generation', async () => {
      // Mock async generator with no content
      mockGenerate.mockImplementation(async function* () {
        // No yields - empty generation
      });

      render(<EditorCanvas />);
      
      const canvas = screen.getByTestId('tldraw-canvas');
      fireEvent.doubleClick(canvas); // Open dialog
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-input-dialog')).toBeInTheDocument();
      });
      
      const submitButton = screen.getByText('Submit');
      submitButton.click();
      
      await waitFor(() => {
        expect(mockEditor.createShape).toHaveBeenCalledWith(
          expect.objectContaining({
            props: expect.objectContaining({
              html: '<div>No HTML generated</div>',
              css: '',
              js: '',
            }),
          })
        );
      });
    });
  });

  describe('Requirement 15.5: Undo/Redo functionality', () => {
    beforeEach(() => {
      // Reset platform detection
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
        configurable: true,
      });
    });

    it('should call editor.undo() when Ctrl+Z is pressed on Windows', async () => {
      render(<EditorCanvas />);
      
      await waitFor(() => {
        expect(mockEditor.getContainer).toHaveBeenCalled();
      });

      fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
      
      expect(mockEditor.undo).toHaveBeenCalledTimes(1);
    });

    it('should call editor.undo() when Cmd+Z is pressed on Mac', async () => {
      // Mock Mac platform
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
        configurable: true,
      });

      render(<EditorCanvas />);
      
      await waitFor(() => {
        expect(mockEditor.getContainer).toHaveBeenCalled();
      });

      fireEvent.keyDown(window, { key: 'z', metaKey: true });
      
      expect(mockEditor.undo).toHaveBeenCalledTimes(1);
    });

    it('should call editor.redo() when Ctrl+Shift+Z is pressed on Windows', async () => {
      render(<EditorCanvas />);
      
      await waitFor(() => {
        expect(mockEditor.getContainer).toHaveBeenCalled();
      });

      fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
      
      expect(mockEditor.redo).toHaveBeenCalledTimes(1);
    });

    it('should call editor.redo() when Cmd+Shift+Z is pressed on Mac', async () => {
      // Mock Mac platform
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
        configurable: true,
      });

      render(<EditorCanvas />);
      
      await waitFor(() => {
        expect(mockEditor.getContainer).toHaveBeenCalled();
      });

      fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true });
      
      expect(mockEditor.redo).toHaveBeenCalledTimes(1);
    });

    it('should call editor.redo() when Ctrl+Y is pressed on Windows', async () => {
      render(<EditorCanvas />);
      
      await waitFor(() => {
        expect(mockEditor.getContainer).toHaveBeenCalled();
      });

      fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
      
      expect(mockEditor.redo).toHaveBeenCalledTimes(1);
    });

    it('should call editor.redo() when Cmd+Y is pressed on Mac', async () => {
      // Mock Mac platform
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
        configurable: true,
      });

      render(<EditorCanvas />);
      
      await waitFor(() => {
        expect(mockEditor.getContainer).toHaveBeenCalled();
      });

      fireEvent.keyDown(window, { key: 'y', metaKey: true });
      
      expect(mockEditor.redo).toHaveBeenCalledTimes(1);
    });

    it('should not trigger undo when typing in input fields', async () => {
      render(<EditorCanvas />);
      
      await waitFor(() => {
        expect(mockEditor.getContainer).toHaveBeenCalled();
      });

      // Create a mock input element
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      fireEvent.keyDown(input, { key: 'z', ctrlKey: true });
      
      expect(mockEditor.undo).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('should not trigger undo when typing in textarea fields', async () => {
      render(<EditorCanvas />);
      
      await waitFor(() => {
        expect(mockEditor.getContainer).toHaveBeenCalled();
      });

      // Create a mock textarea element
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      fireEvent.keyDown(textarea, { key: 'z', ctrlKey: true });
      
      expect(mockEditor.undo).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should prevent default browser behavior for undo/redo shortcuts', async () => {
      render(<EditorCanvas />);
      
      await waitFor(() => {
        expect(mockEditor.getContainer).toHaveBeenCalled();
      });

      const undoEvent = new KeyboardEvent('keydown', { 
        key: 'z', 
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = jest.spyOn(undoEvent, 'preventDefault');

      window.dispatchEvent(undoEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not call undo when Shift+Z is pressed without Ctrl/Cmd', async () => {
      render(<EditorCanvas />);
      
      await waitFor(() => {
        expect(mockEditor.getContainer).toHaveBeenCalled();
      });

      fireEvent.keyDown(window, { key: 'z', shiftKey: true });
      
      expect(mockEditor.undo).not.toHaveBeenCalled();
      expect(mockEditor.redo).not.toHaveBeenCalled();
    });

    it('should not call redo when Y is pressed without Ctrl/Cmd', async () => {
      render(<EditorCanvas />);
      
      await waitFor(() => {
        expect(mockEditor.getContainer).toHaveBeenCalled();
      });

      fireEvent.keyDown(window, { key: 'y' });
      
      expect(mockEditor.redo).not.toHaveBeenCalled();
    });

    it('should handle multiple undo operations', async () => {
      render(<EditorCanvas />);
      
      await waitFor(() => {
        expect(mockEditor.getContainer).toHaveBeenCalled();
      });

      // Trigger undo multiple times
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
      
      expect(mockEditor.undo).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple redo operations', async () => {
      render(<EditorCanvas />);
      
      await waitFor(() => {
        expect(mockEditor.getContainer).toHaveBeenCalled();
      });

      // Trigger redo multiple times
      fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
      fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
      
      expect(mockEditor.redo).toHaveBeenCalledTimes(2);
    });

    it('should handle undo/redo sequence', async () => {
      render(<EditorCanvas />);
      
      await waitFor(() => {
        expect(mockEditor.getContainer).toHaveBeenCalled();
      });

      // Undo, then redo
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
      expect(mockEditor.undo).toHaveBeenCalledTimes(1);
      
      fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
      expect(mockEditor.redo).toHaveBeenCalledTimes(1);
    });
  });
});
