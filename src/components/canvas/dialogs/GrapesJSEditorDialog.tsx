/**
 * GrapesJSEditorDialog - Modal dialog for visual HTML editing with GrapesJS
 * Feature: grapesjs-editor-integration
 * Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.5, 7.1, 7.2, 7.3
 */
import * as React from 'react';
import { useEffect, useRef, useCallback } from 'react';
import type { Editor, TLShapeId } from 'tldraw';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

interface GrapesJSEditorDialogProps {
  isOpen: boolean;
  editor: Editor | null;
  onClose: () => void;
  fullscreenMode?: boolean;
}

export const GrapesJSEditorDialog: React.FC<GrapesJSEditorDialogProps> = ({
  isOpen,
  editor,
  onClose,
  fullscreenMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const gjsEditorRef = useRef<ReturnType<typeof grapesjs.init> | null>(null);
  const shapeIdRef = useRef<TLShapeId | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Handle save
  const handleSave = useCallback(() => {
    if (!gjsEditorRef.current || !editor || !shapeIdRef.current) {
      alert('编辑器未正确初始化');
      return;
    }

    const targetShape = editor.getShape(shapeIdRef.current);
    if (!targetShape || targetShape.type !== 'html') {
      alert('无法找到要更新的 shape。');
      return;
    }

    const html = gjsEditorRef.current.getHtml();
    const css = gjsEditorRef.current.getCss() ?? '';

    editor.updateShape({
      id: targetShape.id,
      type: 'html',
      props: {
        ...(targetShape as any).props,
        html,
        css,
      },
    });

    onClose();
  }, [editor, onClose]);

  // Register beforeDeleteHandler to log and protect the editing shape
  // AND initialize GrapesJS when dialog opens
  useEffect(() => {
    if (!isOpen || !containerRef.current || !editor) return;

    const selectedShapes = editor.getSelectedShapes();
    const currentShape = selectedShapes.length === 1 && selectedShapes[0].type === 'html'
      ? selectedShapes[0] as any
      : null;
    if (!currentShape) return;

    shapeIdRef.current = currentShape.id;

    // Register delete guard BEFORE initializing GrapesJS
    const protectedId = currentShape.id;
    console.log('[GrapesJS-Delete-Guard] Registering beforeDeleteHandler, protecting shape:', protectedId);

    const removeDeleteGuard = editor.sideEffects.registerBeforeDeleteHandler('shape', (shape) => {
      console.log('[GrapesJS-Delete-Guard] Attempting to delete shape:', shape.id, 'type:', shape.type);
      console.log('[GrapesJS-Delete-Guard] Stack trace:', new Error().stack);

      if (shape.id === protectedId) {
        console.warn('[GrapesJS-Delete-Guard] BLOCKED deletion of editing shape:', protectedId);
        return false;
      }
      return;
    });

    try {
      gjsEditorRef.current = grapesjs.init({
        container: containerRef.current,
        height: '100%',
        width: '100%',
        fromElement: false,
        components: currentShape.props.html || '',
        style: currentShape.props.css || '',
        storageManager: false,
        assetManager: { assets: [] },
        blockManager: {
          blocks: [
            {
              id: 'text',
              label: 'Text',
              content: '<p>Text block</p>',
              category: 'Basic',
            },
            {
              id: 'image',
              label: 'Image',
              content: { type: 'image' },
              category: 'Basic',
            },
            {
              id: 'container',
              label: 'Container',
              content: '<div class="container"></div>',
              category: 'Basic',
            },
          ],
        },
        canvas: {
          styles: [],
          scripts: [],
        },
      });
    } catch (error) {
      console.error('Failed to initialize GrapesJS:', error);
      alert('Failed to initialize GrapesJS editor');
      onCloseRef.current();
    }

    return () => {
      console.log('[GrapesJS-Delete-Guard] Unregistering beforeDeleteHandler');
      removeDeleteGuard();
      if (gjsEditorRef.current) {
        gjsEditorRef.current.destroy();
        gjsEditorRef.current = null;
      }
      shapeIdRef.current = null;
    };
  // Only re-run when isOpen or editor changes. onClose is accessed via ref.
  }, [isOpen, editor]);

  // Stop ALL keyboard events from bubbling out of the dialog to tldraw.
  // GrapesJS keyboard events (Backspace, Delete, etc.) would otherwise
  // reach tldraw's global keydown listener and trigger deleteShapes.
  useEffect(() => {
    if (!isOpen) return;
    const el = dialogRef.current;
    if (!el) return;

    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener('keydown', stop, true);
    el.addEventListener('keyup', stop, true);
    el.addEventListener('keypress', stop, true);

    return () => {
      el.removeEventListener('keydown', stop, true);
      el.removeEventListener('keyup', stop, true);
      el.removeEventListener('keypress', stop, true);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={dialogRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1e1e1e',
          borderRadius: fullscreenMode ? '0' : '12px',
          boxShadow: fullscreenMode
            ? 'none'
            : '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          width: fullscreenMode ? '100vw' : '95vw',
          height: fullscreenMode ? '100vh' : '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: '#252525',
          }}
        >
          <h2 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>
            Visual Editor
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Save
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Close
            </button>
          </div>
        </div>
        <div
          ref={containerRef}
          style={{
            flex: 1,
            overflow: 'hidden',
          }}
        />
      </div>
    </div>
  );
};
