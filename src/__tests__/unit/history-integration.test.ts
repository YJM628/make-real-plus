/**
 * Integration tests for History and SyncEngine
 * Feature: ai-html-visual-editor
 * Requirements: 19.1, 19.2, 19.5
 * 
 * Tests the integration between history and SyncEngine:
 * - History entries are added when overrides are applied
 * - Version restore removes subsequent overrides
 * - History is maintained correctly across operations
 */

import { SyncEngine } from '../../core/sync/SyncEngine';
import type { HtmlParseResult, ElementOverride, ParsedElement } from '../../types';

describe('History Integration with SyncEngine', () => {
  let syncEngine: SyncEngine;
  let mockHtmlParseResult: HtmlParseResult;

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
  });

  describe('History Recording', () => {
    it('should add history entry when override is applied', () => {
      // Requirement 19.1: Visual_Editor should maintain complete modification history
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const override: ElementOverride = {
        selector: '#test',
        text: 'New text',
        timestamp: Date.now(),
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.history).toHaveLength(1);
      expect(syncState?.history[0].override).toBe(override);
      expect(syncState?.history[0].timestamp).toBe(override.timestamp);
    });

    it('should maintain history for multiple overrides', () => {
      // Requirement 19.2: When user opens history panel, Visual_Editor should display all Element_Override in timeline
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const override1: ElementOverride = {
        selector: '#test1',
        text: 'First change',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#test2',
        styles: { color: 'red' },
        timestamp: 2000,
        aiGenerated: true,
      };

      const override3: ElementOverride = {
        selector: '#test3',
        position: { x: 100, y: 200 },
        timestamp: 3000,
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override1);
      syncEngine.applyOverride('shape-1', override2);
      syncEngine.applyOverride('shape-1', override3);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.history).toHaveLength(3);
      expect(syncState?.history[0].override).toBe(override1);
      expect(syncState?.history[1].override).toBe(override2);
      expect(syncState?.history[2].override).toBe(override3);
    });

    it('should preserve AI-generated flag in history', () => {
      // Requirement 19.3: History record should include whether AI-generated
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const aiOverride: ElementOverride = {
        selector: '#test',
        text: 'AI generated text',
        timestamp: Date.now(),
        aiGenerated: true,
      };

      syncEngine.applyOverride('shape-1', aiOverride);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.history[0].override.aiGenerated).toBe(true);
    });

    it('should maintain history order by timestamp', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);

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
        timestamp: 1500,
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override1);
      syncEngine.applyOverride('shape-1', override2);
      syncEngine.applyOverride('shape-1', override3);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.history).toHaveLength(3);
      // History is maintained in the order they were added, not sorted
      expect(syncState?.history[0].timestamp).toBe(1000);
      expect(syncState?.history[1].timestamp).toBe(2000);
      expect(syncState?.history[2].timestamp).toBe(1500);
    });
  });

  describe('Version Restore', () => {
    it('should remove overrides after target timestamp when restoring', () => {
      // Requirement 19.5: When user selects to restore to a history version,
      // Visual_Editor should remove all Element_Override after that version
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const override1: ElementOverride = {
        selector: '#test',
        text: 'Version 1',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#test',
        text: 'Version 2',
        timestamp: 2000,
        aiGenerated: false,
      };

      const override3: ElementOverride = {
        selector: '#test',
        text: 'Version 3',
        timestamp: 3000,
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override1);
      syncEngine.applyOverride('shape-1', override2);
      syncEngine.applyOverride('shape-1', override3);

      // Restore to version 2 (timestamp 2000)
      syncEngine.restoreToVersion('shape-1', 2000);

      const syncState = syncEngine.getSyncState('shape-1');
      
      // Should only have overrides up to timestamp 2000
      expect(syncState?.overrides).toHaveLength(2);
      expect(syncState?.overrides[0].timestamp).toBe(1000);
      expect(syncState?.overrides[1].timestamp).toBe(2000);
      
      // History should also be trimmed
      expect(syncState?.history).toHaveLength(2);
      expect(syncState?.history[0].timestamp).toBe(1000);
      expect(syncState?.history[1].timestamp).toBe(2000);
    });

    it('should keep overrides with exact target timestamp', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const override1: ElementOverride = {
        selector: '#test',
        text: 'Version 1',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#test',
        text: 'Version 2',
        timestamp: 2000,
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override1);
      syncEngine.applyOverride('shape-1', override2);

      // Restore to exact timestamp of override2
      syncEngine.restoreToVersion('shape-1', 2000);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.overrides).toHaveLength(2);
      expect(syncState?.overrides[1].timestamp).toBe(2000);
    });

    it('should restore to initial state when timestamp is before all overrides', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const override1: ElementOverride = {
        selector: '#test',
        text: 'Version 1',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#test',
        text: 'Version 2',
        timestamp: 2000,
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override1);
      syncEngine.applyOverride('shape-1', override2);

      // Restore to timestamp before any overrides
      syncEngine.restoreToVersion('shape-1', 500);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.overrides).toHaveLength(0);
      expect(syncState?.history).toHaveLength(0);
    });

    it('should mark sync as synced after restore', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const override: ElementOverride = {
        selector: '#test',
        text: 'Test',
        timestamp: 1000,
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override);
      
      // Sync should be pending after apply
      let syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.status).toBe('pending');

      // Restore to version
      syncEngine.restoreToVersion('shape-1', 1000);

      // Sync should be synced after restore
      syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.status).toBe('synced');
    });

    it('should reapply remaining overrides to DOM after restore', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const domRoot = document.createElement('div');
      domRoot.innerHTML = '<div id="test">Original</div>';
      syncEngine.setDOMRoot('shape-1', domRoot);

      const override1: ElementOverride = {
        selector: '#test',
        text: 'Version 1',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#test',
        text: 'Version 2',
        timestamp: 2000,
        aiGenerated: false,
      };

      const override3: ElementOverride = {
        selector: '#test',
        text: 'Version 3',
        timestamp: 3000,
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override1);
      syncEngine.applyOverride('shape-1', override2);
      syncEngine.applyOverride('shape-1', override3);

      // Element should have Version 3
      let element = domRoot.querySelector('#test');
      expect(element?.textContent).toBe('Version 3');

      // Restore to Version 1
      syncEngine.restoreToVersion('shape-1', 1000);

      // Element should now have Version 1
      element = domRoot.querySelector('#test');
      expect(element?.textContent).toBe('Version 1');
    });
  });

  describe('History and Override Consistency', () => {
    it('should maintain consistency between overrides and history', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const override1: ElementOverride = {
        selector: '#test1',
        text: 'Text 1',
        timestamp: 1000,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#test2',
        text: 'Text 2',
        timestamp: 2000,
        aiGenerated: true,
      };

      syncEngine.applyOverride('shape-1', override1);
      syncEngine.applyOverride('shape-1', override2);

      const syncState = syncEngine.getSyncState('shape-1');
      
      // Overrides and history should have same length
      expect(syncState?.overrides.length).toBe(syncState?.history.length);
      
      // Each override should have corresponding history entry
      syncState?.overrides.forEach((override, index) => {
        expect(syncState.history[index].override).toBe(override);
        expect(syncState.history[index].timestamp).toBe(override.timestamp);
      });
    });

    it('should maintain consistency after multiple restore operations', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const overrides: ElementOverride[] = [
        { selector: '#test', text: 'V1', timestamp: 1000, aiGenerated: false },
        { selector: '#test', text: 'V2', timestamp: 2000, aiGenerated: false },
        { selector: '#test', text: 'V3', timestamp: 3000, aiGenerated: false },
        { selector: '#test', text: 'V4', timestamp: 4000, aiGenerated: false },
      ];

      overrides.forEach(o => syncEngine.applyOverride('shape-1', o));

      // Restore to V2
      syncEngine.restoreToVersion('shape-1', 2000);
      let syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.overrides.length).toBe(2);
      expect(syncState?.history.length).toBe(2);

      // Add new override
      const newOverride: ElementOverride = {
        selector: '#test',
        text: 'V5',
        timestamp: 5000,
        aiGenerated: false,
      };
      syncEngine.applyOverride('shape-1', newOverride);

      syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.overrides.length).toBe(3);
      expect(syncState?.history.length).toBe(3);
      
      // Verify consistency
      expect(syncState?.overrides[2]).toBe(newOverride);
      expect(syncState?.history[2].override).toBe(newOverride);
    });
  });

  describe('Edge Cases', () => {
    it('should handle restore when no overrides exist', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      // Restore when no overrides have been applied
      expect(() => {
        syncEngine.restoreToVersion('shape-1', 1000);
      }).not.toThrow();

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.overrides).toHaveLength(0);
      expect(syncState?.history).toHaveLength(0);
    });

    it('should handle restore to future timestamp', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const override: ElementOverride = {
        selector: '#test',
        text: 'Test',
        timestamp: 1000,
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override);

      // Restore to future timestamp (should keep all overrides)
      syncEngine.restoreToVersion('shape-1', 9999);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.overrides).toHaveLength(1);
      expect(syncState?.history).toHaveLength(1);
    });

    it('should handle multiple overrides with same timestamp', () => {
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const timestamp = 1000;
      const override1: ElementOverride = {
        selector: '#test1',
        text: 'Test 1',
        timestamp,
        aiGenerated: false,
      };

      const override2: ElementOverride = {
        selector: '#test2',
        text: 'Test 2',
        timestamp,
        aiGenerated: false,
      };

      syncEngine.applyOverride('shape-1', override1);
      syncEngine.applyOverride('shape-1', override2);

      // Restore to that timestamp should keep both
      syncEngine.restoreToVersion('shape-1', timestamp);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.overrides).toHaveLength(2);
      expect(syncState?.history).toHaveLength(2);
    });

    it('should handle restore with invalid shape ID', () => {
      expect(() => {
        syncEngine.restoreToVersion('nonexistent', 1000);
      }).toThrow('Sync state not found for shape: nonexistent');
    });
  });

  describe('Integration with Restore Callbacks', () => {
    it('should support onRestore callback pattern', () => {
      // This test demonstrates how restore callbacks would integrate with SyncEngine
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const overrides: ElementOverride[] = [
        { selector: '#test', text: 'V1', timestamp: 1000, aiGenerated: false },
        { selector: '#test', text: 'V2', timestamp: 2000, aiGenerated: false },
        { selector: '#test', text: 'V3', timestamp: 3000, aiGenerated: false },
      ];

      overrides.forEach(o => syncEngine.applyOverride('shape-1', o));

      // Simulate restore callback
      const handleRestore = (timestamp: number) => {
        syncEngine.restoreToVersion('shape-1', timestamp);
      };

      // User clicks restore on version 2
      handleRestore(2000);

      const syncState = syncEngine.getSyncState('shape-1');
      expect(syncState?.overrides).toHaveLength(2);
      expect(syncState?.history).toHaveLength(2);
    });

    it('should provide history data for display', () => {
      // This test demonstrates how to get history data for display
      syncEngine.initSync('shape-1', mockHtmlParseResult);

      const overrides: ElementOverride[] = [
        { selector: '#header', text: 'Welcome', timestamp: 1000, aiGenerated: false },
        { selector: '#button', styles: { color: 'blue' }, timestamp: 2000, aiGenerated: true },
        { selector: '#content', position: { x: 100, y: 200 }, timestamp: 3000, aiGenerated: false },
      ];

      overrides.forEach(o => syncEngine.applyOverride('shape-1', o));

      // Get history for display
      const syncState = syncEngine.getSyncState('shape-1');
      const history = syncState?.history || [];

      // Verify history has all required data
      expect(history).toHaveLength(3);
      
      history.forEach((entry, index) => {
        expect(entry.timestamp).toBeDefined();
        expect(entry.override).toBeDefined();
        expect(entry.override.selector).toBeDefined();
        expect(entry.override.timestamp).toBeDefined();
        expect(entry.override.aiGenerated).toBeDefined();
      });
    });
  });
});
