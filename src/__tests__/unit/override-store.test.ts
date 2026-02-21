/**
 * Unit tests for OverrideStore
 * Feature: ai-html-visual-editor
 * Requirements: 9.1, 9.2, 9.3
 */

import { OverrideStore } from '../../core/storage/OverrideStore';
import type { ElementOverride } from '../../types';

describe('OverrideStore', () => {
  let store: OverrideStore;

  beforeEach(() => {
    store = new OverrideStore();
  });

  describe('addOverride', () => {
    it('should add a new override to the store', () => {
      const override: ElementOverride = {
        selector: '#button-1',
        text: 'Click Me',
        timestamp: Date.now(),
        aiGenerated: false,
      };

      const result = store.addOverride(override);

      expect(result).toBe(override);
      expect(store.getOverridesBySelector('#button-1')).toHaveLength(1);
      expect(store.getOverridesBySelector('#button-1')[0]).toBe(override);
    });

    it('should add multiple overrides for the same selector', () => {
      const override1: ElementOverride = {
        selector: '#button-1',
        text: 'Click Me',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#button-1',
        styles: { color: 'red' },
        timestamp: 2000,
        aiGenerated: true,
      };

      store.addOverride(override1);
      store.addOverride(override2);

      const overrides = store.getOverridesBySelector('#button-1');
      expect(overrides).toHaveLength(2);
      expect(overrides[0]).toBe(override1);
      expect(overrides[1]).toBe(override2);
    });

    it('should add overrides for different selectors', () => {
      const override1: ElementOverride = {
        selector: '#button-1',
        text: 'Button 1',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#button-2',
        text: 'Button 2',
        timestamp: 2000,
        aiGenerated: false,
      };

      store.addOverride(override1);
      store.addOverride(override2);

      expect(store.getOverridesBySelector('#button-1')).toHaveLength(1);
      expect(store.getOverridesBySelector('#button-2')).toHaveLength(1);
      expect(store.getSelectors()).toHaveLength(2);
    });
  });

  describe('mergeOverrides', () => {
    it('should return undefined for non-existent selector', () => {
      const result = store.mergeOverrides('#non-existent');
      expect(result).toBeUndefined();
    });

    it('should return the single override if only one exists', () => {
      const override: ElementOverride = {
        selector: '#button-1',
        text: 'Click Me',
        timestamp: 1000,
        aiGenerated: false,
      };

      store.addOverride(override);
      const merged = store.mergeOverrides('#button-1');

      expect(merged).toBeDefined();
      expect(merged?.selector).toBe('#button-1');
      expect(merged?.text).toBe('Click Me');
      expect(merged?.timestamp).toBe(1000);
    });

    it('should merge multiple overrides with later ones taking precedence', () => {
      const override1: ElementOverride = {
        selector: '#button-1',
        text: 'First Text',
        styles: { color: 'red', fontSize: '14px' },
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#button-1',
        text: 'Second Text',
        styles: { color: 'blue' },
        timestamp: 2000,
        aiGenerated: true,
      };

      store.addOverride(override1);
      store.addOverride(override2);

      const merged = store.mergeOverrides('#button-1');

      expect(merged).toBeDefined();
      expect(merged?.text).toBe('Second Text'); // Later override wins
      expect(merged?.styles).toEqual({ color: 'blue', fontSize: '14px' }); // Merged styles
      expect(merged?.timestamp).toBe(2000); // Latest timestamp
      expect(merged?.aiGenerated).toBe(true); // True if any was AI-generated
    });

    it('should merge position overrides correctly', () => {
      const override1: ElementOverride = {
        selector: '#element-1',
        position: { x: 10, y: 20 },
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#element-1',
        position: { x: 30, y: 40 },
        timestamp: 2000,
        aiGenerated: false,
      };

      store.addOverride(override1);
      store.addOverride(override2);

      const merged = store.mergeOverrides('#element-1');

      expect(merged?.position).toEqual({ x: 30, y: 40 }); // Later position wins
    });

    it('should merge size overrides correctly', () => {
      const override1: ElementOverride = {
        selector: '#element-1',
        size: { width: 100, height: 50 },
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#element-1',
        size: { width: 200, height: 100 },
        timestamp: 2000,
        aiGenerated: false,
      };

      store.addOverride(override1);
      store.addOverride(override2);

      const merged = store.mergeOverrides('#element-1');

      expect(merged?.size).toEqual({ width: 200, height: 100 }); // Later size wins
    });

    it('should merge attributes correctly', () => {
      const override1: ElementOverride = {
        selector: '#input-1',
        attributes: { placeholder: 'Enter name', type: 'text' },
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#input-1',
        attributes: { placeholder: 'Enter email' },
        timestamp: 2000,
        aiGenerated: false,
      };

      store.addOverride(override1);
      store.addOverride(override2);

      const merged = store.mergeOverrides('#input-1');

      expect(merged?.attributes).toEqual({
        placeholder: 'Enter email', // Later value wins
        type: 'text', // Preserved from first override
      });
    });

    it('should merge html overrides with later ones taking precedence', () => {
      const override1: ElementOverride = {
        selector: '#div-1',
        html: '<span>First</span>',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#div-1',
        html: '<span>Second</span>',
        timestamp: 2000,
        aiGenerated: true,
      };

      store.addOverride(override1);
      store.addOverride(override2);

      const merged = store.mergeOverrides('#div-1');

      expect(merged?.html).toBe('<span>Second</span>');
    });

    it('should preserve original values when merging', () => {
      const override1: ElementOverride = {
        selector: '#button-1',
        text: 'New Text',
        timestamp: 1000,
        aiGenerated: false,
        original: {
          text: 'Original Text',
        },
      };

      const override2: ElementOverride = {
        selector: '#button-1',
        styles: { color: 'red' },
        timestamp: 2000,
        aiGenerated: false,
        original: {
          styles: { color: 'black' },
        },
      };

      store.addOverride(override1);
      store.addOverride(override2);

      const merged = store.mergeOverrides('#button-1');

      expect(merged?.original?.text).toBe('Original Text');
      expect(merged?.original?.styles).toEqual({ color: 'black' });
    });

    it('should handle merging with undefined fields', () => {
      const override1: ElementOverride = {
        selector: '#button-1',
        text: 'Text',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#button-1',
        styles: { color: 'red' },
        timestamp: 2000,
        aiGenerated: false,
      };

      store.addOverride(override1);
      store.addOverride(override2);

      const merged = store.mergeOverrides('#button-1');

      expect(merged?.text).toBe('Text');
      expect(merged?.styles).toEqual({ color: 'red' });
      expect(merged?.html).toBeUndefined();
      expect(merged?.attributes).toBeUndefined();
    });
  });

  describe('getOverridesBySelector', () => {
    it('should return empty array for non-existent selector', () => {
      const result = store.getOverridesBySelector('#non-existent');
      expect(result).toEqual([]);
    });

    it('should return all overrides for a selector', () => {
      const override1: ElementOverride = {
        selector: '#button-1',
        text: 'First',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#button-1',
        text: 'Second',
        timestamp: 2000,
        aiGenerated: false,
      };

      store.addOverride(override1);
      store.addOverride(override2);

      const result = store.getOverridesBySelector('#button-1');
      expect(result).toHaveLength(2);
      expect(result).toContain(override1);
      expect(result).toContain(override2);
    });
  });

  describe('removeOverride', () => {
    it('should return false for non-existent selector', () => {
      const result = store.removeOverride('#non-existent', 1000);
      expect(result).toBe(false);
    });

    it('should return false for non-existent timestamp', () => {
      const override: ElementOverride = {
        selector: '#button-1',
        text: 'Click Me',
        timestamp: 1000,
        aiGenerated: false,
      };

      store.addOverride(override);
      const result = store.removeOverride('#button-1', 2000);

      expect(result).toBe(false);
      expect(store.getOverridesBySelector('#button-1')).toHaveLength(1);
    });

    it('should remove a specific override by timestamp', () => {
      const override1: ElementOverride = {
        selector: '#button-1',
        text: 'First',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#button-1',
        text: 'Second',
        timestamp: 2000,
        aiGenerated: false,
      };

      store.addOverride(override1);
      store.addOverride(override2);

      const result = store.removeOverride('#button-1', 1000);

      expect(result).toBe(true);
      const remaining = store.getOverridesBySelector('#button-1');
      expect(remaining).toHaveLength(1);
      expect(remaining[0]).toBe(override2);
    });

    it('should remove selector from map when last override is removed', () => {
      const override: ElementOverride = {
        selector: '#button-1',
        text: 'Click Me',
        timestamp: 1000,
        aiGenerated: false,
      };

      store.addOverride(override);
      store.removeOverride('#button-1', 1000);

      expect(store.getOverridesBySelector('#button-1')).toEqual([]);
      expect(store.getSelectors()).not.toContain('#button-1');
    });
  });

  describe('getAllOverrides', () => {
    it('should return empty array when no overrides exist', () => {
      const result = store.getAllOverrides();
      expect(result).toEqual([]);
    });

    it('should return all overrides sorted by timestamp', () => {
      const override1: ElementOverride = {
        selector: '#button-1',
        text: 'First',
        timestamp: 3000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#button-2',
        text: 'Second',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override3: ElementOverride = {
        selector: '#button-1',
        text: 'Third',
        timestamp: 2000,
        aiGenerated: false,
      };

      store.addOverride(override1);
      store.addOverride(override2);
      store.addOverride(override3);

      const result = store.getAllOverrides();

      expect(result).toHaveLength(3);
      expect(result[0]).toBe(override2); // timestamp 1000
      expect(result[1]).toBe(override3); // timestamp 2000
      expect(result[2]).toBe(override1); // timestamp 3000
    });
  });

  describe('clearOverrides', () => {
    it('should remove all overrides from the store', () => {
      const override1: ElementOverride = {
        selector: '#button-1',
        text: 'First',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#button-2',
        text: 'Second',
        timestamp: 2000,
        aiGenerated: false,
      };

      store.addOverride(override1);
      store.addOverride(override2);

      expect(store.getOverrideCount()).toBe(2);

      store.clearOverrides();

      expect(store.getOverrideCount()).toBe(0);
      expect(store.getAllOverrides()).toEqual([]);
      expect(store.getSelectors()).toEqual([]);
    });
  });

  describe('getOverrideCount', () => {
    it('should return 0 for empty store', () => {
      expect(store.getOverrideCount()).toBe(0);
    });

    it('should return correct count of overrides', () => {
      const override1: ElementOverride = {
        selector: '#button-1',
        text: 'First',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#button-1',
        text: 'Second',
        timestamp: 2000,
        aiGenerated: false,
      };

      const override3: ElementOverride = {
        selector: '#button-2',
        text: 'Third',
        timestamp: 3000,
        aiGenerated: false,
      };

      store.addOverride(override1);
      expect(store.getOverrideCount()).toBe(1);

      store.addOverride(override2);
      expect(store.getOverrideCount()).toBe(2);

      store.addOverride(override3);
      expect(store.getOverrideCount()).toBe(3);
    });
  });

  describe('getSelectors', () => {
    it('should return empty array for empty store', () => {
      expect(store.getSelectors()).toEqual([]);
    });

    it('should return all unique selectors', () => {
      const override1: ElementOverride = {
        selector: '#button-1',
        text: 'First',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#button-2',
        text: 'Second',
        timestamp: 2000,
        aiGenerated: false,
      };

      const override3: ElementOverride = {
        selector: '#button-1',
        text: 'Third',
        timestamp: 3000,
        aiGenerated: false,
      };

      store.addOverride(override1);
      store.addOverride(override2);
      store.addOverride(override3);

      const selectors = store.getSelectors();
      expect(selectors).toHaveLength(2);
      expect(selectors).toContain('#button-1');
      expect(selectors).toContain('#button-2');
    });
  });

  describe('hasOverrides', () => {
    it('should return false for non-existent selector', () => {
      expect(store.hasOverrides('#non-existent')).toBe(false);
    });

    it('should return true for selector with overrides', () => {
      const override: ElementOverride = {
        selector: '#button-1',
        text: 'Click Me',
        timestamp: 1000,
        aiGenerated: false,
      };

      store.addOverride(override);
      expect(store.hasOverrides('#button-1')).toBe(true);
    });

    it('should return false after all overrides are removed', () => {
      const override: ElementOverride = {
        selector: '#button-1',
        text: 'Click Me',
        timestamp: 1000,
        aiGenerated: false,
      };

      store.addOverride(override);
      store.removeOverride('#button-1', 1000);

      expect(store.hasOverrides('#button-1')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty text override', () => {
      const override: ElementOverride = {
        selector: '#button-1',
        text: '',
        timestamp: 1000,
        aiGenerated: false,
      };

      store.addOverride(override);
      const merged = store.mergeOverrides('#button-1');

      expect(merged?.text).toBe('');
    });

    it('should handle empty styles object', () => {
      const override: ElementOverride = {
        selector: '#button-1',
        styles: {},
        timestamp: 1000,
        aiGenerated: false,
      };

      store.addOverride(override);
      const merged = store.mergeOverrides('#button-1');

      expect(merged?.styles).toEqual({});
    });

    it('should handle complex CSS selectors', () => {
      const complexSelector = 'div.container > ul.list li:nth-child(2) a[href="#"]';
      const override: ElementOverride = {
        selector: complexSelector,
        text: 'Link',
        timestamp: 1000,
        aiGenerated: false,
      };

      store.addOverride(override);
      expect(store.hasOverrides(complexSelector)).toBe(true);
      expect(store.getOverridesBySelector(complexSelector)).toHaveLength(1);
    });

    it('should handle very large timestamp values', () => {
      const override: ElementOverride = {
        selector: '#button-1',
        text: 'Click Me',
        timestamp: Number.MAX_SAFE_INTEGER,
        aiGenerated: false,
      };

      store.addOverride(override);
      const result = store.getAllOverrides();

      expect(result[0].timestamp).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});
