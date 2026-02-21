/**
 * AIEditor Component Tests
 * 
 * Requirements: 2.7
 */

import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIEditor } from '../../components/panels/AIEditor';

describe('AIEditor', () => {
  const defaultProps = {
    aiPrompt: '',
    onPromptChange: jest.fn(),
    aiLoading: false,
    aiPreview: null,
    onOptimize: jest.fn(),
    screenshotBlob: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render AI Optimization label', () => {
    const { getByText } = render(<AIEditor {...defaultProps} />);
    expect(getByText('AI Optimization')).toBeInTheDocument();
  });

  it('should render textarea with placeholder', () => {
    const { getByPlaceholderText } = render(<AIEditor {...defaultProps} />);
    expect(getByPlaceholderText('Describe how you want to improve this element...')).toBeInTheDocument();
  });

  it('should call onPromptChange when textarea value changes', () => {
    const { getByPlaceholderText } = render(<AIEditor {...defaultProps} />);
    const textarea = getByPlaceholderText('Describe how you want to improve this element...');
    fireEvent.change(textarea, { target: { value: 'Make it bigger' } });
    expect(defaultProps.onPromptChange).toHaveBeenCalledWith('Make it bigger');
  });

  it('should render optimize button', () => {
    const { getByText } = render(<AIEditor {...defaultProps} />);
    expect(getByText('Optimize with AI')).toBeInTheDocument();
  });

  it('should disable optimize button when prompt is empty', () => {
    const { getByText } = render(<AIEditor {...defaultProps} />);
    const button = getByText('Optimize with AI');
    expect(button).toBeDisabled();
  });

  it('should enable optimize button when prompt is not empty', () => {
    const { getByText } = render(<AIEditor {...defaultProps} aiPrompt="test prompt" />);
    const button = getByText('Optimize with AI');
    expect(button).not.toBeDisabled();
  });

  it('should disable optimize button when loading', () => {
    const { getByText } = render(<AIEditor {...defaultProps} aiPrompt="test" aiLoading={true} />);
    const button = getByText('Optimizing...');
    expect(button).toBeDisabled();
  });

  it('should call onOptimize when optimize button is clicked', () => {
    const { getByText } = render(<AIEditor {...defaultProps} aiPrompt="test prompt" />);
    const button = getByText('Optimize with AI');
    fireEvent.click(button);
    expect(defaultProps.onOptimize).toHaveBeenCalled();
  });

  it('should show success message when aiPreview is available', () => {
    const { getByText } = render(
      <AIEditor {...defaultProps} aiPreview={{ html: '<div>test</div>' }} />
    );
    expect(getByText('✓ AI optimization preview applied. Click Save to confirm.')).toBeInTheDocument();
  });

  it('should not show success message when aiPreview is null', () => {
    const { queryByText } = render(<AIEditor {...defaultProps} />);
    expect(queryByText('✓ AI optimization preview applied. Click Save to confirm.')).not.toBeInTheDocument();
  });

  it('should render screenshot button when onScreenshotSelect is provided', () => {
    const onScreenshotSelect = jest.fn();
    const { getByText } = render(<AIEditor {...defaultProps} onScreenshotSelect={onScreenshotSelect} />);
    expect(getByText('📷 Capture Screenshot')).toBeInTheDocument();
  });

  it('should not render screenshot button when onScreenshotSelect is not provided', () => {
    const { queryByText } = render(<AIEditor {...defaultProps} />);
    expect(queryByText('📷 Capture Screenshot')).not.toBeInTheDocument();
  });

  it('should call onScreenshotSelect when screenshot button is clicked', () => {
    const onScreenshotSelect = jest.fn();
    const { getByText } = render(<AIEditor {...defaultProps} onScreenshotSelect={onScreenshotSelect} />);
    const button = getByText('📷 Capture Screenshot');
    fireEvent.click(button);
    expect(onScreenshotSelect).toHaveBeenCalled();
  });

  it('should show captured state when screenshotBlob is provided', () => {
    const blob = new Blob(['test'], { type: 'image/png' });
    const { getByText } = render(
      <AIEditor {...defaultProps} onScreenshotSelect={jest.fn()} screenshotBlob={blob} />
    );
    expect(getByText('✓ Screenshot Captured')).toBeInTheDocument();
  });

  // Accessibility: Label association (Requirement 7.5)
  it('should have proper label association with textarea', () => {
    const { container } = render(<AIEditor {...defaultProps} />);
    const label = container.querySelector('label');
    const textarea = container.querySelector('textarea');
    
    expect(label).toHaveAttribute('for', 'ai-prompt');
    expect(textarea).toHaveAttribute('id', 'ai-prompt');
  });
});
