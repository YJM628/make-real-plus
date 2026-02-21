/**
 * AIPromptPanel - Left sidebar panel for AI generation input
 */
import * as React from 'react';
import { useState, useCallback } from 'react';
import type { AIGenerationContext } from '../../../types';
import { SidebarLeft01Icon } from 'hugeicons-react';

interface AIPromptPanelProps {
  onSubmit: (context: AIGenerationContext) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  style?: React.CSSProperties;
}

export const AIPromptPanel: React.FC<AIPromptPanelProps> = ({ 
  onSubmit,
  isCollapsed = false,
  onToggleCollapse,
  style,
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDesignSystem, setAiDesignSystem] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!aiPrompt.trim()) return;

      onSubmit({
        prompt: aiPrompt.trim(),
        designSystem: aiDesignSystem || undefined,
      });

      // Clear the form after submission
      setAiPrompt('');
      setAiDesignSystem('');
    },
    [aiPrompt, aiDesignSystem, onSubmit]
  );

  // Collapsed state - show only a thin bar with expand button
  if (isCollapsed) {
    return (
      <div
        style={{
          width: '38px',
          height: '100%',
          backgroundColor: '#f5f5f5',
          borderRight: '1px solid #ddd',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '12px',
          ...style,
        }}
      >
        <button
          onClick={onToggleCollapse}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
          }}
          title="展开侧边栏"
          aria-label="展开侧边栏"
        >
          <SidebarLeft01Icon size={18} color="currentColor" style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '400px',
        height: '100%',
        backgroundColor: '#f5f5f5',
        borderRight: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Header with collapse button */}
      <div
        style={{
          padding: '16px 24px',
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
            fontSize: '20px',
            fontWeight: '600',
            color: '#333',
          }}
        >
          Generate HTML with AI
        </h2>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
            }}
            title="收起侧边栏"
            aria-label="收起侧边栏"
          >
            <SidebarLeft01Icon size={20} color="currentColor" />
          </button>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          padding: '24px',
          height: '100%',
          overflow: 'auto',
        }}
      >

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="ai-prompt"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#555',
              }}
            >
              Describe what you want to create:
            </label>
            <textarea
              id="ai-prompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Create a modern login form with email and password fields..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="design-system"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#555',
              }}
            >
              Design System (optional):
            </label>
            <select
              id="design-system"
              value={aiDesignSystem}
              onChange={(e) => setAiDesignSystem(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              <option value="">None</option>
              <option value="tailwind">Tailwind CSS</option>
              <option value="material-ui">Material UI</option>
              <option value="ant-design">Ant Design</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!aiPrompt.trim()}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: !aiPrompt.trim() ? '#ccc' : '#007bff',
              color: 'white',
              cursor: !aiPrompt.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            Generate
          </button>
        </form>
      </div>
    </div>
  );
};
