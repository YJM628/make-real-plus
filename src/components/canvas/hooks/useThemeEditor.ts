/**
 * useThemeEditor Hook
 * Feature: global-theme-editor
 * Requirements: 2.4, 3.3, 4.2, 5.1, 5.3, 6.2
 *
 * Manages global theme editing state and operations:
 * - Fetches page groups from SharedThemeManager
 * - Manages selected page group state
 * - Provides CSS variable and navigation editing with override application
 * - Text input uses 300ms debounce
 * - Error handling for empty override maps
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Editor } from 'tldraw';
import { sharedThemeManager } from '../../../utils/batch/sharedThemeManager';
import { collectPagesFromCanvas } from '../../../utils/batch/collectPages';
import { parseCssVariables } from '../../../utils/theme/parseCssVariables';
import type { CssVariable } from '../../../utils/theme/parseCssVariables';
import type { PageGroup, ElementOverride } from '../../../types';

/**
 * Return type for useThemeEditor hook
 */
export interface UseThemeEditorReturn {
  /** All available page groups */
  pageGroups: PageGroup[];
  /** Currently selected page group ID */
  selectedGroupId: string | null;
  /** Parsed CSS variables from the selected group's shared theme */
  cssVariables: CssVariable[];
  /** Shared navigation (header/footer) from the selected group */
  sharedNavigation: { header: string; footer: string } | null;
  /** Switch to a different page group */
  selectGroup: (groupId: string) => void;
  /** Update a single CSS variable value */
  updateVariable: (name: string, value: string) => void;
  /** Update shared navigation (header and/or footer) */
  updateNavigation: (changes: { header?: string; footer?: string }) => void;
  /** Error message, if any */
  error: string | null;
}

/** Debounce delay for text inputs (ms) */
const DEBOUNCE_DELAY = 300;

/**
 * Apply CSS variable changes to tldraw shapes by updating both
 * the overrides array and the css prop in a single updateShape call.
 *
 * CSS variable overrides via DiffEngine.applyOverrides don't work because
 * it returns doc.body.innerHTML which loses :root level styles.
 * So we must directly update the shape's css prop.
 *
 * @param editor - tldraw Editor instance
 * @param overridesMap - Map of shapeId → ElementOverride[] (for overrides prop)
 * @param themeChanges - CSS variable name→value map (for css prop)
 */
function applyThemeChangesToShapes(
  editor: Editor,
  overridesMap: Map<string, ElementOverride[]>,
  themeChanges: Record<string, string>
): boolean {
  if (overridesMap.size === 0) {
    return false;
  }

  let appliedAny = false;

  for (const [shapeId, newOverrides] of overridesMap) {
    const shape = editor.getShape(shapeId as any) as any | undefined;
    if (!shape) {
      console.warn(`[useThemeEditor] Shape ${shapeId} not found, skipping`);
      continue;
    }

    // Merge overrides
    const existingOverrides: ElementOverride[] = shape.props?.overrides ?? [];
    const mergedOverrides = mergeOverrides(existingOverrides, newOverrides);

    // Update CSS prop with new variable values
    let css: string = shape.props?.css || '';
    for (const [varName, newValue] of Object.entries(themeChanges)) {
      const escapedName = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const replaceRegex = new RegExp(
        `(${escapedName}\\s*:\\s*)([^;]+)(;)`,
        'g'
      );

      if (replaceRegex.test(css)) {
        replaceRegex.lastIndex = 0;
        css = css.replace(replaceRegex, `$1${newValue}$3`);
      } else {
        const rootMatch = css.match(/:root\s*\{/i);
        if (rootMatch && rootMatch.index !== undefined) {
          const insertPos = rootMatch.index + rootMatch[0].length;
          css =
            css.slice(0, insertPos) +
            `\n  ${varName}: ${newValue};` +
            css.slice(insertPos);
        } else {
          css = `:root {\n  ${varName}: ${newValue};\n}\n\n` + css;
        }
      }
    }

    editor.updateShape({
      id: shape.id,
      type: shape.type as any,
      props: {
        ...shape.props,
        overrides: mergedOverrides,
        css,
      },
    });

    appliedAny = true;
  }

  return appliedAny;
}

/**
 * Apply an override map returned by SharedThemeManager to tldraw shapes.
 *
 * For each shapeId in the map:
 * 1. Get the shape via editor.getShape(shapeId)
 * 2. Merge new overrides into the shape's existing props.overrides array
 * 3. Call editor.updateShape() to persist
 *
 * Requirements: 5.1 - Override application completeness
 *
 * @param editor - tldraw Editor instance
 * @param overridesMap - Map of shapeId → ElementOverride[]
 * @returns true if at least one shape was updated, false otherwise
 */
export function applyOverridesToShapes(
  editor: Editor,
  overridesMap: Map<string, ElementOverride[]>
): boolean {
  if (overridesMap.size === 0) {
    return false;
  }

  let appliedAny = false;

  for (const [shapeId, newOverrides] of overridesMap) {
    const shape = editor.getShape(shapeId as any) as any | undefined;

    if (!shape) {
      // Shape may have been deleted; skip and log warning
      console.warn(
        `[useThemeEditor] Shape ${shapeId} not found, skipping override application`
      );
      continue;
    }

    // Merge new overrides into existing overrides array
    const existingOverrides: ElementOverride[] = shape.props?.overrides ?? [];
    const mergedOverrides = mergeOverrides(existingOverrides, newOverrides);

    editor.updateShape({
      id: shape.id,
      type: shape.type as any,
      props: {
        ...shape.props,
        overrides: mergedOverrides,
      },
    });

    appliedAny = true;
  }

  return appliedAny;
}

/**
 * Merge new overrides into existing overrides.
 * If an override with the same selector already exists, replace it;
 * otherwise append the new override.
 *
 * @param existing - Current overrides on the shape
 * @param incoming - New overrides to merge
 * @returns Merged overrides array
 */
function mergeOverrides(
  existing: ElementOverride[],
  incoming: ElementOverride[]
): ElementOverride[] {
  const result = [...existing];

  for (const newOverride of incoming) {
    const existingIndex = result.findIndex(
      (o) => o.selector === newOverride.selector
    );
    if (existingIndex >= 0) {
      // Replace existing override with same selector
      result[existingIndex] = newOverride;
    } else {
      result.push(newOverride);
    }
  }

  return result;
}

/**
 * Load CSS variables and navigation data from a page group.
 *
 * @param group - The page group to load data from
 * @returns Parsed CSS variables and navigation data
 */
function loadGroupData(group: PageGroup): {
  cssVariables: CssVariable[];
  sharedNavigation: { header: string; footer: string };
} {
  const cssVariables = parseCssVariables(group.sharedTheme);
  const sharedNavigation = { ...group.sharedNavigation };
  return { cssVariables, sharedNavigation };
}

/**
 * Hook to manage global theme editing state and operations.
 *
 * Requirements:
 * - 2.4: updateVariable calls sharedThemeManager.updateSharedTheme() and applies overrides
 * - 3.3: updateNavigation calls sharedThemeManager.updateSharedNavigation() and applies overrides
 * - 4.2: selectGroup switches page group and reloads data
 * - 5.1: Override maps are applied to tldraw shapes
 * - 5.3: Empty override map sets error state
 * - 6.2: Text input uses 300ms debounce
 *
 * @param editor - The tldraw Editor instance (can be null during initialization)
 * @returns Theme editor state and control methods
 */
export function useThemeEditor(editor: Editor | null): UseThemeEditorReturn {
  // Page groups from SharedThemeManager
  const [pageGroups, setPageGroups] = useState<PageGroup[]>([]);
  // Currently selected group ID
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  // Parsed CSS variables from the selected group
  const [cssVariables, setCssVariables] = useState<CssVariable[]>([]);
  // Shared navigation from the selected group
  const [sharedNavigation, setSharedNavigation] = useState<{
    header: string;
    footer: string;
  } | null>(null);
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Debounce timer ref for text inputs
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load page groups on mount and when editor changes
  useEffect(() => {
    let groups = sharedThemeManager.getAllPageGroups();

    // 回退：若 sharedThemeManager 无页面组，扫描画布自动注册
    if (groups.length === 0 && editor) {
      try {
        const pages = collectPagesFromCanvas(editor);
        if (pages.length > 0) {
          const allShapes = editor.getCurrentPageShapes();
          const htmlShapes = allShapes.filter((s) => s.type === 'html' && (s as any).props?.html?.trim());
          const shapeIds = htmlShapes.map((s) => s.id as string);

          // 从第一个 shape 的 CSS 中提取 :root 变量作为 sharedTheme
          const firstCss = (htmlShapes[0] as any)?.props?.css || '';
          const rootMatch = firstCss.match(/:root\s*\{[^}]*\}/s);
          const sharedTheme = rootMatch ? rootMatch[0] : '';

          // 提取共享导航
          const firstHtml = (htmlShapes[0] as any)?.props?.html || '';
          const headerMatch = firstHtml.match(/<(?:nav|header)[^>]*data-shared=["']header["'][^>]*>[\s\S]*?<\/(?:nav|header)>/i);
          const footerMatch = firstHtml.match(/<footer[^>]*data-shared=["']footer["'][^>]*>[\s\S]*?<\/footer>/i);

          const groupId = `canvas-scan-${Date.now()}`;
          sharedThemeManager.registerPageGroup(groupId, shapeIds, sharedTheme, {
            header: headerMatch ? headerMatch[0] : '',
            footer: footerMatch ? footerMatch[0] : '',
          });

          groups = sharedThemeManager.getAllPageGroups();
        }
      } catch {
        // editor 可能未完全初始化，忽略错误
      }
    }

    setPageGroups(groups);

    // Default: select the first available group
    if (groups.length > 0) {
      const firstGroup = groups[0];
      setSelectedGroupId(firstGroup.groupId);
      const { cssVariables: vars, sharedNavigation: nav } = loadGroupData(firstGroup);
      setCssVariables(vars);
      setSharedNavigation(nav);
      setError(null);
    } else {
      setSelectedGroupId(null);
      setCssVariables([]);
      setSharedNavigation(null);
    }
  }, [editor]);

  // Requirement 4.2: Switch page group and reload CSS variables + navigation
  const selectGroup = useCallback(
    (groupId: string) => {
      const group = sharedThemeManager.getPageGroup(groupId);
      if (!group) {
        setError('页面组不存在');
        return;
      }

      setSelectedGroupId(groupId);
      const { cssVariables: vars, sharedNavigation: nav } = loadGroupData(group);
      setCssVariables(vars);
      setSharedNavigation(nav);
      setError(null);
    },
    []
  );

  // Requirement 2.4, 5.1, 5.3, 6.2: Update a CSS variable with debounce
  const updateVariable = useCallback(
    (name: string, value: string) => {
      if (!editor || !selectedGroupId) {
        setError('编辑器或页面组未就绪');
        return;
      }

      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Requirement 6.2: 300ms debounce for text inputs
      debounceTimerRef.current = setTimeout(() => {
        const themeChanges: Record<string, string> = { [name]: value };
        const overridesMap = sharedThemeManager.updateSharedTheme(
          selectedGroupId,
          themeChanges
        );

        // Requirement 5.3: Empty override map → error state
        if (overridesMap.size === 0) {
          setError('变更未能应用，请检查页面组是否有效');
          return;
        }

        // Requirement 5.1: Apply overrides and CSS changes to tldraw shapes
        applyThemeChangesToShapes(editor, overridesMap, themeChanges);

        // Update local CSS variables state to reflect the change
        setCssVariables((prev) =>
          prev.map((v) => (v.name === name ? { ...v, value } : v))
        );

        setError(null);
      }, DEBOUNCE_DELAY);
    },
    [editor, selectedGroupId]
  );

  // Requirement 3.3, 5.1, 5.3, 6.2: Update shared navigation with debounce
  const updateNavigation = useCallback(
    (changes: { header?: string; footer?: string }) => {
      if (!editor || !selectedGroupId) {
        setError('编辑器或页面组未就绪');
        return;
      }

      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Requirement 6.2: 300ms debounce for text inputs
      debounceTimerRef.current = setTimeout(() => {
        const overridesMap = sharedThemeManager.updateSharedNavigation(
          selectedGroupId,
          changes
        );

        // Requirement 5.3: Empty override map → error state
        if (overridesMap.size === 0) {
          setError('变更未能应用，请检查页面组是否有效');
          return;
        }

        // Requirement 5.1: Apply overrides to tldraw shapes
        applyOverridesToShapes(editor, overridesMap);

        // Update local navigation state
        setSharedNavigation((prev) => {
          if (!prev) return prev;
          return {
            header: changes.header !== undefined ? changes.header : prev.header,
            footer: changes.footer !== undefined ? changes.footer : prev.footer,
          };
        });

        setError(null);
      }, DEBOUNCE_DELAY);
    },
    [editor, selectedGroupId]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    pageGroups,
    selectedGroupId,
    cssVariables,
    sharedNavigation,
    selectGroup,
    updateVariable,
    updateNavigation,
    error,
  };
}
