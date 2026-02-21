/**
 * Unit tests for GrapesJSEditorDialog fullscreen mode
 * Feature: fullscreen-edit-mode
 * Tests: GrapesJSEditorDialog fullscreen styles
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GrapesJSEditorDialog } from '../../components/canvas/dialogs/GrapesJSEditorDialog';

// Mock grapesjs
jest.mock('grapesjs', () => ({
  default: {
    init: jest.fn(() => ({
      getHtml: () => '<div>test</div>',
      getCss: () => 'body { margin: 0; }',
      destroy: jest.fn(),
    })),
  },
}));

describe('GrapesJSEditorDialog Fullscreen Mode', () => {
  const mockEditor = {
    getSelectedShapes: jest.fn(() => [
      {
        id: 'test-shape-id',
        type: 'html',
        props: {
          html: '<div>test</div>',
          css: 'body { margin: 0; }',
        },
      },
    ]),
    getShape: jest.fn((id: string) => ({
      id,
      type: 'html',
      props: {
        html: '<div>test</div>',
        css: 'body { margin: 0; }',
      },
    })),
    updateShape: jest.fn(),
    sideEffects: {
      registerBeforeDeleteHandler: jest.fn(() => jest.fn()),
    },
  } as any;

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should apply normal styles when fullscreenMode is false', () => {
    const { container } = render(
      <GrapesJSEditorDialog
        isOpen={true}
        editor={mockEditor}
        onClose={mockOnClose}
        fullscreenMode={false}
      />
    );

    // Find the inner dialog div (second div child)
    const dialogContainer = container.firstChild as HTMLElement;
    const dialogContent = dialogContainer.children[0] as HTMLElement;

    expect(dialogContent.style.width).toBe('95vw');
    expect(dialogContent.style.height).toBe('90vh');
    expect(dialogContent.style.borderRadius).toBe('12px');
  });

  it('should apply fullscreen styles when fullscreenMode is true', () => {
    const { container } = render(
      <GrapesJSEditorDialog
        isOpen={true}
        editor={mockEditor}
        onClose={mockOnClose}
        fullscreenMode={true}
      />
    );

    // Find the inner dialog div (second div child)
    const dialogContainer = container.firstChild as HTMLElement;
    const dialogContent = dialogContainer.children[0] as HTMLElement;

    expect(dialogContent.style.width).toBe('100vw');
    expect(dialogContent.style.height).toBe('100vh');
    expect(dialogContent.style.borderRadius).toBe('0');
    expect(dialogContent.style.boxShadow).toBe('none');
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <GrapesJSEditorDialog
        isOpen={false}
        editor={mockEditor}
        onClose={mockOnClose}
        fullscreenMode={true}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should have close button visible in fullscreen mode', () => {
    const { getByText } = render(
      <GrapesJSEditorDialog
        isOpen={true}
        editor={mockEditor}
        onClose={mockOnClose}
        fullscreenMode={true}
      />
    );

    const closeButton = getByText('Close');
    expect(closeButton).toBeTruthy();
  });
});
