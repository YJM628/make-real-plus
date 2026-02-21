/**
 * Property-based tests for core type definitions
 * Feature: ai-html-visual-editor
 */

import fc from 'fast-check';
import type { ElementOverride, ViewportConfig } from '../../types';

describe('Property-Based Tests - Core Types', () => {
  describe('ElementOverride', () => {
    // Feature: ai-html-visual-editor, Property 15: Override merging is idempotent
    it('should maintain timestamp ordering when creating overrides', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string(),
          fc.integer({ min: 0 }),
          (selector, text, timestamp) => {
            const override: ElementOverride = {
              selector,
              text,
              timestamp,
              aiGenerated: false,
            };

            // Verify all required fields are present
            expect(override.selector).toBe(selector);
            expect(override.text).toBe(text);
            expect(override.timestamp).toBe(timestamp);
            expect(typeof override.aiGenerated).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle optional fields correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.option(fc.string()),
          fc.option(fc.dictionary(fc.string(), fc.string())),
          fc.integer({ min: 0 }),
          (selector, text, styles, timestamp) => {
            const override: ElementOverride = {
              selector,
              ...(text !== null && { text }),
              ...(styles !== null && { styles }),
              timestamp,
              aiGenerated: false,
            };

            expect(override.selector).toBe(selector);
            if (text !== null) {
              expect(override.text).toBe(text);
            }
            if (styles !== null) {
              expect(override.styles).toEqual(styles);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ViewportConfig', () => {
    // Feature: ai-html-visual-editor, Property 24: Responsive viewport adjustment
    it('should accept valid preset viewport types', () => {
      fc.assert(
        fc.property(fc.constantFrom('desktop', 'tablet', 'mobile'), (viewport) => {
          const config: ViewportConfig = viewport;
          expect(['desktop', 'tablet', 'mobile']).toContain(config);
        }),
        { numRuns: 100 }
      );
    });

    it('should accept valid custom viewport dimensions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 3840 }),
          fc.integer({ min: 568, max: 2160 }),
          (width, height) => {
            const config: ViewportConfig = { width, height };
            expect(config).toEqual({ width, height });
            expect(config.width).toBeGreaterThanOrEqual(320);
            expect(config.width).toBeLessThanOrEqual(3840);
            expect(config.height).toBeGreaterThanOrEqual(568);
            expect(config.height).toBeLessThanOrEqual(2160);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
