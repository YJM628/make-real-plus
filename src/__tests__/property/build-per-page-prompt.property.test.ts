/**
 * Property-based tests for buildPerPagePrompt
 * Feature: merge-preview-navigation
 * Task: 2.4 - Property tests for prompt generation
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * Property 1: Prompt Navigation Rules Completeness
 * - For any PageSpec and AppContext, buildPerPagePrompt should generate a prompt
 *   containing the "Navigation Rules" section with data-page-target keyword,
 *   element type checklist, and CRITICAL constraint declaration
 * 
 * Property 2: linksTo Target Example Code Completeness
 * - For any PageSpec with non-empty linksTo list, buildPerPagePrompt should
 *   generate a prompt containing at least two HTML example code snippets with
 *   data-page-target="{targetName}" for each target page
 * 
 * Property 3: Prompt Prohibits File Paths and Includes Anti-Pattern Examples
 * - For any PageSpec and AppContext, buildPerPagePrompt should generate a prompt
 *   containing instructions to prohibit file paths (href="#") and at least one
 *   set of wrong vs. correct usage comparison examples
 */

import fc from 'fast-check';
import { buildPerPagePrompt } from '../../utils/batch/buildPerPagePrompt';
import type { PageSpec, AppContext } from '../../types';

describe('buildPerPagePrompt - Property-Based Tests', () => {
  // Arbitraries (generators) for fast-check

  /**
   * Generate a valid page name (lowercase, alphanumeric with hyphens)
   */
  const pageNameArbitrary = fc
    .tuple(
      fc.stringMatching(/^[a-z][a-z0-9]*$/),
      fc.option(fc.stringMatching(/^[a-z0-9]+$/))
    )
    .map(([first, second]) => (second ? `${first}-${second}` : first))
    .filter(name => name.length >= 2 && name.length <= 30);

  /**
   * Generate a page role (Chinese or English description)
   */
  const pageRoleArbitrary = fc.oneof(
    fc.constantFrom('首页', '产品列表', '产品详情', '购物车', '关于我们', '联系我们', '博客', '文章详情'),
    fc.constantFrom('Home', 'Products', 'Product Detail', 'Cart', 'About', 'Contact', 'Blog', 'Post')
  );

  /**
   * Generate a PageSpec with valid structure
   */
  const pageSpecArbitrary = fc
    .tuple(
      pageNameArbitrary,
      pageRoleArbitrary,
      fc.array(pageNameArbitrary, { minLength: 0, maxLength: 5 }),
      fc.integer({ min: 0, max: 100 })
    )
    .map(([name, role, linksTo, order]) => ({
      name,
      role,
      linksTo: Array.from(new Set(linksTo)), // Remove duplicates
      order,
    }));

  /**
   * Generate an AppContext with valid structure
   */
  const appContextArbitrary = fc
    .tuple(
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.constantFrom('ecommerce', 'blog', 'dashboard', 'portfolio', 'landing', 'saas'),
      fc.array(pageSpecArbitrary, { minLength: 1, maxLength: 8 }),
      fc.string({ minLength: 1, maxLength: 100 }),
      fc.option(fc.constantFrom('Tailwind CSS', 'Material-UI', 'Ant Design', 'Bootstrap'))
    )
    .map(([appName, appType, pages, originalPrompt, designSystem]) => {
      // Ensure unique page names
      const uniquePages = Array.from(
        new Map(pages.map(p => [p.name, p])).values()
      );

      return {
        appName,
        appType,
        pages: uniquePages,
        originalPrompt,
        ...(designSystem ? { designSystem } : {}),
      } as AppContext;
    });

  describe('Property 1: Prompt Navigation Rules Completeness', () => {
    // Feature: merge-preview-navigation, Property 1: Prompt navigation rules completeness
    it('should always include "Navigation Rules" section', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            // Ensure the page is in the context
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: Prompt must contain "Navigation Rules" heading
            expect(prompt).toContain('## Navigation Rules');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 1: Prompt navigation rules completeness
    it('should always include data-page-target keyword', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: Prompt must contain "data-page-target" keyword
            expect(prompt).toContain('data-page-target');
            
            // Should appear multiple times (in rules, examples, etc.)
            const occurrences = (prompt.match(/data-page-target/g) || []).length;
            expect(occurrences).toBeGreaterThanOrEqual(3);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 1: Prompt navigation rules completeness
    it('should always include element type checklist', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: Prompt must contain all required element types
            const requiredElementTypes = [
              'Navigation bar links',
              'Call-to-action (CTA) buttons',
              'Product cards',
              'List item links',
              'Breadcrumb navigation',
              'Footer links',
            ];

            requiredElementTypes.forEach(elementType => {
              expect(prompt).toContain(elementType);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 1: Prompt navigation rules completeness
    it('should always include CRITICAL constraint declaration', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: Prompt must contain CRITICAL keyword
            expect(prompt).toContain('CRITICAL');
            
            // CRITICAL should be associated with data-page-target requirement
            const criticalSections = prompt.split('CRITICAL');
            expect(criticalSections.length).toBeGreaterThan(1);
            
            // At least one CRITICAL section should mention data-page-target
            const hasCriticalWithDataPageTarget = criticalSections.some(section =>
              section.toLowerCase().includes('data-page-target')
            );
            expect(hasCriticalWithDataPageTarget).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 1: Prompt navigation rules completeness
    it('should include all required components in Navigation Rules section', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Extract Navigation Rules section
            const navRulesMatch = prompt.match(/## Navigation Rules[\s\S]*?(?=\n## |$)/);
            expect(navRulesMatch).toBeTruthy();

            if (navRulesMatch) {
              const navRulesSection = navRulesMatch[0];

              // Property: Navigation Rules section must contain all key components
              expect(navRulesSection).toContain('data-page-target');
              expect(navRulesSection).toContain('CRITICAL');
              expect(navRulesSection).toContain('Navigation bar links');
              expect(navRulesSection).toContain('Call-to-action (CTA) buttons');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 1: Prompt navigation rules completeness
    it('should maintain consistent structure across different app types', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          fc.constantFrom('ecommerce', 'blog', 'dashboard', 'portfolio'),
          (page: PageSpec, appType: string) => {
            const context: AppContext = {
              appName: 'Test App',
              appType,
              pages: [page],
              originalPrompt: 'Test prompt',
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: Core navigation rules should be present regardless of app type
            expect(prompt).toContain('## Navigation Rules');
            expect(prompt).toContain('data-page-target');
            expect(prompt).toContain('CRITICAL');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: linksTo Target Example Code Completeness', () => {
    // Feature: merge-preview-navigation, Property 2: linksTo target example code completeness
    it('should include HTML examples for each linksTo target', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary.filter(page => page.linksTo.length > 0),
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            // Ensure all linksTo targets exist in the pages list
            const allPages = [
              page,
              ...page.linksTo.map((target, idx) => ({
                name: target,
                role: `Target ${idx}`,
                linksTo: [],
                order: idx + 1,
              })),
              ...appContext.pages.filter(
                p => p.name !== page.name && !page.linksTo.includes(p.name)
              ),
            ];

            const context = {
              ...appContext,
              pages: allPages,
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: For each linksTo target, there should be HTML examples
            page.linksTo.forEach(target => {
              // Should mention the target page
              expect(prompt).toContain(`For page "${target}"`);
              
              // Should have data-page-target attribute with the target name
              const targetAttributePattern = new RegExp(
                `data-page-target="${target}"`,
                'g'
              );
              const matches = prompt.match(targetAttributePattern);
              
              // Should appear at least twice (for different element types)
              expect(matches).toBeTruthy();
              expect(matches!.length).toBeGreaterThanOrEqual(2);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 2: linksTo target example code completeness
    it('should provide at least two element types for each linksTo target', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary.filter(page => page.linksTo.length > 0),
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const allPages = [
              page,
              ...page.linksTo.map((target, idx) => ({
                name: target,
                role: `Target ${idx}`,
                linksTo: [],
                order: idx + 1,
              })),
            ];

            const context = {
              ...appContext,
              pages: allPages,
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: Each target should have examples with <a> and <button> tags
            page.linksTo.forEach(target => {
              // Check for <a> tag example
              const linkPattern = new RegExp(
                `<a\\s+href="#"\\s+data-page-target="${target}"`,
                'i'
              );
              expect(prompt).toMatch(linkPattern);

              // Check for <button> tag example
              const buttonPattern = new RegExp(
                `<button\\s+data-page-target="${target}"`,
                'i'
              );
              expect(prompt).toMatch(buttonPattern);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 2: linksTo target example code completeness
    it('should include examples section only when linksTo is non-empty', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            if (page.linksTo.length > 0) {
              // Property: Should have HTML Examples section
              expect(prompt).toContain('### HTML Examples for This Page\'s Link Targets');
            } else {
              // Property: Should not have HTML Examples section
              expect(prompt).not.toContain('### HTML Examples for This Page\'s Link Targets');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 2: linksTo target example code completeness
    it('should include card/div examples for each linksTo target', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary.filter(page => page.linksTo.length > 0),
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const allPages = [
              page,
              ...page.linksTo.map((target, idx) => ({
                name: target,
                role: `Target ${idx}`,
                linksTo: [],
                order: idx + 1,
              })),
            ];

            const context = {
              ...appContext,
              pages: allPages,
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: Each target should have a card/div example
            page.linksTo.forEach(target => {
              const cardPattern = new RegExp(
                `<div[^>]*data-page-target="${target}"`,
                'i'
              );
              expect(prompt).toMatch(cardPattern);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 2: linksTo target example code completeness
    it('should handle pages with many linksTo targets', () => {
      fc.assert(
        fc.property(
          fc.array(pageNameArbitrary, { minLength: 3, maxLength: 6 }),
          appContextArbitrary,
          (targetNames: string[], appContext: AppContext) => {
            const uniqueTargets = Array.from(new Set(targetNames));
            
            const page: PageSpec = {
              name: 'hub-page',
              role: 'Hub Page',
              linksTo: uniqueTargets,
              order: 0,
            };

            const allPages = [
              page,
              ...uniqueTargets.map((target, idx) => ({
                name: target,
                role: `Target ${idx}`,
                linksTo: [],
                order: idx + 1,
              })),
            ];

            const context = {
              ...appContext,
              pages: allPages,
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: All targets should have examples
            uniqueTargets.forEach(target => {
              expect(prompt).toContain(`For page "${target}"`);
              expect(prompt).toContain(`data-page-target="${target}"`);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 2: linksTo target example code completeness
    it('should use target page role in examples when available', () => {
      fc.assert(
        fc.property(
          pageNameArbitrary,
          pageRoleArbitrary,
          appContextArbitrary,
          (targetName: string, targetRole: string, appContext: AppContext) => {
            const page: PageSpec = {
              name: 'source-page',
              role: 'Source Page',
              linksTo: [targetName],
              order: 0,
            };

            const targetPage: PageSpec = {
              name: targetName,
              role: targetRole,
              linksTo: [],
              order: 1,
            };

            const context = {
              ...appContext,
              pages: [page, targetPage],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: Examples should use the target page's role
            expect(prompt).toContain(`For page "${targetName}" (${targetRole})`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Prompt Prohibits File Paths and Includes Anti-Pattern Examples', () => {
    // Feature: merge-preview-navigation, Property 3: Prompt prohibits file paths and includes anti-pattern examples
    it('should always include anti-pattern examples section', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: Prompt must contain anti-pattern section
            expect(prompt).toContain('❌ WRONG vs. ✅ CORRECT');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 3: Prompt prohibits file paths and includes anti-pattern examples
    it('should show wrong usage with file paths', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: Prompt must show wrong examples with .html extension
            expect(prompt).toMatch(/href="[^"]*\.html"/);
            
            // Should also show wrong examples with relative paths
            expect(prompt).toMatch(/href="\/[^"]*"/);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 3: Prompt prohibits file paths and includes anti-pattern examples
    it('should show correct usage with href="#" and data-page-target', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: Prompt must show correct examples with href="#"
            expect(prompt).toMatch(/href="#"\s+data-page-target="[^"]+"/);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 3: Prompt prohibits file paths and includes anti-pattern examples
    it('should include prohibition instructions for file paths', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: Prompt must instruct to use href="#" for links
            const navStructureMatch = prompt.match(/## Navigation Structure[\s\S]*?(?=\n## |$)/);
            expect(navStructureMatch).toBeTruthy();

            if (navStructureMatch) {
              const navSection = navStructureMatch[0];
              expect(navSection).toContain('href="#"');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 3: Prompt prohibits file paths and includes anti-pattern examples
    it('should mark wrong examples with ❌ and correct examples with ✅', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: Prompt must use visual markers for wrong and correct examples
            expect(prompt).toContain('❌ WRONG');
            expect(prompt).toContain('✅ CORRECT');
            
            // Extract the anti-pattern section
            const antiPatternMatch = prompt.match(/❌ WRONG vs\. ✅ CORRECT[\s\S]*?(?=\n## |$)/);
            expect(antiPatternMatch).toBeTruthy();

            if (antiPatternMatch) {
              const antiPatternSection = antiPatternMatch[0];
              
              // Should have both wrong and correct examples
              expect(antiPatternSection).toContain('❌ WRONG');
              expect(antiPatternSection).toContain('✅ CORRECT');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 3: Prompt prohibits file paths and includes anti-pattern examples
    it('should show multiple types of wrong patterns', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Extract anti-pattern section - look for the full section
            const antiPatternMatch = prompt.match(/❌ WRONG vs\. ✅ CORRECT[\s\S]*?(?=\n## |$)/);
            expect(antiPatternMatch).toBeTruthy();

            if (antiPatternMatch) {
              const antiPatternSection = antiPatternMatch[0];
              
              // Property: Should show multiple types of wrong patterns
              // 1. File path with .html
              expect(antiPatternSection).toMatch(/\.html/);
              
              // 2. Relative path with /
              expect(antiPatternSection).toMatch(/href="\/[^"]*"/);
              
              // 3. Should have both wrong and correct sections
              expect(antiPatternSection).toContain('❌ WRONG');
              expect(antiPatternSection).toContain('✅ CORRECT');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 3: Prompt prohibits file paths and includes anti-pattern examples
    it('should include wrong and correct example sections with HTML code', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Extract anti-pattern section
            const antiPatternMatch = prompt.match(/❌ WRONG vs\. ✅ CORRECT[\s\S]*?(?=\n## |$)/);
            expect(antiPatternMatch).toBeTruthy();

            if (antiPatternMatch) {
              const antiPatternSection = antiPatternMatch[0];
              
              // Property: Should have both WRONG and CORRECT sections
              expect(antiPatternSection).toContain('❌ WRONG');
              expect(antiPatternSection).toContain('✅ CORRECT');
              
              // Property: Should contain code blocks with HTML examples
              expect(antiPatternSection).toContain('```html');
              
              // Property: Wrong section should show file path usage
              expect(antiPatternSection).toContain('.html');
              expect(antiPatternSection).toContain('href="/');
              
              // Property: Correct section should show data-page-target usage
              expect(antiPatternSection).toContain('data-page-target');
              expect(antiPatternSection).toContain('href="#"');
              
              // Property: Should have multiple HTML elements in examples
              const htmlElementCount = (antiPatternSection.match(/<(a|button|div)/g) || []).length;
              expect(htmlElementCount).toBeGreaterThanOrEqual(6); // At least 3 wrong + 3 correct
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Structural Invariants', () => {
    // Feature: merge-preview-navigation, Property 1, 2, 3: Overall structure
    it('should maintain consistent section ordering', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: Sections should appear in the correct order
            const navStructureIndex = prompt.indexOf('## Navigation Structure');
            const navRulesIndex = prompt.indexOf('## Navigation Rules');
            
            expect(navStructureIndex).toBeGreaterThan(-1);
            expect(navRulesIndex).toBeGreaterThan(-1);
            
            // Navigation Rules should come after Navigation Structure
            expect(navRulesIndex).toBeGreaterThan(navStructureIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 1, 2, 3: Overall structure
    it('should always be a non-empty string', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: Prompt should never be empty
            expect(prompt.length).toBeGreaterThan(0);
            expect(prompt.trim().length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 1, 2, 3: Overall structure
    it('should include all major sections', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt = buildPerPagePrompt(page, context);

            // Property: All major sections should be present
            const requiredSections = [
              '# Page Generation Task',
              '## Application Context',
              '## Current Page',
              '## Shared Theme',
              '## Navigation Structure',
              '## Navigation Rules',
              '## Output Requirements',
            ];

            requiredSections.forEach(section => {
              expect(prompt).toContain(section);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: merge-preview-navigation, Property 1, 2, 3: Overall structure
    it('should be deterministic for the same inputs', () => {
      fc.assert(
        fc.property(
          pageSpecArbitrary,
          appContextArbitrary,
          (page: PageSpec, appContext: AppContext) => {
            const context = {
              ...appContext,
              pages: [page, ...appContext.pages.filter(p => p.name !== page.name)],
            };

            const prompt1 = buildPerPagePrompt(page, context);
            const prompt2 = buildPerPagePrompt(page, context);

            // Property: Same inputs should produce identical output
            expect(prompt2).toBe(prompt1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
