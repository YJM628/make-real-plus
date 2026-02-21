/**
 * Tests for AIPromptPanel component
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { AIPromptPanel } from '../../components/canvas/panels/AIPromptPanel';

describe('AIPromptPanel', () => {
  it('should render the panel with form elements', () => {
    const mockOnSubmit = jest.fn();
    render(<AIPromptPanel onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Generate HTML with AI')).toBeInTheDocument();
    expect(screen.getByLabelText(/Describe what you want to create/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Design System/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument();
  });

  it('should disable submit button when prompt is empty', () => {
    const mockOnSubmit = jest.fn();
    render(<AIPromptPanel onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /Generate/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when prompt has text', () => {
    const mockOnSubmit = jest.fn();
    render(<AIPromptPanel onSubmit={mockOnSubmit} />);

    const textarea = screen.getByLabelText(/Describe what you want to create/i);
    fireEvent.change(textarea, { target: { value: 'Create a login form' } });

    const submitButton = screen.getByRole('button', { name: /Generate/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('should call onSubmit with correct context when form is submitted', () => {
    const mockOnSubmit = jest.fn();
    render(<AIPromptPanel onSubmit={mockOnSubmit} />);

    const textarea = screen.getByLabelText(/Describe what you want to create/i);
    const select = screen.getByLabelText(/Design System/i);
    const submitButton = screen.getByRole('button', { name: /Generate/i });

    fireEvent.change(textarea, { target: { value: 'Create a login form' } });
    fireEvent.change(select, { target: { value: 'tailwind' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      prompt: 'Create a login form',
      designSystem: 'tailwind',
    });
  });

  it('should clear form after submission', () => {
    const mockOnSubmit = jest.fn();
    render(<AIPromptPanel onSubmit={mockOnSubmit} />);

    const textarea = screen.getByLabelText(/Describe what you want to create/i) as HTMLTextAreaElement;
    const select = screen.getByLabelText(/Design System/i) as HTMLSelectElement;
    const submitButton = screen.getByRole('button', { name: /Generate/i });

    fireEvent.change(textarea, { target: { value: 'Create a login form' } });
    fireEvent.change(select, { target: { value: 'tailwind' } });
    fireEvent.click(submitButton);

    expect(textarea.value).toBe('');
    expect(select.value).toBe('');
  });

  it('should not submit when prompt is only whitespace', () => {
    const mockOnSubmit = jest.fn();
    render(<AIPromptPanel onSubmit={mockOnSubmit} />);

    const textarea = screen.getByLabelText(/Describe what you want to create/i);
    const submitButton = screen.getByRole('button', { name: /Generate/i });

    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
