/**
 * toolDefinitions - UI overrides for tldraw toolbar customization
 * Feature: editor-canvas-refactor
 * Requirements: 7.2, 7.3, 6.2
 * 
 * Provides the createUiOverrides function that configures custom tools and actions
 * for the tldraw editor. Uses the shared shapeUpdater utility to eliminate
 * repetitive shape update code.
 */

import type { Editor, TLUiOverrides } from 'tldraw';
import { getToolDefinitions } from './toolRegistry';
import { collectPages, collectPagesFromCanvas, type CollectedPage } from '../../../utils/batch/collectPages';
import { sharedThemeManager } from '../../../utils/batch/sharedThemeManager';

/**
 * Configuration for creating UI overrides
 */
export interface ToolDefinitionsConfig {
  editor: Editor | null;
  setCodeEditorOpen: (open: boolean) => void;
  setGrapesEditorOpen: (open: boolean) => void;
  pageLinkHandlerRef?: React.MutableRefObject<any>;
}

/**
 * Create UI overrides for tldraw editor
 * 
 * This function extracts the uiOverrides configuration from EditorCanvas,
 * providing custom tools and actions for the toolbar. It uses the shared
 * updateAllHtmlShapes utility to eliminate repetitive code patterns.
 * 
 * Requirements:
 * - 7.2: Export uiOverrides configuration with all tools registration
 * - 7.3: Use Shape_Updater for mode switching (Requirement 6.2)
 * 
 * @param config - Configuration object with editor and state setters
 * @returns TLUiOverrides object for tldraw
 */
export function createUiOverrides(config: ToolDefinitionsConfig): TLUiOverrides {
  const { editor: configEditor, setCodeEditorOpen, setGrapesEditorOpen, pageLinkHandlerRef } = config;

  return {
    tools(editor, tools) {
      // Keep only: select, hand
      const allowedTools = ['select', 'hand'];
      
      // Remove all other default tools
      Object.keys(tools).forEach(toolId => {
        if (!allowedTools.includes(toolId)) {
          delete tools[toolId];
        }
      });
      
      // Add custom tools from registry (automatically synced with tool classes)
      const customToolDefs = getToolDefinitions(editor);
      Object.assign(tools, customToolDefs);

      // Add mode-edit as a tool (toolbar button to open GrapesJS editor)
      tools['mode-edit'] = {
        id: 'mode-edit',
        label: 'Edit',
        icon: 'edit',
        kbd: 'e',
        onSelect: () => {
          if (configEditor) {
            // Switch back to select tool BEFORE opening the dialog.
            // This prevents tldraw's tool state machine from flushing
            // history and accidentally undoing the shape creation.
            configEditor.setCurrentTool('select');

            const selectedShapes = configEditor.getSelectedShapes();
            if (selectedShapes.length === 1 && selectedShapes[0].type === 'html') {
              setGrapesEditorOpen(true);
            } else {
              alert('Please select an HTML shape to edit.');
            }
          }
        },
      };

      // Add view-code tool
      tools['view-code'] = {
        id: 'view-code',
        label: 'Code',
        icon: 'code',
        onSelect: () => {
          // Check if there's a selected HTML shape
          if (configEditor) {
            const selectedShapes = configEditor.getSelectedShapes();
            if (selectedShapes.length === 1 && selectedShapes[0].type === 'html') {
              setCodeEditorOpen(true);
            } else {
              // Show error message if no HTML shape is selected
              alert('Please select an HTML shape to view its code.');
            }
          }
        },
      };

      // Add merge-preview tool
      // Feature: multi-page-merge-preview, merge-preview-fallback-fix
      // Requirements: 5.1, 5.2, 5.3, 1.2, 1.5, 1.6, 3.1, 4.1
      tools['merge-preview'] = {
        id: 'merge-preview',
        label: 'Preview',
        icon: 'play',
        onSelect: () => {
          // Requirement 4.1: Check if editor is initialized
          if (!configEditor) {
            alert('Editor not initialized');
            return;
          }

          // Try primary method: PageLinkHandler
          const pageLinkHandler = pageLinkHandlerRef?.current;
          let pages: CollectedPage[] = [];
          
          // Requirement 3.1: Use PageLinkHandler if available (existing behavior)
          if (pageLinkHandler && pageLinkHandler.getRegisteredPages().length > 0) {
            pages = collectPages(pageLinkHandler, configEditor);
          }
          
          // Always try canvas scan as fallback or supplement
          // This handles the case where pageLinkHandler is null (e.g. after page refresh)
          // but shapes are still persisted on the canvas via tldraw's persistenceKey
          if (pages.length === 0) {
            pages = collectPagesFromCanvas(configEditor);
          }
          
          console.debug('[merge-preview] Collected pages', { 
            count: pages.length, 
            names: pages.map(p => p.name),
            source: pageLinkHandler && pageLinkHandler.getRegisteredPages().length > 0 ? 'PageLinkHandler' : 'canvas-scan'
          });
          
          // Requirement 1.6: Only show error if both methods find no pages
          if (pages.length === 0) {
            alert('No HTML shapes found on canvas. Please generate or import pages first.');
            configEditor.setCurrentTool('select');
            return;
          }
          
          // Store pages for dialog to access
          (window as any).__mergePreviewPages = pages;
          
          // Requirement 1.5: Dispatch event to open dialog
          window.dispatchEvent(new CustomEvent('open-merge-preview'));
          
          // Switch back to select tool
          configEditor.setCurrentTool('select');
        },
      };

      // Add share-app tool
      // Feature: share-app-link
      // Requirements: 1.2, 1.3
      tools['share-app'] = {
        id: 'share-app',
        label: 'Share',
        icon: 'share',
        onSelect: () => {
          if (!configEditor) return;

          // Requirement 1.3: Check if canvas has HTML shapes
          const pages = collectPagesFromCanvas(configEditor);
          if (pages.length === 0) {
            alert('画布上没有 HTML 页面，请先生成页面');
            configEditor.setCurrentTool('select');
            return;
          }

          // Requirement 1.2: Dispatch event to open ShareDialog
          window.dispatchEvent(new CustomEvent('open-share-dialog'));

          // Switch back to select tool after dispatching
          configEditor.setCurrentTool('select');
        },
      };
      
      // Add theme-editor tool
      // Feature: global-theme-editor
      // Requirements: 1.1, 1.2
      tools['theme-editor'] = {
        id: 'theme-editor',
        label: 'Theme',
        icon: 'color',
        onSelect: () => {
          if (!configEditor) return;

          // 检查是否存在 PageGroup，若无则扫描画布自动注册
          let groups = sharedThemeManager.getAllPageGroups();
          if (groups.length === 0) {
            // 回退：扫描画布上的 HTML shapes 并自动创建页面组
            const pages = collectPagesFromCanvas(configEditor);
            if (pages.length === 0) {
              alert('画布上没有 HTML 页面，请先生成页面');
              configEditor.setCurrentTool('select');
              return;
            }

            // 从画布 shapes 中收集 shapeId 和提取共享 CSS 变量
            const allShapes = configEditor.getCurrentPageShapes();
            const htmlShapes = allShapes.filter((s) => s.type === 'html' && (s as any).props?.html?.trim());
            const shapeIds = htmlShapes.map((s) => s.id as string);

            // 从第一个 shape 的 CSS 中提取 :root 变量作为 sharedTheme
            const firstCss = (htmlShapes[0] as any)?.props?.css || '';
            const rootMatch = firstCss.match(/:root\s*\{[^}]*\}/s);
            const sharedTheme = rootMatch ? rootMatch[0] : '';

            // 提取共享导航（header/footer）
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

          window.dispatchEvent(new CustomEvent('open-theme-editor'));
          configEditor.setCurrentTool('select');
        },
      };

      return tools;
    },
    actions(_editor, actions) {
      return actions;
    },
  };
}
