import * as React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { htmlParser } from '../../core/parser/HtmlParser';
import './CodeEditor.css';

export interface CodeEditorProps {
  html: string;
  css: string;
  js: string;
  onSave: (code: { html: string; css: string; js: string }, shapeId?: string) => void;
  onClose: () => void;
  // Optional: for multi-page support
  allPages?: Array<{ id: string; name: string; html: string; css: string; js: string }>;
  currentPageId?: string;
}

type TabType = 'html' | 'css' | 'js';

interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  html,
  css,
  js,
  onSave,
  onClose,
  allPages,
  currentPageId,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('html');
  const [selectedPageId, setSelectedPageId] = useState(currentPageId || allPages?.[0]?.id);
  const [htmlCode, setHtmlCode] = useState(html);
  const [cssCode, setCssCode] = useState(css);
  const [jsCode, setJsCode] = useState(js);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Update code when selected page changes
  useEffect(() => {
    if (allPages && selectedPageId) {
      const page = allPages.find(p => p.id === selectedPageId);
      if (page) {
        setHtmlCode(page.html);
        setCssCode(page.css);
        setJsCode(page.js);
        setHasChanges(false);
      }
    }
  }, [selectedPageId, allPages]);

  // Track if code has changed
  useEffect(() => {
    const changed = htmlCode !== html || cssCode !== css || jsCode !== js;
    setHasChanges(changed);
  }, [htmlCode, cssCode, jsCode, html, css, js]);

  // Get current code based on active tab
  const getCurrentCode = useCallback(() => {
    switch (activeTab) {
      case 'html':
        return htmlCode;
      case 'css':
        return cssCode;
      case 'js':
        return jsCode;
      default:
        return '';
    }
  }, [activeTab, htmlCode, cssCode, jsCode]);

  // Get language for Monaco Editor
  const getLanguage = useCallback(() => {
    switch (activeTab) {
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'js':
        return 'javascript';
      default:
        return 'html';
    }
  }, [activeTab]);

  // Handle code change
  const handleCodeChange = useCallback((value: string | undefined) => {
    if (value === undefined) return;

    switch (activeTab) {
      case 'html':
        setHtmlCode(value);
        break;
      case 'css':
        setCssCode(value);
        break;
      case 'js':
        setJsCode(value);
        break;
    }
  }, [activeTab]);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: true },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      formatOnPaste: true,
      formatOnType: true,
    });
  }, []);

  // Validate code syntax
  const validateCode = useCallback(() => {
    if (!editorRef.current) return;

    const monaco = editorRef.current;
    const model = monaco.getModel();
    if (!model) return;

    // Get markers (errors/warnings) from Monaco
    const markers = (window as any).monaco?.editor.getModelMarkers({ resource: model.uri });
    
    const validationErrors: ValidationError[] = [];

    // Add Monaco markers
    if (markers && markers.length > 0) {
      markers.forEach((marker: any) => {
        validationErrors.push({
          line: marker.startLineNumber,
          column: marker.startColumn,
          message: marker.message,
          severity: marker.severity === 8 ? 'error' : 'warning',
        });
      });
    }

    // Additional HTML validation using HtmlParser when on HTML tab
    if (activeTab === 'html') {
      try {
        const validation = htmlParser.validate(htmlCode);
        if (!validation.valid) {
          validation.errors.forEach((error, index) => {
            validationErrors.push({
              line: index + 1, // Approximate line number
              column: 1,
              message: error,
              severity: 'error',
            });
          });
        }
      } catch (error) {
        validationErrors.push({
          line: 1,
          column: 1,
          message: error instanceof Error ? error.message : 'Unknown validation error',
          severity: 'error',
        });
      }
    }

    setErrors(validationErrors);
  }, [activeTab, htmlCode]);

  // Validate code when it changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateCode();
    }, 500); // Debounce validation by 500ms

    return () => clearTimeout(timeoutId);
  }, [htmlCode, cssCode, jsCode, activeTab, validateCode]);

  // Format code
  const handleFormat = useCallback(async () => {
    if (!editorRef.current) return;

    await editorRef.current.getAction('editor.action.formatDocument')?.run();
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    // Validate before saving
    validateCode();

    // Check if there are any errors
    const hasErrors = errors.some(error => error.severity === 'error');
    
    // Additional HTML parsing validation
    let htmlParseError: string | null = null;
    try {
      // Re-parse HTML to ensure it's valid
      htmlParser.parse(htmlCode, cssCode, jsCode);
    } catch (error) {
      htmlParseError = error instanceof Error ? error.message : 'Failed to parse HTML';
    }

    // If there are errors, warn the user
    if (hasErrors || htmlParseError) {
      const errorMessage = htmlParseError 
        ? `HTML parsing error: ${htmlParseError}\n\nDo you want to save anyway?`
        : 'There are syntax errors in your code. Do you want to save anyway?';
      
      const confirmSave = window.confirm(errorMessage);
      if (!confirmSave) return;
    }

    // Save the code - the parent component will handle updating the HTML_Shape
    onSave({
      html: htmlCode,
      css: cssCode,
      js: jsCode,
    }, selectedPageId);
  }, [htmlCode, cssCode, jsCode, errors, selectedPageId, onSave, validateCode]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (hasChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmClose) return;
    }
    onClose();
  }, [hasChanges, onClose]);

  // Handle tab change
  const handleTabChange = useCallback((tab: TabType) => {
    // Validate current tab before switching
    validateCode();
    setActiveTab(tab);
  }, [validateCode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl/Cmd + Shift + F to format
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        handleFormat();
      }
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleFormat, handleCancel]);

  return (
    <div className="code-editor-container">
      <div className="code-editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2>Code Editor</h2>
          {allPages && allPages.length > 1 && (
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: '#3e3e42',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {allPages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="code-editor-actions">
          <button
            onClick={handleFormat}
            className="btn-format"
            title="Format Code (Ctrl+Shift+F)"
          >
            Format
          </button>
          <button
            onClick={handleSave}
            className="btn-save"
            title="Save (Ctrl+S)"
            disabled={!hasChanges}
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="btn-cancel"
            title="Close (Esc)"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="code-editor-tabs">
        <button
          className={`tab ${activeTab === 'html' ? 'active' : ''}`}
          onClick={() => handleTabChange('html')}
        >
          HTML
        </button>
        <button
          className={`tab ${activeTab === 'css' ? 'active' : ''}`}
          onClick={() => handleTabChange('css')}
        >
          CSS
        </button>
        <button
          className={`tab ${activeTab === 'js' ? 'active' : ''}`}
          onClick={() => handleTabChange('js')}
        >
          JavaScript
        </button>
      </div>

      <div className="code-editor-content">
        <Editor
          height="500px"
          language={getLanguage()}
          value={getCurrentCode()}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            selectOnLineNumbers: true,
            automaticLayout: true,
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            tabSize: 2,
          }}
        />
      </div>

      {errors.length > 0 && (
        <div className="code-editor-errors">
          <h3>Validation Errors:</h3>
          <ul>
            {errors.map((error, index) => (
              <li
                key={index}
                className={`error-item ${error.severity}`}
              >
                <span className="error-location">
                  Line {error.line}, Column {error.column}:
                </span>
                <span className="error-message">{error.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="code-editor-footer">
        <span className="editor-info">
          {activeTab.toUpperCase()} | Line {editorRef.current?.getPosition()?.lineNumber || 1}
        </span>
        {hasChanges && <span className="unsaved-indicator">● Unsaved changes</span>}
      </div>
    </div>
  );
};
