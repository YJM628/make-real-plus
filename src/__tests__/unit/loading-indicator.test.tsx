/**
 * Unit tests for LoadingIndicator component
 * Feature: editor-canvas-refactor
 * Requirements: 9.2, 9.4
 */

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingIndicator } from '../../components/canvas/notifications/LoadingIndicator';

describe('LoadingIndicator', () => {
  describe('Requirement 9.4: Return null when visible is false', () => {
    it('should not render when visible is false', () => {
      const { container } = render(<LoadingIndicator visible={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when visible is false even with message', () => {
      const { container } = render(
        <LoadingIndicator visible={false} message="Custom message" />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Requirement 9.2: Render blue floating toast', () => {
    it('should render when visible is true', () => {
      const { container } = render(<LoadingIndicator visible={true} />);
      expect(container.firstChild).not.toBeNull();
    });

    it('should display default "Loading..." message when no message provided', () => {
      render(<LoadingIndicator visible={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should display custom message when provided', () => {
      const customMessage = 'Generating batch pages...';
      render(<LoadingIndicator visible={true} message={customMessage} />);
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should have blue background color', () => {
      render(<LoadingIndicator visible={true} />);
      const element = screen.getByText('Loading...');
      expect(element).toHaveStyle({ backgroundColor: '#3b82f6' });
    });

    it('should have white text color', () => {
      render(<LoadingIndicator visible={true} />);
      const element = screen.getByText('Loading...');
      expect(element).toHaveStyle({ color: 'rgb(255, 255, 255)' });
    });

    it('should be positioned fixed at top center', () => {
      render(<LoadingIndicator visible={true} />);
      const element = screen.getByText('Loading...');
      expect(element).toHaveStyle({
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
      });
    });

    it('should have high z-index for visibility', () => {
      render(<LoadingIndicator visible={true} />);
      const element = screen.getByText('Loading...');
      expect(element).toHaveStyle({ zIndex: 10000 });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string message', () => {
      const { container } = render(<LoadingIndicator visible={true} message="" />);
      const element = container.firstChild as HTMLElement;
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBe('');
    });

    it('should handle long messages', () => {
      const longMessage = 'This is a very long loading message that might wrap to multiple lines in the toast notification';
      render(<LoadingIndicator visible={true} message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });
});
