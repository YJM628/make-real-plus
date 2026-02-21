/**
 * Unit tests for EditorCanvas persistence functionality
 * Feature: canvas-persistence
 * Requirements: 1.1, 1.2
 * 
 * This test verifies that the EditorCanvas component correctly passes
 * the persistenceKey prop to the Tldraw component to enable automatic
 * canvas state persistence to IndexedDB.
 */

import * as React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditorCanvas } from '../../components/canvas/EditorCanvas';

// Track the props passed to Tldraw
let capturedTldrawProps: any = null;

// Mock tldraw
jest.mock('tldraw', () => ({
  Tldraw: (props: any) => {
    // Capture the props for verification
    capturedTldrawProps = props;
    
    // Simulate mounting with a mock editor
    React.useEffect(() => {
      if (props.onMount) {
        const mockEditor = {
          inputs: { currentPagePoint: { x: 0, y: 0 } },
          createShape: jest.fn(),
          select: jest.fn(),
          getContainer: jest.fn(() => document.createElement('div')),
          undo: jest.fn(),
          redo: jest.fn(),
        };
        props.onMount(mockEditor);
      }
    }, [props.onMount]);

    return <div data-testid="tldraw-canvas">Tldraw Canvas</div>;
  },
  createShapeId: () => 'test-shape-id',
  StateNode: class MockStateNode {},
  HTMLContainer: () => null,
}));

// Mock HybridHtmlShapeUtil
jest.mock('../../core/shape/HybridHtmlShapeUtil', () => ({
  HybridHtmlShapeUtil: class MockHybridHtmlShapeUtil {},
}));

// Mock AI config to avoid import.meta issues
jest.mock('../../services/ai/config', () => ({
  getAIConfig: jest.fn(() => ({
    provider: 'mock',
    maxTokens: 4000,
    temperature: 0.7,
  })),
  getAIConfigFromEnv: jest.fn(() => ({
    provider: 'mock',
    maxTokens: 4000,
    temperature: 0.7,
  })),
  validateAIConfig: jest.fn(() => ({
    valid: true,
  })),
}));

// Mock other dependencies
jest.mock('../../components/import/HtmlImportDialog', () => ({
  HtmlImportDialog: () => null,
}));

jest.mock('../../components/canvas/dialogs/CodeEditorDialog', () => ({
  CodeEditorDialog: () => null,
}));

jest.mock('../../components/canvas/dialogs/GrapesJSEditorDialog', () => ({
  GrapesJSEditorDialog: () => null,
}));

jest.mock('../../components/canvas/dialogs/MergePreviewDialog', () => ({
  MergePreviewDialog: () => null,
}));

jest.mock('../../components/canvas/panels/AIPromptPanel', () => ({
  AIPromptPanel: () => <div data-testid="ai-prompt-panel">AI Prompt Panel</div>,
}));

describe('EditorCanvas Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedTldrawProps = null;
  });

  describe('Requirement 1.1, 1.2: persistenceKey property', () => {
    it('should pass persistenceKey prop to Tldraw component', () => {
      render(<EditorCanvas />);
      
      // Verify that Tldraw received the persistenceKey prop
      expect(capturedTldrawProps).not.toBeNull();
      expect(capturedTldrawProps).toHaveProperty('persistenceKey');
    });

    it('should pass persistenceKey with value "canvas-editor"', () => {
      render(<EditorCanvas />);
      
      // Verify the persistenceKey value matches the constant
      expect(capturedTldrawProps.persistenceKey).toBe('canvas-editor');
    });

    it('should pass persistenceKey along with other required props', () => {
      render(<EditorCanvas />);
      
      // Verify that persistenceKey is passed alongside other essential props
      expect(capturedTldrawProps).toHaveProperty('persistenceKey', 'canvas-editor');
      expect(capturedTldrawProps).toHaveProperty('onMount');
      expect(capturedTldrawProps).toHaveProperty('shapeUtils');
      expect(capturedTldrawProps).toHaveProperty('tools');
      expect(capturedTldrawProps).toHaveProperty('overrides');
      expect(capturedTldrawProps).toHaveProperty('components');
    });
  });

  describe('PERSISTENCE_KEY constant', () => {
    it('should have PERSISTENCE_KEY constant with value "canvas-editor"', () => {
      // Import the constant value through the component's behavior
      render(<EditorCanvas />);
      
      // The constant value is verified through the prop passed to Tldraw
      expect(capturedTldrawProps.persistenceKey).toBe('canvas-editor');
    });

    it('should use consistent persistenceKey value across renders', () => {
      // First render
      const { unmount } = render(<EditorCanvas />);
      const firstPersistenceKey = capturedTldrawProps.persistenceKey;
      unmount();
      
      // Second render
      capturedTldrawProps = null;
      render(<EditorCanvas />);
      const secondPersistenceKey = capturedTldrawProps.persistenceKey;
      
      // Verify consistency
      expect(firstPersistenceKey).toBe('canvas-editor');
      expect(secondPersistenceKey).toBe('canvas-editor');
      expect(firstPersistenceKey).toBe(secondPersistenceKey);
    });
  });
});
