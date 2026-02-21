/**
 * AIInputDialog - Dialog for AI-driven HTML generation
 * Feature: ai-html-visual-editor
 * Requirements: 15.1, 15.2
 * 
 * Displays a dialog where users can input natural language descriptions
 * to generate HTML content via AI.
 */

import * as React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { AIGenerationContext } from '../../types';

export interface AIInputDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  
  /** Callback when dialog should close */
  onClose: () => void;
  
  /** Callback when user submits a prompt */
  onSubmit: (context: AIGenerationContext) => void;
  
  /** Position to place the generated shape (from double-click) */
  position?: { x: number; y: number };
  
  /** Optional design system preference */
  defaultDesignSystem?: string;
}

/**
 * AIInputDialog component
 * 
 * Provides a modal dialog for users to input natural language descriptions
 * for AI-driven HTML generation. Supports design system selection and
 * handles form submission.
 * 
 * Requirements:
 * - 15.1: Display AI input dialog when user double-clicks canvas
 * - 15.2: Handle user input and submit to AI generation
 */
export const AIInputDialog: React.FC<AIInputDialogProps> = ({
  open,
  onClose,
  onSubmit,
  position,
  defaultDesignSystem,
}) => {
  const [prompt, setPrompt] = useState('');
  const [designSystem, setDesignSystem] = useState(defaultDesignSystem || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when dialog opens
  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setPrompt('');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!prompt.trim() || isSubmitting) {
        return;
      }

      setIsSubmitting(true);

      const context: AIGenerationContext = {
        prompt: prompt.trim(),
        designSystem: designSystem || undefined,
      };

      // Call onSubmit and handle completion
      try {
        onSubmit(context);
      } catch (error) {
        console.error('Submit error:', error);
        setIsSubmitting(false);
      }
    },
    [prompt, designSystem, onSubmit, isSubmitting]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Ctrl+Enter or Cmd+Enter
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit(e as any);
      }
      // Close on Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [handleSubmit, onClose]
  );

  if (!open) {
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
        zIndex: 10000,
      }}
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          width: '90%',
          maxWidth: '600px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#333',
          }}
        >
          Generate HTML with AI
        </h2>

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
              ref={textareaRef}
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Create a modern login form with email and password fields..."
              disabled={isSubmitting}
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
            <div
              style={{
                marginTop: '4px',
                fontSize: '12px',
                color: '#888',
              }}
            >
              Press Ctrl+Enter (Cmd+Enter on Mac) to submit
            </div>
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
              value={designSystem}
              onChange={(e) => setDesignSystem(e.target.value)}
              disabled={isSubmitting}
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

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                color: '#555',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!prompt.trim() || isSubmitting}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: !prompt.trim() || isSubmitting ? '#ccc' : '#007bff',
                color: 'white',
                cursor: !prompt.trim() || isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
