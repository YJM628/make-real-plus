/**
 * Unit tests for ErrorToast component
 * Feature: editor-canvas-refactor
 * Requirements: 9.1, 9.3
 */

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorToast } from '../../components/canvas/notifications/ErrorToast';

describe('ErrorToast', () => {
  describe('Requirement 9.1: Display error message in red floating toast', () => {
    it('should render error message text when message is provided', () => {
      const errorMessage = 'AI generation failed: Network error';
      
      render(<ErrorToast message={errorMessage} />);
      
      // Verify the error message is displayed
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should render with red background color', () => {
      const errorMessage = 'Test error';
      
      const { container } = render(<ErrorToast message={errorMessage} />);
      const toastElement = container.firstChild as HTMLElement;
      
      // Verify red background color (#ef4444)
      expect(toastElement).toHaveStyle({ backgroundColor: '#ef4444' });
    });

    it('should render with white text color', () => {
      const errorMessage = 'Test error';
      
      const { container } = render(<ErrorToast message={errorMessage} />);
      const toastElement = container.firstChild as HTMLElement;
      
      // Verify white text color (rgb(255, 255, 255) is equivalent to 'white')
      expect(toastElement).toHaveStyle({ color: 'rgb(255, 255, 255)' });
    });

    it('should render as a fixed positioned element at the top center', () => {
      const errorMessage = 'Test error';
      
      const { container } = render(<ErrorToast message={errorMessage} />);
      const toastElement = container.firstChild as HTMLElement;
      
      // Verify fixed positioning at top center
      expect(toastElement).toHaveStyle({
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
      });
    });

    it('should render with high z-index for visibility', () => {
      const errorMessage = 'Test error';
      
      const { container } = render(<ErrorToast message={errorMessage} />);
      const toastElement = container.firstChild as HTMLElement;
      
      // Verify high z-index (10000)
      expect(toastElement).toHaveStyle({ zIndex: 10000 });
    });
  });

  describe('Requirement 9.3: Return null when message is null', () => {
    it('should not render anything when message is null', () => {
      const { container } = render(<ErrorToast message={null} />);
      
      // Verify nothing is rendered
      expect(container.firstChild).toBeNull();
    });

    it('should not render when message is explicitly null', () => {
      const { container } = render(<ErrorToast message={null} />);
      
      // Verify the container is empty
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Edge cases', () => {
    it('should render empty string message', () => {
      const { container } = render(<ErrorToast message="" />);
      
      // Empty string is not null, so it should render the toast (even if empty)
      expect(container.firstChild).not.toBeNull();
    });

    it('should render long error messages', () => {
      const longMessage = 'This is a very long error message that should still be displayed correctly in the toast notification component without breaking the layout or causing any visual issues.';
      
      render(<ErrorToast message={longMessage} />);
      
      // Verify long message is displayed
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should render error messages with special characters', () => {
      const specialMessage = 'Error: <script>alert("test")</script> & "quotes"';
      
      render(<ErrorToast message={specialMessage} />);
      
      // Verify special characters are displayed (React escapes them by default)
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should render multiline error messages', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      
      const { container } = render(<ErrorToast message={multilineMessage} />);
      
      // Verify multiline message is displayed (text content includes newlines)
      const toastElement = container.firstChild as HTMLElement;
      expect(toastElement.textContent).toBe(multilineMessage);
    });
  });
});
