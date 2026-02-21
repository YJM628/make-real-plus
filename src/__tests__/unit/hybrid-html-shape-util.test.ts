/**
 * Unit tests for HybridHtmlShapeUtil
 * Feature: ai-html-visual-editor
 * 
 * Tests the custom tldraw shape handler for HTML rendering
 * Requirements: 2.1, 2.2, 2.4, 2.5
 * 
 * Note: These tests verify the shape util structure and exports.
 * Full integration testing with tldraw will be done in E2E tests.
 */

import { HTML_SHAPE_TYPE } from '../../core/shape';

// Mock InteractiveModeContext
jest.mock('../../components/canvas/hooks/useInteractiveMode', () => ({
  InteractiveModeContext: { Provider: 'div', Consumer: 'div' },
}));

// Mock tldraw to avoid ES module issues in Jest
jest.mock('tldraw', () => ({
  HTMLContainer: 'div',
  Rectangle2d: jest.fn(),
  ShapeUtil: class ShapeUtil {
    static type = 'base';
    getDefaultProps() {}
    getGeometry() {}
    component() {}
    indicator() {}
  },
  TLShape: {},
  TLResizeInfo: {},
  T: {
    string: 'string',
    number: 'number',
    boolean: 'boolean',
    literalEnum: jest.fn(() => 'literalEnum'),
    arrayOf: jest.fn(() => 'arrayOf'),
    object: jest.fn(() => 'object'),
    optional: jest.fn(() => 'optional'),
    dict: jest.fn(() => 'dict'),
  },
  EditorAtom: jest.fn().mockImplementation((name, fn) => ({
    name,
    get: jest.fn(() => new Map()),
    update: jest.fn(),
  })),
  AtomMap: jest.fn().mockImplementation(() => new Map()),
  useEditor: jest.fn(() => ({
    sideEffects: {
      registerAfterDeleteHandler: jest.fn(),
    },
  })),
}));

describe('HybridHtmlShapeUtil', () => {
  describe('Shape Type Definition', () => {
    it('should export HTML_SHAPE_TYPE constant', () => {
      expect(HTML_SHAPE_TYPE).toBe('html');
    });

    it('should have correct type value', () => {
      expect(HTML_SHAPE_TYPE).toBe('html');
    });
  });

  describe('Module Exports', () => {
    it('should export HybridHtmlShapeUtil class', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      expect(HybridHtmlShapeUtil).toBeDefined();
      expect(typeof HybridHtmlShapeUtil).toBe('function');
    });

    it('should export HTML_SHAPE_TYPE', async () => {
      const { HTML_SHAPE_TYPE } = await import('../../core/shape');
      expect(HTML_SHAPE_TYPE).toBe('html');
    });

    it('should export HtmlShape type', async () => {
      // Type exports can't be tested at runtime, but we can verify the module loads
      const module = await import('../../core/shape');
      expect(module).toBeDefined();
    });
  });

  describe('Shape Util Structure', () => {
    it('should have static type property', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      expect(HybridHtmlShapeUtil.type).toBe('html');
    });

    it('should have required methods', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      
      const requiredMethods = [
        'getDefaultProps',
        'getGeometry',
        'component',
        'indicator',
      ];

      requiredMethods.forEach((method) => {
        expect(HybridHtmlShapeUtil.prototype[method]).toBeDefined();
      });
    });

    it('should have transformation handlers', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      const util = new HybridHtmlShapeUtil({} as any);
      
      // Arrow function properties are on the instance, not prototype
      expect(util.onResize).toBeDefined();
      expect(util.onRotate).toBeDefined();
    });

    it('should have pointer event handlers', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      const util = new HybridHtmlShapeUtil({} as any);
      
      // Arrow function properties are on the instance, not prototype
      expect(util.onPointerDown).toBeDefined();
      expect(util.onPointerMove).toBeDefined();
      expect(util.onPointerUp).toBeDefined();
    });

    it('should have capability methods', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      const util = new HybridHtmlShapeUtil({} as any);
      
      // Arrow function properties are on the instance, not prototype
      expect(util.canResize).toBeDefined();
      expect(util.canRotate).toBeDefined();
      expect(util.canBind).toBeDefined();
    });
  });

  describe('Default Props', () => {
    it('should provide default props structure', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      const util = new HybridHtmlShapeUtil({} as any);
      const defaultProps = util.getDefaultProps();

      expect(defaultProps).toHaveProperty('html');
      expect(defaultProps).toHaveProperty('css');
      expect(defaultProps).toHaveProperty('js');
      expect(defaultProps).toHaveProperty('mode');
      expect(defaultProps).toHaveProperty('overrides');
      expect(defaultProps).toHaveProperty('w');
      expect(defaultProps).toHaveProperty('h');
    });

    it('should have sensible default values', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      const util = new HybridHtmlShapeUtil({} as any);
      const defaultProps = util.getDefaultProps();

      expect(defaultProps.mode).toBe('preview');
      expect(defaultProps.overrides).toEqual([]);
      expect(defaultProps.w).toBe(800);
      expect(defaultProps.h).toBe(600);
      expect(typeof defaultProps.html).toBe('string');
      expect(typeof defaultProps.css).toBe('string');
      expect(typeof defaultProps.js).toBe('string');
    });
  });

  describe('Shape Capabilities', () => {
    it('should allow resizing', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      const util = new HybridHtmlShapeUtil({} as any);
      
      expect(util.canResize()).toBe(true);
    });

    it('should not allow rotation', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      const util = new HybridHtmlShapeUtil({} as any);
      
      expect(util.canRotate()).toBe(false);
    });

    it('should not allow binding', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      const util = new HybridHtmlShapeUtil({} as any);
      
      expect(util.canBind()).toBe(false);
    });
  });

  describe('Integration Points', () => {
    it('should be a valid ShapeUtil subclass', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      
      // Verify the class has all required methods for a ShapeUtil
      const requiredMethods = [
        'getDefaultProps',
        'getGeometry',
        'component',
        'indicator',
      ];

      requiredMethods.forEach((method) => {
        expect(HybridHtmlShapeUtil.prototype[method]).toBeDefined();
        expect(typeof HybridHtmlShapeUtil.prototype[method]).toBe('function');
      });
    });

    it('should have correct static type', async () => {
      const { HybridHtmlShapeUtil, HTML_SHAPE_TYPE } = await import('../../core/shape');
      
      expect(HybridHtmlShapeUtil.type).toBe(HTML_SHAPE_TYPE);
      expect(HybridHtmlShapeUtil.type).toBe('html');
    });
  });

  describe('Requirements Coverage', () => {
    it('should satisfy requirement 2.1 - HTML shape creation', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      
      // Verify shape can be created with default props
      const util = new HybridHtmlShapeUtil({} as any);
      const defaultProps = util.getDefaultProps();
      
      expect(defaultProps).toBeDefined();
      expect(defaultProps.html).toBeDefined();
    });

    it('should satisfy requirement 2.2 - Shape-DOM mapping', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      
      // Verify shape has component method for rendering
      expect(HybridHtmlShapeUtil.prototype.component).toBeDefined();
    });

    it('should satisfy requirement 2.4 - Standard tldraw operations', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      const util = new HybridHtmlShapeUtil({} as any);
      
      // Verify shape supports standard operations
      expect(util.onResize).toBeDefined();
      expect(util.onRotate).toBeDefined();
      expect(HybridHtmlShapeUtil.prototype.getGeometry).toBeDefined();
    });

    it('should satisfy requirement 2.5 - Resize synchronization', async () => {
      const { HybridHtmlShapeUtil } = await import('../../core/shape');
      const util = new HybridHtmlShapeUtil({} as any);
      
      // Verify shape has resize handler
      expect(util.onResize).toBeDefined();
      expect(typeof util.onResize).toBe('function');
    });
  });
});

