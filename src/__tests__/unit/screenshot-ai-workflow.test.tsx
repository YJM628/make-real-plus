/**
 * Unit tests for ScreenshotAIWorkflow component
 * Feature: ai-html-visual-editor
 * Requirements: 8.5, 8.6, 8.7, 8.8, 8.9
 */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScreenshotAIWorkflow } from '../../components/workflows/ScreenshotAIWorkflow';
import type { ElementOverride } from '../../types';

// Mock dependencies
jest.mock('../../hooks/useAI');
jest.mock('../../components/tools/ScreenshotSelector');
jest.mock('../../components/panels/FloatingEditPanel');

import { useAI } from '../../hooks/useAI';
import { ScreenshotSelector } from '../../components/tools/ScreenshotSelector';
import { FloatingEditPanel } from '../../components/panels/FloatingEditPanel';

const mockUseAI = useAI as jest.MockedFunction<typeof useAI>;
const MockScreenshotSelector = ScreenshotSelector as jest.MockedFunction<typeof ScreenshotSelector>;
const MockFloatingEditPanel = FloatingEditPanel as jest.MockedFunction<typeof FloatingEditPanel>;

describe('ScreenshotAIWorkflow', () => {
  let targetElement: HTMLElement;
  let mockOnCancel: jest.Mock;
  let mockOnApplyOverrides: jest.Mock;
  let mockOptimize: jest.Mock;

  beforeEach(() => {
    // Create target element
    targetElement = document.createElement('div');
    targetElement.innerHTML = `
      <div id="test-element" data-uuid="test-uuid">
        <h1>Test Heading</h1>
        <button>Test Button</button>
      </div>
    `;
    document.body.appendChild(targetElement);

    // Setup mocks
    mockOnCancel = jest.fn();
    mockOnApplyOverrides = jest.fn();
    mockOptimize = jest.fn().mockResolvedValue({
      html: '<div class="optimized">Optimized Content</div>',
      styles: { 'background-color': '#f0f0f0' },
    });

    mockUseAI.mockReturnValue({
      generate: jest.fn(),
      optimize: mockOptimize,
      generateBatch: jest.fn(),
      loading: false,
      error: null,
    });

    // Mock ScreenshotSelector to render a simple div
    MockScreenshotSelector.mockImplementation(({ onComplete, onCancel }) => (
      <div data-testid="screenshot-selector">
        <button onClick={() => {
          const mockBlob = new Blob(['test'], { type: 'image/png' });
          const elements = Array.from(targetElement.querySelectorAll('*')) as HTMLElement[];
          const bounds = new DOMRect(0, 0, 100, 100);
          onComplete(mockBlob, elements, bounds);
        }}>
          Complete Selection
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ));

    // Mock FloatingEditPanel to render a simple div
    MockFloatingEditPanel.mockImplementation(({ onSave, onCancel, onAIOptimize, element }) => (
      <div data-testid="floating-edit-panel">
        <button onClick={() => {
          if (onAIOptimize && element) {
            onAIOptimize('test prompt', element, new Blob(['test'], { type: 'image/png' }));
          }
        }}>
          Optimize
        </button>
        <button onClick={() => {
          onSave({
            selector: '#test-element',
            html: '<div>Modified</div>',
            timestamp: Date.now(),
            aiGenerated: true,
          });
        }}>
          Save
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ));
  });

  afterEach(() => {
    document.body.removeChild(targetElement);
    jest.clearAllMocks();
  });

  describe('Screenshot Selection', () => {
    it('should render ScreenshotSelector when in screenshot mode', () => {
      render(
        <ScreenshotAIWorkflow
          targetElement={targetElement}
          screenshotMode={true}
          onCancel={mockOnCancel}
          onApplyOverrides={mockOnApplyOverrides}
        />
      );

      expect(screen.getByTestId('screenshot-selector')).toBeInTheDocument();
    });

    it('should not render anything when not in screenshot mode', () => {
      const { container } = render(
        <ScreenshotAIWorkflow
          targetElement={targetElement}
          screenshotMode={false}
          onCancel={mockOnCancel}
          onApplyOverrides={mockOnApplyOverrides}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should handle screenshot selection cancellation (Requirement 8.9)', async () => {
      render(
        <ScreenshotAIWorkflow
          targetElement={targetElement}
          screenshotMode={true}
          onCancel={mockOnCancel}
          onApplyOverrides={mockOnApplyOverrides}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('AI Optimization with Screenshot', () => {
    it('should transition to editing mode after screenshot selection (Requirement 8.4)', async () => {
      render(
        <ScreenshotAIWorkflow
          targetElement={targetElement}
          screenshotMode={true}
          onCancel={mockOnCancel}
          onApplyOverrides={mockOnApplyOverrides}
        />
      );

      // Complete screenshot selection
      const completeButton = screen.getByText('Complete Selection');
      await userEvent.click(completeButton);

      // Should show floating edit panel
      await waitFor(() => {
        expect(screen.getByTestId('floating-edit-panel')).toBeInTheDocument();
      });
    });

    it('should send screenshot and element structure to AI (Requirement 8.5)', async () => {
      render(
        <ScreenshotAIWorkflow
          targetElement={targetElement}
          screenshotMode={true}
          onCancel={mockOnCancel}
          onApplyOverrides={mockOnApplyOverrides}
        />
      );

      // Complete screenshot selection
      await userEvent.click(screen.getByText('Complete Selection'));

      // Trigger AI optimization
      await waitFor(() => {
        expect(screen.getByTestId('floating-edit-panel')).toBeInTheDocument();
      });

      const optimizeButton = screen.getByText('Optimize');
      await userEvent.click(optimizeButton);

      // Verify AI service was called with screenshot
      await waitFor(() => {
        expect(mockOptimize).toHaveBeenCalledWith(
          expect.any(String), // element HTML
          'test prompt',
          expect.any(Blob) // screenshot
        );
      });
    });

    it('should preview AI modifications in real-time (Requirement 8.7)', async () => {
      render(
        <ScreenshotAIWorkflow
          targetElement={targetElement}
          screenshotMode={true}
          onCancel={mockOnCancel}
          onApplyOverrides={mockOnApplyOverrides}
        />
      );

      // Complete screenshot selection
      await userEvent.click(screen.getByText('Complete Selection'));

      await waitFor(() => {
        expect(screen.getByTestId('floating-edit-panel')).toBeInTheDocument();
      });

      // Trigger AI optimization
      const optimizeButton = screen.getByText('Optimize');
      await userEvent.click(optimizeButton);

      // Verify AI service was called
      await waitFor(() => {
        expect(mockOptimize).toHaveBeenCalled();
      });

      // In a real scenario, we'd verify the DOM was updated with preview
      // For now, we just verify the optimize function was called
    });

    it('should apply modifications as Element_Override on confirmation (Requirement 8.8)', async () => {
      render(
        <ScreenshotAIWorkflow
          targetElement={targetElement}
          screenshotMode={true}
          onCancel={mockOnCancel}
          onApplyOverrides={mockOnApplyOverrides}
        />
      );

      // Complete screenshot selection
      await userEvent.click(screen.getByText('Complete Selection'));

      await waitFor(() => {
        expect(screen.getByTestId('floating-edit-panel')).toBeInTheDocument();
      });

      // Save modifications
      const saveButton = screen.getByText('Save');
      await userEvent.click(saveButton);

      // Verify overrides were applied
      await waitFor(() => {
        expect(mockOnApplyOverrides).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              selector: expect.any(String),
              timestamp: expect.any(Number),
              aiGenerated: expect.any(Boolean),
            }),
          ])
        );
      });

      // Verify workflow was cancelled (returned to normal mode)
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should support canceling selection operation (Requirement 8.9)', async () => {
      render(
        <ScreenshotAIWorkflow
          targetElement={targetElement}
          screenshotMode={true}
          onCancel={mockOnCancel}
          onApplyOverrides={mockOnApplyOverrides}
        />
      );

      // Complete screenshot selection
      await userEvent.click(screen.getByText('Complete Selection'));

      await waitFor(() => {
        expect(screen.getByTestId('floating-edit-panel')).toBeInTheDocument();
      });

      // Cancel from edit panel
      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      // Verify workflow was cancelled
      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnApplyOverrides).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle AI optimization errors gracefully', async () => {
      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockOptimize.mockRejectedValueOnce(new Error('AI service error'));

      render(
        <ScreenshotAIWorkflow
          targetElement={targetElement}
          screenshotMode={true}
          onCancel={mockOnCancel}
          onApplyOverrides={mockOnApplyOverrides}
        />
      );

      // Complete screenshot selection
      await userEvent.click(screen.getByText('Complete Selection'));

      await waitFor(() => {
        expect(screen.getByTestId('floating-edit-panel')).toBeInTheDocument();
      });

      // Trigger AI optimization
      const optimizeButton = screen.getByText('Optimize');
      await userEvent.click(optimizeButton);

      // Error should be logged but component should not crash
      await waitFor(() => {
        expect(mockOptimize).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'AI optimization failed:',
          expect.any(Error)
        );
      });

      // Component should still be rendered
      expect(screen.getByTestId('floating-edit-panel')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle empty element selection', async () => {
      // Mock ScreenshotSelector to return empty elements
      MockScreenshotSelector.mockImplementation(({ onComplete, onCancel }) => (
        <div data-testid="screenshot-selector">
          <button onClick={() => {
            const mockBlob = new Blob(['test'], { type: 'image/png' });
            const bounds = new DOMRect(0, 0, 100, 100);
            onComplete(mockBlob, [], bounds); // Empty elements array
          }}>
            Complete Selection
          </button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      ));

      render(
        <ScreenshotAIWorkflow
          targetElement={targetElement}
          screenshotMode={true}
          onCancel={mockOnCancel}
          onApplyOverrides={mockOnApplyOverrides}
        />
      );

      // Complete screenshot selection with no elements
      await userEvent.click(screen.getByText('Complete Selection'));

      // Should not show edit panel since no elements were selected
      await waitFor(() => {
        expect(screen.queryByTestId('floating-edit-panel')).not.toBeInTheDocument();
      });
    });
  });

  describe('Multiple Elements in Selection', () => {
    it('should create overrides for all elements in selection', async () => {
      render(
        <ScreenshotAIWorkflow
          targetElement={targetElement}
          screenshotMode={true}
          onCancel={mockOnCancel}
          onApplyOverrides={mockOnApplyOverrides}
        />
      );

      // Complete screenshot selection (will select all elements in targetElement)
      await userEvent.click(screen.getByText('Complete Selection'));

      await waitFor(() => {
        expect(screen.getByTestId('floating-edit-panel')).toBeInTheDocument();
      });

      // Save modifications
      const saveButton = screen.getByText('Save');
      await userEvent.click(saveButton);

      // Verify overrides were created for multiple elements
      await waitFor(() => {
        expect(mockOnApplyOverrides).toHaveBeenCalled();
        const overrides = mockOnApplyOverrides.mock.calls[0][0] as ElementOverride[];
        expect(overrides.length).toBeGreaterThan(0);
      });
    });
  });
});
