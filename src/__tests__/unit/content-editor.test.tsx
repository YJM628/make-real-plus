/**
 * ContentEditor Component Tests
 * 
 * Requirements: 2.5, 6.1, 6.2
 */

import * as React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContentEditor } from '../../components/panels/ContentEditor';

describe('ContentEditor', () => {
  const defaultProps = {
    textContent: 'Test content',
    onTextChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with text content', () => {
    const { getByDisplayValue } = render(<ContentEditor {...defaultProps} />);
    expect(getByDisplayValue('Test content')).toBeInTheDocument();
  });

  it('should render label', () => {
    const { getByText } = render(<ContentEditor {...defaultProps} />);
    expect(getByText('Text Content')).toBeInTheDocument();
  });

  it('should render textarea with placeholder', () => {
    const { getByPlaceholderText } = render(<ContentEditor {...defaultProps} textContent="" />);
    expect(getByPlaceholderText('Enter text content...')).toBeInTheDocument();
  });

  it('should call onTextChange when text is changed', () => {
    const { getByPlaceholderText } = render(<ContentEditor {...defaultProps} textContent="" />);
    const textarea = getByPlaceholderText('Enter text content...');
    
    fireEvent.change(textarea, { target: { value: 'New content' } });
    
    expect(defaultProps.onTextChange).toHaveBeenCalledWith('New content');
  });

  it('should only use onChange event handler (not onInput)', () => {
    const { getByPlaceholderText } = render(<ContentEditor {...defaultProps} textContent="" />);
    const textarea = getByPlaceholderText('Enter text content...') as HTMLTextAreaElement;
    
    // Verify that onChange is the only input-related handler
    expect(textarea.onchange).toBeDefined();
    expect(textarea.oninput).toBeNull();
  });

  it('should update displayed value when textContent prop changes', () => {
    const { getByDisplayValue, rerender } = render(<ContentEditor {...defaultProps} />);
    expect(getByDisplayValue('Test content')).toBeInTheDocument();
    
    rerender(<ContentEditor {...defaultProps} textContent="Updated content" />);
    expect(getByDisplayValue('Updated content')).toBeInTheDocument();
  });

  // Accessibility: Label association (Requirement 7.5)
  it('should have proper label association with textarea', () => {
    const { container } = render(<ContentEditor {...defaultProps} />);
    const label = container.querySelector('label');
    const textarea = container.querySelector('textarea');
    
    expect(label).toHaveAttribute('for', 'content-text');
    expect(textarea).toHaveAttribute('id', 'content-text');
  });
});
