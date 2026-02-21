/**
 * useShapeAutoResize Hook
 * Feature: shape-auto-resize
 * 
 * This hook listens for postMessage events from an iframe and updates the
 * ShapeSizes store with the reported content height. It validates message
 * source and format, clamps height to minimum 100px, and skips redundant updates.
 * 
 * Requirements: 4.1, 4.2, 4.3, 1.4
 */

import { useEffect, useCallback } from 'react';
import { useEditor } from 'tldraw';
import type { TLShapeId } from 'tldraw';
import { ShapeSizes } from './shapeSizes';

/**
 * Message format expected from iframe content height reporter
 */
interface ContentHeightMessage {
  type: 'content-height';
  height: number;
}

/**
 * Hook that listens for iframe postMessage and updates ShapeSizes store
 * 
 * @param shapeId - The ID of the shape to update
 * @param iframeRef - Reference to the iframe element
 * 
 * Requirements:
 * - 4.1: Receive content-height message and update ShapeSizes
 * - 4.2: Skip update if height equals currently stored height
 * - 4.3: Clean up postMessage listener on unmount
 * - 1.4: Handle measurement failures gracefully (retain current dimensions)
 */
export function useShapeAutoResize(
  shapeId: TLShapeId,
  iframeRef: React.RefObject<HTMLIFrameElement | null>
): void {
  const editor = useEditor();

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Validate message source matches the iframe's contentWindow
      // Requirement 4.1: Validate message source
      if (event.source !== iframeRef.current?.contentWindow) return;

      // Validate message format
      // Requirement 4.1: Validate message format
      const data = event.data as Partial<ContentHeightMessage>;
      if (data?.type !== 'content-height') return;

      const height = data.height;
      
      console.log('[useShapeAutoResize] Received height message:', { shapeId, height });
      
      // Validate height is a positive number
      if (typeof height !== 'number' || height <= 0 || !isFinite(height)) {
        console.warn('[useShapeAutoResize] Invalid height:', height);
        return;
      }

      // Clamp height to minimum 100px
      const clampedHeight = Math.max(100, height);

      console.log('[useShapeAutoResize] Updating ShapeSizes:', { shapeId, clampedHeight });

      // Update ShapeSizes store
      // Requirement 4.2: Skip update if height unchanged
      const updated = ShapeSizes.update(editor, (map) => {
        const existing = map.get(shapeId);
        
        // Skip update if height is the same (idempotent update)
        if (existing && existing.height === clampedHeight) {
          console.log('[useShapeAutoResize] Height unchanged, skipping update');
          return map;
        }
        
        console.log('[useShapeAutoResize] Height updated:', { old: existing?.height, new: clampedHeight });
        
        // Update with new height
        return map.set(shapeId, { height: clampedHeight });
      });
      
      console.log('[useShapeAutoResize] ShapeSizes update result:', updated);
    },
    [editor, shapeId, iframeRef]
  );

  // Setup and cleanup postMessage listener
  // Requirement 4.3: Clean up listener on unmount
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);
}
