/**
 * usePageNavigation hook - Manages inter-page navigation for batch-generated applications
 * Feature: editor-canvas-refactor
 * Requirements: 4.1, 4.2, 4.3
 * 
 * This hook listens for navigateToPage custom events emitted by page links
 * in batch-generated HTML shapes, and navigates the canvas to the target shape.
 */

import { useEffect, useRef } from 'react';
import type { Editor } from 'tldraw';
import { PageLinkHandler } from '../../../utils/batch/pageLinkHandler';

/**
 * Return type for usePageNavigation hook
 */
export interface UsePageNavigationReturn {
  /**
   * Reference to the PageLinkHandler instance
   * Used by batch generation to register page mappings
   */
  pageLinkHandlerRef: React.MutableRefObject<PageLinkHandler | null>;
}

/**
 * Hook to manage inter-page navigation for batch-generated applications
 * 
 * Listens for navigateToPage custom events and uses PageLinkHandler to:
 * - Resolve page names to shape IDs
 * - Select the target shape
 * - Zoom to the selected shape with animation
 * 
 * Silently ignores navigation requests when:
 * - Editor is not initialized
 * - Target page doesn't exist in the page map
 * - Target shape is not found on the canvas
 * 
 * @param editor - tldraw Editor instance (or null if not yet initialized)
 * @returns Object containing pageLinkHandlerRef for registering page mappings
 * 
 * @example
 * ```typescript
 * const { pageLinkHandlerRef } = usePageNavigation(editor);
 * 
 * // After batch generation, register pages
 * pageLinkHandlerRef.current = new PageLinkHandler();
 * pageLinkHandlerRef.current.registerPages(pageMap);
 * ```
 * 
 * Requirements:
 * - 4.1: Generate Inter_Page_Links in shared navigation
 * - 4.2: Scroll canvas to target shape when link is clicked
 * - 4.3: Use data-page-target attribute to mark link targets
 */
export function usePageNavigation(editor: Editor | null): UsePageNavigationReturn {
  // Create a ref to hold the PageLinkHandler instance
  const pageLinkHandlerRef = useRef<PageLinkHandler | null>(null);

  useEffect(() => {
    // Don't register event listeners if editor is not initialized
    if (!editor) return;

    /**
     * Handle navigateToPage custom events from batch-generated pages
     * 
     * Event detail contains:
     * - targetPage: Name of the page to navigate to
     * - sourcePage: Name of the current page (for context)
     * 
     * Requirements:
     * - 4.2: Smooth scroll to target page shape
     * - 4.3: Handle data-page-target links
     */
    const handleNavigateToPage = (e: Event) => {
      const customEvent = e as CustomEvent<{ targetPage: string; sourcePage: string }>;
      const { targetPage } = customEvent.detail;
      
      // Silently ignore if PageLinkHandler is not initialized
      // Requirement 4.2: Silently ignore when target doesn't exist
      if (!pageLinkHandlerRef.current) return;
      
      // Resolve target page name to shape ID
      const targetShapeId = pageLinkHandlerRef.current.handlePageLinkClick(targetPage);
      
      // Silently ignore if target page doesn't exist in the page map
      // Requirement 4.2: Silently ignore when target doesn't exist
      if (!targetShapeId) return;

      // Find the shape on the canvas
      const shape = editor.getShape(targetShapeId as any);
      
      // Silently ignore if shape is not found
      // Requirement 4.2: Silently ignore when target doesn't exist
      if (!shape) return;

      // Select the target shape
      editor.select(shape.id);
      
      // Zoom to the selected shape with animation
      // Requirement 4.2: Smooth scroll to target shape
      setTimeout(() => {
        editor.zoomToSelection({ animation: { duration: 300 } });
      }, 50);
    };

    // Listen for navigateToPage events on the document
    // Events are dispatched by the injected script in PageLinkHandler.injectLinkHandlers
    document.addEventListener('navigateToPage', handleNavigateToPage);

    // Cleanup: remove event listener on unmount or when editor changes
    return () => {
      document.removeEventListener('navigateToPage', handleNavigateToPage);
    };
  }, [editor]);

  return { pageLinkHandlerRef };
}
