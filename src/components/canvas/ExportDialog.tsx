/**
 * ExportDialog - Dialog for selecting export format and options
 * Feature: export-deployable-project
 * Requirements: 6.1, 6.3, 6.4
 * 
 * Provides a user interface for selecting the export format (static HTML, React, or Vue)
 * and configuring export options like application name.
 */

import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import type { Editor } from 'tldraw';
import type { ExportOptions } from '../../types';
import { exportProject } from '../../utils/export';

export interface ExportDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean;
  
  /** tldraw Editor instance */
  editor: Editor | null;
  
  /** Callback when dialog is closed */
  onClose: () => void;
}

/**
 * Dialog for configuring and triggering project export
 * 
 * Allows users to:
 * - Select export format (static HTML, React, or Vue)
 * - Configure application name
 * - Trigger the export process
 * 
 * Requirements:
 * - 6.1: Default export to static HTML/CSS/JS (no framework dependencies)
 * - 6.3: Option to export as React project
 * - 6.4: Option to export as Vue project
 */
export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  editor,
  onClose,
}) => {
  const [format, setFormat] = useState<'static' | 'react' | 'vue'>('static');
  const [appName, setAppName] = useState('my-app');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Infer app name from canvas context when dialog opens
  useEffect(() => {
    if (isOpen && editor) {
      const inferredName = inferAppNameFromCanvas(editor);
      setAppName(inferredName);
      setError(null);
    }
  }, [isOpen, editor]);

  const handleExport = useCallback(async () => {
    if (!editor) {
      setError('Editor not available');
      return;
    }

    if (!appName.trim()) {
      setError('Please enter an application name');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const options: ExportOptions = {
        format,
        appName: appName.trim(),
      };

      await exportProject(editor, options);
      
      // Success - close dialog
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to export project';
      setError(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [editor, format, appName, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isExporting) {
      handleExport();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleExport, isExporting, onClose]);

  if (!isOpen) {
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2
          style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            fontWeight: 600,
            color: '#262626',
          }}
        >
          Export Project
        </h2>

        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '14px',
            color: '#595959',
            lineHeight: '1.6',
          }}
        >
          Export your canvas as a complete, deployable project with routing and shared resources.
        </p>

        {/* Application Name Input */}
        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="app-name"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#262626',
            }}
          >
            Application Name
          </label>
          <input
            id="app-name"
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            disabled={isExporting}
            placeholder="my-app"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#1890ff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d9d9d9';
            }}
          />
        </div>

        {/* Export Format Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#262626',
            }}
          >
            Export Format
          </label>

          {/* Static HTML Option */}
          <FormatOption
            id="format-static"
            value="static"
            selected={format === 'static'}
            onChange={setFormat}
            disabled={isExporting}
            title="Static HTML"
            description="Pure HTML/CSS/JS - no build tools required, deploy anywhere"
            recommended
          />

          {/* React Option */}
          <FormatOption
            id="format-react"
            value="react"
            selected={format === 'react'}
            onChange={setFormat}
            disabled={isExporting}
            title="React Project"
            description="React components with React Router - requires npm install"
          />

          {/* Vue Option */}
          <FormatOption
            id="format-vue"
            value="vue"
            selected={format === 'vue'}
            onChange={setFormat}
            disabled={isExporting}
            title="Vue Project"
            description="Vue SFC with Vue Router - requires npm install"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#cf1322',
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fff',
              color: '#595959',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.6 : 1,
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting || !appName.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: isExporting || !appName.trim() ? '#d9d9d9' : '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isExporting || !appName.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isExporting ? (
              <>
                <span>⏳</span>
                Exporting...
              </>
            ) : (
              <>
                <span>📦</span>
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Format option radio button component
 */
interface FormatOptionProps {
  id: string;
  value: 'static' | 'react' | 'vue';
  selected: boolean;
  onChange: (value: 'static' | 'react' | 'vue') => void;
  disabled: boolean;
  title: string;
  description: string;
  recommended?: boolean;
}

const FormatOption: React.FC<FormatOptionProps> = ({
  id,
  value,
  selected,
  onChange,
  disabled,
  title,
  description,
  recommended,
}) => {
  return (
    <label
      htmlFor={id}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        padding: '12px',
        marginBottom: '8px',
        border: `2px solid ${selected ? '#1890ff' : '#d9d9d9'}`,
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: selected ? '#e6f7ff' : '#fff',
        transition: 'all 0.2s',
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !selected) {
          e.currentTarget.style.borderColor = '#40a9ff';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !selected) {
          e.currentTarget.style.borderColor = '#d9d9d9';
        }
      }}
    >
      <input
        id={id}
        type="radio"
        name="export-format"
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
        disabled={disabled}
        style={{
          marginTop: '2px',
          marginRight: '12px',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#262626',
            }}
          >
            {title}
          </span>
          {recommended && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#52c41a',
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '3px',
                padding: '2px 6px',
              }}
            >
              RECOMMENDED
            </span>
          )}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            color: '#595959',
            lineHeight: '1.5',
          }}
        >
          {description}
        </p>
      </div>
    </label>
  );
};

/**
 * Infer application name from canvas context
 * 
 * Attempts to extract a meaningful app name from:
 * 1. First page's title tag
 * 2. First page's h1 tag
 * 3. Falls back to 'my-app'
 * 
 * @param editor - tldraw Editor instance
 * @returns Inferred application name
 */
function inferAppNameFromCanvas(editor: Editor): string {
  const shapes = editor.getCurrentPageShapes();
  const htmlShapes = shapes.filter((shape: any) => shape.type === 'html');

  if (htmlShapes.length === 0) {
    return 'my-app';
  }

  // Try to extract name from first shape
  const firstShape = htmlShapes[0] as any;
  const html = firstShape.props.html || '';

  // Try title tag
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return sanitizeAppName(titleMatch[1]);
  }

  // Try h1 tag
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    return sanitizeAppName(h1Match[1]);
  }

  // Try meta name or og:title
  const metaNameMatch = html.match(/<meta[^>]*name=["']application-name["'][^>]*content=["']([^"']+)["']/i);
  if (metaNameMatch && metaNameMatch[1]) {
    return sanitizeAppName(metaNameMatch[1]);
  }

  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    return sanitizeAppName(ogTitleMatch[1]);
  }

  return 'my-app';
}

/**
 * Sanitize a string to be a valid app name
 * 
 * @param name - Raw name string
 * @returns Sanitized app name
 */
function sanitizeAppName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30) || 'my-app';
}
