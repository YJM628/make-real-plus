/**
 * useBatchGenerate Hook - Batch AI generation
 * Feature: per-page-batch-generation
 * Requirements: 4.3, 6.2, 6.3, 9.4
 * 
 * Handles batch AI generation by streaming results from the AI service,
 * creating multiple HTML shapes on the canvas with auto-layout positioning,
 * and injecting page link handlers for inter-page navigation.
 * Each page is self-contained with inline CSS/JS (no shared theme post-processing needed).
 */

import { useState, useCallback } from 'react';
import type { Editor } from 'tldraw';
import { createShapeId } from 'tldraw';
import { useAI } from '../../../hooks/useAI';
import type { AIGenerationContext } from '../../../types';
import type { PageLinkHandler } from '../../../utils/batch/pageLinkHandler';
import { sharedThemeManager } from '../../../utils/batch/sharedThemeManager';

/**
 * Hook return type
 */
interface UseBatchGenerateReturn {
  /**
   * Handle batch AI generation
   * @param context - AI generation context
   */
  handleBatchGenerate: (context: AIGenerationContext) => Promise<void>;
  
  /**
   * Whether batch generation is in progress
   */
  batchLoading: boolean;
  
  /**
   * Batch generation progress (completed/total pages)
   */
  batchProgress: { completed: number; total: number } | null;
}

/**
 * Hook for batch AI generation
 * 
 * Extracts the batch generation logic from EditorCanvas.
 * Streams AI-generated batch results, creates multiple shapes on the canvas
 * with auto-layout, injects page link handlers for inter-page navigation,
 * and registers page mappings for navigation.
 * 
 * @param editor - tldraw Editor instance
 * @param pageLinkHandlerRef - Ref to store the PageLinkHandler for navigation
 * @param onComplete - Callback invoked on successful generation
 * @param onError - Callback invoked on generation failure
 * @returns Object containing handleBatchGenerate function and batchLoading state
 * 
 * @example
 * ```tsx
 * const pageLinkHandlerRef = useRef<PageLinkHandler | null>(null);
 * const { handleBatchGenerate, batchLoading } = useBatchGenerate(
 *   editor,
 *   pageLinkHandlerRef,
 *   () => console.log('Complete'),
 *   (msg) => console.error(msg)
 * );
 * 
 * await handleBatchGenerate({ 
 *   prompt: 'Create an e-commerce app with home, products, and cart pages' 
 * });
 * ```
 * 
 * Requirements:
 * - 8.2: Call useAI().generateBatch and processBatchResult for batch generation
 * - 8.3: Display error message on failure
 * - 8.4: Display loading indicator during batch generation
 * - 8.5: Zoom to fit all generated shapes after completion
 */
export function useBatchGenerate(
  editor: Editor | null,
  pageLinkHandlerRef: React.MutableRefObject<PageLinkHandler | null>,
  onComplete: () => void,
  onError: (message: string) => void
): UseBatchGenerateReturn {
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number } | null>(null);
  const { generateBatch, processBatchResult } = useAI();

  /**
   * Handle batch generation of cohesive multi-page applications
   * Requirements: 8.2, 8.3, 8.4, 8.5, 5.1, 5.2, 5.3, 5.4, 5.5
   * Feature: batch-generation-placeholder-shapes
   * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3
   */
  const handleBatchGenerate = useCallback(
    async (context: AIGenerationContext) => {
      if (!editor) return;

      // Set loading state (Requirement 8.4)
      setBatchLoading(true);
      setBatchProgress(null);

      // Track created pages for post-processing
      const createdPages: Array<{ name: string; html: string; css: string; js: string; shapeId: string }> = [];

      try {
        console.log('[Batch] Starting batch generation...');
        
        // Step 1: Stream batch generation
        // Note: generateBatch internally calls parseAppContext with AI parser support
        // and will throw an error if parsing fails
        const generator = generateBatch(context);
        const iterator = generator[Symbol.asyncIterator]();
        let iterResult = await iterator.next();
        
        console.log('[Batch] Created generator, starting iteration...');
        
        while (!iterResult.done) {
          const event = iterResult.value as import('../../../types').BatchStreamEvent;
          
          // Handle page-complete events - create new shape for each page
          if (event.type === 'page-complete') {
            const { page, pageIndex, totalPages } = event;
            console.log(`[Batch] Page ${pageIndex + 1}/${totalPages} complete: ${page.name}`);
            
            // Create new shape for this page
            const x = 100 + pageIndex * 850;
            const y = 100;
            const shapeId = createShapeId();
            
            editor.createShape({
              id: shapeId,
              type: 'html' as any,
              x,
              y,
              props: {
                html: page.html,
                css: page.css,
                js: page.js,
                mode: 'preview',
                overrides: [],
                designSystem: context.designSystem,
                viewport: 'desktop',
                w: 800,
                h: 600,
              },
            });
            
            createdPages.push({ ...page, shapeId });
            
            // Update progress
            setBatchProgress({ completed: pageIndex + 1, total: totalPages });
          }
          
          // Handle progress events
          if (event.type === 'batch-progress') {
            console.log(`[Batch] Progress: ${event.pagesCompleted}/${event.totalPages}`);
          }
          
          iterResult = await iterator.next();
        }
        
        console.log('[Batch] Iteration complete, final value:', iterResult.value);
        
        // The final value is the BatchGenerationResult
        const batchResult = iterResult.value;

        console.log('[Batch] Batch result:', batchResult);

        if (!batchResult || batchResult.pages.length === 0) {
          throw new Error('No pages were generated');
        }

        // Step 2: Post-processing - register links and page mappings (Requirement 6.2, 6.3)
        const groupId = `batch-${Date.now()}`;
        const { pageLinkHandler } = processBatchResult(batchResult, groupId);
        
        // Store the page link handler for navigation
        pageLinkHandlerRef.current = pageLinkHandler;

        // Step 3: Update created shapes with link handlers
        // Each page is self-contained with inline CSS/JS, so no shared theme injection needed
        createdPages.forEach((createdPage, index) => {
          const processedPage = batchResult.pages[index];
          if (processedPage && createdPage.shapeId) {
            // Inject link handlers
            const htmlWithLinks = pageLinkHandler.injectLinkHandlers(
              processedPage.html,
              processedPage.name
            );
            
            // Update the shape with processed content
            editor.updateShape({
              id: createdPage.shapeId as any,
              type: 'html',
              props: {
                html: htmlWithLinks,
                css: processedPage.css,
                js: processedPage.js,
              },
            });
          }
        });

        // Commit all shape creations to history so _flushHistory won't undo them
        editor.markHistoryStoppingPoint('batch-shapes-created');

        // Step 5: Re-register page group with actual canvas shape IDs
        // processBatchResult registers with its own internal shape IDs which differ
        // from the actual canvas shapes. Re-register with the real IDs so the
        // theme editor can find the group.
        const actualShapeIds = createdPages.map(p => p.shapeId);
        sharedThemeManager.removePageGroup(groupId);
        sharedThemeManager.registerPageGroup(
          groupId,
          actualShapeIds,
          batchResult.sharedTheme || '',
          batchResult.sharedNavigation || { header: '', footer: '' }
        );
        // Re-map page names to actual shape IDs
        createdPages.forEach((createdPage, index) => {
          const page = batchResult.pages[index];
          if (page) {
            sharedThemeManager.mapPageToShape(groupId, page.name, createdPage.shapeId);
          }
        });

        // Step 4: Zoom to fit all generated shapes
        editor.zoomToFit({ animation: { duration: 400 } });

        // Clear loading state
        setBatchLoading(false);
        setBatchProgress(null);
        
        // Call success callback
        onComplete();
      } catch (error) {
        console.error('Batch generation failed:', error);
        
        // Format error message
        const errorMsg = error instanceof Error 
          ? `Batch generation failed: ${error.message}` 
          : 'Batch generation failed. Please try again.';
        
        // Clear loading state but keep created shapes
        setBatchLoading(false);
        setBatchProgress(null);
        
        // Call error callback
        onError(errorMsg);
      }
    },
    [editor, generateBatch, processBatchResult, pageLinkHandlerRef, onComplete, onError]
  );

  return {
    handleBatchGenerate,
    batchLoading,
    batchProgress,
  };
}
