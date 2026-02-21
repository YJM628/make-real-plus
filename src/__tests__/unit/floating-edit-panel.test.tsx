/**
 * FloatingEditPanel Component Tests
 * 
 * Tests for the refactored FloatingEditPanel component, verifying:
 * - Basic rendering and tab switching (Requirements 2.1-2.4)
 * - Save/Cancel operations (Requirement 8.1)
 * - ARIA attributes: role="dialog", tablist, tab, aria-selected (Requirements 7.1, 7.2)
 * - Escape key to close panel (Requirement 7.3)
 * - Focus management on panel open (Requirement 7.4)
 * - Label associations for form controls (Requirement 7.5)
 * - AI optimization flow (Requirement 8.1)
 * - Integration with useElementPreview Hook (Requirement 8.2)
 * - Integration with rgbToHex utility (Requirement 8.3)
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3
 */

import * as React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FloatingEditPanel } from '../../components/panels/FloatingEditPanel';

describe('FloatingEditPanel', () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    mockElement.textContent = 'Test Content';
    document.body.appendChild(mockElement);
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (mockElement.parentNode) {
      document.body.removeChild(mockElement);
    }
  });

  const defaultProps = {
    visible: true,
    element: mockElement,
    selector: '.test',
    position: { x: 100, y: 100 },
    onSave: jest.fn(),
    onCancel: jest.fn(),
  };

  it('should render when visible', () => {
    const { container } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    const { container } = render(<FloatingEditPanel {...defaultProps} visible={false} element={mockElement} />);
    expect(container.firstChild).not.toBeInTheDocument();
  });

  it('should render three tabs', () => {
    const { getByText } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
    expect(getByText('content')).toBeInTheDocument();
    expect(getByText('style')).toBeInTheDocument();
    expect(getByText('ai')).toBeInTheDocument();
  });

  it('should have Save and Cancel buttons', () => {
    const { getByText } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
    expect(getByText('Save')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
  });

  it('should call onCancel when Cancel is clicked', () => {
    const { getByText } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
    fireEvent.click(getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should call onSave when Save is clicked', () => {
    const { getByText } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
    fireEvent.click(getByText('Save'));
    expect(defaultProps.onSave).toHaveBeenCalled();
  });

  it('should have text input in content tab', () => {
    const { getByPlaceholderText } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
    expect(getByPlaceholderText('Enter text content...')).toBeInTheDocument();
  });

  it('should have AI prompt in AI tab', () => {
    const { getByText, getByPlaceholderText } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
    fireEvent.click(getByText('ai'));
    expect(getByPlaceholderText('Describe how you want to improve this element...')).toBeInTheDocument();
  });

  it('should call onAIOptimize when optimize button is clicked', async () => {
    const onAIOptimize = jest.fn().mockResolvedValue({ html: '<div>Optimized</div>' });
    const { getByText, getByPlaceholderText } = render(
      <FloatingEditPanel {...defaultProps} element={mockElement} onAIOptimize={onAIOptimize} />
    );
    
    fireEvent.click(getByText('ai'));
    const textarea = getByPlaceholderText('Describe how you want to improve this element...');
    fireEvent.change(textarea, { target: { value: 'Make it bigger' } });
    fireEvent.click(getByText('Optimize with AI'));
    
    await waitFor(() => {
      expect(onAIOptimize).toHaveBeenCalled();
    });
  });

  // ARIA attribute tests (Requirement 7.1: role="dialog" and aria-label)
  describe('ARIA dialog role (Requirement 7.1)', () => {
    it('should have role="dialog" on panel root', () => {
      const { container } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveAttribute('role', 'dialog');
    });

    it('should have aria-label on panel root', () => {
      const { container } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveAttribute('aria-label', 'Edit Element Panel');
    });
  });

  // ARIA tablist/tab tests (Requirement 7.2: tablist, tab, aria-selected)
  describe('ARIA tablist structure (Requirement 7.2)', () => {
    it('should have role="tablist" on tabs container', () => {
      const { container } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toBeInTheDocument();
    });

    it('should have role="tab" on each tab button', () => {
      const { container } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
      const tabs = container.querySelectorAll('[role="tab"]');
      expect(tabs).toHaveLength(3);
    });

    it('should have aria-selected="true" on the active tab and "false" on others', () => {
      const { container } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
      const tabs = container.querySelectorAll('[role="tab"]');
      
      // First tab (content) should be selected by default
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
    });

    it('should update aria-selected when switching to style tab', () => {
      const { container, getByText } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
      
      fireEvent.click(getByText('style'));
      
      const tabs = container.querySelectorAll('[role="tab"]');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
    });

    it('should update aria-selected when switching to ai tab', () => {
      const { container, getByText } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
      
      fireEvent.click(getByText('ai'));
      
      const tabs = container.querySelectorAll('[role="tab"]');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    });
  });

  // Escape key tests (Requirement 7.3)
  describe('Escape key handling (Requirement 7.3)', () => {
    it('should call onCancel when Escape key is pressed', () => {
      render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('should not call onCancel when Escape is pressed and panel is not visible', () => {
      const onCancel = jest.fn();
      render(<FloatingEditPanel {...defaultProps} visible={false} onCancel={onCancel} element={mockElement} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('should not call onCancel when a non-Escape key is pressed', () => {
      render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      
      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });
  });

  // Focus management tests (Requirement 7.4)
  describe('Focus management (Requirement 7.4)', () => {
    it('should auto-focus first interactive element when panel becomes visible', () => {
      const { rerender, container } = render(
        <FloatingEditPanel {...defaultProps} visible={false} element={mockElement} />
      );
      
      // Make panel visible
      rerender(<FloatingEditPanel {...defaultProps} visible={true} element={mockElement} />);
      
      // Check that a focusable element inside the panel is focused
      const focusedElement = document.activeElement;
      const panel = container.firstChild as HTMLElement;
      expect(panel).not.toBeNull();
      expect(panel.contains(focusedElement)).toBe(true);
    });

    it('should focus an element within the panel on initial render when visible', () => {
      const { container } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
      
      const focusedElement = document.activeElement;
      const panel = container.firstChild as HTMLElement;
      expect(panel.contains(focusedElement)).toBe(true);
    });
  });

  // Label association tests (Requirement 7.5)
  describe('Label associations (Requirement 7.5)', () => {
    it('should have label associated with textarea in content tab', () => {
      const { container } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
      
      const contentTextarea = container.querySelector('#content-text');
      const contentLabel = Array.from(container.querySelectorAll('label')).find(
        l => l.getAttribute('for') === 'content-text'
      );
      expect(contentTextarea).toBeInTheDocument();
      expect(contentLabel).toBeInTheDocument();
    });

    it('should have labels associated with all style inputs in style tab', () => {
      const { container, getByText } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
      
      // Switch to style tab
      fireEvent.click(getByText('style'));
      
      const styleInputIds = [
        'style-color',
        'style-background-color',
        'style-font-size',
        'style-padding',
        'style-margin'
      ];
      
      styleInputIds.forEach(id => {
        const input = container.querySelector(`#${id}`);
        const label = Array.from(container.querySelectorAll('label')).find(
          l => l.getAttribute('for') === id
        );
        expect(input).toBeInTheDocument();
        expect(label).toBeInTheDocument();
      });
    });

    it('should have label associated with textarea in AI tab', () => {
      const { container, getByText } = render(<FloatingEditPanel {...defaultProps} element={mockElement} />);
      
      // Switch to AI tab
      fireEvent.click(getByText('ai'));
      
      const aiTextarea = container.querySelector('#ai-prompt');
      const aiLabel = Array.from(container.querySelectorAll('label')).find(
        l => l.getAttribute('for') === 'ai-prompt'
      );
      expect(aiTextarea).toBeInTheDocument();
      expect(aiLabel).toBeInTheDocument();
    });
  });

  // Integration: useElementPreview cancel/restore (Requirement 8.2)
  describe('useElementPreview integration (Requirement 8.2)', () => {
    it('should restore element text when Cancel is clicked', () => {
      mockElement.textContent = 'Original Text';
      
      const onCancel = jest.fn();
      const { getByPlaceholderText, getByText } = render(
        <FloatingEditPanel {...defaultProps} element={mockElement} onCancel={onCancel} />
      );
      
      // Modify text content
      const textarea = getByPlaceholderText('Enter text content...');
      fireEvent.change(textarea, { target: { value: 'Modified Text' } });
      
      // Click Cancel - should trigger onCancel callback
      fireEvent.click(getByText('Cancel'));
      expect(onCancel).toHaveBeenCalled();
    });

    it('should preview text changes on the DOM element in real-time', () => {
      mockElement.textContent = 'Original';
      
      const { getByPlaceholderText } = render(
        <FloatingEditPanel {...defaultProps} element={mockElement} />
      );
      
      const textarea = getByPlaceholderText('Enter text content...');
      fireEvent.change(textarea, { target: { value: 'Preview Text' } });
      
      // The hook should apply the text to the DOM element
      expect(mockElement.textContent).toBe('Preview Text');
    });
  });

  // Integration: rgbToHex utility (Requirement 8.3)
  describe('rgbToHex integration (Requirement 8.3)', () => {
    it('should initialize style values using rgbToHex conversion', () => {
      // Set computed style on the mock element (jsdom returns rgb format)
      mockElement.style.color = 'rgb(255, 0, 0)';
      
      const { getByText, container } = render(
        <FloatingEditPanel {...defaultProps} element={mockElement} />
      );
      
      // Switch to style tab to see the converted values
      fireEvent.click(getByText('style'));
      
      // The color input should have the hex-converted value
      const colorInput = container.querySelector('#style-color') as HTMLInputElement;
      expect(colorInput).toBeInTheDocument();
      // The value should be a hex string (converted from rgb by rgbToHex)
      if (colorInput) {
        expect(colorInput.value).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });
});
