/**
 * Unit tests for useBatchGenerate hook
 * Feature: editor-canvas-refactor
 * Requirements: 8.2, 8.3, 8.4, 8.5
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useBatchGenerate } from '../../components/canvas/generation/useBatchGenerate';
import { useAI } from '../../hooks/useAI';
import type { Editor } from 'tldraw';
import type { AIGenerationContext, BatchGenerationResult } from '../../types';
import type { PageLinkHandler } from '../../utils/batch/pageLinkHandler';

// Mock config before other imports
jest.mock('../../services/ai/config', () => ({
  getAIConfigFromEnv: jest.fn(() => ({
    provider: 'mock',
    maxTokens: 4000,
    temperature: 0.7,
  })),
}));

// Mock dependencies
jest.mock('../../hooks/useAI');
jest.mock('tldraw', () => ({
  createShapeId: jest.fn(() => 'mock-shape-id'),
}));

describe('useBatchGenerate', () => {
  let mockEditor: jest.Mocked<Editor>;
  let mockPageLinkHandlerRef: React.MutableRefObject<PageLinkHandler | null>;
  let mockOnComplete: jest.Mock;
  let mockOnError: jest.Mock;
  let mockGenerateBatch: jest.Mock;
  let mockProcessBatchResult: jest.Mock;

  beforeEach(() => {
    // Create mock editor with all methods used by useBatchGenerate
    mockEditor = {
      createShape: jest.fn(),
      updateShape: jest.fn(),
      zoomToFit: jest.fn(),
      markHistoryStoppingPoint: jest.fn(),
    } as any;

    // Create mock ref
    mockPageLinkHandlerRef = { current: null };

    // Create mock callbacks
    mockOnComplete = jest.fn();
    mockOnError = jest.fn();

    // Create mock AI functions
    mockGenerateBatch = jest.fn();
    mockProcessBatchResult = jest.fn();

    // Mock useAI hook
    (useAI as jest.Mock).mockReturnValue({
      generateBatch: mockGenerateBatch,
      processBatchResult: mockProcessBatchResult,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleBatchGenerate', () => {
    it('should set batchLoading to true during generation', async () => {
      // Arrange
      const mockBatchResult: BatchGenerationResult = {
        pages: [
          { name: 'home', html: '<div>Home</div>', css: '', js: '' },
        ],
      };

      const mockPageLinkHandler = {
        registerPages: jest.fn(),
        injectLinkHandlers: jest.fn((html: string) => html),
      } as any;

      // Create async generator that delays to allow checking loading state
      let resolveGeneration: () => void;
      const generationPromise = new Promise<void>((resolve) => {
        resolveGeneration = resolve;
      });

      mockGenerateBatch.mockReturnValue((async function* () {
        await generationPromise;
        yield { type: 'page-complete', page: { name: 'home', html: '<div>Home</div>', css: '', js: '' }, pageIndex: 0, totalPages: 1 };
        yield { type: 'batch-progress', pagesCompleted: 1, totalPages: 1 };
        return mockBatchResult;
      })());

      mockProcessBatchResult.mockReturnValue({
        shapes: [],
        pageLinkHandler: mockPageLinkHandler,
        pageMap: new Map([['home', 'shape-1']]),
      });

      const { result } = renderHook(() =>
        useBatchGenerate(mockEditor, mockPageLinkHandlerRef, mockOnComplete, mockOnError)
      );

      // Initially loading should be false
      expect(result.current.batchLoading).toBe(false);

      // Act - start generation
      const promise = result.current.handleBatchGenerate({
        prompt: 'Create a home page',
      } as AIGenerationContext);

      // Wait for loading state to update to true
      await waitFor(() => {
        expect(result.current.batchLoading).toBe(true);
      });

      // Resolve the generation
      resolveGeneration!();

      // Wait for completion
      await promise;

      // Assert - loading should be false after completion
      await waitFor(() => {
        expect(result.current.batchLoading).toBe(false);
      });
    });

    it('should call generateBatch and processBatchResult (Requirement 8.2)', async () => {
      // Arrange
      const mockContext: AIGenerationContext = {
        prompt: 'Create an e-commerce app',
        designSystem: 'tailwind',
      };

      const mockBatchResult: BatchGenerationResult = {
        pages: [
          { name: 'home', html: '<div>Home</div>', css: '', js: '' },
          { name: 'products', html: '<div>Products</div>', css: '', js: '' },
        ],
      };

      const mockPageLinkHandler = {
        registerPages: jest.fn(),
        injectLinkHandlers: jest.fn((html: string) => html),
      } as any;

      mockGenerateBatch.mockReturnValue((async function* () {
        yield { type: 'page-complete', page: { name: 'home', html: '<div>Home</div>', css: '', js: '' }, pageIndex: 0, totalPages: 2 };
        yield { type: 'batch-progress', pagesCompleted: 1, totalPages: 2 };
        yield { type: 'page-complete', page: { name: 'products', html: '<div>Products</div>', css: '', js: '' }, pageIndex: 1, totalPages: 2 };
        yield { type: 'batch-progress', pagesCompleted: 2, totalPages: 2 };
        return mockBatchResult;
      })());

      mockProcessBatchResult.mockReturnValue({
        shapes: [],
        pageLinkHandler: mockPageLinkHandler,
        pageMap: new Map([
          ['home', 'shape-1'],
          ['products', 'shape-2'],
        ]),
      });

      const { result } = renderHook(() =>
        useBatchGenerate(mockEditor, mockPageLinkHandlerRef, mockOnComplete, mockOnError)
      );

      // Act
      await result.current.handleBatchGenerate(mockContext);

      // Assert
      await waitFor(() => {
        expect(mockGenerateBatch).toHaveBeenCalledWith(mockContext);
        expect(mockProcessBatchResult).toHaveBeenCalledWith(
          mockBatchResult,
          expect.stringMatching(/^batch-\d+$/)
        );
      });
    });

    it('should create shapes on the canvas', async () => {
      // Arrange
      const mockBatchResult: BatchGenerationResult = {
        pages: [
          { name: 'home', html: '<div>Home</div>', css: 'body {}', js: 'console.log()' },
        ],
      };

      const mockPageLinkHandler = {
        registerPages: jest.fn(),
        injectLinkHandlers: jest.fn((html: string) => html),
      } as any;

      mockGenerateBatch.mockReturnValue((async function* () {
        yield { type: 'page-complete', page: { name: 'home', html: '<div>Home</div>', css: 'body {}', js: 'console.log()' }, pageIndex: 0, totalPages: 1 };
        yield { type: 'batch-progress', pagesCompleted: 1, totalPages: 1 };
        return mockBatchResult;
      })());

      mockProcessBatchResult.mockReturnValue({
        shapes: [],
        pageLinkHandler: mockPageLinkHandler,
        pageMap: new Map([['home', 'shape-1']]),
      });

      const { result } = renderHook(() =>
        useBatchGenerate(mockEditor, mockPageLinkHandlerRef, mockOnComplete, mockOnError)
      );

      // Act
      await result.current.handleBatchGenerate({
        prompt: 'Create a home page',
        designSystem: 'material-ui',
      } as AIGenerationContext);

      // Assert - shapes are created during streaming via page-complete events
      await waitFor(() => {
        expect(mockEditor.createShape).toHaveBeenCalledWith({
          id: 'mock-shape-id',
          type: 'html',
          x: 100,
          y: 100,
          props: {
            html: '<div>Home</div>',
            css: 'body {}',
            js: 'console.log()',
            mode: 'preview',
            overrides: [],
            designSystem: 'material-ui',
            viewport: 'desktop',
            w: 800,
            h: 600,
          },
        });
      });
    });

    it('should zoom to fit all shapes after creation (Requirement 8.5)', async () => {
      // Arrange
      const mockBatchResult: BatchGenerationResult = {
        pages: [
          { name: 'home', html: '<div>Home</div>', css: '', js: '' },
        ],
      };

      const mockPageLinkHandler = {
        registerPages: jest.fn(),
        injectLinkHandlers: jest.fn((html: string) => html),
      } as any;

      mockGenerateBatch.mockReturnValue((async function* () {
        yield { type: 'page-complete', page: { name: 'home', html: '<div>Home</div>', css: '', js: '' }, pageIndex: 0, totalPages: 1 };
        yield { type: 'batch-progress', pagesCompleted: 1, totalPages: 1 };
        return mockBatchResult;
      })());

      mockProcessBatchResult.mockReturnValue({
        shapes: [],
        pageLinkHandler: mockPageLinkHandler,
        pageMap: new Map([['home', 'shape-1']]),
      });

      const { result } = renderHook(() =>
        useBatchGenerate(mockEditor, mockPageLinkHandlerRef, mockOnComplete, mockOnError)
      );

      // Act
      await result.current.handleBatchGenerate({
        prompt: 'Create a home page',
      } as AIGenerationContext);

      // Assert
      await waitFor(() => {
        expect(mockEditor.zoomToFit).toHaveBeenCalledWith({
          animation: { duration: 400 },
        });
      });
    });

    it('should store PageLinkHandler in ref', async () => {
      // Arrange
      const mockBatchResult: BatchGenerationResult = {
        pages: [
          { name: 'home', html: '<div>Home</div>', css: '', js: '' },
        ],
      };

      const mockPageLinkHandler = {
        registerPages: jest.fn(),
        injectLinkHandlers: jest.fn((html: string) => html),
      } as any;

      mockGenerateBatch.mockReturnValue((async function* () {
        yield { type: 'page-complete', page: { name: 'home', html: '<div>Home</div>', css: '', js: '' }, pageIndex: 0, totalPages: 1 };
        yield { type: 'batch-progress', pagesCompleted: 1, totalPages: 1 };
        return mockBatchResult;
      })());

      mockProcessBatchResult.mockReturnValue({
        shapes: [],
        pageLinkHandler: mockPageLinkHandler,
        pageMap: new Map([['home', 'shape-1']]),
      });

      const { result } = renderHook(() =>
        useBatchGenerate(mockEditor, mockPageLinkHandlerRef, mockOnComplete, mockOnError)
      );

      // Act
      await result.current.handleBatchGenerate({
        prompt: 'Create a home page',
      } as AIGenerationContext);

      // Assert
      await waitFor(() => {
        expect(mockPageLinkHandlerRef.current).toBe(mockPageLinkHandler);
      });
    });

    it('should call onComplete on successful generation', async () => {
      // Arrange
      const mockBatchResult: BatchGenerationResult = {
        pages: [
          { name: 'home', html: '<div>Home</div>', css: '', js: '' },
        ],
      };

      const mockPageLinkHandler = {
        registerPages: jest.fn(),
        injectLinkHandlers: jest.fn((html: string) => html),
      } as any;

      mockGenerateBatch.mockReturnValue((async function* () {
        yield { type: 'page-complete', page: { name: 'home', html: '<div>Home</div>', css: '', js: '' }, pageIndex: 0, totalPages: 1 };
        yield { type: 'batch-progress', pagesCompleted: 1, totalPages: 1 };
        return mockBatchResult;
      })());

      mockProcessBatchResult.mockReturnValue({
        shapes: [],
        pageLinkHandler: mockPageLinkHandler,
        pageMap: new Map([['home', 'shape-1']]),
      });

      const { result } = renderHook(() =>
        useBatchGenerate(mockEditor, mockPageLinkHandlerRef, mockOnComplete, mockOnError)
      );

      // Act
      await result.current.handleBatchGenerate({
        prompt: 'Create a home page',
      } as AIGenerationContext);

      // Assert
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });

    it('should call onError on generation failure (Requirement 8.3)', async () => {
      // Arrange
      const mockError = new Error('AI service unavailable');

      mockGenerateBatch.mockReturnValue((async function* () {
        throw mockError;
      })());

      const { result } = renderHook(() =>
        useBatchGenerate(mockEditor, mockPageLinkHandlerRef, mockOnComplete, mockOnError)
      );

      // Act
      await result.current.handleBatchGenerate({
        prompt: 'Create a home page',
      } as AIGenerationContext);

      // Assert
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          'Batch generation failed: AI service unavailable'
        );
        expect(mockOnComplete).not.toHaveBeenCalled();
        expect(result.current.batchLoading).toBe(false);
      });
    });

    it('should handle empty pages result', async () => {
      // Arrange - generator returns result with empty pages
      const mockBatchResult: BatchGenerationResult = {
        pages: [],
      };

      mockGenerateBatch.mockReturnValue((async function* () {
        return mockBatchResult;
      })());

      const { result } = renderHook(() =>
        useBatchGenerate(mockEditor, mockPageLinkHandlerRef, mockOnComplete, mockOnError)
      );

      // Act
      await result.current.handleBatchGenerate({
        prompt: 'Create a home page',
      } as AIGenerationContext);

      // Assert
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          'Batch generation failed: No pages were generated'
        );
        expect(mockProcessBatchResult).not.toHaveBeenCalled();
        expect(mockEditor.createShape).not.toHaveBeenCalled();
      });
    });

    it('should not execute if editor is null', async () => {
      // Arrange
      const { result } = renderHook(() =>
        useBatchGenerate(null, mockPageLinkHandlerRef, mockOnComplete, mockOnError)
      );

      // Act
      await result.current.handleBatchGenerate({
        prompt: 'Create a home page',
      } as AIGenerationContext);

      // Assert
      expect(mockGenerateBatch).not.toHaveBeenCalled();
      expect(mockProcessBatchResult).not.toHaveBeenCalled();
      expect(mockOnComplete).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should set batchLoading to false after error (Requirement 8.4)', async () => {
      // Arrange
      const mockError = new Error('Network error');

      mockGenerateBatch.mockReturnValue((async function* () {
        throw mockError;
      })());

      const { result } = renderHook(() =>
        useBatchGenerate(mockEditor, mockPageLinkHandlerRef, mockOnComplete, mockOnError)
      );

      // Act
      await result.current.handleBatchGenerate({
        prompt: 'Create a home page',
      } as AIGenerationContext);

      // Assert
      await waitFor(() => {
        expect(result.current.batchLoading).toBe(false);
      });
    });

    // Feature: batch-generation-placeholder-shapes
    // New tests for placeholder functionality

    it('should create placeholder shapes immediately when AppContext is parsed (Requirement 1.1)', async () => {
      // Arrange
      const mockBatchResult: BatchGenerationResult = {
        pages: [
          { name: 'home', html: '<div>Home</div>', css: '', js: '' },
          { name: 'products', html: '<div>Products</div>', css: '', js: '' },
        ],
      };

      const mockPageLinkHandler = {
        registerPages: jest.fn(),
        injectLinkHandlers: jest.fn((html: string) => html),
      } as any;

      mockGenerateBatch.mockReturnValue((async function* () {
        yield { type: 'page-complete', page: { name: 'home', html: '<div>Home</div>', css: '', js: '' }, pageIndex: 0, totalPages: 2 };
        yield { type: 'page-complete', page: { name: 'products', html: '<div>Products</div>', css: '', js: '' }, pageIndex: 1, totalPages: 2 };
        return mockBatchResult;
      })());

      mockProcessBatchResult.mockReturnValue({
        shapes: [],
        pageLinkHandler: mockPageLinkHandler,
        pageMap: new Map(),
      });

      const { result } = renderHook(() =>
        useBatchGenerate(mockEditor, mockPageLinkHandlerRef, mockOnComplete, mockOnError)
      );

      // Act - use a prompt that parseAppContext will recognize
      await result.current.handleBatchGenerate({
        prompt: '生成电商网站：首页、产品列表',
      } as AIGenerationContext);

      // Assert - placeholder shapes should be created
      await waitFor(() => {
        // Should have created placeholder shapes (with placeholder HTML)
        const createCalls = (mockEditor.createShape as jest.Mock).mock.calls;
        expect(createCalls.length).toBeGreaterThan(0);
        
        // First calls should be placeholders (containing shimmer animation)
        const firstCall = createCalls[0][0];
        expect(firstCall.props.html).toContain('shimmer');
      });
    });

    it('should zoom to fit immediately after creating placeholders (Requirement 1.4)', async () => {
      // Arrange
      const mockBatchResult: BatchGenerationResult = {
        pages: [
          { name: 'home', html: '<div>Home</div>', css: '', js: '' },
        ],
      };

      const mockPageLinkHandler = {
        registerPages: jest.fn(),
        injectLinkHandlers: jest.fn((html: string) => html),
      } as any;

      mockGenerateBatch.mockReturnValue((async function* () {
        yield { type: 'page-complete', page: { name: 'home', html: '<div>Home</div>', css: '', js: '' }, pageIndex: 0, totalPages: 1 };
        return mockBatchResult;
      })());

      mockProcessBatchResult.mockReturnValue({
        shapes: [],
        pageLinkHandler: mockPageLinkHandler,
        pageMap: new Map(),
      });

      const { result } = renderHook(() =>
        useBatchGenerate(mockEditor, mockPageLinkHandlerRef, mockOnComplete, mockOnError)
      );

      // Act
      await result.current.handleBatchGenerate({
        prompt: '生成电商网站：首页',
      } as AIGenerationContext);

      // Assert - zoomToFit should be called (at least once for placeholders)
      await waitFor(() => {
        expect(mockEditor.zoomToFit).toHaveBeenCalled();
      });
    });

    it('should replace placeholder with actual content on page-complete (Requirement 3.1, 3.2)', async () => {
      // Arrange
      const mockBatchResult: BatchGenerationResult = {
        pages: [
          { name: 'home', html: '<div>Home Content</div>', css: 'body {}', js: 'console.log()' },
        ],
      };

      const mockPageLinkHandler = {
        registerPages: jest.fn(),
        injectLinkHandlers: jest.fn((html: string) => html),
      } as any;

      mockGenerateBatch.mockReturnValue((async function* () {
        yield { type: 'page-complete', page: { name: 'home', html: '<div>Home Content</div>', css: 'body {}', js: 'console.log()' }, pageIndex: 0, totalPages: 1 };
        return mockBatchResult;
      })());

      mockProcessBatchResult.mockReturnValue({
        shapes: [],
        pageLinkHandler: mockPageLinkHandler,
        pageMap: new Map(),
      });

      const { result } = renderHook(() =>
        useBatchGenerate(mockEditor, mockPageLinkHandlerRef, mockOnComplete, mockOnError)
      );

      // Act
      await result.current.handleBatchGenerate({
        prompt: '生成电商网站：首页',
      } as AIGenerationContext);

      // Assert - updateShape should be called to replace placeholder
      await waitFor(() => {
        expect(mockEditor.updateShape).toHaveBeenCalled();
        const updateCalls = (mockEditor.updateShape as jest.Mock).mock.calls;
        const lastUpdate = updateCalls[updateCalls.length - 1][0];
        expect(lastUpdate.props.html).toContain('Home Content');
      });
    });

    it('should fallback to creating new shapes when AppContext parse fails (Requirement 3.3)', async () => {
      // Arrange
      const mockBatchResult: BatchGenerationResult = {
        pages: [
          { name: 'page1', html: '<div>Page 1</div>', css: '', js: '' },
        ],
      };

      const mockPageLinkHandler = {
        registerPages: jest.fn(),
        injectLinkHandlers: jest.fn((html: string) => html),
      } as any;

      mockGenerateBatch.mockReturnValue((async function* () {
        yield { type: 'page-complete', page: { name: 'page1', html: '<div>Page 1</div>', css: '', js: '' }, pageIndex: 0, totalPages: 1 };
        return mockBatchResult;
      })());

      mockProcessBatchResult.mockReturnValue({
        shapes: [],
        pageLinkHandler: mockPageLinkHandler,
        pageMap: new Map(),
      });

      const { result } = renderHook(() =>
        useBatchGenerate(mockEditor, mockPageLinkHandlerRef, mockOnComplete, mockOnError)
      );

      // Act - use a prompt that won't be parsed as AppContext
      await result.current.handleBatchGenerate({
        prompt: 'Create a simple page',
      } as AIGenerationContext);

      // Assert - should still create shapes (fallback behavior)
      await waitFor(() => {
        expect(mockEditor.createShape).toHaveBeenCalled();
      });
    });

    it('should update placeholders to error state on generation failure (Requirement 4.1, 4.2)', async () => {
      // Arrange
      const mockError = new Error('Generation failed');

      mockGenerateBatch.mockReturnValue((async function* () {
        // Simulate partial success - one page completes, then error
        yield { type: 'page-complete', page: { name: 'home', html: '<div>Home</div>', css: '', js: '' }, pageIndex: 0, totalPages: 2 };
        throw mockError;
      })());

      const { result } = renderHook(() =>
        useBatchGenerate(mockEditor, mockPageLinkHandlerRef, mockOnComplete, mockOnError)
      );

      // Act
      await result.current.handleBatchGenerate({
        prompt: '生成电商网站：首页、产品列表',
      } as AIGenerationContext);

      // Assert - error placeholders should be updated
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
        // Check if updateShape was called with error HTML
        const updateCalls = (mockEditor.updateShape as jest.Mock).mock.calls;
        const hasErrorUpdate = updateCalls.some((call: any) => 
          call[0].props.html && call[0].props.html.includes('生成失败')
        );
        expect(hasErrorUpdate).toBe(true);
      });
    });
  });
});
