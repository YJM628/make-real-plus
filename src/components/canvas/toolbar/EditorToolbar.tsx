/**
 * EditorToolbar - Custom toolbar component for EditorCanvas
 * Feature: editor-canvas-refactor
 * Requirements: 7.1
 * 
 * Provides custom toolbar rendering with text-only buttons for mode switching
 * and other custom tools. Hides the StylePanel.
 */

import {
  type TLComponents,
  DefaultToolbar,
  TldrawUiMenuItem,
  useIsToolSelected,
  useTools,
} from 'tldraw';
import {
  Edit03Icon,
  CodeIcon,
  Download01Icon,
  EyeIcon,
  Share01Icon,
  PlateIcon,
} from 'hugeicons-react';

/**
 * Create toolbar components configuration
 * 
 * @returns TLComponents configuration with custom Toolbar and hidden StylePanel
 * 
 * Requirements:
 * - 7.1: Render all existing toolbar buttons with text labels
 * - 7.1: Hide StylePanel
 */
export function createToolbarComponents(): TLComponents {
  return {
    Toolbar: (props) => {
      const tools = useTools();
      
      // Helper to create an icon button
      const IconButton = ({ 
        tool, 
        isSelected, 
        label,
        icon: Icon,
      }: { 
        tool: any; 
        isSelected?: boolean; 
        label: string;
        icon: React.ComponentType<{ size: number; color: string }>;
      }) => (
        <button
          type="button"
          onClick={() => tool.onSelect?.('toolbar')}
          className={`tlui-button tlui-button__tool ${isSelected ? 'tlui-button__tool--selected' : ''}`}
          style={{
            padding: '6px',
            minWidth: '36px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isSelected ? 'var(--color-selected)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
          title={label}
        >
          <Icon size={18} color="currentColor" />
        </button>
      );
      
      return (
        <DefaultToolbar {...props} orientation="vertical">
          {/* Basic tools with icons */}
          <TldrawUiMenuItem {...tools['select']} isSelected={useIsToolSelected(tools['select'])} />
          <TldrawUiMenuItem {...tools['hand']} isSelected={useIsToolSelected(tools['hand'])} />
          
          {/* Custom tools with Hugeicons */}
          <IconButton tool={tools['mode-edit']} label="Edit" icon={Edit03Icon} />
          <IconButton tool={tools['view-code']} label="Code" icon={CodeIcon} />
          <IconButton tool={tools['export-html']} isSelected={useIsToolSelected(tools['export-html'])} label="Export" icon={Download01Icon} />
          <IconButton tool={tools['merge-preview']} label="Preview" icon={EyeIcon} />
          <IconButton tool={tools['share-app']} label="Share" icon={Share01Icon} />
          <IconButton tool={tools['theme-editor']} label="Theme" icon={PlateIcon} />
        </DefaultToolbar>
      );
    },
    // Hide style panels (color, opacity, fill, stroke, size)
    StylePanel: null,
  };
}
