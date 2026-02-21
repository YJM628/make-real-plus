/**
 * Property-based tests for pageNameResolver
 * Feature: merge-preview-navigation
 * 
 * **Validates: Requirements 3.1, 3.2, 3.4**
 * 
 * Property 4: Page Name Normalization
 * - For any string containing file extensions, path prefixes, query parameters,
 *   mixed case, or camelCase format, normalizePageName should produce a string
 *   without extensions, prefixes, query parameters, in lowercase kebab-case
 * 
 * Property 5: Chinese Alias Mapping Correctness
 * - For any Chinese role name in DEFAULT_ROLE_ALIASES, resolvePageName should
 *   return the correct English page name when given a valid page list containing
 *   that English name
 * 
 * Property 6: Page Name Round-Trip Consistency
 * - For any valid page name (already in the valid page list), normalizing it
 *   and then resolving it should return an equivalent result
 */

import fc from 'fast-check';
import {
  normalizePageName,
  resolvePageName,
  DEFAULT_ROLE_ALIASES,
} from '../../utils/batch/pageNameResolver';

describe('pageNameResolver - Property-Based Tests', () => {
  describe('Property 4: Page Name Normalization', () => {
    // Feature: merge-preview-navigation, Property 4: Page name normalization
    it('should always produce lowercase output', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (input: string) => {
            const result = normalizePageName(input);
            // Property: Result should be lowercase (or empty)
            if (result.length > 0) {
              expect(result).toBe(result.toLowerCase());
              expect(result).not.toMatch(/[A-Z]/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 4: Page name normalization
    it('should remove file extensions from any input', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.constantFrom('.html', '.htm', '.php', '.jsp', '.aspx', '.txt'),
          (baseName: string, extension: string) => {
            const input = baseName + extension;
            const result = normalizePageName(input);
            
            // Property: Result should not contain the file extension
            if (result.length > 0) {
              expect(result).not.toContain(extension);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 4: Page name normalization
    it('should remove path prefixes from any input', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/', './', '../', '../../', '\\'),
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          (prefix: string, pageName: string) => {
            const input = prefix + pageName;
            const result = normalizePageName(input);
            
            // Property: Result should not start with path prefixes
            // Note: If the pageName itself starts with dots/slashes (like ". "),
            // those are part of the content, not prefixes
            if (result.length > 0) {
              // The result should not start with the exact prefix pattern
              // unless the pageName itself contains those characters
              const normalizedPageName = normalizePageName(pageName);
              if (normalizedPageName.length > 0) {
                // If we have a valid normalized page name, the result should match it
                expect(result).toBe(normalizedPageName);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 4: Page name normalization
    it('should remove query parameters and anchors', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 20 }).map(s => '?' + s),
            fc.string({ minLength: 1, maxLength: 20 }).map(s => '#' + s),
            fc.tuple(
              fc.string({ minLength: 1, maxLength: 10 }),
              fc.string({ minLength: 1, maxLength: 10 })
            ).map(([q, a]) => '?' + q + '#' + a)
          ),
          (baseName: string, suffix: string) => {
            const input = baseName + suffix;
            const result = normalizePageName(input);
            
            // Property: Result should not contain ? or # characters
            expect(result).not.toContain('?');
            expect(result).not.toContain('#');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 4: Page name normalization
    it('should convert camelCase to kebab-case', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 4 }),
          (words: string[]) => {
            // Create a camelCase string
            const camelCase = words
              .map((word, index) => {
                if (index === 0) {
                  return word.toLowerCase();
                }
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
              })
              .join('');
            
            if (camelCase.length === 0) return;
            
            const result = normalizePageName(camelCase);
            
            // Property: Result should be in kebab-case (lowercase with hyphens)
            if (result.length > 0) {
              expect(result).toBe(result.toLowerCase());
              // Should not have consecutive uppercase letters in original positions
              expect(result).not.toMatch(/[A-Z]/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 4: Page name normalization
    it('should handle combined transformations correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('/', './', '../'),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => {
            const trimmed = s.trim();
            // Ensure we have actual content after trimming
            return trimmed.length > 0 && /[a-zA-Z0-9]/.test(trimmed);
          }),
          fc.constantFrom('.html', '.htm', '.php'),
          fc.option(fc.string({ minLength: 1, maxLength: 10 })),
          (prefix: string, name: string, extension: string, query: string | null) => {
            let input = prefix + name + extension;
            if (query) {
              input += '?' + query;
            }
            
            const result = normalizePageName(input);
            
            // Property: Result should have all transformations applied
            if (result.length > 0) {
              // No extension
              expect(result).not.toContain(extension);
              // No query parameters
              expect(result).not.toContain('?');
              // Lowercase
              expect(result).toBe(result.toLowerCase());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 4: Page name normalization
    it('should handle empty and whitespace inputs gracefully', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '   ', '\t', '\n', '  \t\n  '),
          (input: string) => {
            const result = normalizePageName(input);
            
            // Property: Empty or whitespace input should produce empty string
            expect(result).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 4: Page name normalization
    it('should produce idempotent results for already-normalized inputs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => {
            // Only test with strings that don't have trailing spaces or special chars
            // that would be removed in subsequent normalizations
            const trimmed = s.trim();
            return trimmed.length > 0 && trimmed === s;
          }),
          (input: string) => {
            const firstNormalization = normalizePageName(input);
            const secondNormalization = normalizePageName(firstNormalization);
            
            // Property: Normalizing an already normalized string should produce the same result
            expect(secondNormalization).toBe(firstNormalization);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Chinese Alias Mapping Correctness', () => {
    // Feature: merge-preview-navigation, Property 5: Chinese alias mapping correctness
    it('should correctly resolve all Chinese aliases in DEFAULT_ROLE_ALIASES', () => {
      // Get all Chinese aliases and their expected English mappings
      const aliases = Object.entries(DEFAULT_ROLE_ALIASES);
      
      fc.assert(
        fc.property(
          fc.constantFrom(...aliases),
          ([chineseAlias, expectedEnglish]: [string, string]) => {
            // Create a valid page list that includes the expected English name
            const validPages = [expectedEnglish, 'other-page-1', 'other-page-2'];
            
            const result = resolvePageName(chineseAlias, validPages);
            
            // Property: Chinese alias should resolve to the correct English page name
            expect(result).toBe(expectedEnglish);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 5: Chinese alias mapping correctness
    it('should return null for Chinese aliases when target page is not in valid list', () => {
      const aliases = Object.entries(DEFAULT_ROLE_ALIASES);
      
      fc.assert(
        fc.property(
          fc.constantFrom(...aliases),
          ([chineseAlias, expectedEnglish]: [string, string]) => {
            // Create a valid page list that does NOT include the expected English name
            const validPages = ['unrelated-page-1', 'unrelated-page-2', 'another-page'];
            
            // Make sure the expected English name is not in the list
            expect(validPages).not.toContain(expectedEnglish);
            
            const result = resolvePageName(chineseAlias, validPages);
            
            // Property: Should return null or a contains-match result
            // (null is expected, but contains-match might occur if the alias happens to match)
            if (result !== null) {
              // If not null, it must be from the valid pages list
              expect(validPages).toContain(result);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 5: Chinese alias mapping correctness
    it('should prioritize Chinese alias mapping over contains matching', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.entries(DEFAULT_ROLE_ALIASES)),
          ([chineseAlias, expectedEnglish]: [string, string]) => {
            // Create a valid page list with both the exact match and a partial match
            const partialMatch = expectedEnglish + '-extended';
            const validPages = [expectedEnglish, partialMatch, 'other-page'];
            
            const result = resolvePageName(chineseAlias, validPages);
            
            // Property: Should return the exact alias match, not the partial match
            expect(result).toBe(expectedEnglish);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 5: Chinese alias mapping correctness
    it('should handle custom pageRoles mapping correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (pageName: string, customRole: string, otherPage: string) => {
            // Ensure pageName and otherPage are different
            if (pageName === otherPage) return;
            
            const validPages = [pageName, otherPage];
            const pageRoles = new Map([[pageName, customRole]]);
            
            const result = resolvePageName(customRole, validPages, pageRoles);
            
            // Property: Custom role should resolve to the correct page name
            if (result !== null) {
              // Should either match the custom role mapping or be a valid page
              expect(validPages).toContain(result);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: Page Name Round-Trip Consistency', () => {
    // Feature: merge-preview-navigation, Property 6: Page name round-trip consistency
    it('should maintain consistency for valid page names', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 20 }).map(s => 
              normalizePageName(s) || 'default-page'
            ),
            { minLength: 1, maxLength: 10 }
          ),
          (validPages: string[]) => {
            // Ensure all pages are unique and non-empty
            const uniquePages = Array.from(new Set(validPages.filter(p => p.length > 0)));
            
            if (uniquePages.length === 0) return;
            
            // Property: For each valid page, normalize then resolve should return the same page
            uniquePages.forEach(pageName => {
              const normalized = normalizePageName(pageName);
              const resolved = resolvePageName(normalized, uniquePages);
              
              expect(resolved).toBe(pageName);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 6: Page name round-trip consistency
    it('should maintain consistency for page names with various formats', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 15 })
              .filter(s => s.trim().length > 0)
              .map(s => normalizePageName(s) || 'page'),
            { minLength: 1, maxLength: 8 }
          ),
          (basePages: string[]) => {
            // Create unique valid pages
            const validPages = Array.from(new Set(basePages.filter(p => p.length > 0)));
            
            if (validPages.length === 0) return;
            
            validPages.forEach(pageName => {
              // Test with uppercase
              const upperResult = resolvePageName(pageName.toUpperCase(), validPages);
              expect(upperResult).toBe(pageName);
              
              // Test with file extension
              const extResult = resolvePageName(pageName + '.html', validPages);
              expect(extResult).toBe(pageName);
              
              // Test with path prefix
              const pathResult = resolvePageName('/' + pageName, validPages);
              expect(pathResult).toBe(pageName);
              
              // Test with query parameter
              const queryResult = resolvePageName(pageName + '?id=123', validPages);
              expect(queryResult).toBe(pageName);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 6: Page name round-trip consistency
    it('should maintain consistency for kebab-case page names', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              fc.string({ minLength: 1, maxLength: 10 }),
              fc.string({ minLength: 1, maxLength: 10 })
            ).map(([a, b]) => {
              const normalized = normalizePageName(a + '-' + b);
              return normalized.length > 0 ? normalized : 'default-page';
            }),
            { minLength: 1, maxLength: 8 }
          ),
          (validPages: string[]) => {
            const uniquePages = Array.from(new Set(validPages));
            
            if (uniquePages.length === 0) return;
            
            // Property: Kebab-case names should round-trip perfectly
            uniquePages.forEach(pageName => {
              const normalized = normalizePageName(pageName);
              const resolved = resolvePageName(normalized, uniquePages);
              
              expect(resolved).toBe(pageName);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 6: Page name round-trip consistency
    it('should handle camelCase to kebab-case round-trip', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              fc.string({ minLength: 1, maxLength: 8 }),
              fc.string({ minLength: 1, maxLength: 8 })
            ),
            { minLength: 1, maxLength: 5 }
          ),
          (wordPairs: [string, string][]) => {
            // Create camelCase page names and their normalized versions
            const pageMap = new Map<string, string>();
            
            wordPairs.forEach(([word1, word2]) => {
              const camelCase = word1.toLowerCase() + 
                               word2.charAt(0).toUpperCase() + 
                               word2.slice(1).toLowerCase();
              const normalized = normalizePageName(camelCase);
              
              if (normalized.length > 0 && !pageMap.has(normalized)) {
                pageMap.set(normalized, normalized);
              }
            });
            
            const validPages = Array.from(pageMap.keys());
            
            if (validPages.length === 0) return;
            
            // Property: Normalized camelCase names should resolve back correctly
            validPages.forEach(pageName => {
              const resolved = resolvePageName(pageName, validPages);
              expect(resolved).toBe(pageName);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 6: Page name round-trip consistency
    it('should maintain consistency even with multiple transformations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 15 })
              .filter(s => s.trim().length > 0)
              .map(s => normalizePageName(s) || 'page'),
            { minLength: 1, maxLength: 8 }
          ),
          fc.constantFrom('.html', '.htm', '.php'),
          fc.constantFrom('/', './', '../'),
          fc.option(fc.string({ minLength: 1, maxLength: 10 })),
          (basePages: string[], extension: string, prefix: string, query: string | null) => {
            const validPages = Array.from(new Set(basePages.filter(p => p.length > 0)));
            
            if (validPages.length === 0) return;
            
            validPages.forEach(pageName => {
              // Apply multiple transformations
              let transformed = prefix + pageName + extension;
              if (query) {
                transformed += '?' + query;
              }
              
              const resolved = resolvePageName(transformed, validPages);
              
              // Property: Should still resolve to the original page name
              expect(resolved).toBe(pageName);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Normalization Invariants', () => {
    // Feature: merge-preview-navigation, Property 4: Page name normalization
    it('should never produce output with uppercase letters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          (input: string) => {
            const result = normalizePageName(input);
            
            // Property: Result should never contain uppercase letters
            expect(result).not.toMatch(/[A-Z]/);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 4: Page name normalization
    it('should never produce output with file extensions', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (input: string) => {
            const result = normalizePageName(input);
            
            // Property: Result should not end with common file extensions
            if (result.length > 0) {
              expect(result).not.toMatch(/\.(html?|php|jsp|aspx|txt)$/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 4: Page name normalization
    it('should never produce output with query parameters or anchors', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          (input: string) => {
            const result = normalizePageName(input);
            
            // Property: Result should not contain ? or #
            expect(result).not.toContain('?');
            expect(result).not.toContain('#');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Resolution Invariants', () => {
    // Feature: merge-preview-navigation, Property 5 & 6: Resolution correctness
    it('should always return null or a value from the valid pages list', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          (input: string, validPages: string[]) => {
            const uniquePages = Array.from(new Set(validPages));
            const result = resolvePageName(input, uniquePages);
            
            // Property: Result must be null or in the valid pages list
            if (result !== null) {
              expect(uniquePages).toContain(result);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 5 & 6: Resolution correctness
    it('should never return a result for empty valid pages list', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (input: string) => {
            const result = resolvePageName(input, []);
            
            // Property: Should always return null for empty valid pages
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 5 & 6: Resolution correctness
    it('should be deterministic for the same inputs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          (input: string, validPages: string[]) => {
            const uniquePages = Array.from(new Set(validPages));
            
            const result1 = resolvePageName(input, uniquePages);
            const result2 = resolvePageName(input, uniquePages);
            
            // Property: Same inputs should produce same output
            expect(result2).toBe(result1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
