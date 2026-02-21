/**
 * Unit tests for SharedThemeManager
 * Feature: batch-html-redesign
 */

import { SharedThemeManager } from '../../utils/batch/sharedThemeManager';

describe('SharedThemeManager', () => {
  let manager: SharedThemeManager;

  beforeEach(() => {
    manager = new SharedThemeManager();
  });

  describe('registerPageGroup', () => {
    it('should register a new page group', () => {
      const groupId = 'test-group';
      const shapeIds = ['shape1', 'shape2', 'shape3'];
      const sharedTheme = ':root { --primary: #2563eb; --bg: #ffffff; }';
      const sharedNavigation = {
        header: '<nav data-shared="header">Nav</nav>',
        footer: '<footer data-shared="footer">Footer</footer>',
      };

      manager.registerPageGroup(groupId, shapeIds, sharedTheme, sharedNavigation);

      const group = manager.getPageGroup(groupId);
      expect(group).toBeDefined();
      expect(group?.groupId).toBe(groupId);
      expect(group?.shapeIds).toEqual(shapeIds);
      expect(group?.sharedTheme).toBe(sharedTheme);
      expect(group?.sharedNavigation).toEqual(sharedNavigation);
    });

    it('should initialize empty page name to shape ID mapping', () => {
      manager.registerPageGroup('group1', ['shape1'], ':root {}', { header: '', footer: '' });

      const group = manager.getPageGroup('group1');
      expect(group?.pageNameToShapeId.size).toBe(0);
    });
  });

  describe('mapPageToShape', () => {
    it('should map page name to shape ID', () => {
      manager.registerPageGroup('group1', ['shape1'], ':root {}', { header: '', footer: '' });
      manager.mapPageToShape('group1', 'home', 'shape1');

      const group = manager.getPageGroup('group1');
      expect(group?.pageNameToShapeId.get('home')).toBe('shape1');
    });

    it('should handle non-existent group gracefully', () => {
      expect(() => {
        manager.mapPageToShape('non-existent', 'home', 'shape1');
      }).not.toThrow();
    });
  });

  describe('updateSharedTheme', () => {
    it('should generate overrides for all pages in the group', () => {
      const shapeIds = ['shape1', 'shape2', 'shape3'];
      manager.registerPageGroup(
        'group1',
        shapeIds,
        ':root { --primary: #2563eb; --bg: #ffffff; }',
        { header: '', footer: '' }
      );

      const themeChanges = { '--primary': '#ff0000', '--bg': '#000000' };
      const overridesMap = manager.updateSharedTheme('group1', themeChanges);

      expect(overridesMap.size).toBe(3);
      for (const shapeId of shapeIds) {
        const overrides = overridesMap.get(shapeId);
        expect(overrides).toBeDefined();
        expect(overrides?.length).toBe(1);
        expect(overrides?.[0].selector).toBe(':root');
        expect(overrides?.[0].styles).toEqual(themeChanges);
      }
    });

    it('should update the stored shared theme', () => {
      manager.registerPageGroup(
        'group1',
        ['shape1'],
        ':root { --primary: #2563eb; }',
        { header: '', footer: '' }
      );

      manager.updateSharedTheme('group1', { '--primary': '#ff0000' });

      const group = manager.getPageGroup('group1');
      expect(group?.sharedTheme).toContain('--primary: #ff0000');
    });

    it('should preserve original theme values in override', () => {
      manager.registerPageGroup(
        'group1',
        ['shape1'],
        ':root { --primary: #2563eb; --bg: #ffffff; }',
        { header: '', footer: '' }
      );

      const overridesMap = manager.updateSharedTheme('group1', { '--primary': '#ff0000' });
      const overrides = overridesMap.get('shape1');

      expect(overrides?.[0].original?.styles).toEqual({ '--primary': '#2563eb' });
    });

    it('should return empty map for non-existent group', () => {
      const overridesMap = manager.updateSharedTheme('non-existent', { '--primary': '#ff0000' });
      expect(overridesMap.size).toBe(0);
    });

    it('should add new CSS variables if they do not exist', () => {
      manager.registerPageGroup(
        'group1',
        ['shape1'],
        ':root { --primary: #2563eb; }',
        { header: '', footer: '' }
      );

      manager.updateSharedTheme('group1', { '--secondary': '#10b981' });

      const group = manager.getPageGroup('group1');
      expect(group?.sharedTheme).toContain('--secondary: #10b981');
    });

    it('should create :root block if it does not exist', () => {
      manager.registerPageGroup(
        'group1',
        ['shape1'],
        '/* No :root block */',
        { header: '', footer: '' }
      );

      manager.updateSharedTheme('group1', { '--primary': '#2563eb' });

      const group = manager.getPageGroup('group1');
      expect(group?.sharedTheme).toContain(':root');
      expect(group?.sharedTheme).toContain('--primary: #2563eb');
    });
  });

  describe('updateSharedNavigation', () => {
    it('should generate overrides for header changes', () => {
      const shapeIds = ['shape1', 'shape2'];
      manager.registerPageGroup(
        'group1',
        shapeIds,
        ':root {}',
        {
          header: '<nav data-shared="header">Old Nav</nav>',
          footer: '<footer data-shared="footer">Footer</footer>',
        }
      );

      const newHeader = '<nav data-shared="header">New Nav</nav>';
      const overridesMap = manager.updateSharedNavigation('group1', { header: newHeader });

      expect(overridesMap.size).toBe(2);
      for (const shapeId of shapeIds) {
        const overrides = overridesMap.get(shapeId);
        expect(overrides).toBeDefined();
        expect(overrides?.length).toBe(1);
        expect(overrides?.[0].selector).toBe('nav[data-shared="header"], header[data-shared="header"]');
        expect(overrides?.[0].html).toBe(newHeader);
      }
    });

    it('should generate overrides for footer changes', () => {
      const shapeIds = ['shape1', 'shape2'];
      manager.registerPageGroup(
        'group1',
        shapeIds,
        ':root {}',
        {
          header: '<nav data-shared="header">Nav</nav>',
          footer: '<footer data-shared="footer">Old Footer</footer>',
        }
      );

      const newFooter = '<footer data-shared="footer">New Footer</footer>';
      const overridesMap = manager.updateSharedNavigation('group1', { footer: newFooter });

      expect(overridesMap.size).toBe(2);
      for (const shapeId of shapeIds) {
        const overrides = overridesMap.get(shapeId);
        expect(overrides).toBeDefined();
        expect(overrides?.length).toBe(1);
        expect(overrides?.[0].selector).toBe('footer[data-shared="footer"]');
        expect(overrides?.[0].html).toBe(newFooter);
      }
    });

    it('should generate overrides for both header and footer changes', () => {
      manager.registerPageGroup(
        'group1',
        ['shape1'],
        ':root {}',
        {
          header: '<nav data-shared="header">Old Nav</nav>',
          footer: '<footer data-shared="footer">Old Footer</footer>',
        }
      );

      const newHeader = '<nav data-shared="header">New Nav</nav>';
      const newFooter = '<footer data-shared="footer">New Footer</footer>';
      const overridesMap = manager.updateSharedNavigation('group1', {
        header: newHeader,
        footer: newFooter,
      });

      const overrides = overridesMap.get('shape1');
      expect(overrides?.length).toBe(2);
      expect(overrides?.[0].html).toBe(newHeader);
      expect(overrides?.[1].html).toBe(newFooter);
    });

    it('should update the stored shared navigation', () => {
      manager.registerPageGroup(
        'group1',
        ['shape1'],
        ':root {}',
        {
          header: '<nav data-shared="header">Old Nav</nav>',
          footer: '<footer data-shared="footer">Old Footer</footer>',
        }
      );

      const newHeader = '<nav data-shared="header">New Nav</nav>';
      manager.updateSharedNavigation('group1', { header: newHeader });

      const group = manager.getPageGroup('group1');
      expect(group?.sharedNavigation.header).toBe(newHeader);
      expect(group?.sharedNavigation.footer).toBe('<footer data-shared="footer">Old Footer</footer>');
    });

    it('should preserve original navigation values in override', () => {
      const originalHeader = '<nav data-shared="header">Old Nav</nav>';
      manager.registerPageGroup(
        'group1',
        ['shape1'],
        ':root {}',
        {
          header: originalHeader,
          footer: '<footer data-shared="footer">Footer</footer>',
        }
      );

      const overridesMap = manager.updateSharedNavigation('group1', {
        header: '<nav data-shared="header">New Nav</nav>',
      });
      const overrides = overridesMap.get('shape1');

      expect(overrides?.[0].original?.html).toBe(originalHeader);
    });

    it('should return empty map for non-existent group', () => {
      const overridesMap = manager.updateSharedNavigation('non-existent', {
        header: '<nav>New Nav</nav>',
      });
      expect(overridesMap.size).toBe(0);
    });
  });

  describe('isSharedComponent', () => {
    beforeEach(() => {
      manager.registerPageGroup(
        'group1',
        ['shape1'],
        ':root { --primary: #2563eb; }',
        {
          header: '<nav data-shared="header">Nav</nav>',
          footer: '<footer data-shared="footer">Footer</footer>',
        }
      );
    });

    it('should return true for :root selector', () => {
      expect(manager.isSharedComponent('group1', ':root')).toBe(true);
    });

    it('should return true for shared header selector', () => {
      expect(manager.isSharedComponent('group1', 'nav[data-shared="header"]')).toBe(true);
      expect(manager.isSharedComponent('group1', 'header[data-shared="header"]')).toBe(true);
    });

    it('should return true for shared footer selector', () => {
      expect(manager.isSharedComponent('group1', 'footer[data-shared="footer"]')).toBe(true);
    });

    it('should return true for selectors within shared components', () => {
      expect(manager.isSharedComponent('group1', 'nav[data-shared="header"] a')).toBe(true);
      expect(manager.isSharedComponent('group1', 'footer[data-shared="footer"] p')).toBe(true);
    });

    it('should return false for non-shared selectors', () => {
      expect(manager.isSharedComponent('group1', '.main-content')).toBe(false);
      expect(manager.isSharedComponent('group1', '#hero')).toBe(false);
      expect(manager.isSharedComponent('group1', 'div.container')).toBe(false);
    });

    it('should return false for non-existent group', () => {
      expect(manager.isSharedComponent('non-existent', ':root')).toBe(false);
    });
  });

  describe('getPageGroup', () => {
    it('should return the page group if it exists', () => {
      manager.registerPageGroup('group1', ['shape1'], ':root {}', { header: '', footer: '' });

      const group = manager.getPageGroup('group1');
      expect(group).toBeDefined();
      expect(group?.groupId).toBe('group1');
    });

    it('should return undefined for non-existent group', () => {
      const group = manager.getPageGroup('non-existent');
      expect(group).toBeUndefined();
    });
  });

  describe('getAllPageGroups', () => {
    it('should return all registered page groups', () => {
      manager.registerPageGroup('group1', ['shape1'], ':root {}', { header: '', footer: '' });
      manager.registerPageGroup('group2', ['shape2'], ':root {}', { header: '', footer: '' });
      manager.registerPageGroup('group3', ['shape3'], ':root {}', { header: '', footer: '' });

      const groups = manager.getAllPageGroups();
      expect(groups.length).toBe(3);
      expect(groups.map((g) => g.groupId)).toEqual(['group1', 'group2', 'group3']);
    });

    it('should return empty array when no groups are registered', () => {
      const groups = manager.getAllPageGroups();
      expect(groups).toEqual([]);
    });
  });

  describe('removePageGroup', () => {
    it('should remove a page group', () => {
      manager.registerPageGroup('group1', ['shape1'], ':root {}', { header: '', footer: '' });
      expect(manager.getPageGroup('group1')).toBeDefined();

      manager.removePageGroup('group1');
      expect(manager.getPageGroup('group1')).toBeUndefined();
    });

    it('should handle removing non-existent group gracefully', () => {
      expect(() => {
        manager.removePageGroup('non-existent');
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty shape IDs array', () => {
      manager.registerPageGroup('group1', [], ':root {}', { header: '', footer: '' });

      const overridesMap = manager.updateSharedTheme('group1', { '--primary': '#ff0000' });
      expect(overridesMap.size).toBe(0);
    });

    it('should handle empty theme changes', () => {
      manager.registerPageGroup('group1', ['shape1'], ':root {}', { header: '', footer: '' });

      const overridesMap = manager.updateSharedTheme('group1', {});
      expect(overridesMap.size).toBe(1);
      expect(overridesMap.get('shape1')?.[0].styles).toEqual({});
    });

    it('should handle empty navigation changes', () => {
      manager.registerPageGroup('group1', ['shape1'], ':root {}', { header: '', footer: '' });

      const overridesMap = manager.updateSharedNavigation('group1', {});
      expect(overridesMap.size).toBe(1);
      expect(overridesMap.get('shape1')?.length).toBe(0);
    });

    it('should handle CSS variables with special characters', () => {
      manager.registerPageGroup(
        'group1',
        ['shape1'],
        ':root { --primary-color: #2563eb; }',
        { header: '', footer: '' }
      );

      manager.updateSharedTheme('group1', { '--primary-color': '#ff0000' });

      const group = manager.getPageGroup('group1');
      expect(group?.sharedTheme).toContain('--primary-color: #ff0000');
    });

    it('should handle multiple :root blocks in theme', () => {
      manager.registerPageGroup(
        'group1',
        ['shape1'],
        ':root { --primary: #2563eb; } :root { --secondary: #10b981; }',
        { header: '', footer: '' }
      );

      manager.updateSharedTheme('group1', { '--primary': '#ff0000' });

      const group = manager.getPageGroup('group1');
      expect(group?.sharedTheme).toContain('--primary: #ff0000');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow: register, map, update theme, update nav', () => {
      const groupId = 'ecommerce-site';
      const shapeIds = ['home-shape', 'products-shape', 'cart-shape'];
      const sharedTheme = ':root { --primary: #2563eb; --bg: #ffffff; }';
      const sharedNavigation = {
        header: '<nav data-shared="header">Nav</nav>',
        footer: '<footer data-shared="footer">Footer</footer>',
      };

      // Register group
      manager.registerPageGroup(groupId, shapeIds, sharedTheme, sharedNavigation);

      // Map pages to shapes
      manager.mapPageToShape(groupId, 'home', 'home-shape');
      manager.mapPageToShape(groupId, 'products', 'products-shape');
      manager.mapPageToShape(groupId, 'cart', 'cart-shape');

      // Update theme
      const themeOverrides = manager.updateSharedTheme(groupId, { '--primary': '#ff0000' });
      expect(themeOverrides.size).toBe(3);

      // Update navigation
      const navOverrides = manager.updateSharedNavigation(groupId, {
        header: '<nav data-shared="header">New Nav</nav>',
      });
      expect(navOverrides.size).toBe(3);

      // Verify group state
      const group = manager.getPageGroup(groupId);
      expect(group?.sharedTheme).toContain('--primary: #ff0000');
      expect(group?.sharedNavigation.header).toBe('<nav data-shared="header">New Nav</nav>');
      expect(group?.pageNameToShapeId.get('home')).toBe('home-shape');
    });

    it('should handle multiple independent page groups', () => {
      // Register two groups
      manager.registerPageGroup('group1', ['shape1', 'shape2'], ':root { --primary: #2563eb; }', {
        header: '<nav>Nav1</nav>',
        footer: '<footer>Footer1</footer>',
      });
      manager.registerPageGroup('group2', ['shape3', 'shape4'], ':root { --primary: #10b981; }', {
        header: '<nav>Nav2</nav>',
        footer: '<footer>Footer2</footer>',
      });

      // Update theme for group1
      manager.updateSharedTheme('group1', { '--primary': '#ff0000' });

      // Verify group1 changed but group2 didn't
      const group1 = manager.getPageGroup('group1');
      const group2 = manager.getPageGroup('group2');
      expect(group1?.sharedTheme).toContain('--primary: #ff0000');
      expect(group2?.sharedTheme).toContain('--primary: #10b981');
    });
  });
});
