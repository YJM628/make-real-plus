/**
 * LoadingIndicator - Loading notification component
 * Feature: editor-canvas-refactor
 * Requirements: 9.2, 9.4
 * 
 * Displays loading messages in a blue floating toast notification.
 * Returns null when not visible.
 */

import * as React from 'react';

interface LoadingIndicatorProps {
  visible: boolean;
  message?: string;
}

/**
 * LoadingIndicator component
 * 
 * Displays loading messages in a floating toast notification at the top center of the screen.
 * 
 * Requirements:
 * - 9.2: Display blue floating toast for batch generation progress
 * - 9.4: Return null when visible is false
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  visible, 
  message = 'Loading...' 
}) => {
  // Return null when not visible (Requirement 9.4)
  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 999,
        maxWidth: '500px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        fontWeight: '500',
        pointerEvents: 'none',
      }}
    >
      {message}
    </div>
  );
};
