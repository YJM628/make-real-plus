/**
 * Unit tests for SyncEngine
 * Feature: ai-html-visual-editor
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 19.1, 19.5
 */

import { SyncEngine } from '../../core/sync/SyncEngine';
import type { HtmlParseResult, ElementOverride, HtmlShapeProps, ParsedElement } from '../../types';

describe('SyncEngine', () => {
  let syncEngine: SyncEngine;
  let mockHtmlParseResult: HtmlParseResult;
  let mockShapeProps: HtmlShapeProps;

  beforeEach(() => {
    syncEngine = new SyncEngine();

    // Create mock parsed HTML
    const mockRootElement: ParsedElement = {
      identifier: 'root-1',
      tagName: 'DIV',
      attributes: { id: 'root' },
      inlineStyles: {},
      selector: '#root',
      textContent: '',
      children: [],
    };

    mockHtmlParseResult = {
      root: mockRootElement,
      elementMap: new Map([['root-1', mockRootElement]]),
      styles: '',
      scripts: '',
      externalResources: {
        stylesheets: [],
        scripts: [],
        images: [],
      },
    };

    // Create mock shape props
    mockShapeProps = {
      id: 'shape-1',
      type: 'html',
      x: 100,
      y: 200,
      width: 400,
      height: 300,
      props: {
        html: '<div id="root">Test</div>',
        css: '',
        js: '',
        mode: 'edit',
        overrides: [],
      },
    };
  });

  describe('initSync', () => {
    it('should initialize sync state for a new shape', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState).toBeDefined();
      expect(syncState?.shapeId).toBe('shape-1');
      expect(syncState?.originalHtml).toBe(mockHtmlParseResult);
      expect(syncState?.overrides).toEqual([]);
      expect(syncState?.status).toBe('synced');
      expect(syncState?.history).toEqual([]);
    });

    it('should set lastSync timestamp', () => {
      const beforeTime = Date.now();
      syncEngine.initSync('shape-1', mockHtmlParseResult);
      const afterTime = Date.now();

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.lastSync).toBeGreaterThanOrEqual(beforeTime);
      expect(syncState?.lastSync).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('applyOverride', () => {
    beforeEach(() => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);
    });

    it('should add override to sync state', () => {
      const override: ElementOverride = {
        selector: '#root',
        text: 'New text',
        timestamp: Date.now(),
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.overrides).toHaveLength(1);
      expect(syncState?.overrides[0]).toBe(override);
    });

    it('should add override to history', () => {
      const override: ElementOverride = {
        selector: '#root',
        text: 'New text',
        timestamp: Date.now(),
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.history).toHaveLength(1);
      expect(syncState?.history[0].override).toBe(override);
    });

    it('should mark sync as pending', () => {
      const override: ElementOverride = {
        selector: '#root',
        text: 'New text',
        timestamp: Date.now(),
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.status).toBe('pending');
    });

    it('should throw error if shape not found', () => {
      const override: ElementOverride = {
        selector: '#root',
        text: 'New text',
        timestamp: Date.now(),
        aiGenerated: false,
      };

      expect(() => {
        syncEngine.applyOverride('nonexistent', override);
      }).toThrow('Sync state not found for shape: nonexistent');
    });

    it('should apply text override to DOM if domRoot exists', () => {
      const domRoot = document.createElement('div');
      domRoot.innerHTML = '<div id="test">Original</div>';
      syncEngine.setDOMRoot('shape-1', domRoot);

      const override: ElementOverride = {
        selector: '#test',
        text: 'New text',
        timestamp: Date.now(),
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override);

      const element = domRoot.querySelector('#test');
      expect(element?.textContent).toBe('New text');
    });

    it('should apply style overrides to DOM if domRoot exists', () => {
      const domRoot = document.createElement('div');
      domRoot.innerHTML = '<div id="test">Test</div>';
      syncEngine.setDOMRoot('shape-1', domRoot);

      const override: ElementOverride = {
        selector: '#test',
        styles: {
          color: 'red',
          'font-size': '16px',
        },
        timestamp: Date.now(),
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override);

      const element = domRoot.querySelector('#test') as HTMLElement;
      expect(element?.style.color).toBe('red');
      expect(element?.style.fontSize).toBe('16px');
    });

    it('should apply position override to DOM', () => {
      const domRoot = document.createElement('div');
      domRoot.innerHTML = '<div id="test">Test</div>';
      syncEngine.setDOMRoot('shape-1', domRoot);

      const override: ElementOverride = {
        selector: '#test',
        position: { x: 50, y: 100 },
        timestamp: Date.now(),
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override);

      const element = domRoot.querySelector('#test') as HTMLElement;
      expect(element?.style.position).toBe('absolute');
      expect(element?.style.left).toBe('50px');
      expect(element?.style.top).toBe('100px');
    });

    it('should apply size override to DOM', () => {
      const domRoot = document.createElement('div');
      domRoot.innerHTML = '<div id="test">Test</div>';
      syncEngine.setDOMRoot('shape-1', domRoot);

      const override: ElementOverride = {
        selector: '#test',
        size: { width: 200, height: 150 },
        timestamp: Date.now(),
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override);

      const element = domRoot.querySelector('#test') as HTMLElement;
      expect(element?.style.width).toBe('200px');
      expect(element?.style.height).toBe('150px');
    });
  });

  describe('syncShapeToDOM', () => {
    beforeEach(() => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);
    });

    it('should update shape reference', () => {
      syncEngine.syncShapeToDOM('shape-1', mockShapeProps);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.shapeRef).toBe(mockShapeProps);
    });

    it('should update DOM container position and size if domRoot exists', () => {
      const domRoot = document.createElement('div');
      syncEngine.setDOMRoot('shape-1', domRoot);

      syncEngine.syncShapeToDOM('shape-1', mockShapeProps);

      expect(domRoot.style.position).toBe('absolute');
      expect(domRoot.style.left).toBe('100px');
      expect(domRoot.style.top).toBe('200px');
      expect(domRoot.style.width).toBe('400px');
      expect(domRoot.style.height).toBe('300px');
    });

    it('should mark sync as pending', () => {
      syncEngine.syncShapeToDOM('shape-1', mockShapeProps);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.status).toBe('pending');
    });

    it('should throw error if shape not found', () => {
      expect(() => {
        syncEngine.syncShapeToDOM('nonexistent', mockShapeProps);
      }).toThrow('Sync state not found for shape: nonexistent');
    });
  });

  describe('syncDOMToShape', () => {
    beforeEach(() => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);
    });

    it('should create override from DOM element state', () => {
      const domRoot = document.createElement('div');
      domRoot.innerHTML = '<div id="test">Test content</div>';
      syncEngine.setDOMRoot('shape-1', domRoot);

      const shapeProps = { ...mockShapeProps };
      syncEngine.syncShapeToDOM('shape-1', shapeProps);

      const element = domRoot.querySelector('#test') as HTMLElement;
      element.style.color = 'blue';

      syncEngine.syncDOMToShape('shape-1', element);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.overrides.length).toBeGreaterThan(0);
      
      const lastOverride = syncState?.overrides[syncState.overrides.length - 1];
      expect(lastOverride?.selector).toBe('#test');
      expect(lastOverride?.styles?.color).toBe('blue');
    });

    it('should throw error if shape not found', () => {
      const element = document.createElement('div');
      
      expect(() => {
        syncEngine.syncDOMToShape('nonexistent', element);
      }).toThrow('Sync state or shape reference not found for shape: nonexistent');
    });
  });

  describe('validateSync', () => {
    beforeEach(() => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);
    });

    it('should return true if no shape reference or DOM root', () => {
      expect(syncEngine.validateSync('shape-1')).toBe(true);
    });

    it('should return true if shape and DOM are in sync', () => {
      const domRoot = document.createElement('div');
      domRoot.style.position = 'absolute';
      domRoot.style.left = '100px';
      domRoot.style.top = '200px';
      domRoot.style.width = '400px';
      domRoot.style.height = '300px';

      syncEngine.setDOMRoot('shape-1', domRoot);
      syncEngine.syncShapeToDOM('shape-1', mockShapeProps);

      expect(syncEngine.validateSync('shape-1')).toBe(true);
    });

    it('should return false if position is out of sync', () => {
      const domRoot = document.createElement('div');
      domRoot.style.position = 'absolute';
      domRoot.style.left = '110px'; // Different from shape x: 100 (within tolerance)
      domRoot.style.top = '200px';
      domRoot.style.width = '400px';
      domRoot.style.height = '300px';

      syncEngine.setDOMRoot('shape-1', domRoot);
      syncEngine.syncShapeToDOM('shape-1', mockShapeProps);

      // Manually set DOM to be out of sync
      domRoot.style.left = '150px'; // Now out of tolerance

      expect(syncEngine.validateSync('shape-1')).toBe(false);
    });

    it('should return false if size is out of sync', () => {
      const domRoot = document.createElement('div');
      domRoot.style.position = 'absolute';
      domRoot.style.left = '100px';
      domRoot.style.top = '200px';
      domRoot.style.width = '400px';
      domRoot.style.height = '300px';

      syncEngine.setDOMRoot('shape-1', domRoot);
      syncEngine.syncShapeToDOM('shape-1', mockShapeProps);

      // Manually set DOM to be out of sync
      domRoot.style.width = '500px'; // Now out of tolerance

      expect(syncEngine.validateSync('shape-1')).toBe(false);
    });

    it('should return false if shape not found', () => {
      expect(syncEngine.validateSync('nonexistent')).toBe(false);
    });
  });

  describe('recoverSync', () => {
    beforeEach(() => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);
    });

    it('should reapply all overrides to DOM', () => {
      const domRoot = document.createElement('div');
      domRoot.innerHTML = '<div id="test">Original</div>';
      syncEngine.setDOMRoot('shape-1', domRoot);
      syncEngine.syncShapeToDOM('shape-1', mockShapeProps);

      const override: ElementOverride = {
        selector: '#test',
        text: 'New text',
        timestamp: Date.now(),
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override);

      // Manually corrupt the DOM
      const element = domRoot.querySelector('#test');
      if (element) element.textContent = 'Corrupted';

      // Recover sync
      syncEngine.recoverSync('shape-1');

      // Check that override was reapplied
      expect(element?.textContent).toBe('New text');
    });

    it('should mark sync as synced after recovery', () => {
      syncEngine.syncShapeToDOM('shape-1', mockShapeProps);
      
      const syncState = syncEngine.getSyncState('shape-1');
      if (syncState) syncState.status = 'error';

      syncEngine.recoverSync('shape-1');

      expect(syncState?.status).toBe('synced');
    });

    it('should handle missing shape gracefully', () => {
      // Should not throw
      expect(() => {
        syncEngine.recoverSync('nonexistent');
      }).not.toThrow();
    });
  });

  describe('addHistoryEntry', () => {
    beforeEach(() => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);
    });

    it('should add entry to history', () => {
      const override: ElementOverride = {
        selector: '#test',
        text: 'Test',
        timestamp: Date.now(),
        aiGenerated: false,
      };

      syncEngine.addHistoryEntry('shape-1', override);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.history).toHaveLength(1);
      expect(syncState?.history[0].override).toBe(override);
      expect(syncState?.history[0].timestamp).toBe(override.timestamp);
    });

    it('should throw error if shape not found', () => {
      const override: ElementOverride = {
        selector: '#test',
        text: 'Test',
        timestamp: Date.now(),
        aiGenerated: false,
      };

      expect(() => {
        syncEngine.addHistoryEntry('nonexistent', override);
      }).toThrow('Sync state not found for shape: nonexistent');
    });
  });

  describe('restoreToVersion', () => {
    beforeEach(() => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);
    });

    it('should remove overrides after target timestamp', () => {
      const override1: ElementOverride = {
        selector: '#test',
        text: 'First',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#test',
        text: 'Second',
        timestamp: 2000,
        aiGenerated: false,
      };

      const override3: ElementOverride = {
        selector: '#test',
        text: 'Third',
        timestamp: 3000,
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override1);
      syncEngine.applyOverride('shape-1', override2);
      syncEngine.applyOverride('shape-1', override3);

      // Restore to timestamp 2000
      syncEngine.restoreToVersion('shape-1', 2000);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.overrides).toHaveLength(2);
      expect(syncState?.overrides[0].timestamp).toBe(1000);
      expect(syncState?.overrides[1].timestamp).toBe(2000);
    });

    it('should remove history entries after target timestamp', () => {
      const override1: ElementOverride = {
        selector: '#test',
        text: 'First',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#test',
        text: 'Second',
        timestamp: 2000,
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override1);
      syncEngine.applyOverride('shape-1', override2);

      syncEngine.restoreToVersion('shape-1', 1000);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.history).toHaveLength(1);
      expect(syncState?.history[0].timestamp).toBe(1000);
    });

    it('should mark sync as synced', () => {
      const override: ElementOverride = {
        selector: '#test',
        text: 'Test',
        timestamp: 1000,
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override);
      syncEngine.restoreToVersion('shape-1', 1000);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.status).toBe('synced');
    });

    it('should throw error if shape not found', () => {
      expect(() => {
        syncEngine.restoreToVersion('nonexistent', 1000);
      }).toThrow('Sync state not found for shape: nonexistent');
    });
  });

  describe('setDOMRoot', () => {
    beforeEach(() => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);
    });

    it('should set DOM root in sync state', () => {
      const domRoot = document.createElement('div');
      syncEngine.setDOMRoot('shape-1', domRoot);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.domRoot).toBe(domRoot);
    });

    it('should apply existing overrides to new DOM root', () => {
      const override: ElementOverride = {
        selector: '#test',
        text: 'Test text',
        timestamp: Date.now(),
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override);

      const domRoot = document.createElement('div');
      domRoot.innerHTML = '<div id="test">Original</div>';
      syncEngine.setDOMRoot('shape-1', domRoot);

      const element = domRoot.querySelector('#test');
      expect(element?.textContent).toBe('Test text');
    });

    it('should throw error if shape not found', () => {
      const domRoot = document.createElement('div');
      
      expect(() => {
        syncEngine.setDOMRoot('nonexistent', domRoot);
      }).toThrow('Sync state not found for shape: nonexistent');
    });
  });

  describe('removeSync', () => {
    it('should remove sync state', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);
      expect(syncEngine.getSyncState('shape-1')).toBeDefined();

      syncEngine.removeSync('shape-1');
      expect(syncEngine.getSyncState('shape-1')).toBeUndefined();
    });
  });

  describe('getAllSyncStates', () => {
    it('should return all sync states', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);
      syncEngine.initSync('shape-2', mockHtmlParseResult);

      const allStates = syncEngine.getAllSyncStates();
      expect(allStates.size).toBe(2);
      expect(allStates.has('shape-1')).toBe(true);
      expect(allStates.has('shape-2')).toBe(true);
    });
  });

  describe('clearAllSyncStates', () => {
    it('should clear all sync states', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);
      syncEngine.initSync('shape-2', mockHtmlParseResult);

      syncEngine.clearAllSyncStates();

      const allStates = syncEngine.getAllSyncStates();
      expect(allStates.size).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple overrides for same element', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const override1: ElementOverride = {
        selector: '#test',
        text: 'First',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#test',
        styles: { color: 'red' },
        timestamp: 2000,
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override1);
      syncEngine.applyOverride('shape-1', override2);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.overrides).toHaveLength(2);
    });

    it('should handle empty selector gracefully', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);
      const domRoot = document.createElement('div');
      syncEngine.setDOMRoot('shape-1', domRoot);

      const override: ElementOverride = {
        selector: '#nonexistent',
        text: 'Test',
        timestamp: Date.now(),
        aiGenerated: false,
      };

      // Should not throw, just log warning
      expect(() => {
        syncEngine.applyOverride('shape-1', override);
      }).not.toThrow();
    });

    it('should handle HTML override', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);
      const domRoot = document.createElement('div');
      domRoot.innerHTML = '<div id="test">Original</div>';
      syncEngine.setDOMRoot('shape-1', domRoot);

      const override: ElementOverride = {
        selector: '#test',
        html: '<span>New HTML</span>',
        timestamp: Date.now(),
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override);

      const element = domRoot.querySelector('#test');
      expect(element?.innerHTML).toBe('<span>New HTML</span>');
    });

    it('should handle attribute overrides', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);
      const domRoot = document.createElement('div');
      domRoot.innerHTML = '<div id="test">Test</div>';
      syncEngine.setDOMRoot('shape-1', domRoot);

      const override: ElementOverride = {
        selector: '#test',
        attributes: {
          'data-custom': 'value',
          'aria-label': 'Test label',
        },
        timestamp: Date.now(),
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override);

      const element = domRoot.querySelector('#test');
      expect(element?.getAttribute('data-custom')).toBe('value');
      expect(element?.getAttribute('aria-label')).toBe('Test label');
    });
  });
});
