/**
 * ThemeEditorPanel - Right sidebar panel for global theme editing
 * Feature: global-theme-editor
 * Requirements: 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.3, 5.3
 *
 * Provides UI for editing shared CSS variables and navigation components
 * across all pages in a page group.
 */
import * as React from 'react';
import { useMemo } from 'react';
import type { Editor } from 'tldraw';
import { useThemeEditor } from '../hooks/useThemeEditor';
import type { CssVariable } from '../../../utils/theme/parseCssVariables';

export interface ThemeEditorPanelProps {
  isOpen: boolean;
  editor: Editor | null;
  onClose: () => void;
}

/** Category display labels */
const CATEGORY_LABELS: Record<CssVariable['category'], string> = {
  color: '🎨 颜色',
  font: '🔤 字体',
  spacing: '📏 间距',
  other: '⚙️ 其他',
};

/** Category display order */
const CATEGORY_ORDER: CssVariable['category'][] = ['color', 'font', 'spacing', 'other'];

export const ThemeEditorPanel: React.FC<ThemeEditorPanelProps> = ({
  isOpen,
  editor,
  onClose,
}) => {
  const {
    pageGroups,
    selectedGroupId,
    cssVariables,
    sharedNavigation,
    selectGroup,
    updateVariable,
    updateNavigation,
    error,
  } = useThemeEditor(editor);

  // Requirement 2.1: Group CSS variables by category
  const variablesByCategory = useMemo(() => {
    const grouped: Record<CssVariable['category'], CssVariable[]> = {
      color: [],
      font: [],
      spacing: [],
      other: [],
    };
    for (const v of cssVariables) {
      grouped[v.category].push(v);
    }
    return grouped;
  }, [cssVariables]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '280px',
        height: '100%',
        backgroundColor: '#f5f5f5',
        borderLeft: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
        boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
      }}
      data-testid="theme-editor-panel"
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fff',
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#333',
          }}
        >
          全局主题编辑器
        </h2>
        <button
          onClick={onClose}
          data-testid="theme-editor-close"
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#666',
            padding: '4px 6px',
            borderRadius: '4px',
            lineHeight: 1,
          }}
          aria-label="关闭主题编辑器"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '12px 16px',
        }}
      >
        {/* Requirement 5.3: Error display */}
        {error && (
          <div
            data-testid="theme-editor-error"
            style={{
              padding: '8px 10px',
              marginBottom: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              color: '#dc2626',
              fontSize: '12px',
            }}
          >
            {error}
          </div>
        )}

        {/* Requirement 4.1, 4.3: Page group selector (shown when multiple groups exist) */}
        {pageGroups.length > 1 && (
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="page-group-select"
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#555',
              }}
            >
              页面组
            </label>
            <select
              id="page-group-select"
              data-testid="page-group-selector"
              value={selectedGroupId ?? ''}
              onChange={(e) => selectGroup(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              {pageGroups.map((group) => (
                <option key={group.groupId} value={group.groupId}>
                  {group.groupId} ({group.shapeIds.length} 页)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Requirement 2.1, 2.2, 2.3: CSS Variables editing by category */}
        {cssVariables.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h3
              style={{
                margin: '0 0 10px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
              }}
            >
              CSS 变量
            </h3>
            {CATEGORY_ORDER.map((category) => {
              const vars = variablesByCategory[category];
              if (vars.length === 0) return null;
              return (
                <div key={category} style={{ marginBottom: '12px' }}>
                  <h4
                    style={{
                      margin: '0 0 6px 0',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#666',
                      borderBottom: '1px solid #e5e5e5',
                      paddingBottom: '3px',
                    }}
                  >
                    {CATEGORY_LABELS[category]}
                  </h4>
                  {vars.map((variable) => (
                    <CssVariableEditor
                      key={variable.name}
                      variable={variable}
                      onUpdate={updateVariable}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Requirement 3.1, 3.2: Navigation editing */}
        {sharedNavigation && (
          <div style={{ marginBottom: '16px' }}>
            <h3
              style={{
                margin: '0 0 10px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
              }}
            >
              共享导航
            </h3>

            {/* Header navigation */}
            <div style={{ marginBottom: '10px' }}>
              <label
                htmlFor="nav-header"
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#555',
                }}
              >
                页头 (Header)
              </label>
              <NavigationTextarea
                id="nav-header"
                testId="nav-header-textarea"
                value={sharedNavigation.header}
                onChange={(val) => updateNavigation({ header: val })}
                placeholder="输入页头 HTML..."
              />
            </div>

            {/* Footer navigation */}
            <div style={{ marginBottom: '10px' }}>
              <label
                htmlFor="nav-footer"
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#555',
                }}
              >
                页脚 (Footer)
              </label>
              <NavigationTextarea
                id="nav-footer"
                testId="nav-footer-textarea"
                value={sharedNavigation.footer}
                onChange={(val) => updateNavigation({ footer: val })}
                placeholder="输入页脚 HTML..."
              />
            </div>
          </div>
        )}

        {/* Empty state when no data */}
        {cssVariables.length === 0 && !sharedNavigation && pageGroups.length > 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#999',
              fontSize: '14px',
            }}
          >
            当前页面组没有共享主题数据
          </div>
        )}

        {pageGroups.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#999',
              fontSize: '14px',
            }}
          >
            画布上没有页面组，请先批量生成页面
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Individual CSS variable editor row.
 * Requirement 2.2: Color variables use <input type="color">
 * Requirement 2.3: Non-color variables use <input type="text">
 */
interface CssVariableEditorProps {
  variable: CssVariable;
  onUpdate: (name: string, value: string) => void;
}

const CssVariableEditor: React.FC<CssVariableEditorProps> = ({
  variable,
  onUpdate,
}) => {
  // Local state for immediate input responsiveness
  const [localValue, setLocalValue] = React.useState(variable.value);

  // Sync local state when parent value changes (e.g. switching page groups)
  React.useEffect(() => {
    setLocalValue(variable.value);
  }, [variable.value]);

  const handleChange = React.useCallback(
    (newValue: string) => {
      setLocalValue(newValue);
      onUpdate(variable.name, newValue);
    },
    [variable.name, onUpdate]
  );

  // Format variable name for display: remove "--" prefix and replace hyphens with spaces
  const displayName = variable.name
    .replace(/^--/, '')
    .replace(/-/g, ' ');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '6px',
        gap: '6px',
      }}
    >
      <label
        style={{
          flex: 1,
          fontSize: '11px',
          color: '#444',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={variable.name}
      >
        {displayName}
      </label>
      {variable.category === 'color' ? (
        <input
          type="color"
          data-testid={`color-input-${variable.name}`}
          value={normalizeColorForPicker(localValue)}
          onChange={(e) => handleChange(e.target.value)}
          style={{
            width: '32px',
            height: '24px',
            padding: '2px',
            border: '1px solid #ddd',
            borderRadius: '3px',
            cursor: 'pointer',
            backgroundColor: 'transparent',
          }}
        />
      ) : (
        <input
          type="text"
          data-testid={`text-input-${variable.name}`}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          style={{
            width: '100px',
            padding: '3px 6px',
            fontSize: '11px',
            border: '1px solid #ddd',
            borderRadius: '3px',
            fontFamily: 'monospace',
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  );
};

/**
 * NavigationTextarea - textarea with local state for responsive input
 */
interface NavigationTextareaProps {
  id: string;
  testId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const NavigationTextarea: React.FC<NavigationTextareaProps> = ({
  id,
  testId,
  value,
  onChange,
  placeholder,
}) => {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <textarea
      id={id}
      data-testid={testId}
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        onChange(e.target.value);
      }}
      placeholder={placeholder}
      style={{
        width: '100%',
        minHeight: '80px',
        padding: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        border: '1px solid #ddd',
        borderRadius: '4px',
        resize: 'vertical',
        boxSizing: 'border-box',
        backgroundColor: '#fff',
      }}
    />
  );
};

/**
 * Normalize a color value for the HTML color picker input.
 * The color picker only accepts 7-character hex values (#rrggbb).
 * If the value is a 4-character shorthand (#rgb), expand it.
 * If the value is not a valid hex, return a default.
 */
function normalizeColorForPicker(value: string): string {
  const trimmed = value.trim();

  // Already a valid 7-char hex
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed;
  }

  // Shorthand 4-char hex (#rgb) → expand to #rrggbb
  const shortMatch = trimmed.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/);
  if (shortMatch) {
    return `#${shortMatch[1]}${shortMatch[1]}${shortMatch[2]}${shortMatch[2]}${shortMatch[3]}${shortMatch[3]}`;
  }

  // Default fallback for non-hex values (rgb(), hsl(), etc.)
  return '#000000';
}
