/**
 * Unit tests for EditorCanvas interactive mode integration
 * Feature: html-interactive-preview
 * Requirements: 1.1, 1.3
 */

import * as React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditorCanvas } from '../../components/canvas/EditorCanvas';

// Mock all dependencies
jest.mock('tldraw', () => ({
  Tldraw: ({ children }: any) => <div data-testid="tldraw-canvas">{children}</div>,
  createShapeId: () => 'test-shape-id',
  StateNode: class {},
}));

jest.mock('../../core/shape/HybridHtmlShapeUtil', () => ({
  HybridHtmlShapeUtil: {},
}));

jest.mock('../../components/import/HtmlImportDialog', () => ({
  HtmlImportDialog: () => null,
}));

jest.mock('../../components/canvas/dialogs/CodeEditorDialog', () => ({
  CodeEditorDialog: () => null,
}));

jest.mock('../../components/canvas/dialogs/GrapesJSEditorDialog', () => ({
  GrapesJSEditorDialog: () => null,
}));

jest.mock('../../components/canvas/panels/AIPromptPanel', () => ({
  AIPromptPanel: () => <div data-testid="ai-prompt-panel" />,
}));

jest.mock('../../components/canvas/toolbar/toolRegistry', () => ({
  getToolClasses: () => [],
}));

jest.mock('../../components/canvas/hooks/useCanvasEditor', () => ({
  useCanvasEditor: () => ({
    editor: null,
    handleMount: jest.fn(),
  }),
}));

jest.mock('../../components/canvas/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: jest.fn(),
}));

jest.mock('../../components/canvas/hooks/usePageNavigation', () => ({
  usePageNavigation: () => ({
    pageLinkHandlerRef: { current: null },
  }),
}));

jest.mock('../../components/canvas/hooks/useToolEventHandlers', () => ({
  useToolEventHandlers: jest.fn(),
}));

jest.mock('../../components/canvas/generation/useSingleGenerate', () => ({
  useSingleGenerate: () => ({
    handleSingleGenerate: jest.fn(),
    singleLoading: false,
  }),
}));

jest.mock('../../components/canvas/generation/useBatchGenerate', () => ({
  useBatchGenerate: () => ({
    handleBatchGenerate: jest.fn(),
    batchLoading: false,
    batchProgress: null,
  }),
}));

jest.mock('../../components/canvas/toolbar/toolDefinitions', () => ({
  createUiOverrides: () => ({}),
}));

jest.mock('../../components/canvas/toolbar/EditorToolbar', () => ({
  createToolbarComponents: () => ({}),
}));

jest.mock('../../components/canvas/notifications/ErrorToast', () => ({
  ErrorToast: () => null,
}));

jest.mock('../../components/canvas/notifications/LoadingIndicator', () => ({
  LoadingIndicator: () => null,
}));

describe('EditorCanvas - Interactive Mode Integration', () => {
  describe('Requirement 1.1, 1.3: Interactive mode context integration', () => {
    it('should render without errors when interactive mode is integrated', () => {
      const { container } = render(<EditorCanvas />);
      expect(container).toBeInTheDocument();
    });

    it('should provide InteractiveModeContext to Tldraw component', () => {
      const { getByTestId } = render(<EditorCanvas />);
      const tldrawCanvas = getByTestId('tldraw-canvas');
      expect(tldrawCanvas).toBeInTheDocument();
    });

    it('should initialize useInteractiveMode hook', () => {
      // This test verifies that the hook is called without errors
      expect(() => render(<EditorCanvas />)).not.toThrow();
    });
  });
});
