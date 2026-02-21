/**
 * Unit tests for AIInputDialog component
 * Feature: ai-html-visual-editor
 * Requirements: 15.1, 15.2
 */

import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AIInputDialog } from '../../components/dialogs/AIInputDialog';
import type { AIGenerationContext } from '../../types';

describe('AIInputDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();
  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 15.1: Display AI input dialog', () => {
    it('should render when open is true', () => {
      render(<AIInputDialog {...defaultProps} />);
      
      expect(screen.getByText('Generate HTML with AI')).toBeInTheDocument();
      expect(screen.getByLabelText(/Describe what you want to create/i)).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      render(<AIInputDialog {...defaultProps} open={false} />);
      
      expect(screen.queryByText('Generate HTML with AI')).not.toBeInTheDocument();
    });

    it('should focus textarea when dialog opens', async () => {
      const { rerender } = render(<AIInputDialog {...defaultProps} open={false} />);
      
      rerender(<AIInputDialog {...defaultProps} open={true} />);
      
      await waitFor(() => {
        const textarea = screen.getByLabelText(/Describe what you want to create/i);
        expect(textarea).toHaveFocus();
      });
    });

    it('should display design system selector', () => {
      render(<AIInputDialog {...defaultProps} />);
      
      const select = screen.getByLabelText(/Design System/i);
      expect(select).toBeInTheDocument();
      
      // Check options
      expect(screen.getByRole('option', { name: 'None' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Tailwind CSS' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Material UI' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Ant Design' })).toBeInTheDocument();
    });

    it('should use default design system if provided', () => {
      render(<AIInputDialog {...defaultProps} defaultDesignSystem="tailwind" />);
      
      const select = screen.getByLabelText(/Design System/i) as HTMLSelectElement;
      expect(select.value).toBe('tailwind');
    });
  });

  describe('Requirement 15.2: Handle user input and submission', () => {
    it('should update prompt when user types', async () => {
      const user = userEvent.setup();
      render(<AIInputDialog {...defaultProps} />);
      
      const textarea = screen.getByLabelText(/Describe what you want to create/i);
      await user.type(textarea, 'Create a login form');
      
      expect(textarea).toHaveValue('Create a login form');
    });

    it('should update design system when user selects', async () => {
      const user = userEvent.setup();
      render(<AIInputDialog {...defaultProps} />);
      
      const select = screen.getByLabelText(/Design System/i);
      await user.selectOptions(select, 'material-ui');
      
      expect(select).toHaveValue('material-ui');
    });

    it('should call onSubmit with correct context when form is submitted', async () => {
      const user = userEvent.setup();
      render(<AIInputDialog {...defaultProps} />);
      
      const textarea = screen.getByLabelText(/Describe what you want to create/i);
      const select = screen.getByLabelText(/Design System/i);
      const submitButton = screen.getByRole('button', { name: /Generate/i });
      
      await user.type(textarea, 'Create a login form');
      await user.selectOptions(select, 'tailwind');
      await user.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        prompt: 'Create a login form',
        designSystem: 'tailwind',
      } as AIGenerationContext);
    });

    it('should not call onSubmit when prompt is empty', async () => {
      const user = userEvent.setup();
      render(<AIInputDialog {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /Generate/i });
      await user.click(submitButton);
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should trim whitespace from prompt', async () => {
      const user = userEvent.setup();
      render(<AIInputDialog {...defaultProps} />);
      
      const textarea = screen.getByLabelText(/Describe what you want to create/i);
      const submitButton = screen.getByRole('button', { name: /Generate/i });
      
      await user.type(textarea, '  Create a form  ');
      await user.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        prompt: 'Create a form',
        designSystem: undefined,
      } as AIGenerationContext);
    });

    it('should submit on Ctrl+Enter', async () => {
      render(<AIInputDialog {...defaultProps} />);
      
      const textarea = screen.getByLabelText(/Describe what you want to create/i);
      
      fireEvent.change(textarea, { target: { value: 'Create a form' } });
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        prompt: 'Create a form',
        designSystem: undefined,
      } as AIGenerationContext);
    });

    it('should submit on Cmd+Enter (Mac)', async () => {
      render(<AIInputDialog {...defaultProps} />);
      
      const textarea = screen.getByLabelText(/Describe what you want to create/i);
      
      fireEvent.change(textarea, { target: { value: 'Create a form' } });
      fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        prompt: 'Create a form',
        designSystem: undefined,
      } as AIGenerationContext);
    });

    it('should disable submit button when prompt is empty', () => {
      render(<AIInputDialog {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /Generate/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when prompt is not empty', async () => {
      const user = userEvent.setup();
      render(<AIInputDialog {...defaultProps} />);
      
      const textarea = screen.getByLabelText(/Describe what you want to create/i);
      const submitButton = screen.getByRole('button', { name: /Generate/i });
      
      await user.type(textarea, 'Create a form');
      
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Dialog interactions', () => {
    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<AIInputDialog {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when Escape key is pressed', () => {
      render(<AIInputDialog {...defaultProps} />);
      
      const textarea = screen.getByLabelText(/Describe what you want to create/i);
      fireEvent.keyDown(textarea, { key: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking backdrop', async () => {
      render(<AIInputDialog {...defaultProps} />);
      
      // Find the backdrop by its style properties
      const backdrop = screen.getByText('Generate HTML with AI').parentElement?.parentElement;
      
      // Simulate clicking the backdrop directly
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should not call onClose when clicking dialog content', async () => {
      const user = userEvent.setup();
      render(<AIInputDialog {...defaultProps} />);
      
      const dialogContent = screen.getByText('Generate HTML with AI').closest('div');
      if (dialogContent) {
        await user.click(dialogContent);
        expect(mockOnClose).not.toHaveBeenCalled();
      }
    });

    it('should reset form when dialog closes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<AIInputDialog {...defaultProps} />);
      
      const textarea = screen.getByLabelText(/Describe what you want to create/i);
      await user.type(textarea, 'Create a form');
      
      // Close dialog
      rerender(<AIInputDialog {...defaultProps} open={false} />);
      
      // Reopen dialog
      rerender(<AIInputDialog {...defaultProps} open={true} />);
      
      const newTextarea = screen.getByLabelText(/Describe what you want to create/i);
      expect(newTextarea).toHaveValue('');
    });

    it('should show "Generating..." text when submitting', async () => {
      const user = userEvent.setup();
      render(<AIInputDialog {...defaultProps} />);
      
      const textarea = screen.getByLabelText(/Describe what you want to create/i);
      await user.type(textarea, 'Create a form');
      
      const submitButton = screen.getByRole('button', { name: /Generate/i });
      await user.click(submitButton);
      
      expect(screen.getByRole('button', { name: /Generating.../i })).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle position prop', () => {
      render(<AIInputDialog {...defaultProps} position={{ x: 100, y: 200 }} />);
      
      // Position is passed but not displayed in UI
      // Just verify dialog renders correctly
      expect(screen.getByText('Generate HTML with AI')).toBeInTheDocument();
    });

    it('should handle empty design system selection', async () => {
      const user = userEvent.setup();
      render(<AIInputDialog {...defaultProps} defaultDesignSystem="tailwind" />);
      
      const textarea = screen.getByLabelText(/Describe what you want to create/i);
      const select = screen.getByLabelText(/Design System/i);
      const submitButton = screen.getByRole('button', { name: /Generate/i });
      
      await user.type(textarea, 'Create a form');
      await user.selectOptions(select, '');
      await user.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        prompt: 'Create a form',
        designSystem: undefined,
      } as AIGenerationContext);
    });
  });
});
