/**
 * StyleEditor Component Tests
 *
 * Verifies the StyleEditor component renders correctly and handles user input.
 * Requirements: 2.6, 6.1, 6.2
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { StyleEditor } from '../../components/panels/StyleEditor';

describe('StyleEditor', () => {
  const mockStyles = {
    color: '#000000',
    backgroundColor: '#ffffff',
    fontSize: '16px',
    padding: '10px',
    margin: '5px',
  };

  it('should render all style input fields', () => {
    const onStyleChange = jest.fn();
    render(<StyleEditor styles={mockStyles} onStyleChange={onStyleChange} />);

    // Check labels are present
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('Background Color')).toBeInTheDocument();
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByText('Padding')).toBeInTheDocument();
    expect(screen.getByText('Margin')).toBeInTheDocument();
  });

  it('should display current style values', () => {
    const onStyleChange = jest.fn();
    render(<StyleEditor styles={mockStyles} onStyleChange={onStyleChange} />);

    // Check color inputs
    const colorInputs = screen.getAllByDisplayValue('#000000');
    expect(colorInputs.length).toBeGreaterThan(0);

    // Check background color inputs
    const bgColorInputs = screen.getAllByDisplayValue('#ffffff');
    expect(bgColorInputs.length).toBeGreaterThan(0);

    // Check other inputs
    expect(screen.getByDisplayValue('16px')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10px')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5px')).toBeInTheDocument();
  });

  it('should call onStyleChange when color text input changes', () => {
    const onStyleChange = jest.fn();
    render(<StyleEditor styles={mockStyles} onStyleChange={onStyleChange} />);

    const colorTextInput = screen.getByPlaceholderText('#000000');
    fireEvent.change(colorTextInput, { target: { value: '#ff0000' } });

    expect(onStyleChange).toHaveBeenCalledWith({
      ...mockStyles,
      color: '#ff0000',
    });
  });

  it('should call onStyleChange when fontSize input changes', () => {
    const onStyleChange = jest.fn();
    render(<StyleEditor styles={mockStyles} onStyleChange={onStyleChange} />);

    const fontSizeInput = screen.getByPlaceholderText('e.g., 16px');
    fireEvent.change(fontSizeInput, { target: { value: '20px' } });

    expect(onStyleChange).toHaveBeenCalledWith({
      ...mockStyles,
      fontSize: '20px',
    });
  });

  it('should call onStyleChange when padding input changes', () => {
    const onStyleChange = jest.fn();
    render(<StyleEditor styles={mockStyles} onStyleChange={onStyleChange} />);

    const paddingInput = screen.getByDisplayValue('10px');
    fireEvent.change(paddingInput, { target: { value: '15px' } });

    expect(onStyleChange).toHaveBeenCalledWith({
      ...mockStyles,
      padding: '15px',
    });
  });

  it('should call onStyleChange when margin input changes', () => {
    const onStyleChange = jest.fn();
    render(<StyleEditor styles={mockStyles} onStyleChange={onStyleChange} />);

    const marginInput = screen.getByDisplayValue('5px');
    fireEvent.change(marginInput, { target: { value: '8px' } });

    expect(onStyleChange).toHaveBeenCalledWith({
      ...mockStyles,
      margin: '8px',
    });
  });

  it('should use default values when styles are empty', () => {
    const onStyleChange = jest.fn();
    const emptyStyles = {
      color: '',
      backgroundColor: '',
      fontSize: '',
      padding: '',
      margin: '',
    };
    render(<StyleEditor styles={emptyStyles} onStyleChange={onStyleChange} />);

    // Color picker should default to #000000
    const colorPickers = screen.getAllByDisplayValue('#000000');
    expect(colorPickers.length).toBeGreaterThan(0);

    // Background color picker should default to #ffffff
    const bgColorPickers = screen.getAllByDisplayValue('#ffffff');
    expect(bgColorPickers.length).toBeGreaterThan(0);
  });

  it('should only use onChange handlers (not onInput)', () => {
    const onStyleChange = jest.fn();
    const { container } = render(<StyleEditor styles={mockStyles} onStyleChange={onStyleChange} />);

    // Verify no onInput handlers are present
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
      expect(input.oninput).toBeNull();
    });
  });

  // Accessibility: Label associations (Requirement 7.5)
  describe('Label associations', () => {
    it('should have proper label association for color input', () => {
      const onStyleChange = jest.fn();
      const { container } = render(<StyleEditor styles={mockStyles} onStyleChange={onStyleChange} />);
      
      const label = Array.from(container.querySelectorAll('label')).find(
        l => l.textContent === 'Color'
      );
      const input = container.querySelector('#style-color');
      
      expect(label).toHaveAttribute('for', 'style-color');
      expect(input).toHaveAttribute('id', 'style-color');
    });

    it('should have proper label association for background color input', () => {
      const onStyleChange = jest.fn();
      const { container } = render(<StyleEditor styles={mockStyles} onStyleChange={onStyleChange} />);
      
      const label = Array.from(container.querySelectorAll('label')).find(
        l => l.textContent === 'Background Color'
      );
      const input = container.querySelector('#style-background-color');
      
      expect(label).toHaveAttribute('for', 'style-background-color');
      expect(input).toHaveAttribute('id', 'style-background-color');
    });

    it('should have proper label association for font size input', () => {
      const onStyleChange = jest.fn();
      const { container } = render(<StyleEditor styles={mockStyles} onStyleChange={onStyleChange} />);
      
      const label = Array.from(container.querySelectorAll('label')).find(
        l => l.textContent === 'Font Size'
      );
      const input = container.querySelector('#style-font-size');
      
      expect(label).toHaveAttribute('for', 'style-font-size');
      expect(input).toHaveAttribute('id', 'style-font-size');
    });

    it('should have proper label association for padding input', () => {
      const onStyleChange = jest.fn();
      const { container } = render(<StyleEditor styles={mockStyles} onStyleChange={onStyleChange} />);
      
      const label = Array.from(container.querySelectorAll('label')).find(
        l => l.textContent === 'Padding'
      );
      const input = container.querySelector('#style-padding');
      
      expect(label).toHaveAttribute('for', 'style-padding');
      expect(input).toHaveAttribute('id', 'style-padding');
    });

    it('should have proper label association for margin input', () => {
      const onStyleChange = jest.fn();
      const { container } = render(<StyleEditor styles={mockStyles} onStyleChange={onStyleChange} />);
      
      const label = Array.from(container.querySelectorAll('label')).find(
        l => l.textContent === 'Margin'
      );
      const input = container.querySelector('#style-margin');
      
      expect(label).toHaveAttribute('for', 'style-margin');
      expect(input).toHaveAttribute('id', 'style-margin');
    });
  });
});
