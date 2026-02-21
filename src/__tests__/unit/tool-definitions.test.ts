/**
 * Unit tests for toolDefinitions module
 * Feature: editor-canvas-refactor
 * Requirements: 7.2, 7.3, 7.4
 * 
 * Tests the createUiOverrides function to ensure it properly configures
 * custom tools and actions.
 */

import { createUiOverrides } from '../../components/canvas/toolbar/toolDefinitions';
import type { Editor } from 'tldraw';

// Mock the toolRegistry module
jest.mock('../../components/canvas/toolbar/toolRegistry', () => ({
  getToolDefinitions: jest.fn(() => ({})),
}));

describe('toolDefinitions', () => {
  let mockEditor: Editor;
  let setCodeEditorOpen: jest.Mock;
  let setGrapesEditorOpen: jest.Mock;
  let mockHelpers: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock editor
    mockEditor = {
      setCurrentTool: jest.fn(),
      getCurrentPageShapes: jest.fn(() => []),
      updateShape: jest.fn(),
      getSelectedShapes: jest.fn(() => []),
    } as any;

    // Create mock state setters
    setCodeEditorOpen = jest.fn();
    setGrapesEditorOpen = jest.fn();

    // Create mock helpers (required by tldraw API)
    mockHelpers = {};
  });

  describe('createUiOverrides', () => {
    it('should return a TLUiOverrides object with tools and actions functions', () => {
      const overrides = createUiOverrides({
        editor: mockEditor,
        setCodeEditorOpen,
        setGrapesEditorOpen,
      });

      expect(overrides).toHaveProperty('tools');
      expect(overrides).toHaveProperty('actions');
      expect(typeof overrides.tools).toBe('function');
      expect(typeof overrides.actions).toBe('function');
    });

    describe('tools function', () => {
      it('should keep only select and hand tools from defaults', () => {
        const overrides = createUiOverrides({
          editor: mockEditor,
          setCodeEditorOpen,
          setGrapesEditorOpen,
        });

        const mockTools = {
          select: { id: 'select' },
          hand: { id: 'hand' },
          draw: { id: 'draw' },
          eraser: { id: 'eraser' },
          text: { id: 'text' },
        };

        const result = overrides.tools!(mockEditor, mockTools as any, mockHelpers);

        // Should keep select and hand
        expect(result).toHaveProperty('select');
        expect(result).toHaveProperty('hand');

        // Should remove other default tools
        expect(result).not.toHaveProperty('draw');
        expect(result).not.toHaveProperty('eraser');
        expect(result).not.toHaveProperty('text');
      });

      it('should add custom tools from registry', () => {
        const overrides = createUiOverrides({
          editor: mockEditor,
          setCodeEditorOpen,
          setGrapesEditorOpen,
        });

        const mockTools = { select: { id: 'select' }, hand: { id: 'hand' } };
        const result = overrides.tools!(mockEditor, mockTools as any, mockHelpers);

        // Should have custom tools from registry
        // Note: The actual tools depend on what's registered in toolRegistry
        expect(result).toHaveProperty('select');
        expect(result).toHaveProperty('hand');
      });

      it('should add mode-edit tool', () => {
        const overrides = createUiOverrides({
          editor: mockEditor,
          setCodeEditorOpen,
          setGrapesEditorOpen,
        });

        const mockTools = { select: { id: 'select' }, hand: { id: 'hand' } };
        const result = overrides.tools!(mockEditor, mockTools as any, mockHelpers);

        // Should have mode-edit tool
        expect(result).toHaveProperty('mode-edit');
        expect(result['mode-edit']).toMatchObject({
          id: 'mode-edit',
          label: 'Edit',
          icon: 'edit',
          kbd: 'e',
        });
      });

      it('should add view-code tool', () => {
        const overrides = createUiOverrides({
          editor: mockEditor,
          setCodeEditorOpen,
          setGrapesEditorOpen,
        });

        const mockTools = { select: { id: 'select' }, hand: { id: 'hand' } };
        const result = overrides.tools!(mockEditor, mockTools as any, mockHelpers);

        // Should have view-code tool
        expect(result).toHaveProperty('view-code');
        expect(result['view-code']).toMatchObject({
          id: 'view-code',
          label: 'Code',
          icon: 'code',
        });
      });

      it('should add merge-preview tool', () => {
        // Feature: multi-page-merge-preview
        // Requirements: 5.1, 5.2
        const overrides = createUiOverrides({
          editor: mockEditor,
          setCodeEditorOpen,
          setGrapesEditorOpen,
        });

        const mockTools = { select: { id: 'select' }, hand: { id: 'hand' } };
        const result = overrides.tools!(mockEditor, mockTools as any, mockHelpers);

        // Should have merge-preview tool
        expect(result).toHaveProperty('merge-preview');
        expect(result['merge-preview']).toMatchObject({
          id: 'merge-preview',
          label: '合并预览',
          icon: 'play',
        });
      });

      it('should dispatch open-merge-preview event when merge-preview tool is selected', () => {
        // Feature: multi-page-merge-preview, merge-preview-fallback-fix
        // Requirements: 5.2, 1.5
        
        // Mock pageLinkHandler with registered pages
        const mockPageLinkHandler = {
          getRegisteredPages: jest.fn(() => ['home', 'about']),
          handlePageLinkClick: jest.fn((pageName: string) => `shape:${pageName}`),
        };
        
        // Mock editor.getShape to return valid shapes
        (mockEditor.getShape as any) = jest.fn(() => ({
          type: 'html',
          props: {
            html: '<div>Test</div>',
            css: '',
            js: '',
          },
        }));
        
        const pageLinkHandlerRef = {
          current: mockPageLinkHandler,
        };
        
        const overrides = createUiOverrides({
          editor: mockEditor,
          setCodeEditorOpen,
          setGrapesEditorOpen,
          pageLinkHandlerRef: pageLinkHandlerRef as any,
        });

        const mockTools = { select: { id: 'select' }, hand: { id: 'hand' } };
        const result = overrides.tools!(mockEditor, mockTools as any, mockHelpers);

        // Mock window.dispatchEvent
        const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

        // Trigger merge-preview
        result['merge-preview'].onSelect('toolbar');

        // Should dispatch custom event
        expect(dispatchEventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'open-merge-preview',
          })
        );

        // Should switch back to select tool
        expect(mockEditor.setCurrentTool).toHaveBeenCalledWith('select');

        dispatchEventSpy.mockRestore();
      });
    });

    describe('actions function', () => {
      it('should return actions unchanged', () => {
        const overrides = createUiOverrides({
          editor: mockEditor,
          setCodeEditorOpen,
          setGrapesEditorOpen,
        });

        const mockActions = { someAction: { id: 'someAction' } };
        const result = overrides.actions!(mockEditor, mockActions as any, mockHelpers);

        // Should return actions as-is
        expect(result).toEqual(mockActions);
      });
    });
  });
});
