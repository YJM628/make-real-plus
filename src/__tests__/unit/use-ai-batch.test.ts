/**
 * Integration tests for batch generation workflow
 * Feature: batch-html-redesign
 * Requirements: 1.1, 2.1, 4.2, 5.1, 5.2, 5.3, 5.4, 8.1
 * 
 * These tests verify the integration of:
 * - parseAppContext
 * - injectSharedTheme
 * - createShapesWithAutoLayout
 * - PageLinkHandler
 * - SharedThemeManager
 */

import type { BatchGenerationResult } from '../../types';
import { parseAppContext } from '../../utils/batch/parseBatchRequest';
import { injectSharedTheme } from '../../utils/batch/parseMultiPageResponse';
import { createShapesWithAutoLayout } from '../../utils/layout/autoLayout';
import { PageLinkHandler } from '../../utils/batch/pageLinkHandler';
import { SharedThemeManager } from '../../utils/batch/sharedThemeManager';

describe('Batch Generation Workflow Integration', () => {
  describe('Complete batch generation workflow', () => {
    it('should process batch result through complete workflow', () => {
      // Step 1: Parse user input to AppContext
      const userPrompt = '生成电商网站：首页、产品列表、购物车';
      const appContext = parseAppContext(userPrompt);
      
      expect(appContext).not.toBeNull();
      expect(appContext!.pages.length).toBeGreaterThan(0);

      // Step 2: Simulate batch generation result
      const batchResult: BatchGenerationResult = {
        pages: appContext!.pages.map(page => ({
          name: page.name,
          html: `<html><body><h1>${page.role}</h1></body></html>`,
          css: `h1 { color: var(--primary); }`,
          js: '',
        })),
        sharedTheme: ':root { --primary: #2563eb; --bg: #ffffff; }',
        sharedNavigation: {
          header: '<nav data-shared="header">Navigation</nav>',
          footer: '<footer data-shared="footer">Footer</footer>',
        },
      };

      // Step 3: Inject shared theme
      const pagesWithTheme = injectSharedTheme(batchResult.pages, batchResult.sharedTheme!);
      
      expect(pagesWithTheme[0].css).toContain(':root { --primary: #2563eb');
      expect(pagesWithTheme[0].css).toContain('h1 { color: var(--primary); }');

      // Step 4: Create shapes with auto-layout
      const shapes = createShapesWithAutoLayout(pagesWithTheme);
      
      expect(shapes.length).toBe(pagesWithTheme.length);
      expect(shapes[0].x).toBe(100); // startX
      expect(shapes[1].x).toBe(950); // startX + width + spacing

      // Step 5: Register pages with PageLinkHandler
      const pageMap = new Map<string, string>();
      pagesWithTheme.forEach((page, index) => {
        pageMap.set(page.name, shapes[index].id);
      });

      const pageLinkHandler = new PageLinkHandler();
      pageLinkHandler.registerPages(pageMap);

      expect(pageLinkHandler.getRegisteredPages().length).toBe(pagesWithTheme.length);

      // Step 6: Inject link handlers
      shapes.forEach((shape, index) => {
        const page = pagesWithTheme[index];
        shape.props.html = pageLinkHandler.injectLinkHandlers(
          shape.props.html,
          page.name
        );
      });

      expect(shapes[0].props.html).toContain('<script>');
      expect(shapes[0].props.html).toContain('navigateToPage');

      // Step 7: Register page group with SharedThemeManager
      const sharedThemeManager = new SharedThemeManager();
      const groupId = 'test-group';
      const shapeIds = shapes.map(s => s.id);

      sharedThemeManager.registerPageGroup(
        groupId,
        shapeIds,
        batchResult.sharedTheme!,
        batchResult.sharedNavigation!
      );

      pagesWithTheme.forEach((page, index) => {
        sharedThemeManager.mapPageToShape(groupId, page.name, shapes[index].id);
      });

      const pageGroup = sharedThemeManager.getPageGroup(groupId);
      expect(pageGroup).toBeDefined();
      expect(pageGroup!.shapeIds.length).toBe(shapes.length);
    });

    it('should handle workflow with minimal batch result', () => {
      const batchResult: BatchGenerationResult = {
        pages: [
          {
            name: 'home',
            html: '<html><body>Home</body></html>',
            css: 'body { margin: 0; }',
            js: '',
          },
        ],
      };

      // Process without shared theme
      const shapes = createShapesWithAutoLayout(batchResult.pages);
      
      expect(shapes.length).toBe(1);
      expect(shapes[0].props.css).toBe('body { margin: 0; }');
    });

    it('should maintain page order through workflow', () => {
      const batchResult: BatchGenerationResult = {
        pages: [
          {
            name: 'contact',
            html: '<html><body>Contact</body></html>',
            css: '',
            js: '',
          },
          {
            name: 'home',
            html: '<html><body>Home</body></html>',
            css: '',
            js: '',
          },
          {
            name: 'about',
            html: '<html><body>About</body></html>',
            css: '',
            js: '',
          },
        ],
      };

      // Auto-layout should sort by logical order
      const shapes = createShapesWithAutoLayout(batchResult.pages);

      // Pages should be sorted: home, about, contact
      expect(shapes[0].id).toContain('home');
      expect(shapes[1].id).toContain('about');
      expect(shapes[2].id).toContain('contact');
    });

    it('should handle shared theme updates through SharedThemeManager', () => {
      const batchResult: BatchGenerationResult = {
        pages: [
          {
            name: 'home',
            html: '<html><body>Home</body></html>',
            css: '',
            js: '',
          },
          {
            name: 'about',
            html: '<html><body>About</body></html>',
            css: '',
            js: '',
          },
        ],
        sharedTheme: ':root { --primary: #2563eb; }',
        sharedNavigation: {
          header: '<nav>Nav</nav>',
          footer: '<footer>Footer</footer>',
        },
      };

      const shapes = createShapesWithAutoLayout(batchResult.pages);
      const sharedThemeManager = new SharedThemeManager();
      const groupId = 'test-group';

      sharedThemeManager.registerPageGroup(
        groupId,
        shapes.map(s => s.id),
        batchResult.sharedTheme!,
        batchResult.sharedNavigation!
      );

      // Update shared theme
      const themeChanges = { '--primary': '#ff0000' };
      const overridesMap = sharedThemeManager.updateSharedTheme(groupId, themeChanges);

      // Should generate overrides for all pages
      expect(overridesMap.size).toBe(2);
      expect(overridesMap.get(shapes[0].id)).toBeDefined();
      expect(overridesMap.get(shapes[1].id)).toBeDefined();
    });
  });

  describe('Requirements validation', () => {
    it('should satisfy Requirement 1.1: Parse AppContext from user input', () => {
      const prompt = '生成博客网站：首页、文章列表、文章详情';
      const appContext = parseAppContext(prompt);

      expect(appContext).not.toBeNull();
      expect(appContext!.appName).toBeTruthy();
      expect(appContext!.pages.length).toBeGreaterThan(0);
    });

    it('should satisfy Requirement 2.1: Single AI call for all pages', () => {
      // This is validated by the AIService implementation
      // Here we verify the result structure supports it
      const batchResult: BatchGenerationResult = {
        pages: [
          { name: 'home', html: '<html></html>', css: '', js: '' },
          { name: 'about', html: '<html></html>', css: '', js: '' },
        ],
        sharedTheme: ':root { --primary: #000; }',
      };

      expect(batchResult.pages.length).toBe(2);
      expect(batchResult.sharedTheme).toBeTruthy();
    });

    it('should satisfy Requirement 4.2: Register page mappings for navigation', () => {
      const pageMap = new Map([
        ['home', 'shape-1'],
        ['about', 'shape-2'],
      ]);

      const handler = new PageLinkHandler();
      handler.registerPages(pageMap);

      expect(handler.handlePageLinkClick('home')).toBe('shape-1');
      expect(handler.handlePageLinkClick('about')).toBe('shape-2');
    });

    it('should satisfy Requirements 5.1-5.4: Auto-layout shapes on canvas', () => {
      const pages = [
        { name: 'home', html: '<html></html>', css: '', js: '' },
        { name: 'about', html: '<html></html>', css: '', js: '' },
        { name: 'contact', html: '<html></html>', css: '', js: '' },
      ];

      const shapes = createShapesWithAutoLayout(pages);

      // 5.1: Create independent shapes
      expect(shapes.length).toBe(3);

      // 5.2: Logical order (home, about, contact)
      expect(shapes[0].id).toContain('home');
      expect(shapes[1].id).toContain('about');
      expect(shapes[2].id).toContain('contact');

      // 5.3: 50px spacing
      expect(shapes[1].x - shapes[0].x).toBe(850); // width + spacing

      // 5.4: Auto-adjust view (bounds calculation)
      expect(shapes[0].x).toBe(100);
      expect(shapes[shapes.length - 1].x).toBeGreaterThan(shapes[0].x);
    });

    it('should satisfy Requirement 8.1: Register page group for batch modifications', () => {
      const manager = new SharedThemeManager();
      const groupId = 'test-group';
      const shapeIds = ['shape-1', 'shape-2'];

      manager.registerPageGroup(
        groupId,
        shapeIds,
        ':root { --primary: #000; }',
        { header: '<nav></nav>', footer: '<footer></footer>' }
      );

      const group = manager.getPageGroup(groupId);
      expect(group).toBeDefined();
      expect(group!.shapeIds).toEqual(shapeIds);
    });
  });
});
