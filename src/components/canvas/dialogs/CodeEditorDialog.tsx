/**
 * CodeEditorDialog - Modal dialog for editing HTML shape code
 */
import * as React from 'react';
import { useCallback, useMemo } from 'react';
import type { Editor } from 'tldraw';
import { CodeEditor } from '../../editors/CodeEditor';

interface CodeEditorDialogProps {
  isOpen: boolean;
  editor: Editor | null;
  onClose: () => void;
}

export const CodeEditorDialog: React.FC<CodeEditorDialogProps> = ({
  isOpen,
  editor,
  onClose,
}) => {
  // Get current selected HTML shape
  const getCurrentHtmlShape = useCallback(() => {
    if (!editor) return null;
    const selectedShapes = editor.getSelectedShapes();
    if (selectedShapes.length !== 1) return null;
    const shape = selectedShapes[0];
    if (shape.type !== 'html') return null;
    return shape as any;
  }, [editor]);

  // Get all HTML shapes
  const getAllHtmlShapes = useCallback(() => {
    if (!editor) return [];
    const allShapes = editor.getCurrentPageShapes();
    return allShapes.filter((shape: any) => shape.type === 'html') as any[];
  }, [editor]);

  // Handle code save
  const handleCodeSave = useCallback(
    (code: { html: string; css: string; js: string }, shapeId?: string) => {
      if (!editor) return;
      const targetShapeId = shapeId || getCurrentHtmlShape()?.id;
      if (!targetShapeId) return;

      editor.updateShape({
        id: targetShapeId,
        type: 'html',
        props: {
          ...editor.getShape(targetShapeId)?.props,
          html: code.html,
          css: code.css,
          js: code.js,
        },
      });

      onClose();
    },
    [editor, getCurrentHtmlShape, onClose]
  );

  // Prepare editor data
  const editorData = useMemo(() => {
    if (!isOpen || !editor) return null;

    const allHtmlShapes = getAllHtmlShapes();
    const currentShape = getCurrentHtmlShape();

    if (allHtmlShapes.length === 0) {
      return null;
    }

    // If no shape is selected but there are shapes, use the first one
    const targetShape = currentShape || allHtmlShapes[0];

    // Prepare all pages data for multi-page support
    const allPages = allHtmlShapes.map((shape: any, index: number) => ({
      id: shape.id,
      name: `Page ${index + 1}`,
      html: shape.props.html || '',
      css: shape.props.css || '',
      js: shape.props.js || '',
    }));

    return {
      targetShape,
      allPages: allPages.length > 1 ? allPages : undefined,
    };
  }, [isOpen, editor, getAllHtmlShapes, getCurrentHtmlShape]);

  if (!isOpen || !editorData) {
    return null;
  }

  return (
    <div
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
          borderRadius: '12px',
          boxShadow:
            '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          maxWidth: '1200px',
          width: '90vw',
          maxHeight: '85vh',
          height: '700px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CodeEditor
          html={editorData.targetShape.props.html || ''}
          css={editorData.targetShape.props.css || ''}
          js={editorData.targetShape.props.js || ''}
          allPages={editorData.allPages}
          currentPageId={editorData.targetShape.id}
          onSave={handleCodeSave}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
