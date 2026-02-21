/**
 * EditorCanvas - Thin assembly layer for tldraw canvas with AI integration
 * Feature: editor-canvas-refactor, Requirements: 11.1, 11.2, 11.3, 10.1, 10.2, 10.3
 */
import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { Tldraw, createShapeId } from 'tldraw';
import 'tldraw/tldraw.css';
import { HybridHtmlShapeUtil } from '../../core/shape/HybridHtmlShapeUtil';
import { HtmlImportDialog } from '../import/HtmlImportDialog';
import { CodeEditorDialog } from './dialogs/CodeEditorDialog';
import { GrapesJSEditorDialog } from './dialogs/GrapesJSEditorDialog';
import { MergePreviewDialog } from './dialogs/MergePreviewDialog';
import { ExportDialog } from './ExportDialog';
import { ShareDialog } from './dialogs/ShareDialog';
import { ThemeEditorPanel } from './panels/ThemeEditorPanel';
import { AIPromptPanel } from './panels/AIPromptPanel';
import { collectPages } from '../../utils/batch/collectPages';
import type { AIGenerationContext } from '../../types';
import type { HtmlImportResult } from '../../utils/import/htmlImporter';
import { getToolClasses } from './toolbar/toolRegistry';
import { useCanvasEditor } from './hooks/useCanvasEditor';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePageNavigation } from './hooks/usePageNavigation';
import { useToolEventHandlers } from './hooks/useToolEventHandlers';
import { useInteractiveMode, InteractiveModeContext } from './hooks/useInteractiveMode';
import { InteractionOverlay } from './overlays/InteractionOverlay';
import { useSmartGenerate } from './generation/useSmartGenerate';
import { createUiOverrides } from './toolbar/toolDefinitions';
import { createToolbarComponents } from './toolbar/EditorToolbar';
import { ErrorToast } from './notifications/ErrorToast';
import { LoadingIndicator } from './notifications/LoadingIndicator';

/** 持久化存储的唯一标识符 */
const PERSISTENCE_KEY = 'canvas-editor';

export const EditorCanvas: React.FC = () => {
  const { editor, handleMount } = useCanvasEditor();
  useKeyboardShortcuts(editor);
  const { pageLinkHandlerRef } = usePageNavigation(editor);
  const { interactiveShapeId, exitInteractiveMode } = useInteractiveMode(editor);
  
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [codeEditorOpen, setCodeEditorOpen] = useState(false);
  const [grapesEditorOpen, setGrapesEditorOpen] = useState(false);
  const [mergePreviewOpen, setMergePreviewOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [themeEditorOpen, setThemeEditorOpen] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  
  // Sync fullscreenMode with grapesEditorOpen
  React.useEffect(() => {
    setFullscreenMode(grapesEditorOpen);
  }, [grapesEditorOpen]);
  
  // Automatically register all tool event handlers
  // Note: setDialogOpen and setScreenshotActive removed as those features are no longer needed
  useToolEventHandlers({
    editor,
    setDialogOpen: () => {}, // No-op - double-click dialog removed
    setImportDialogOpen,
    setCodeEditorOpen,
    setScreenshotActive: () => {}, // No-op placeholder for screenshot toggle
    setErrorMessage,
    setMergePreviewOpen,
    setExportDialogOpen,
    setShareDialogOpen,
    setThemeEditorOpen,
  });
  
  const onError = useCallback((msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  }, []);
  
  const onComplete = useCallback(() => {
    // Generation complete - no dialog to close anymore
  }, []);
  
  const { handleGenerate: handleSmartGenerate, loading: generateLoading, batchProgress } = useSmartGenerate(editor, pageLinkHandlerRef, onComplete, onError);
  
  const uiOverrides = useMemo(() => createUiOverrides({
    editor, 
    setCodeEditorOpen, 
    setGrapesEditorOpen,
    pageLinkHandlerRef,
  }), [editor, pageLinkHandlerRef]);
  const customComponents = useMemo(() => createToolbarComponents(), []);
  const customTools = useMemo(() => getToolClasses(), []);
  
  // Handle AI generation from left panel - AI decides single vs batch
  const handlePanelSubmit = useCallback(
    (context: AIGenerationContext) => {
      handleSmartGenerate(context);
    },
    [handleSmartGenerate]
  );
  
  const handleImportSuccess = useCallback((results: HtmlImportResult[]) => {
    if (!editor) return;
    let xOffset = 100;
    results.forEach((result) => {
      const shapeId = createShapeId();
      editor.createShape({
        id: shapeId, type: 'html' as any, x: xOffset, y: 100,
        props: {
          html: result.htmlContent, css: result.parseResult.styles || '', js: result.parseResult.scripts || '',
          mode: 'preview', overrides: [], viewport: 'desktop', w: 800, h: 600,
        },
      });
      xOffset += 850;
    });
    // Commit imported shapes to history
    editor.markHistoryStoppingPoint('import-shapes-created');
    setImportDialogOpen(false);
  }, [editor]);
  
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* Left Panel - AI Prompt Panel */}
      <AIPromptPanel 
        onSubmit={handlePanelSubmit}
        isCollapsed={leftPanelCollapsed}
        onToggleCollapse={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
        style={{ display: fullscreenMode ? 'none' : 'flex' }}
      />

      {/* Right Panel - Tldraw Editor */}
      <div style={{ flex: 1, position: 'relative', display: fullscreenMode ? 'none' : 'block' }}>
        <InteractiveModeContext.Provider value={interactiveShapeId}>
          <Tldraw
            persistenceKey={PERSISTENCE_KEY}
            onMount={handleMount}
            shapeUtils={[HybridHtmlShapeUtil]}
            tools={customTools}
            overrides={uiOverrides}
            components={customComponents}
          />
        </InteractiveModeContext.Provider>
        
        {/* Requirement 4.1, 4.2, 4.3: Render InteractionOverlay when in interactive mode */}
        {interactiveShapeId && editor && (
          <InteractionOverlay
            shapeId={interactiveShapeId}
            editor={editor}
            onExit={exitInteractiveMode}
          />
        )}
        
        <ErrorToast message={errorMessage} />
        <LoadingIndicator 
          visible={generateLoading} 
          message={
            batchProgress 
              ? `正在生成第 ${batchProgress.completed}/${batchProgress.total} 页...` 
              : "AI 正在分析并生成页面..."
          } 
        />
      </div>

      {/* Dialogs */}
      <HtmlImportDialog
        isOpen={importDialogOpen}
        onImportSuccess={handleImportSuccess}
        onCancel={() => setImportDialogOpen(false)}
      />
      <CodeEditorDialog
        isOpen={codeEditorOpen}
        editor={editor}
        onClose={() => setCodeEditorOpen(false)}
      />
      <GrapesJSEditorDialog
        isOpen={grapesEditorOpen}
        editor={editor}
        onClose={() => setGrapesEditorOpen(false)}
        fullscreenMode={fullscreenMode}
      />
      <MergePreviewDialog
        isOpen={mergePreviewOpen}
        pages={(window as any).__mergePreviewPages || collectPages(pageLinkHandlerRef.current, editor)}
        onClose={() => setMergePreviewOpen(false)}
      />
      <ExportDialog
        isOpen={exportDialogOpen}
        editor={editor}
        onClose={() => setExportDialogOpen(false)}
      />
      <ShareDialog
        isOpen={shareDialogOpen}
        editor={editor}
        onClose={() => setShareDialogOpen(false)}
      />
      <ThemeEditorPanel
        isOpen={themeEditorOpen}
        editor={editor}
        onClose={() => setThemeEditorOpen(false)}
      />
    </div>
  );
};
