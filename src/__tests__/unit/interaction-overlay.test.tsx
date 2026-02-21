/**
 * Unit tests for InteractionOverlay component
 * Feature: html-interactive-preview
 * Requirements: 4.1, 4.2, 4.3
 */

import { render, screen } from '@testing-library/react';
import { InteractionOverlay } from '../../components/canvas/overlays/InteractionOverlay';
import type { Editor } from 'tldraw';

describe('InteractionOverlay', () => {
  let mockEditor: Partial<Editor>;
  let mockOnExit: jest.Mock;

  beforeEach(() => {
    mockOnExit = jest.fn();

    // Mock editor with necessary methods
    mockEditor = {
      getShape: jest.fn((id: string) => ({
        id,
        type: 'html',
        x: 100,
        y: 100,
        props: { w: 800, h: 600 },
      })),
      getShapePageTransform: jest.fn(() => ({
        // Mat is a 6-element array: [a, b, c, d, e, f]
        // where e and f are x and y translations
        a: 1, b: 0, c: 0, d: 1, e: 100, f: 100,
      })),
      getShapeGeometry: jest.fn(() => ({
        bounds: {
          x: 0,
          y: 0,
          width: 800,
          height: 600,
        },
      })),
      pageToScreen: jest.fn((point: { x: number; y: number }) => ({
        x: point.x * 2, // Mock zoom factor
        y: point.y * 2,
        z: 1,
      })),
      store: {
        listen: jest.fn(() => jest.fn()), // Return unsubscribe function
      },
    } as any;
  });

  /**
   * Requirement 4.1: Display prominent visual border around interactive shape
   */
  it('should render blue highlight border around interactive shape', () => {
    const { container } = render(
      <InteractionOverlay
        shapeId="shape-123"
        editor={mockEditor as Editor}
        onExit={mockOnExit}
      />
    );

    // Find the border element (first div with fixed position)
    const borderElement = container.querySelector('div[style*="border"]');
    expect(borderElement).toBeTruthy();

    // Verify border styling
    const style = (borderElement as HTMLElement).style;
    // Note: browsers convert hex colors to rgb format
    expect(style.border).toMatch(/3px solid (rgb\(59, 130, 246\)|#3b82f6)/);
    expect(style.boxShadow).toBeTruthy();
    expect(style.pointerEvents).toBe('none');
  });

  /**
   * Requirement 4.2: Show instructions for exiting interactive mode
   */
  it('should display exit instructions', () => {
    render(
      <InteractionOverlay
        shapeId="shape-123"
        editor={mockEditor as Editor}
        onExit={mockOnExit}
      />
    );

    // Verify exit instructions are displayed
    expect(screen.getByText('按 Esc 退出交互模式')).toBeTruthy();
  });

  /**
   * Requirement 4.3: Position overlay based on shape bounds
   */
  it('should position overlay based on shape bounds in screen coordinates', () => {
    const { container } = render(
      <InteractionOverlay
        shapeId="shape-123"
        editor={mockEditor as Editor}
        onExit={mockOnExit}
      />
    );

    // Find the border element
    const borderElement = container.querySelector('div[style*="border"]') as HTMLElement;
    expect(borderElement).toBeTruthy();

    // Verify positioning (pageToScreen converts 100,100 to 200,200)
    const style = borderElement.style;
    expect(style.position).toBe('fixed');
    expect(parseInt(style.left)).toBe(200); // 100 * 2
    expect(parseInt(style.top)).toBe(200); // 100 * 2
  });

  /**
   * Requirement 4.3: Calculate correct dimensions
   */
  it('should calculate correct dimensions based on shape size', () => {
    const { container } = render(
      <InteractionOverlay
        shapeId="shape-123"
        editor={mockEditor as Editor}
        onExit={mockOnExit}
      />
    );

    // Find the border element
    const borderElement = container.querySelector('div[style*="border"]') as HTMLElement;
    expect(borderElement).toBeTruthy();

    // Verify dimensions (800x600 shape, scaled by zoom)
    // topLeft: (100, 100) -> (200, 200)
    // bottomRight: (100 + 800, 100 + 600) = (900, 700) -> (1800, 1400)
    // width: 1800 - 200 = 1600, height: 1400 - 200 = 1200
    const style = borderElement.style;
    expect(parseInt(style.width)).toBe(1600);
    expect(parseInt(style.height)).toBe(1200);
  });

  /**
   * Requirement 4.3: Call onExit when shape is deleted
   */
  it('should call onExit when shape is deleted', () => {
    // Mock getShape to return null (shape deleted)
    mockEditor.getShape = jest.fn(() => null);

    render(
      <InteractionOverlay
        shapeId="shape-123"
        editor={mockEditor as Editor}
        onExit={mockOnExit}
      />
    );

    // onExit should be called when shape is not found
    expect(mockOnExit).toHaveBeenCalled();
  });

  /**
   * Requirement 4.3: Update bounds when shape changes
   */
  it('should listen for shape changes and update bounds', () => {
    render(
      <InteractionOverlay
        shapeId="shape-123"
        editor={mockEditor as Editor}
        onExit={mockOnExit}
      />
    );

    // Verify store.listen was called to subscribe to changes
    expect(mockEditor.store?.listen).toHaveBeenCalled();
  });

  /**
   * Requirement 4.3: Don't render if bounds not calculated
   */
  it('should not render if bounds cannot be calculated', () => {
    // Mock getShapePageTransform to return null
    mockEditor.getShapePageTransform = jest.fn(() => null);

    const { container } = render(
      <InteractionOverlay
        shapeId="shape-123"
        editor={mockEditor as Editor}
        onExit={mockOnExit}
      />
    );

    // Should not render any overlay elements
    const borderElement = container.querySelector('div[style*="border"]');
    expect(borderElement).toBeFalsy();
  });

  /**
   * Requirement 4.1: Verify z-index for proper layering
   */
  it('should render with high z-index to appear above other elements', () => {
    const { container } = render(
      <InteractionOverlay
        shapeId="shape-123"
        editor={mockEditor as Editor}
        onExit={mockOnExit}
      />
    );

    // Find the border element
    const borderElement = container.querySelector('div[style*="border"]') as HTMLElement;
    expect(borderElement).toBeTruthy();

    // Verify high z-index
    expect(borderElement.style.zIndex).toBe('9999');
  });

  /**
   * Requirement 4.2: Verify exit instructions styling
   */
  it('should style exit instructions with blue background', () => {
    const { container } = render(
      <InteractionOverlay
        shapeId="shape-123"
        editor={mockEditor as Editor}
        onExit={mockOnExit}
      />
    );

    // Find the instructions element (second div with fixed position)
    const elements = container.querySelectorAll('div[style*="fixed"]');
    const instructionsElement = elements[1] as HTMLElement;
    expect(instructionsElement).toBeTruthy();

    // Verify styling
    const style = instructionsElement.style;
    // Note: browsers convert hex colors to rgb format
    expect(style.backgroundColor).toMatch(/(rgb\(59, 130, 246\)|#3b82f6)/);
    expect(style.color).toBe('white');
    expect(style.pointerEvents).toBe('none');
  });
});
