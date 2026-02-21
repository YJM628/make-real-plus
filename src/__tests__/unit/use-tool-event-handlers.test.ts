/**
 * Unit tests for useToolEventHandlers hook
 * 
 * Tests automatic event handler registration and cleanup
 */

import { renderHook } from '@testing-library/react';
import { useToolEventHandlers } from '../../components/canvas/hooks/useToolEventHandlers';
import type { Editor } from 'tldraw';

describe('useToolEventHandlers', () => {
  let mockEditor: Partial<Editor>;
  let setDialogOpen: jest.Mock;
  let setImportDialogOpen: jest.Mock;
  let setCodeEditorOpen: jest.Mock;
  let setScreenshotActive: jest.Mock;
  let setErrorMessage: jest.Mock;
  let setMergePreviewOpen: jest.Mock;
  let setExportDialogOpen: jest.Mock;
  let setShareDialogOpen: jest.Mock;
  let setThemeEditorOpen: jest.Mock;

  beforeEach(() => {
    mockEditor = {
      getCurrentPageShapes: jest.fn().mockReturnValue([]),
    };
    setDialogOpen = jest.fn();
    setImportDialogOpen = jest.fn();
    setCodeEditorOpen = jest.fn();
    setScreenshotActive = jest.fn();
    setErrorMessage = jest.fn();
    setMergePreviewOpen = jest.fn();
    setExportDialogOpen = jest.fn();
    setShareDialogOpen = jest.fn();
    setThemeEditorOpen = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register event listeners on mount', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    renderHook(() =>
      useToolEventHandlers({
        editor: mockEditor as Editor,
        setDialogOpen,
        setImportDialogOpen,
        setCodeEditorOpen,
        setScreenshotActive,
        setErrorMessage,
        setMergePreviewOpen,
        setExportDialogOpen,
        setShareDialogOpen,
        setThemeEditorOpen,
      })
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith('open-ai-dialog', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('toggle-screenshot', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('open-merge-preview', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('export-html', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('open-share-dialog', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('open-theme-editor', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('should remove event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useToolEventHandlers({
        editor: mockEditor as Editor,
        setDialogOpen,
        setImportDialogOpen,
        setCodeEditorOpen,
        setScreenshotActive,
        setErrorMessage,
        setMergePreviewOpen,
        setExportDialogOpen,
        setShareDialogOpen,
        setThemeEditorOpen,
      })
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('open-ai-dialog', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('toggle-screenshot', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('open-merge-preview', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('export-html', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('open-share-dialog', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('open-theme-editor', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should handle open-ai-dialog event', () => {
    renderHook(() =>
      useToolEventHandlers({
        editor: mockEditor as Editor,
        setDialogOpen,
        setImportDialogOpen,
        setCodeEditorOpen,
        setScreenshotActive,
        setErrorMessage,
        setMergePreviewOpen,
        setExportDialogOpen,
        setShareDialogOpen,
        setThemeEditorOpen,
      })
    );

    window.dispatchEvent(new CustomEvent('open-ai-dialog'));

    expect(setDialogOpen).toHaveBeenCalledWith(true);
  });

  it('should handle toggle-screenshot event', () => {
    renderHook(() =>
      useToolEventHandlers({
        editor: mockEditor as Editor,
        setDialogOpen,
        setImportDialogOpen,
        setCodeEditorOpen,
        setScreenshotActive,
        setErrorMessage,
        setMergePreviewOpen,
        setExportDialogOpen,
        setShareDialogOpen,
        setThemeEditorOpen,
      })
    );

    window.dispatchEvent(new CustomEvent('toggle-screenshot'));

    expect(setScreenshotActive).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should handle open-merge-preview event', () => {
    renderHook(() =>
      useToolEventHandlers({
        editor: mockEditor as Editor,
        setDialogOpen,
        setImportDialogOpen,
        setCodeEditorOpen,
        setScreenshotActive,
        setErrorMessage,
        setMergePreviewOpen,
        setExportDialogOpen,
        setShareDialogOpen,
        setThemeEditorOpen,
      })
    );

    window.dispatchEvent(new CustomEvent('open-merge-preview'));

    expect(setMergePreviewOpen).toHaveBeenCalledWith(true);
  });

  it('should handle export-html event by opening export dialog', () => {
    renderHook(() =>
      useToolEventHandlers({
        editor: mockEditor as Editor,
        setDialogOpen,
        setImportDialogOpen,
        setCodeEditorOpen,
        setScreenshotActive,
        setErrorMessage,
        setMergePreviewOpen,
        setExportDialogOpen,
        setShareDialogOpen,
        setThemeEditorOpen,
      })
    );

    window.dispatchEvent(new CustomEvent('export-html'));

    expect(setExportDialogOpen).toHaveBeenCalledWith(true);
  });

  it('should handle open-share-dialog event', () => {
    renderHook(() =>
      useToolEventHandlers({
        editor: mockEditor as Editor,
        setDialogOpen,
        setImportDialogOpen,
        setCodeEditorOpen,
        setScreenshotActive,
        setErrorMessage,
        setMergePreviewOpen,
        setExportDialogOpen,
        setShareDialogOpen,
        setThemeEditorOpen,
      })
    );

    window.dispatchEvent(new CustomEvent('open-share-dialog'));

    expect(setShareDialogOpen).toHaveBeenCalledWith(true);
  });

  it('should handle open-theme-editor event', () => {
    renderHook(() =>
      useToolEventHandlers({
        editor: mockEditor as Editor,
        setDialogOpen,
        setImportDialogOpen,
        setCodeEditorOpen,
        setScreenshotActive,
        setErrorMessage,
        setMergePreviewOpen,
        setExportDialogOpen,
        setShareDialogOpen,
        setThemeEditorOpen,
      })
    );

    window.dispatchEvent(new CustomEvent('open-theme-editor'));

    expect(setThemeEditorOpen).toHaveBeenCalledWith(true);
  });
});
