/**
 * ErrorToast - Error notification component
 * Feature: editor-canvas-refactor
 * Requirements: 9.1, 9.3
 * 
 * Displays error messages in a red floating toast notification.
 * Returns null when no message is provided.
 */

import * as React from 'react';

interface ErrorToastProps {
  message: string | null;
}

/**
 * ErrorToast component
 * 
 * Displays error messages in a floating toast notification at the top center of the screen.
 * 
 * Requirements:
 * - 9.1: Accept error message string and display in red floating toast
 * - 9.3: Return null when message is null
 */
export const ErrorToast: React.FC<ErrorToastProps> = ({ message }) => {
  // Return null when message is null (Requirement 9.3)
  if (message === null) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#ef4444',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 10000,
        maxWidth: '500px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        fontWeight: '500',
      }}
    >
      {message}
    </div>
  );
};
