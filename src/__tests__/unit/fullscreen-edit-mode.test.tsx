/**
 * Unit tests for fullscreen edit mode functionality
 * Feature: fullscreen-edit-mode
 * Tests: EditorCanvas fullscreen state management and UI layout
 */
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditorCanvas } from '../../components/canvas/EditorCanvas';

// Mock all dependencies
jest.mock('tldraw', () => ({
  Tldraw: ({ children }: any) => <div data-testid="tldraw">{children}</div>,
  createShapeId: () => 'test-shape-id',
}));

jest.mock('../../core/shape/HybridHtmlShapeUtil', () => ({
  HybridHtmlShapeUtil: {},
}));

jest.mock('../../components/import/HtmlImportDialog', () => ({
  HtmlImportDialog: () => <div data-testid="html-import-dialog" />,
}));

jest.mock('../../components/canvas/dialogs/CodeEditorDialog', () => ({
  CodeEditorDialog: () => <div data-testid="code-editor-dialog" />,
}));

jest.mock('../../components/canvas/dialogs/GrapesJSEditorDialog', () => ({
  GrapesJSEditorDialog: ({ fullscreenMode }: { fullscreenMode?: boolean }) => (
    <div data-testid="grapesjs-dialog" data-fullscreen={fullscreenMode} />
  ),
}));

jest.mock('../../components/canvas/dialogs/MergePreviewDialog', () => ({
  MergePreviewDialog: () => <div data-testid="merge-preview-dialog" />,
}));

jest.mock('../../components/canvas/ExportDialog', () => ({
  ExportDialog: () => <div data-testid="export-dialog" />,
}));

jest.mock('../../components/canvas/dialogs/ShareDialog', () => ({
  ShareDialog: () => <div data-testid="share-dialog" />,
}));

jest.mock('../../components/canvas/panels/ThemeEditorPanel', () => ({
  ThemeEditorPanel: () => <div data-testid="theme-editor-panel" />,
}));

jest.mock('../../components/canvas/panels/AIPromptPanel', () => ({
  AIPromptPanel: ({ style }: { style?: React.CSSProperties }) => (
    <div data-testid="ai-prompt-panel" style={style} />
  ),
}));

jest.mock('../../components/canvas/overlays/InteractionOverlay', () => ({
  InteractionOverlay: () => <div data-testid="interaction-overlay" />,
}));

jest.mock('../../components/canvas/notifications/ErrorToast', () => ({
  ErrorToast: () => <div data-testid="error-toast" />,
}));

jest.mock('../../components/canvas/notifications/LoadingIndicator', () => ({
  LoadingIndicator: () => <div data-testid="loading-indicator" />,
}));

jest.mock('../../utils/batch/collectPages', () => ({
  collectPages: () => [],
}));

jest.mock('../../utils/batch/parseBatchRequest', () => ({
  parseAppContext: () => null,
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

jest.mock('../../components/canvas/hooks/useInteractiveMode', () => ({
  useInteractiveMode: () => ({
    interactiveShapeId: null,
    exitInteractiveMode: jest.fn(),
  }),
  InteractiveModeContext: {
    Provider: ({ children }: any) => children,
  },
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

describe('Fullscreen Edit Mode', () => {
  it('should render EditorCanvas with AI panel and Tldraw visible by default', () => {
    render(<EditorCanvas />);
    
    const aiPanel = screen.getByTestId('ai-prompt-panel');
    const tldraw = screen.getByTestId('tldraw');
    
    expect(aiPanel).toBeTruthy();
    expect(tldraw).toBeTruthy();
    
    // Check that display is not 'none'
    expect(aiPanel.style.display).not.toBe('none');
  });

  it('should pass fullscreenMode prop to GrapesJSEditorDialog', () => {
    render(<EditorCanvas />);
    
    const grapesDialog = screen.getByTestId('grapesjs-dialog');
    
    // Initially fullscreenMode should be false
    expect(grapesDialog.getAttribute('data-fullscreen')).toBe('false');
  });
});
