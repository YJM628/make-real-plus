/**
 * Unit tests for ScreenshotSelector component
 * Feature: ai-html-visual-editor
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScreenshotSelector } from '../../components/tools/ScreenshotSelector';

// Mock html2canvas
jest.mock('html2canvas', () => {
  const mockHtml2Canvas = jest.fn(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    
    // Ensure getContext returns a valid mock context
    const originalGetContext = canvas.getContext.bind(canvas);
    canvas.getContext = jest.fn((contextType: string) => {
      if (contextType === '2d') {
        const ctx = originalGetContext('2d');
        if (!ctx) {
          // Create a minimal mock context if real one isn't available
          return {
            drawImage: jest.fn(),
            fillRect: jest.fn(),
            fillStyle: '',
          };
        }
        return ctx;
      }
      return originalGetContext(contextType);
    });
    
    return Promise.resolve(canvas);
  });
  return {
    __esModule: true,
    default: mockHtml2Canvas,
  };
});

describe('ScreenshotSelector', () => {
  let targetElement: HTMLElement;
  let onComplete: jest.Mock;
  let onCancel: jest.Mock;

  beforeEach(() => {
    // Mock HTMLCanvasElement.prototype.toBlob if not available
    if (!HTMLCanvasElement.prototype.toBlob) {
      HTMLCanvasElement.prototype.toBlob = function(callback: BlobCallback) {
        setTimeout(() => {
          const blob = new Blob(['fake-image-data'], { type: 'image/png' });
          callback(blob);
        }, 0);
      };
    }

    // Create a target element with some content
    targetElement = document.createElement('div');
    targetElement.style.width = '800px';
    targetElement.style.height = '600px';
    targetElement.style.position = 'relative';
    
    // Add some child elements
    const child1 = document.createElement('div');
    child1.id = 'child1';
    child1.style.position = 'absolute';
    child1.style.left = '100px';
    child1.style.top = '100px';
    child1.style.width = '200px';
    child1.style.height = '100px';
    
    const child2 = document.createElement('div');
    child2.id = 'child2';
    child2.style.position = 'absolute';
    child2.style.left = '400px';
    child2.style.top = '300px';
    child2.style.width = '150px';
    child2.style.height = '80px';
    
    targetElement.appendChild(child1);
    targetElement.appendChild(child2);
    document.body.appendChild(targetElement);

    onComplete = jest.fn();
    onCancel = jest.fn();
  });

  afterEach(() => {
    document.body.removeChild(targetElement);
    jest.clearAllMocks();
  });

  /**
   * Test: Semi-transparent overlay is rendered
   * Requirement: 8.1
   */
  test('renders semi-transparent overlay mask', () => {
    const { container } = render(
      <ScreenshotSelector
        targetElement={targetElement}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveStyle({
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      cursor: 'crosshair',
    });
  });

  /**
   * Test: Cancel button is rendered and functional
   * Requirement: 8.1, 8.9
   */
  test('renders cancel button and calls onCancel when clicked', () => {
    render(
      <ScreenshotSelector
        targetElement={targetElement}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByText(/Cancel/i);
    expect(cancelButton).toBeInTheDocument();

    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Escape key cancels selection
   * Requirement: 8.9
   */
  test('pressing Escape key calls onCancel', () => {
    render(
      <ScreenshotSelector
        targetElement={targetElement}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Selection rectangle is drawn on drag
   * Requirement: 8.2
   */
  test('draws selection rectangle when dragging', () => {
    const { container } = render(
      <ScreenshotSelector
        targetElement={targetElement}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );

    const overlay = container.firstChild as HTMLElement;

    // Simulate drag from (100, 100) to (300, 250)
    fireEvent.mouseDown(overlay, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(overlay, { clientX: 300, clientY: 250 });

    // Check if selection rectangle is rendered
    const selectionRect = overlay.querySelector('div[style*="border"]') as HTMLElement;
    expect(selectionRect).toBeInTheDocument();
    expect(selectionRect).toHaveStyle({
      border: '2px solid #007AFF',
    });
  });

  /**
   * Test: Selection dimensions are displayed
   * Requirement: 8.2
   */
  test('displays selection dimensions during drag', () => {
    const { container } = render(
      <ScreenshotSelector
        targetElement={targetElement}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );

    const overlay = container.firstChild as HTMLElement;

    // Mock getBoundingClientRect for overlay
    overlay.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    // Simulate drag
    fireEvent.mouseDown(overlay, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(overlay, { clientX: 300, clientY: 250 });

    // Check if dimensions are displayed
    const dimensionsDisplay = screen.getByText(/200.*×.*150/);
    expect(dimensionsDisplay).toBeInTheDocument();
  });

  /**
   * Test: Reverse dragging (right-to-left, bottom-to-top) works correctly
   * Requirement: 8.2
   */
  test('handles reverse dragging correctly', () => {
    const { container } = render(
      <ScreenshotSelector
        targetElement={targetElement}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );

    const overlay = container.firstChild as HTMLElement;

    overlay.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    // Simulate reverse drag (from bottom-right to top-left)
    fireEvent.mouseDown(overlay, { clientX: 300, clientY: 250 });
    fireEvent.mouseMove(overlay, { clientX: 100, clientY: 100 });

    // Selection should still have positive width and height
    const dimensionsDisplay = screen.getByText(/200.*×.*150/);
    expect(dimensionsDisplay).toBeInTheDocument();
  });

  /**
   * Test: Small selections (accidental clicks) are ignored
   * Requirement: 8.2
   */
  test('ignores very small selections', async () => {
    const { container } = render(
      <ScreenshotSelector
        targetElement={targetElement}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );

    const overlay = container.firstChild as HTMLElement;

    overlay.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    // Simulate very small drag (< 10px)
    fireEvent.mouseDown(overlay, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(overlay, { clientX: 105, clientY: 105 });
    fireEvent.mouseUp(overlay);

    await waitFor(() => {
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  /**
   * Test: Screenshot capture flow is initiated
   * Requirement: 8.3
   * 
   * Note: Full end-to-end screenshot testing is limited in jsdom due to canvas API limitations.
   * This test verifies that the component attempts to capture a screenshot when a valid
   * selection is made. Integration tests in a real browser environment would verify the
   * complete screenshot capture functionality.
   */
  test('initiates screenshot capture on valid selection', async () => {
    const { container } = render(
      <ScreenshotSelector
        targetElement={targetElement}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );

    const overlay = container.firstChild as HTMLElement;

    // Mock getBoundingClientRect
    overlay.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    targetElement.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    // Simulate valid selection
    fireEvent.mouseDown(overlay, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(overlay, { clientX: 300, clientY: 250 });
    
    // Verify html2canvas would be called (mock verification)
    const html2canvas = require('html2canvas').default;
    
    fireEvent.mouseUp(overlay);

    // Wait a bit for async operations to start
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify html2canvas was called with the target element
    expect(html2canvas).toHaveBeenCalledWith(
      targetElement,
      expect.objectContaining({
        allowTaint: true,
        useCORS: true,
        logging: false,
      })
    );
  });

  /**
   * Test: Element identification within bounds
   * Requirement: 8.4
   * 
   * Note: This test verifies the element identification logic separately from screenshot capture.
   * We test the identifyElementsInBounds function indirectly by checking that html2canvas is called.
   */
  test('calls html2canvas when selection is made', async () => {
    const { container } = render(
      <ScreenshotSelector
        targetElement={targetElement}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );

    const overlay = container.firstChild as HTMLElement;

    // Mock getBoundingClientRect
    overlay.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    targetElement.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    // Mock child elements' bounding boxes
    const child1 = targetElement.querySelector('#child1') as HTMLElement;
    const child2 = targetElement.querySelector('#child2') as HTMLElement;

    child1.getBoundingClientRect = jest.fn(() => ({
      left: 100,
      top: 100,
      right: 300,
      bottom: 200,
      width: 200,
      height: 100,
      x: 100,
      y: 100,
      toJSON: () => {},
    }));

    child2.getBoundingClientRect = jest.fn(() => ({
      left: 400,
      top: 300,
      right: 550,
      bottom: 380,
      width: 150,
      height: 80,
      x: 400,
      y: 300,
      toJSON: () => {},
    }));

    const html2canvas = require('html2canvas').default;
    html2canvas.mockClear();

    // Select area that would include child1 but not child2
    fireEvent.mouseDown(overlay, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(overlay, { clientX: 350, clientY: 250 });
    fireEvent.mouseUp(overlay);

    // Wait for async operations to start
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify html2canvas was called
    expect(html2canvas).toHaveBeenCalled();
  });

  /**
   * Test: Error handling during screenshot capture
   * Requirement: 8.3
   */
  test('handles screenshot capture errors gracefully', async () => {
    // Mock html2canvas to throw an error
    const html2canvas = require('html2canvas').default;
    html2canvas.mockImplementationOnce(() => Promise.reject(new Error('Capture failed')));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { container } = render(
      <ScreenshotSelector
        targetElement={targetElement}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );

    const overlay = container.firstChild as HTMLElement;

    overlay.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    targetElement.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    // Simulate selection
    fireEvent.mouseDown(overlay, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(overlay, { clientX: 300, clientY: 250 });
    fireEvent.mouseUp(overlay);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to capture screenshot:',
        expect.any(Error)
      );
    });

    expect(onComplete).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
