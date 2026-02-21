/**
 * Unit tests and property-based tests for useThemeEditor hook
 * Feature: global-theme-editor
 * Requirements: 2.4, 3.3, 4.2, 5.1, 5.3, 6.2
 */

import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useThemeEditor, applyOverridesToShapes } from './useThemeEditor';
import { sharedThemeManager } from '../../../utils/batch/sharedThemeManager';
import type { ElementOverride } from '../../../types';

// --- Mock editor factory ---
function createMockEditor(shapes: Record<string, any> = {}) {
  return {
    getShape: jest.fn((id: string) => shapes[id] ?? undefined),
    updateShape: jest.fn(),
  } as any;
}

// --- Helper: register a test page group ---
function registerTestGroup(
  groupId: string,
  shapeIds: string[],
  sharedTheme: string = ':root {\n  --primary-color: #3b82f6;\n  --font-family: sans-serif;\n  --spacing: 16px;\n}',
  sharedNavigation = { header: '<nav>Header</nav>', footer: '<footer>Footer</footer>' }
) {
  sharedThemeManager.registerPageGroup(groupId, shapeIds, sharedTheme, sharedNavigation);
}

describe('useThemeEditor', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Clean up any existing page groups
    for (const group of sharedThemeManager.getAllPageGroups()) {
      sharedThemeManager.removePageGroup(group.groupId);
    }
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should return empty state when no page groups exist', () => {
      const editor = createMockEditor();
      const { result } = renderHook(() => useThemeEditor(editor));

      expect(result.current.pageGroups).toEqual([]);
      expect(result.current.selectedGroupId).toBeNull();
      expect(result.current.cssVariables).toEqual([]);
      expect(result.current.sharedNavigation).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should auto-select the first page group and parse CSS variables', () => {
      registerTestGroup('group-1', ['shape-a', 'shape-b']);
      const editor = createMockEditor();
      const { result } = renderHook(() => useThemeEditor(editor));

      expect(result.current.pageGroups).toHaveLength(1);
      expect(result.current.selectedGroupId).toBe('group-1');
      expect(result.current.cssVariables).toHaveLength(3);
      expect(result.current.cssVariables[0]).toEqual({
        name: '--primary-color',
        value: '#3b82f6',
        category: 'color',
      });
      expect(result.current.sharedNavigation).toEqual({
        header: '<nav>Header</nav>',
        footer: '<footer>Footer</footer>',
      });
    });
  });

  describe('selectGroup', () => {
    it('should switch to a different page group and reload data (Requirement 4.2)', () => {
      registerTestGroup('group-1', ['shape-a'], ':root {\n  --primary-color: #ff0000;\n}', {
        header: '<nav>H1</nav>',
        footer: '<footer>F1</footer>',
      });
      registerTestGroup('group-2', ['shape-b'], ':root {\n  --bg-color: #00ff00;\n}', {
        header: '<nav>H2</nav>',
        footer: '<footer>F2</footer>',
      });

      const editor = createMockEditor();
      const { result } = renderHook(() => useThemeEditor(editor));

      // Initially selects group-1
      expect(result.current.selectedGroupId).toBe('group-1');
      expect(result.current.cssVariables[0].value).toBe('#ff0000');

      // Switch to group-2
      act(() => {
        result.current.selectGroup('group-2');
      });

      expect(result.current.selectedGroupId).toBe('group-2');
      expect(result.current.cssVariables[0].name).toBe('--bg-color');
      expect(result.current.cssVariables[0].value).toBe('#00ff00');
      expect(result.current.sharedNavigation).toEqual({
        header: '<nav>H2</nav>',
        footer: '<footer>F2</footer>',
      });
      expect(result.current.error).toBeNull();
    });

    it('should set error when selecting an invalid group ID', () => {
      registerTestGroup('group-1', ['shape-a']);
      const editor = createMockEditor();
      const { result } = renderHook(() => useThemeEditor(editor));

      act(() => {
        result.current.selectGroup('nonexistent');
      });

      expect(result.current.error).toBe('页面组不存在');
    });
  });

  describe('updateVariable', () => {
    it('should debounce and apply CSS variable changes (Requirements 2.4, 5.1, 6.2)', () => {
      registerTestGroup('group-1', ['shape-a']);
      const shapes: Record<string, any> = {
        'shape-a': {
          id: 'shape-a',
          type: 'html',
          props: { overrides: [] },
        },
      };
      const editor = createMockEditor(shapes);
      const { result } = renderHook(() => useThemeEditor(editor));

      // Call updateVariable
      act(() => {
        result.current.updateVariable('--primary-color', '#ff0000');
      });

      // Should NOT have called updateShape yet (debounce pending)
      expect(editor.updateShape).not.toHaveBeenCalled();

      // Advance timers past debounce delay
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Now updateShape should have been called
      expect(editor.updateShape).toHaveBeenCalledTimes(1);
      expect(editor.updateShape).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'shape-a',
          type: 'html',
          props: expect.objectContaining({
            overrides: expect.arrayContaining([
              expect.objectContaining({
                selector: ':root',
                styles: { '--primary-color': '#ff0000' },
              }),
            ]),
          }),
        })
      );

      // Local state should be updated
      expect(result.current.cssVariables.find((v) => v.name === '--primary-color')?.value).toBe(
        '#ff0000'
      );
      expect(result.current.error).toBeNull();
    });

    it('should set error when override map is empty (Requirement 5.3)', () => {
      // Register group then remove it to make updateSharedTheme return empty map
      registerTestGroup('group-1', ['shape-a']);
      const editor = createMockEditor();
      const { result } = renderHook(() => useThemeEditor(editor));

      // Remove the group so updateSharedTheme returns empty map
      sharedThemeManager.removePageGroup('group-1');

      act(() => {
        result.current.updateVariable('--primary-color', '#ff0000');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.error).toBe('变更未能应用，请检查页面组是否有效');
    });

    it('should set error when editor is null', () => {
      registerTestGroup('group-1', ['shape-a']);
      const { result } = renderHook(() => useThemeEditor(null));

      act(() => {
        result.current.updateVariable('--primary-color', '#ff0000');
      });

      expect(result.current.error).toBe('编辑器或页面组未就绪');
    });
  });

  describe('updateNavigation', () => {
    it('should debounce and apply navigation changes (Requirements 3.3, 5.1, 6.2)', () => {
      registerTestGroup('group-1', ['shape-a']);
      const shapes: Record<string, any> = {
        'shape-a': {
          id: 'shape-a',
          type: 'html',
          props: { overrides: [] },
        },
      };
      const editor = createMockEditor(shapes);
      const { result } = renderHook(() => useThemeEditor(editor));

      act(() => {
        result.current.updateNavigation({ header: '<nav>New Header</nav>' });
      });

      // Should NOT have called updateShape yet
      expect(editor.updateShape).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Now updateShape should have been called
      expect(editor.updateShape).toHaveBeenCalledTimes(1);
      expect(result.current.sharedNavigation?.header).toBe('<nav>New Header</nav>');
      expect(result.current.error).toBeNull();
    });

    it('should set error when override map is empty for navigation (Requirement 5.3)', () => {
      registerTestGroup('group-1', ['shape-a']);
      const editor = createMockEditor();
      const { result } = renderHook(() => useThemeEditor(editor));

      // Remove the group
      sharedThemeManager.removePageGroup('group-1');

      act(() => {
        result.current.updateNavigation({ footer: '<footer>New</footer>' });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.error).toBe('变更未能应用，请检查页面组是否有效');
    });
  });

  describe('debounce behavior', () => {
    it('should only apply the last value when multiple rapid updates occur (Requirement 6.2)', () => {
      registerTestGroup('group-1', ['shape-a']);
      const shapes: Record<string, any> = {
        'shape-a': {
          id: 'shape-a',
          type: 'html',
          props: { overrides: [] },
        },
      };
      const editor = createMockEditor(shapes);
      const { result } = renderHook(() => useThemeEditor(editor));

      // Rapid-fire updates within 300ms
      act(() => {
        result.current.updateVariable('--primary-color', '#111111');
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      act(() => {
        result.current.updateVariable('--primary-color', '#222222');
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      act(() => {
        result.current.updateVariable('--primary-color', '#333333');
      });

      // Advance past debounce
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should only have been called once with the last value
      expect(editor.updateShape).toHaveBeenCalledTimes(1);
      expect(editor.updateShape).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            overrides: expect.arrayContaining([
              expect.objectContaining({
                styles: { '--primary-color': '#333333' },
              }),
            ]),
          }),
        })
      );
    });
  });
});

describe('applyOverridesToShapes', () => {
  it('should apply overrides to existing shapes', () => {
    const shapes: Record<string, any> = {
      'shape-1': {
        id: 'shape-1',
        type: 'html',
        props: { overrides: [] },
      },
    };
    const editor = createMockEditor(shapes);

    const overridesMap = new Map<string, ElementOverride[]>();
    overridesMap.set('shape-1', [
      {
        selector: ':root',
        styles: { '--color': 'red' },
        timestamp: Date.now(),
        aiGenerated: false,
      },
    ]);

    const result = applyOverridesToShapes(editor, overridesMap);

    expect(result).toBe(true);
    expect(editor.updateShape).toHaveBeenCalledTimes(1);
  });

  it('should return false for empty override map', () => {
    const editor = createMockEditor();
    const overridesMap = new Map<string, ElementOverride[]>();

    const result = applyOverridesToShapes(editor, overridesMap);

    expect(result).toBe(false);
    expect(editor.updateShape).not.toHaveBeenCalled();
  });

  it('should skip missing shapes and continue processing', () => {
    const shapes: Record<string, any> = {
      'shape-2': {
        id: 'shape-2',
        type: 'html',
        props: { overrides: [] },
      },
    };
    const editor = createMockEditor(shapes);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const overridesMap = new Map<string, ElementOverride[]>();
    overridesMap.set('shape-missing', [
      { selector: ':root', styles: {}, timestamp: Date.now(), aiGenerated: false },
    ]);
    overridesMap.set('shape-2', [
      { selector: ':root', styles: { '--x': '1' }, timestamp: Date.now(), aiGenerated: false },
    ]);

    const result = applyOverridesToShapes(editor, overridesMap);

    expect(result).toBe(true);
    expect(editor.updateShape).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('shape-missing')
    );

    warnSpy.mockRestore();
  });

  it('should merge overrides with existing ones by selector', () => {
    const existingOverride: ElementOverride = {
      selector: ':root',
      styles: { '--old': 'value' },
      timestamp: 1000,
      aiGenerated: false,
    };
    const shapes: Record<string, any> = {
      'shape-1': {
        id: 'shape-1',
        type: 'html',
        props: { overrides: [existingOverride] },
      },
    };
    const editor = createMockEditor(shapes);

    const newOverride: ElementOverride = {
      selector: ':root',
      styles: { '--new': 'value' },
      timestamp: 2000,
      aiGenerated: false,
    };
    const overridesMap = new Map<string, ElementOverride[]>();
    overridesMap.set('shape-1', [newOverride]);

    applyOverridesToShapes(editor, overridesMap);

    // The :root override should be replaced (same selector)
    const updateCall = editor.updateShape.mock.calls[0][0];
    expect(updateCall.props.overrides).toHaveLength(1);
    expect(updateCall.props.overrides[0]).toEqual(newOverride);
  });
});


// ============================================================
// Property-Based Tests (fast-check)
// Feature: global-theme-editor
// ============================================================

describe('Property-Based Tests', () => {
  beforeEach(() => {
    // Clean up any existing page groups
    for (const group of sharedThemeManager.getAllPageGroups()) {
      sharedThemeManager.removePageGroup(group.groupId);
    }
  });

  // --- Generators ---

  /**
   * Generator for a valid shape ID (alphanumeric with hyphens).
   */
  const shapeIdArb = fc
    .tuple(
      fc.stringMatching(/^[a-z][a-z0-9]{2,8}$/),
      fc.integer({ min: 1, max: 999 })
    )
    .map(([prefix, num]) => `shape-${prefix}-${num}`);

  /**
   * Generator for an array of unique shape IDs (1 to 10 shapes).
   */
  const uniqueShapeIdsArb = fc
    .uniqueArray(shapeIdArb, { minLength: 1, maxLength: 10 })
    .filter((ids) => ids.length > 0);

  /**
   * Generator for a valid group ID.
   */
  const groupIdArb = fc
    .stringMatching(/^[a-z][a-z0-9]{2,8}$/)
    .map((s) => `group-${s}`);

  /**
   * Generator for a CSS variable name.
   */
  const cssVarNameArb = fc
    .stringMatching(/^[a-z][a-z0-9]{1,8}$/)
    .map((s) => `--${s}`);

  /**
   * Generator for a CSS variable value (simple safe values).
   */
  const cssVarValueArb = fc.oneof(
    fc.stringMatching(/^#[0-9a-f]{6}$/),
    fc.stringMatching(/^[0-9]{1,3}px$/),
    fc.constant('sans-serif'),
    fc.constant('16px'),
    fc.constant('#ff0000')
  );

  /**
   * Generator for theme changes (Record<string, string>).
   */
  const themeChangesArb = fc
    .tuple(cssVarNameArb, cssVarValueArb)
    .map(([name, value]) => ({ [name]: value }));

  /**
   * Generator for navigation changes.
   */
  const navChangesArb = fc.oneof(
    fc.record({
      header: fc.stringMatching(/^<nav>[a-zA-Z0-9 ]{1,20}<\/nav>$/),
    }),
    fc.record({
      footer: fc.stringMatching(/^<footer>[a-zA-Z0-9 ]{1,20}<\/footer>$/),
    }),
    fc.record({
      header: fc.stringMatching(/^<nav>[a-zA-Z0-9 ]{1,20}<\/nav>$/),
      footer: fc.stringMatching(/^<footer>[a-zA-Z0-9 ]{1,20}<\/footer>$/),
    })
  );

  // Feature: global-theme-editor, Property 3: 主题/导航更新覆盖所有组内页面
  // **Validates: Requirements 2.4, 3.3**
  describe('Property 3: Theme/navigation updates cover all pages in group', () => {
    it('updateSharedTheme should return overrides for ALL shapeIds in the group', () => {
      fc.assert(
        fc.property(
          groupIdArb,
          uniqueShapeIdsArb,
          themeChangesArb,
          (groupId, shapeIds, themeChanges) => {
            // Setup: register a page group
            sharedThemeManager.registerPageGroup(
              groupId,
              shapeIds,
              ':root { --placeholder: 0; }',
              { header: '<nav>H</nav>', footer: '<footer>F</footer>' }
            );

            try {
              // Act: call updateSharedTheme
              const overridesMap = sharedThemeManager.updateSharedTheme(
                groupId,
                themeChanges
              );

              // Assert: the override map should contain entries for ALL N shapeIds
              expect(overridesMap.size).toBe(shapeIds.length);
              for (const shapeId of shapeIds) {
                expect(overridesMap.has(shapeId)).toBe(true);
                const overrides = overridesMap.get(shapeId)!;
                expect(overrides.length).toBeGreaterThan(0);
              }
            } finally {
              // Cleanup
              sharedThemeManager.removePageGroup(groupId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('updateSharedNavigation should return overrides for ALL shapeIds in the group', () => {
      fc.assert(
        fc.property(
          groupIdArb,
          uniqueShapeIdsArb,
          navChangesArb,
          (groupId, shapeIds, navChanges) => {
            // Setup: register a page group
            sharedThemeManager.registerPageGroup(
              groupId,
              shapeIds,
              ':root { --placeholder: 0; }',
              { header: '<nav>H</nav>', footer: '<footer>F</footer>' }
            );

            try {
              // Act: call updateSharedNavigation
              const overridesMap = sharedThemeManager.updateSharedNavigation(
                groupId,
                navChanges
              );

              // Assert: the override map should contain entries for ALL N shapeIds
              expect(overridesMap.size).toBe(shapeIds.length);
              for (const shapeId of shapeIds) {
                expect(overridesMap.has(shapeId)).toBe(true);
                const overrides = overridesMap.get(shapeId)!;
                expect(overrides.length).toBeGreaterThan(0);
              }
            } finally {
              // Cleanup
              sharedThemeManager.removePageGroup(groupId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: global-theme-editor, Property 4: Override 应用完整性
  // **Validates: Requirements 5.1**
  describe('Property 4: Override application completeness', () => {
    it('after applyOverridesToShapes, each shape should contain the newly written Override entries', () => {
      fc.assert(
        fc.property(
          uniqueShapeIdsArb,
          cssVarNameArb,
          cssVarValueArb,
          (shapeIds, varName, varValue) => {
            // Setup: create mock shapes with empty overrides
            const shapes: Record<string, any> = {};
            for (const id of shapeIds) {
              shapes[id] = {
                id,
                type: 'html',
                props: { overrides: [] },
              };
            }

            const editor = {
              getShape: jest.fn((id: string) => shapes[id] ?? undefined),
              updateShape: jest.fn((update: any) => {
                // Simulate tldraw persisting the update
                if (shapes[update.id]) {
                  shapes[update.id] = {
                    ...shapes[update.id],
                    props: { ...shapes[update.id].props, ...update.props },
                  };
                }
              }),
            } as any;

            // Build an override map covering all shapes
            const overridesMap = new Map<string, ElementOverride[]>();
            const timestamp = Date.now();
            for (const id of shapeIds) {
              overridesMap.set(id, [
                {
                  selector: ':root',
                  styles: { [varName]: varValue },
                  timestamp,
                  aiGenerated: false,
                },
              ]);
            }

            // Act: apply overrides
            const result = applyOverridesToShapes(editor, overridesMap);

            // Assert: function returned true
            expect(result).toBe(true);

            // Assert: updateShape was called for each shape
            expect(editor.updateShape).toHaveBeenCalledTimes(shapeIds.length);

            // Assert: each shape now contains the new override entries
            for (const id of shapeIds) {
              const updatedShape = shapes[id];
              const overrides: ElementOverride[] = updatedShape.props.overrides;
              // Should contain at least one override with the :root selector
              const rootOverride = overrides.find(
                (o: ElementOverride) => o.selector === ':root'
              );
              expect(rootOverride).toBeDefined();
              expect(rootOverride!.styles).toEqual(
                expect.objectContaining({ [varName]: varValue })
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: global-theme-editor, Property 5: 防抖合并快速输入
  // **Validates: Requirements 6.2**
  describe('Property 5: Debounce merges rapid inputs', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('for N consecutive input changes (N >= 2) within 300ms, updateSharedTheme should be called only once with the last value', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.array(cssVarValueArb, { minLength: 2, maxLength: 10 }),
          (n, values) => {
            // Ensure we have exactly n values
            const inputValues = values.slice(0, Math.max(n, values.length));
            const actualN = inputValues.length;
            if (actualN < 2) return; // Skip if not enough values

            // Clean up page groups
            for (const group of sharedThemeManager.getAllPageGroups()) {
              sharedThemeManager.removePageGroup(group.groupId);
            }

            // Setup: register a page group with one shape
            const groupId = 'debounce-test-group';
            const shapeId = 'debounce-shape';
            sharedThemeManager.registerPageGroup(
              groupId,
              [shapeId],
              ':root { --test-var: initial; }',
              { header: '<nav>H</nav>', footer: '<footer>F</footer>' }
            );

            const shapes: Record<string, any> = {
              [shapeId]: {
                id: shapeId,
                type: 'html',
                props: { overrides: [] },
              },
            };
            const editor = {
              getShape: jest.fn((id: string) => shapes[id] ?? undefined),
              updateShape: jest.fn(),
            } as any;

            // Spy on sharedThemeManager.updateSharedTheme
            const updateSpy = jest.spyOn(
              sharedThemeManager,
              'updateSharedTheme'
            );

            try {
              const { result } = renderHook(() => useThemeEditor(editor));

              // Fire N rapid updates within 300ms (each spaced < 300ms apart)
              const intervalBetween = Math.floor(250 / actualN);
              for (let i = 0; i < actualN; i++) {
                act(() => {
                  result.current.updateVariable('--test-var', inputValues[i]);
                });
                if (i < actualN - 1) {
                  act(() => {
                    jest.advanceTimersByTime(intervalBetween);
                  });
                }
              }

              // At this point, no updateSharedTheme call should have happened yet
              // (all within debounce window)
              expect(updateSpy).not.toHaveBeenCalled();

              // Advance past the debounce delay
              act(() => {
                jest.advanceTimersByTime(300);
              });

              // Assert: updateSharedTheme should be called exactly once
              expect(updateSpy).toHaveBeenCalledTimes(1);

              // Assert: it should be called with the LAST input value
              const lastValue = inputValues[actualN - 1];
              expect(updateSpy).toHaveBeenCalledWith(groupId, {
                '--test-var': lastValue,
              });
            } finally {
              updateSpy.mockRestore();
              sharedThemeManager.removePageGroup(groupId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================
// Additional Unit Tests
// Feature: global-theme-editor
// ============================================================

describe('useThemeEditor - additional unit tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    for (const group of sharedThemeManager.getAllPageGroups()) {
      sharedThemeManager.removePageGroup(group.groupId);
    }
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('empty page group list', () => {
    it('should have null selectedGroupId when no groups exist', () => {
      const editor = createMockEditor();
      const { result } = renderHook(() => useThemeEditor(editor));

      expect(result.current.pageGroups).toEqual([]);
      expect(result.current.selectedGroupId).toBeNull();
      expect(result.current.cssVariables).toEqual([]);
      expect(result.current.sharedNavigation).toBeNull();
    });

    it('should set error when calling updateVariable with no groups', () => {
      const editor = createMockEditor();
      const { result } = renderHook(() => useThemeEditor(editor));

      act(() => {
        result.current.updateVariable('--color', '#fff');
      });

      // selectedGroupId is null, so error should be set immediately
      expect(result.current.error).toBe('编辑器或页面组未就绪');
    });

    it('should set error when calling updateNavigation with no groups', () => {
      const editor = createMockEditor();
      const { result } = renderHook(() => useThemeEditor(editor));

      act(() => {
        result.current.updateNavigation({ header: '<nav>New</nav>' });
      });

      expect(result.current.error).toBe('编辑器或页面组未就绪');
    });
  });

  describe('switching page groups', () => {
    it('should clear error when switching to a valid group after an error', () => {
      registerTestGroup('group-1', ['shape-a']);
      registerTestGroup('group-2', ['shape-b']);
      const editor = createMockEditor();
      const { result } = renderHook(() => useThemeEditor(editor));

      // Trigger an error by selecting invalid group
      act(() => {
        result.current.selectGroup('nonexistent');
      });
      expect(result.current.error).toBe('页面组不存在');

      // Switch to valid group should clear error
      act(() => {
        result.current.selectGroup('group-2');
      });
      expect(result.current.error).toBeNull();
      expect(result.current.selectedGroupId).toBe('group-2');
    });

    it('should update cssVariables and navigation when switching groups', () => {
      registerTestGroup(
        'group-a',
        ['s1'],
        ':root { --color-a: #aaa; }',
        { header: '<nav>A</nav>', footer: '<footer>A</footer>' }
      );
      registerTestGroup(
        'group-b',
        ['s2'],
        ':root { --color-b: #bbb; }',
        { header: '<nav>B</nav>', footer: '<footer>B</footer>' }
      );

      const editor = createMockEditor();
      const { result } = renderHook(() => useThemeEditor(editor));

      // Initially group-a
      expect(result.current.cssVariables[0].name).toBe('--color-a');
      expect(result.current.sharedNavigation?.header).toBe('<nav>A</nav>');

      // Switch to group-b
      act(() => {
        result.current.selectGroup('group-b');
      });

      expect(result.current.cssVariables[0].name).toBe('--color-b');
      expect(result.current.sharedNavigation?.header).toBe('<nav>B</nav>');
      expect(result.current.sharedNavigation?.footer).toBe('<footer>B</footer>');
    });
  });

  describe('invalid groupId', () => {
    it('should set error when selectGroup is called with invalid groupId', () => {
      registerTestGroup('group-1', ['shape-a']);
      const editor = createMockEditor();
      const { result } = renderHook(() => useThemeEditor(editor));

      act(() => {
        result.current.selectGroup('does-not-exist');
      });

      expect(result.current.error).toBe('页面组不存在');
      // selectedGroupId should remain unchanged
      expect(result.current.selectedGroupId).toBe('group-1');
    });

    it('should set error when updateVariable targets a removed group', () => {
      registerTestGroup('group-1', ['shape-a']);
      const shapes: Record<string, any> = {
        'shape-a': { id: 'shape-a', type: 'html', props: { overrides: [] } },
      };
      const editor = createMockEditor(shapes);
      const { result } = renderHook(() => useThemeEditor(editor));

      // Remove the group after hook initialization
      sharedThemeManager.removePageGroup('group-1');

      act(() => {
        result.current.updateVariable('--color', '#000');
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.error).toBe('变更未能应用，请检查页面组是否有效');
    });
  });
});
