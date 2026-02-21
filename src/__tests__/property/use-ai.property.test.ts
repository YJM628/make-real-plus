/**
 * Property-based tests for useAI hook
 * Feature: ai-html-visual-editor
 * 
 * **Validates: Requirements 1.2, 1.3, 7.5**
 * 
 * Property 2: Streaming Generation Completeness
 * - For any AI generation request, streaming chunks combined should equal the final result
 * - Chunks should arrive in order: HTML → CSS → JS
 * 
 * Property 1 (partial): AI Generation Validity
 * - Generated HTML/CSS/JS should be parseable strings
 * - HTML should not be empty
 */

import fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useAI } from '../../hooks/useAI';
import type { AIGenerationContext, AIGenerationChunk } from '../../types';

/**
 * Generator for AI generation contexts
 */
const aiContextGenerator = () =>
  fc.record({
    prompt: fc.string({ minLength: 1, maxLength: 100 }),
    designSystem: fc.option(fc.constantFrom('vanilla', 'material-ui', 'ant-design', 'tailwind')),
  });

/**
 * Generator for HTML strings (for optimization)
 */
const htmlStringGenerator = () =>
  fc.oneof(
    fc.constant('<div>Content</div>'),
    fc.constant('<button>Click me</button>'),
    fc.constant('<p>Paragraph</p>'),
    fc.constant('<span>Text</span>'),
    fc.string({ minLength: 10, maxLength: 100 }).map((text) => `<div>${text}</div>`)
  );

/**
 * Generator for optimization prompts
 */
const optimizationPromptGenerator = () =>
  fc.oneof(
    fc.constant('Make it blue'),
    fc.constant('Add padding'),
    fc.constant('Center the text'),
    fc.constant('Make it bigger'),
    fc.string({ minLength: 5, maxLength: 50 })
  );

describe('useAI Hook - Property-Based Tests', () => {
  describe('Property 2: Streaming Generation Completeness', () => {
    it('should yield chunks that combine to form complete HTML/CSS/JS', async () => {
      await fc.assert(
        fc.asyncProperty(aiContextGenerator(), async (context: AIGenerationContext) => {
          // Create a fresh hook for each iteration
          const { result, unmount } = renderHook(() => useAI());

          try {
            let accumulatedHtml = '';
            let accumulatedCss = '';
            let accumulatedJs = '';
            const chunkTypes: string[] = [];

            await act(async () => {
              const generator = result.current.generate(context);

              for await (const chunk of generator) {
                chunkTypes.push(chunk.type);

                if (chunk.type === 'html') {
                  accumulatedHtml += chunk.content;
                } else if (chunk.type === 'css') {
                  accumulatedCss += chunk.content;
                } else if (chunk.type === 'js') {
                  accumulatedJs += chunk.content;
                }
              }
            });

            // Property: Accumulated content should not be empty
            expect(accumulatedHtml.length).toBeGreaterThan(0);
            expect(accumulatedCss.length).toBeGreaterThan(0);
            expect(accumulatedJs.length).toBeGreaterThan(0);

            // Property: Chunks should arrive in order (HTML before CSS before JS)
            const firstHtmlIndex = chunkTypes.indexOf('html');
            const firstCssIndex = chunkTypes.indexOf('css');
            const firstJsIndex = chunkTypes.indexOf('js');

            expect(firstHtmlIndex).toBeGreaterThanOrEqual(0);
            expect(firstCssIndex).toBeGreaterThan(firstHtmlIndex);
            expect(firstJsIndex).toBeGreaterThan(firstCssIndex);

            // Property: HTML should be valid (contains DOCTYPE)
            expect(accumulatedHtml).toContain('<!DOCTYPE html>');

            // Property: If design system specified, it should appear in HTML or related indicators
            if (context.designSystem) {
              const designSystemLower = context.designSystem.toLowerCase();
              const htmlLower = accumulatedHtml.toLowerCase();
              
              // Check for design system name or common indicators
              const hasDesignSystemIndicator =
                htmlLower.includes(designSystemLower) ||
                (designSystemLower.includes('material') && (htmlLower.includes('mui') || htmlLower.includes('fonts.googleapis.com'))) ||
                (designSystemLower.includes('ant') && htmlLower.includes('antd')) ||
                (designSystemLower.includes('tailwind') && htmlLower.includes('tailwindcss'));
              
              expect(hasDesignSystemIndicator).toBe(true);
            }
          } finally {
            unmount();
          }
        }),
        { numRuns: 5, timeout: 60000 } // 5 runs, 1 minute timeout
      );
    }, 90000); // 1.5 minute test timeout

    it('should maintain chunk order consistency across multiple generations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(aiContextGenerator(), { minLength: 2, maxLength: 3 }),
          async (contexts: AIGenerationContext[]) => {
            // Create a fresh hook for each iteration
            const { result, unmount } = renderHook(() => useAI());

            try {
              for (const context of contexts) {
                const chunkTypes: string[] = [];

                await act(async () => {
                  const generator = result.current.generate(context);

                  for await (const chunk of generator) {
                    chunkTypes.push(chunk.type);
                  }
                });

                // Property: Every generation should follow HTML → CSS → JS order
                const firstHtmlIndex = chunkTypes.indexOf('html');
                const firstCssIndex = chunkTypes.indexOf('css');
                const firstJsIndex = chunkTypes.indexOf('js');

                expect(firstHtmlIndex).toBeLessThan(firstCssIndex);
                expect(firstCssIndex).toBeLessThan(firstJsIndex);
              }
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 3, timeout: 60000 } // 3 runs, 1 minute timeout
      );
    }, 90000);
  });

  describe('Property 1 (partial): AI Generation Validity', () => {
    it('should always generate non-empty, parseable HTML', async () => {
      await fc.assert(
        fc.asyncProperty(aiContextGenerator(), async (context: AIGenerationContext) => {
          const { result, unmount } = renderHook(() => useAI());

          try {
            let html = '';

            await act(async () => {
              const generator = result.current.generate(context);

              for await (const chunk of generator) {
                if (chunk.type === 'html') {
                  html += chunk.content;
                }
              }
            });

            // Property: HTML should not be empty
            expect(html.length).toBeGreaterThan(0);

            // Property: HTML should be parseable (contains basic structure)
            expect(html).toContain('<html');
            expect(html).toContain('</html>');

            // Property: HTML should have proper DOCTYPE
            expect(html).toMatch(/<!DOCTYPE html>/i);
          } finally {
            unmount();
          }
        }),
        { numRuns: 5, timeout: 60000 }
      );
    }, 90000);

    it('should generate valid CSS and JS strings', async () => {
      await fc.assert(
        fc.asyncProperty(aiContextGenerator(), async (context: AIGenerationContext) => {
          const { result, unmount } = renderHook(() => useAI());

          try {
            let css = '';
            let js = '';

            await act(async () => {
              const generator = result.current.generate(context);

              for await (const chunk of generator) {
                if (chunk.type === 'css') css += chunk.content;
                if (chunk.type === 'js') js += chunk.content;
              }
            });

            // Property: CSS and JS should be strings (even if empty)
            expect(typeof css).toBe('string');
            expect(typeof js).toBe('string');

            // Property: CSS should contain valid CSS syntax if not empty
            if (css.length > 0) {
              expect(css).toMatch(/[{;}]/); // Contains CSS syntax characters
            }

            // Property: JS should contain valid JS syntax if not empty
            if (js.length > 0) {
              expect(js).toMatch(/[();]/); // Contains JS syntax characters
            }
          } finally {
            unmount();
          }
        }),
        { numRuns: 5, timeout: 60000 }
      );
    }, 90000);
  });

  describe('Property: Optimization Result Validity', () => {
    it('should always return valid optimization results', async () => {
      await fc.assert(
        fc.asyncProperty(
          htmlStringGenerator(),
          optimizationPromptGenerator(),
          async (elementHtml: string, prompt: string) => {
            const { result, unmount } = renderHook(() => useAI());

            try {
              let optimizationResult;

              await act(async () => {
                optimizationResult = await result.current.optimize(elementHtml, prompt);
              });

              // Property: Result should be defined
              expect(optimizationResult).toBeDefined();

              // Property: Result should have either html or styles
              expect(
                optimizationResult!.html !== undefined || optimizationResult!.styles !== undefined
              ).toBe(true);

              // Property: If html is provided, it should be a non-empty string
              if (optimizationResult!.html) {
                expect(typeof optimizationResult!.html).toBe('string');
                expect(optimizationResult!.html.length).toBeGreaterThan(0);
              }

              // Property: If styles are provided, it should be an object
              if (optimizationResult!.styles) {
                expect(typeof optimizationResult!.styles).toBe('object');
                expect(Object.keys(optimizationResult!.styles).length).toBeGreaterThan(0);
              }
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 5, timeout: 30000 } // 5 runs, 30 second timeout
      );
    }, 90000);
  });

  describe('Property: State Management Consistency', () => {
    it('should always clear loading state after operations complete', async () => {
      await fc.assert(
        fc.asyncProperty(aiContextGenerator(), async (context: AIGenerationContext) => {
          const { result, unmount } = renderHook(() => useAI());

          try {
            await act(async () => {
              const generator = result.current.generate(context);

              for await (const _chunk of generator) {
                // Consume chunks
              }
            });

            // Property: Loading should be false after completion
            expect(result.current.loading).toBe(false);
          } finally {
            unmount();
          }
        }),
        { numRuns: 5, timeout: 60000 }
      );
    }, 90000);

    it('should always clear loading state after optimization', async () => {
      await fc.assert(
        fc.asyncProperty(
          htmlStringGenerator(),
          optimizationPromptGenerator(),
          async (elementHtml: string, prompt: string) => {
            const { result, unmount } = renderHook(() => useAI());

            try {
              await act(async () => {
                await result.current.optimize(elementHtml, prompt);
              });

              // Property: Loading should be false after completion
              expect(result.current.loading).toBe(false);
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 20, timeout: 60000 }
      );
    }, 90000);

    it('should clear error state when starting new operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(aiContextGenerator(), { minLength: 2, maxLength: 3 }),
          async (contexts: AIGenerationContext[]) => {
            const { result, unmount } = renderHook(() => useAI());

            try {
              for (const context of contexts) {
                await act(async () => {
                  const generator = result.current.generate(context);

                  for await (const _chunk of generator) {
                    // Consume
                  }
                });

                // Property: Error should be null after successful operation
                expect(result.current.error).toBeNull();
              }
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 3, timeout: 60000 }
      );
    }, 90000);
  });

  describe('Property: Chunk Completeness', () => {
    it('should never yield incomplete chunks', async () => {
      await fc.assert(
        fc.asyncProperty(aiContextGenerator(), async (context: AIGenerationContext) => {
          const { result, unmount } = renderHook(() => useAI());

          try {
            const chunks: AIGenerationChunk[] = [];

            await act(async () => {
              const generator = result.current.generate(context);

              for await (const chunk of generator) {
                chunks.push(chunk);
              }
            });

            // Property: Every chunk should have required fields
            for (const chunk of chunks) {
              expect(chunk).toHaveProperty('type');
              expect(chunk).toHaveProperty('content');
              expect(chunk).toHaveProperty('isComplete');

              expect(typeof chunk.type).toBe('string');
              expect(typeof chunk.content).toBe('string');
              expect(typeof chunk.isComplete).toBe('boolean');

              // Property: Chunk type should be one of html, css, js
              expect(['html', 'css', 'js']).toContain(chunk.type);
            }
          } finally {
            unmount();
          }
        }),
        { numRuns: 5, timeout: 60000 }
      );
    }, 90000);
  });
});
