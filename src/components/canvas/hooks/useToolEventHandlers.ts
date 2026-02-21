/**
 * useToolEventHandlers - Automatic event handler registration for custom tools
 * 
 * This hook automatically registers and manages event listeners for custom tools,
 * eliminating the need to manually sync event handlers between toolDefinitions
 * and EditorCanvas.
 */

import { useEffect } from 'react';
import type { Editor } from 'tldraw';

/**
 * Tool event handler configuration
 */
export interface ToolEventHandler {
  /** Event name to listen for */
  eventName: string;
  /** Handler function to execute when event is triggered */
  handler: () => void;
}

/**
 * Configuration for tool event handlers
 */
export interface ToolEventHandlersConfig {
  editor: Editor | null;
  setDialogOpen: (open: boolean) => void;
  setImportDialogOpen: (open: boolean) => void;
  setCodeEditorOpen: (open: boolean) => void;
  setScreenshotActive: React.Dispatch<React.SetStateAction<boolean>>;
  setErrorMessage: (message: string | null) => void;
  setMergePreviewOpen: (open: boolean) => void;
  setExportDialogOpen: (open: boolean) => void;
  setShareDialogOpen: (open: boolean) => void;
  setThemeEditorOpen: (open: boolean) => void;
}

/**
 * Custom hook to automatically register and manage tool event handlers
 * 
 * This hook centralizes all tool event handling logic, making it easy to add
 * new tools without modifying EditorCanvas.
 * 
 * @param config - Configuration object with editor and state setters
 */
export function useToolEventHandlers(config: ToolEventHandlersConfig): void {
  const { editor, setDialogOpen, setImportDialogOpen, setCodeEditorOpen, setScreenshotActive, setErrorMessage, setMergePreviewOpen, setExportDialogOpen, setShareDialogOpen, setThemeEditorOpen } = config;

  useEffect(() => {
    // Define all tool event handlers in one place
    const handlers: ToolEventHandler[] = [
      {
        eventName: 'open-ai-dialog',
        handler: () => setDialogOpen(true),
      },
      {
        eventName: 'toggle-screenshot',
        handler: () => setScreenshotActive(prev => !prev),
      },
      {
        eventName: 'open-merge-preview',
        handler: () => setMergePreviewOpen(true),
      },
      {
        eventName: 'export-html',
        handler: () => {
          // Open the export dialog instead of directly exporting
          setExportDialogOpen(true);
        },
      },
      {
        eventName: 'open-share-dialog',
        handler: () => setShareDialogOpen(true),
      },
      {
        eventName: 'open-theme-editor',
        handler: () => setThemeEditorOpen(true),
      },
    ];

    // Register all event listeners
    handlers.forEach(({ eventName, handler }) => {
      window.addEventListener(eventName, handler);
    });

    // Cleanup: remove all event listeners
    return () => {
      handlers.forEach(({ eventName, handler }) => {
        window.removeEventListener(eventName, handler);
      });
    };
  }, [editor, setDialogOpen, setImportDialogOpen, setCodeEditorOpen, setScreenshotActive, setErrorMessage, setMergePreviewOpen, setExportDialogOpen, setShareDialogOpen, setThemeEditorOpen]);
}
