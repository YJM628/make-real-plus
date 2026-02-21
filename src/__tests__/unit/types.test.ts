/**
 * Unit tests for core type definitions
 * Feature: ai-html-visual-editor
 */

import type {
  ElementOverride,
  ParsedElement,
  ViewportConfig,
  AIGenerationContext,
  HtmlShapeProps,
  PageSpec,
  AppContext,
  CohesiveBatchResult,
  PageGroup,
} from '../../types';

describe('Core Types', () => {
  describe('ElementOverride', () => {
    it('should create a valid ElementOverride object', () => {
      const override: ElementOverride = {
        selector: '#test-element',
        text: 'Updated text',
        timestamp: Date.now(),
        aiGenerated: false,
      };

      expect(override.selector).toBe('#test-element');
      expect(override.text).toBe('Updated text');
      expect(override.aiGenerated).toBe(false);
      expect(typeof override.timestamp).toBe('number');
    });

    it('should support optional fields', () => {
      const override: ElementOverride = {
        selector: '.test-class',
        styles: { color: 'red', fontSize: '16px' },
        position: { x: 100, y: 200 },
        size: { width: 300, height: 400 },
        timestamp: Date.now(),
        aiGenerated: true,
      };

      expect(override.styles).toEqual({ color: 'red', fontSize: '16px' });
      expect(override.position).toEqual({ x: 100, y: 200 });
      expect(override.size).toEqual({ width: 300, height: 400 });
    });

    it('should support original values for restoration', () => {
      const override: ElementOverride = {
        selector: '#element',
        text: 'New text',
        timestamp: Date.now(),
        aiGenerated: false,
        original: {
          text: 'Original text',
          styles: { color: 'blue' },
        },
      };

      expect(override.original?.text).toBe('Original text');
      expect(override.original?.styles).toEqual({ color: 'blue' });
    });
  });

  describe('ParsedElement', () => {
    it('should create a valid ParsedElement object', () => {
      const element: ParsedElement = {
        identifier: 'elem-123',
        tagName: 'div',
        attributes: { class: 'container', id: 'main' },
        inlineStyles: { display: 'flex' },
        selector: '#main',
        textContent: 'Hello World',
        children: [],
      };

      expect(element.identifier).toBe('elem-123');
      expect(element.tagName).toBe('div');
      expect(element.selector).toBe('#main');
      expect(element.textContent).toBe('Hello World');
      expect(element.children).toHaveLength(0);
    });

    it('should support nested children', () => {
      const child: ParsedElement = {
        identifier: 'child-1',
        tagName: 'span',
        attributes: {},
        inlineStyles: {},
        selector: '#main > span',
        textContent: 'Child',
        children: [],
      };

      const parent: ParsedElement = {
        identifier: 'parent-1',
        tagName: 'div',
        attributes: {},
        inlineStyles: {},
        selector: '#main',
        textContent: '',
        children: [child],
      };

      expect(parent.children).toHaveLength(1);
      expect(parent.children[0]).toBe(child);
    });
  });

  describe('ViewportConfig', () => {
    it('should support preset viewport types', () => {
      const desktop: ViewportConfig = 'desktop';
      const tablet: ViewportConfig = 'tablet';
      const mobile: ViewportConfig = 'mobile';

      expect(desktop).toBe('desktop');
      expect(tablet).toBe('tablet');
      expect(mobile).toBe('mobile');
    });

    it('should support custom viewport dimensions', () => {
      const custom: ViewportConfig = { width: 1440, height: 900 };

      expect(custom).toEqual({ width: 1440, height: 900 });
    });
  });

  describe('HtmlShapeProps', () => {
    it('should create a valid HtmlShapeProps object', () => {
      const shape: HtmlShapeProps = {
        id: 'shape-1',
        type: 'html',
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        props: {
          html: '<div>Test</div>',
          css: 'div { color: red; }',
          js: 'console.log("test");',
          mode: 'preview',
          overrides: [],
        },
      };

      expect(shape.id).toBe('shape-1');
      expect(shape.type).toBe('html');
      expect(shape.props.mode).toBe('preview');
      expect(shape.props.overrides).toHaveLength(0);
    });

    it('should support different rendering modes', () => {
      const previewShape: HtmlShapeProps = {
        id: 'shape-1',
        type: 'html',
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        props: {
          html: '',
          css: '',
          js: '',
          mode: 'preview',
          overrides: [],
        },
      };

      const editShape: HtmlShapeProps = {
        ...previewShape,
        props: { ...previewShape.props, mode: 'edit' },
      };

      const splitShape: HtmlShapeProps = {
        ...previewShape,
        props: { ...previewShape.props, mode: 'split' },
      };

      expect(previewShape.props.mode).toBe('preview');
      expect(editShape.props.mode).toBe('edit');
      expect(splitShape.props.mode).toBe('split');
    });
  });

  describe('AIGenerationContext', () => {
    it('should create a valid AIGenerationContext object', () => {
      const context: AIGenerationContext = {
        prompt: 'Create a landing page',
        designSystem: 'tailwind',
      };

      expect(context.prompt).toBe('Create a landing page');
      expect(context.designSystem).toBe('tailwind');
    });

    it('should support batch generation', () => {
      const context: AIGenerationContext = {
        prompt: 'Create multiple pages',
        batchGeneration: {
          count: 3,
          pageTypes: ['home', 'about', 'contact'],
        },
      };

      expect(context.batchGeneration?.count).toBe(3);
      expect(context.batchGeneration?.pageTypes).toHaveLength(3);
    });

    it('should support batch generation with appContext', () => {
      const appContext: AppContext = {
        appName: 'E-commerce Site',
        appType: 'ecommerce',
        pages: [
          { name: 'home', role: '首页', linksTo: ['products', 'cart'], order: 0 },
          { name: 'products', role: '产品列表', linksTo: ['cart'], order: 1 },
          { name: 'cart', role: '购物车', linksTo: ['home'], order: 2 },
        ],
        originalPrompt: '生成电商网站：首页、产品列表、购物车',
        designSystem: 'tailwind',
      };

      const context: AIGenerationContext = {
        prompt: '生成电商网站：首页、产品列表、购物车',
        designSystem: 'tailwind',
        batchGeneration: {
          count: 3,
          pageTypes: ['home', 'products', 'cart'],
          appContext,
        },
      };

      expect(context.batchGeneration?.appContext).toBeDefined();
      expect(context.batchGeneration?.appContext?.appName).toBe('E-commerce Site');
      expect(context.batchGeneration?.appContext?.pages).toHaveLength(3);
    });
  });

  describe('PageSpec', () => {
    it('should create a valid PageSpec object', () => {
      const pageSpec: PageSpec = {
        name: 'home',
        role: '首页',
        linksTo: ['products', 'about'],
        order: 0,
      };

      expect(pageSpec.name).toBe('home');
      expect(pageSpec.role).toBe('首页');
      expect(pageSpec.linksTo).toEqual(['products', 'about']);
      expect(pageSpec.order).toBe(0);
    });

    it('should support empty linksTo array', () => {
      const pageSpec: PageSpec = {
        name: 'contact',
        role: '联系我们',
        linksTo: [],
        order: 5,
      };

      expect(pageSpec.linksTo).toHaveLength(0);
    });
  });

  describe('AppContext', () => {
    it('should create a valid AppContext object', () => {
      const appContext: AppContext = {
        appName: 'My Blog',
        appType: 'blog',
        pages: [
          { name: 'home', role: '首页', linksTo: ['blog', 'about'], order: 0 },
          { name: 'blog', role: '博客列表', linksTo: ['home'], order: 1 },
          { name: 'about', role: '关于', linksTo: ['home'], order: 2 },
        ],
        originalPrompt: '创建博客网站',
      };

      expect(appContext.appName).toBe('My Blog');
      expect(appContext.appType).toBe('blog');
      expect(appContext.pages).toHaveLength(3);
      expect(appContext.originalPrompt).toBe('创建博客网站');
    });

    it('should support optional designSystem', () => {
      const appContext: AppContext = {
        appName: 'Dashboard',
        appType: 'dashboard',
        pages: [
          { name: 'overview', role: '概览', linksTo: [], order: 0 },
        ],
        originalPrompt: '创建仪表板',
        designSystem: 'material-ui',
      };

      expect(appContext.designSystem).toBe('material-ui');
    });
  });

  describe('CohesiveBatchResult', () => {
    it('should create a valid CohesiveBatchResult object', () => {
      const result: CohesiveBatchResult = {
        sharedTheme: ':root { --primary: #2563eb; --bg: #ffffff; }',
        sharedNavigation: {
          header: '<nav><a href="#home">Home</a></nav>',
          footer: '<footer>© 2024</footer>',
        },
        pages: [
          {
            name: 'home',
            html: '<!DOCTYPE html><html><body>Home</body></html>',
            css: 'body { margin: 0; }',
            js: 'console.log("home");',
          },
          {
            name: 'about',
            html: '<!DOCTYPE html><html><body>About</body></html>',
            css: 'body { margin: 0; }',
            js: 'console.log("about");',
          },
        ],
      };

      expect(result.sharedTheme).toContain('--primary');
      expect(result.sharedNavigation.header).toContain('nav');
      expect(result.sharedNavigation.footer).toContain('footer');
      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].name).toBe('home');
      expect(result.pages[1].name).toBe('about');
    });

    it('should support error field', () => {
      const result: CohesiveBatchResult = {
        sharedTheme: '',
        sharedNavigation: {
          header: '',
          footer: '',
        },
        pages: [],
        error: 'Failed to parse AI response',
      };

      expect(result.error).toBe('Failed to parse AI response');
      expect(result.pages).toHaveLength(0);
    });
  });

  describe('PageGroup', () => {
    it('should create a valid PageGroup object', () => {
      const pageGroup: PageGroup = {
        groupId: 'group-123',
        shapeIds: ['shape-1', 'shape-2', 'shape-3'],
        sharedTheme: ':root { --primary: #2563eb; }',
        sharedNavigation: {
          header: '<nav>Navigation</nav>',
          footer: '<footer>Footer</footer>',
        },
        pageNameToShapeId: new Map([
          ['home', 'shape-1'],
          ['about', 'shape-2'],
          ['contact', 'shape-3'],
        ]),
      };

      expect(pageGroup.groupId).toBe('group-123');
      expect(pageGroup.shapeIds).toHaveLength(3);
      expect(pageGroup.pageNameToShapeId.size).toBe(3);
      expect(pageGroup.pageNameToShapeId.get('home')).toBe('shape-1');
    });

    it('should support Map operations', () => {
      const pageGroup: PageGroup = {
        groupId: 'group-456',
        shapeIds: ['shape-a', 'shape-b'],
        sharedTheme: '',
        sharedNavigation: {
          header: '',
          footer: '',
        },
        pageNameToShapeId: new Map(),
      };

      pageGroup.pageNameToShapeId.set('home', 'shape-a');
      pageGroup.pageNameToShapeId.set('about', 'shape-b');

      expect(pageGroup.pageNameToShapeId.has('home')).toBe(true);
      expect(pageGroup.pageNameToShapeId.get('about')).toBe('shape-b');
      expect(pageGroup.pageNameToShapeId.size).toBe(2);
    });
  });
});
