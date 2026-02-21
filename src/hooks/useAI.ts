/**
 * useAI React Hook for AI service integration
 * Feature: ai-html-visual-editor
 * Requirements: 1.2, 1.3, 7.5
 */

import { useState, useCallback, useRef } from 'react';
import type {
  AIGenerationContext,
  AIGenerationChunk,
  AIGenerationResult,
  AIOptimizationResult,
} from '../types';
import { createAIService, AIServiceError } from '../services/ai/AIService';
import { parseAppContext } from '../utils/batch/parseBatchRequest';
import { AIParserService } from '../utils/batch/aiParserService';
import { PageLinkHandler } from '../utils/batch/pageLinkHandler';
import { sharedThemeManager } from '../utils/batch/sharedThemeManager';
import { createShapesWithAutoLayout } from '../utils/layout/autoLayout';

/**
 * Hook state interface
 */
interface UseAIState {
  loading: boolean;
  error: string | null;
}

/**
 * Hook return type
 */
interface UseAIReturn {
  /**
   * Generate HTML/CSS/JS from natural language (streaming)
   * @param context - AI generation context
   * @returns AsyncGenerator yielding chunks of generated content
   */
  generate: (
    context: AIGenerationContext
  ) => AsyncGenerator<AIGenerationChunk, AIGenerationResult, void>;

  /**
   * Optimize an existing element
   * @param elementHtml - Current HTML of the element
   * @param prompt - Natural language optimization request
   * @param screenshot - Optional screenshot for visual context
   * @returns Promise resolving to optimization result
   */
  optimize: (
    elementHtml: string,
    prompt: string,
    screenshot?: Blob
  ) => Promise<AIOptimizationResult>;

  /**
   * Generate multiple pages in batch
   * @param context - AI generation context with batch configuration
   * @returns AsyncGenerator yielding batch generation progress
   */
  generateBatch: (
    context: AIGenerationContext
  ) => AsyncGenerator<import('../types').BatchStreamEvent, import('../types').BatchGenerationResult, void>;

  /**
   * Process batch generation result to register pages and create shapes
   * This should be called after generateBatch completes
   * @param result - Batch generation result from AI service
   * @param groupId - Unique identifier for this page group
   * @returns Object containing page mappings, shapes, and page link handler
   */
  processBatchResult: (
    result: import('../types').BatchGenerationResult,
    groupId: string
  ) => {
    pageMap: Map<string, string>;
    shapes: import('../types').HtmlShapeProps[];
    pageLinkHandler: PageLinkHandler;
  };

  /**
   * Whether an AI operation is in progress
   */
  loading: boolean;

  /**
   * Error message if an operation failed
   */
  error: string | null;
}

/**
 * React hook for AI service integration
 * 
 * Provides methods to generate HTML from natural language and optimize elements,
 * with built-in loading and error state management.
 * 
 * @example
 * ```tsx
 * const { generate, optimize, loading, error } = useAI();
 * 
 * // Generate HTML
 * const handleGenerate = async () => {
 *   const chunks = generate({ prompt: 'Create a login form' });
 *   for await (const chunk of chunks) {
 *     console.log('Received chunk:', chunk);
 *   }
 * };
 * 
 * // Optimize element
 * const handleOptimize = async () => {
 *   const result = await optimize(
 *     '<button>Click me</button>',
 *     'Make it more modern'
 *   );
 *   console.log('Optimized:', result);
 * };
 * ```
 * 
 * Requirements:
 * - 1.2: Streaming AI generation with real-time updates
 * - 1.3: Real-time rendering of partial generated HTML
 * - 7.5: AI optimization of elements
 */
export function useAI(): UseAIReturn {
  const [state, setState] = useState<UseAIState>({
    loading: false,
    error: null,
  });

  // Keep a stable reference to the AI service
  const serviceRef = useRef(createAIService());
  
  // Keep a stable reference to the AI parser service
  const aiParserRef = useRef<AIParserService | null>(null);
  
  // Initialize AI parser on first use
  if (!aiParserRef.current) {
    aiParserRef.current = new AIParserService(serviceRef.current, {
      timeout: 30000,
      verbose: true,
    });
  }

  /**
   * Generate HTML/CSS/JS from natural language (streaming)
   * Handles loading state and errors automatically
   */
  const generate = useCallback(
    async function* (
      context: AIGenerationContext
    ): AsyncGenerator<AIGenerationChunk, AIGenerationResult, void> {
      // Set loading state
      setState({ loading: true, error: null });

      try {
        // Stream chunks from AI service
        const generator = serviceRef.current.generateHtml(context);
        
        // We need to manually iterate to capture the return value
        const iterator = generator[Symbol.asyncIterator]();
        let iterResult = await iterator.next();
        
        // Yield all chunks until done
        while (!iterResult.done) {
          yield iterResult.value as AIGenerationChunk;
          iterResult = await iterator.next();
        }
        
        // Clear loading state
        setState({ loading: false, error: null });

        // The return value is in iterResult.value when done is true
        return iterResult.value as AIGenerationResult;
      } catch (error) {
        // Handle errors
        const errorMessage = error instanceof AIServiceError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'An unknown error occurred';

        setState({ loading: false, error: errorMessage });

        // Re-throw to allow caller to handle
        throw error;
      }
    },
    []
  );

  /**
   * Optimize an existing element
   * Handles loading state and errors automatically
   */
  const optimize = useCallback(
    async (
      elementHtml: string,
      prompt: string,
      screenshot?: Blob
    ): Promise<AIOptimizationResult> => {
      // Set loading state
      setState({ loading: true, error: null });

      try {
        // Call AI service
        const result = await serviceRef.current.optimizeElement(
          elementHtml,
          prompt,
          screenshot
        );

        // Clear loading state
        setState({ loading: false, error: null });

        return result;
      } catch (error) {
        // Handle errors
        const errorMessage = error instanceof AIServiceError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'An unknown error occurred';

        setState({ loading: false, error: errorMessage });

        // Re-throw to allow caller to handle
        throw error;
      }
    },
    []
  );

  /**
   * Generate multiple pages in batch
   * Handles loading state and errors automatically
   * 
   * This method:
   * 1. Parses user input to extract AppContext
   * 2. Calls AIService.generateBatch with the AppContext
   * 3. Transparently passes through all BatchStreamEvent events
   * 4. Registers page mappings with PageLinkHandler
   * 5. Registers page group with SharedThemeManager
   * 6. Uses autoLayout to arrange shapes on canvas
   * 
   * Requirements:
   * - 1.1: Parse AppContext from user input
   * - 2.1: Single AI call for all related pages
   * - 4.1, 4.2: Transparently pass through page-level events
   * - 4.2: Register page mappings for navigation
   * - 5.1-5.4: Auto-layout shapes on canvas
   * - 8.1: Register page group for batch modifications
   */
  const generateBatch = useCallback(
    async function* (
      context: AIGenerationContext
    ): AsyncGenerator<import('../types').BatchStreamEvent, import('../types').BatchGenerationResult, void> {
      // Set loading state
      setState({ loading: true, error: null });

      try {
        console.log('[useAI] Starting batch generation with context:', context);
        console.log('[useAI] AI parser available:', !!aiParserRef.current);
        
        // Step 1: Parse AppContext from user input (now async with AI parser support)
        const appContext = await parseAppContext(context.prompt, aiParserRef.current || undefined);
        
        console.log('[useAI] Parsed appContext:', appContext);
        
        // If AppContext parsing failed, throw a helpful error
        if (!appContext) {
          throw new AIServiceError(
            'Could not parse application structure from your description. Please try:\n' +
            '1. Specify the number of pages (e.g., "Create 3 pages")\n' +
            '2. List the page types (e.g., "home, about, contact")\n' +
            '3. Use a known app type (ecommerce, blog, dashboard, portfolio)\n' +
            '4. Or describe a single page instead',
            'INVALID_RESPONSE',
            false
          );
        }
        
        // Enhance the context with batch generation info
        context = {
          ...context,
          batchGeneration: {
            count: appContext.pages.length,
            pageTypes: appContext.pages.map(p => p.name),
            appContext,
          },
        };
        console.log('[useAI] Enhanced context with batchGeneration:', context.batchGeneration);

        // Step 2: Stream events from AI service and transparently pass through
        console.log('[useAI] Calling service.generateBatch...');
        const generator = serviceRef.current.generateBatch(context);
        
        let finalResult: import('../types').BatchGenerationResult = { pages: [] };
        
        // Consume the generator and transparently yield all events
        const iterator = generator[Symbol.asyncIterator]();
        let iterResult = await iterator.next();
        
        while (!iterResult.done) {
          console.log('[useAI] Received event:', iterResult.value);
          // Transparently pass through all BatchStreamEvent events
          yield iterResult.value as import('../types').BatchStreamEvent;
          iterResult = await iterator.next();
        }
        
        // The final iterResult.value is the return value of the generator
        finalResult = iterResult.value as import('../types').BatchGenerationResult;
        
        console.log('[useAI] Generator completed with result:', finalResult);
        
        // Clear loading state
        setState({ loading: false, error: null });

        // Return the actual result from the service
        return finalResult;
      } catch (error) {
        console.error('[useAI] Batch generation error:', error);
        
        // Handle errors
        const errorMessage = error instanceof AIServiceError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'An unknown error occurred';

        setState({ loading: false, error: errorMessage });

        // Re-throw to allow caller to handle
        throw error;
      }
    },
    []
  );

  /**
   * Process batch generation result to register pages and create shapes
   * 
   * This method performs post-processing after batch generation:
   * 1. Creates shapes with auto-layout positioning
   * 2. Registers page mappings with PageLinkHandler
   * 3. Injects link handlers into each page's HTML
   * 4. Registers page group with SharedThemeManager (empty sharedTheme, each page is self-contained)
   * 
   * Note: sharedTheme injection is no longer needed because each page's HTML
   * is now self-contained with inline CSS/JS (per-page batch generation).
   * 
   * @param result - Batch generation result from AI service
   * @param groupId - Unique identifier for this page group
   * @returns Object containing page mappings, shapes, and page link handler
   * 
   * Requirements:
   * - 6.2: Register page mappings for inter-page navigation
   * - 6.3: Inject link handlers into page HTML
   * - 9.4: Continue using existing BatchStreamEvent event-driven architecture
   */
  const processBatchResult = useCallback(
    (
      result: import('../types').BatchGenerationResult,
      groupId: string
    ): {
      pageMap: Map<string, string>;
      shapes: import('../types').HtmlShapeProps[];
      pageLinkHandler: PageLinkHandler;
    } => {
      const pages = result.pages;

      // Step 1: Create shapes with auto-layout
      const shapes = createShapesWithAutoLayout(pages);

      // Step 2: Build page name to shape ID mapping
      const pageMap = new Map<string, string>();
      pages.forEach((page, index) => {
        const shapeId = shapes[index]?.id;
        if (shapeId) {
          pageMap.set(page.name, shapeId);
        }
      });

      // Step 3: Register pages with PageLinkHandler
      const pageLinkHandler = new PageLinkHandler();
      pageLinkHandler.registerPages(pageMap);

      // Step 4: Inject link handlers into each page's HTML
      shapes.forEach((shape, index) => {
        const page = pages[index];
        if (page && shape.props) {
          shape.props.html = pageLinkHandler.injectLinkHandlers(
            shape.props.html,
            page.name
          );
        }
      });

      // Step 5: Register page group with SharedThemeManager
      // Pass empty string as sharedTheme since each page is now self-contained
      const shapeIds = shapes.map(s => s.id);
      sharedThemeManager.registerPageGroup(
        groupId,
        shapeIds,
        '',
        result.sharedNavigation || { header: '', footer: '' }
      );

      // Step 6: Map page names to shape IDs in the theme manager
      pages.forEach((page, index) => {
        const shapeId = shapes[index]?.id;
        if (shapeId) {
          sharedThemeManager.mapPageToShape(groupId, page.name, shapeId);
        }
      });

      return {
        pageMap,
        shapes,
        pageLinkHandler,
      };
    },
    []
  );

  return {
    generate,
    optimize,
    generateBatch,
    processBatchResult,
    loading: state.loading,
    error: state.error,
  };
}
