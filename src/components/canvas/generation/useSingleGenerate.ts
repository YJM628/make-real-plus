/**
 * useSingleGenerate Hook - Single page AI generation
 * Feature: editor-canvas-refactor
 * Requirements: 8.1, 8.3
 * 
 * Handles single page AI generation by streaming results from the AI service
 * and creating an HTML shape at the specified click position.
 * Shows a placeholder shape with shimmer animation while generating.
 */

import { useState, useCallback } from 'react';
import type { Editor } from 'tldraw';
import { createShapeId } from 'tldraw';
import { useAI } from '../../../hooks/useAI';
import type { AIGenerationContext } from '../../../types';
import { generatePlaceholderHtml } from './placeholderHtml';

/**
 * Hook return type
 */
interface UseSingleGenerateReturn {
  /**
   * Handle single page AI generation
   * @param context - AI generation context
   */
  handleSingleGenerate: (context: AIGenerationContext) => Promise<void>;
  
  /**
   * Whether single page generation is in progress
   */
  singleLoading: boolean;
}

/**
 * Hook for single page AI generation
 * 
 * Extracts the single page generation logic from EditorCanvas.
 * Streams AI-generated HTML/CSS/JS and creates a shape at the click position.
 * 
 * @param editor - tldraw Editor instance
 * @param clickPosition - Position where the shape should be created
 * @param onComplete - Callback invoked on successful generation
 * @param onError - Callback invoked on generation failure
 * @returns Object containing handleSingleGenerate function
 * 
 * @example
 * ```tsx
 * const { handleSingleGenerate } = useSingleGenerate(
 *   editor,
 *   clickPosition,
 *   () => console.log('Complete'),
 *   (msg) => console.error(msg)
 * );
 * 
 * await handleSingleGenerate({ prompt: 'Create a login form' });
 * ```
 * 
 * Requirements:
 * - 8.1: Stream AI generation results and create HTML shape at click position
 * - 8.3: Display error message on failure
 */
export function useSingleGenerate(
  editor: Editor | null,
  clickPosition: { x: number; y: number } | undefined,
  onComplete: () => void,
  onError: (message: string) => void
): UseSingleGenerateReturn {
  const { generate } = useAI();
  const [singleLoading, setSingleLoading] = useState(false);

  /**
   * Handle single page AI generation
   * Requirements: 8.1, 8.3
   */
  const handleSingleGenerate = useCallback(
    async (context: AIGenerationContext) => {
      if (!editor) return;

      // Use clickPosition if available, otherwise use default position (center of viewport)
      const position = clickPosition || { x: 100, y: 100 };

      // Set loading state
      setSingleLoading(true);

      // Create placeholder shape immediately so user sees something on canvas
      const shapeId = createShapeId();
      const pageName = extractPageName(context.prompt);
      
      editor.createShape({
        id: shapeId,
        type: 'html' as any,
        x: position.x,
        y: position.y,
        props: {
          html: generatePlaceholderHtml(pageName),
          css: '',
          js: '',
          mode: 'preview',
          overrides: [],
          designSystem: context.designSystem,
          viewport: 'desktop',
          w: 800,
          h: 600,
        },
      });

      // Select and zoom to the placeholder
      editor.select(shapeId);
      editor.zoomToFit({ animation: { duration: 300 } });

      try {
        // Generate HTML/CSS/JS - accumulate chunks and get final result
        const generator = generate(context);
        
        // Accumulate chunks as they stream in
        let html = '';
        let css = '';
        let js = '';
        
        // Consume the generator, accumulating chunks
        const iterator = generator[Symbol.asyncIterator]();
        let iterResult = await iterator.next();
        
        while (!iterResult.done) {
          const chunk = iterResult.value;
          
          // Type guard: check if this is a chunk (has 'type' property)
          if ('type' in chunk) {
            // Accumulate content by type
            if (chunk.type === 'html') {
              html += chunk.content;
            } else if (chunk.type === 'css') {
              css += chunk.content;
            } else if (chunk.type === 'js') {
              js += chunk.content;
            }
          }
          
          iterResult = await iterator.next();
        }
        
        // The return value contains the final result (may have additional data)
        const returnValue = iterResult.value;
        
        // Use accumulated chunks, fallback to return value if chunks weren't yielded
        const result = {
          html: html || returnValue?.html || '',
          css: css || returnValue?.css || '',
          js: js || returnValue?.js || '',
          identifiers: returnValue?.identifiers || [],
        };

        if (!result.html) {
          throw new Error('No valid HTML generated');
        }

        // Update placeholder shape with real content
        editor.updateShape({
          id: shapeId,
          type: 'html',
          props: {
            html: result.html,
            css: result.css || '',
            js: result.js || '',
          },
        });

        // Commit shape update to history
        editor.markHistoryStoppingPoint('shape-created');

        // Select the shape
        editor.select(shapeId);
        
        // Clear loading state
        setSingleLoading(false);
        
        // Call success callback
        onComplete();
      } catch (error) {
        console.error('AI generation failed:', error);
        
        // Remove the placeholder shape on failure
        try {
          editor.deleteShape(shapeId);
        } catch {
          // Shape may already be gone
        }
        
        // Format error message
        const errorMsg = error instanceof Error 
          ? `AI generation failed: ${error.message}` 
          : 'AI generation failed. Please try again.';
        
        // Clear loading state
        setSingleLoading(false);
        
        // Call error callback
        onError(errorMsg);
      }
    },
    [editor, clickPosition, generate, onComplete, onError]
  );

  return {
    handleSingleGenerate,
    singleLoading,
  };
}


/**
 * Extract a short page name from the user's prompt for the placeholder display.
 * Falls back to "页面" if nothing meaningful can be extracted.
 */
function extractPageName(prompt: string): string {
  // Chinese: "创建一个XX页面" → extract XX
  const zhMatch = prompt.match(/(?:创建|生成|做|设计)一个(.{1,15}?)(?:页面|页|表单|组件|界面)/);
  if (zhMatch?.[1]) return zhMatch[1].trim();

  // English: "create a XX page" → extract XX
  const enMatch = prompt.match(/(?:create|make|build|design|generate)\s+(?:a|an|one)\s+(.{1,30}?)\s+(?:page|form|component|view|screen)/i);
  if (enMatch?.[1]) return enMatch[1].trim();

  // Fallback: use first 20 chars of prompt
  return prompt.length > 20 ? prompt.substring(0, 20) + '...' : prompt;
}
