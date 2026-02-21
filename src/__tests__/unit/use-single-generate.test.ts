/**
 * Unit tests for useSingleGenerate hook
 * Feature: editor-canvas-refactor
 * Requirements: 8.1, 8.3
 */

// Mock config before other imports
jest.mock('../../services/ai/config', () => ({
  getAIConfigFromEnv: jest.fn(() => ({
    provider: 'mock',
    maxTokens: 4000,
    temperature: 0.7,
  })),
  validateAIConfig: jest.fn(() => ({ valid: true })),
}));

// Mock dependencies
jest.mock('../../hooks/useAI');
jest.mock('tldraw', () => ({
  createShapeId: jest.fn(() => 'test-shape-id'),
}));

import { renderHook, waitFor } from '@testing-library/react';
import { useSingleGenerate } from '../../components/canvas/generation/useSingleGenerate';
import { useAI } from '../../hooks/useAI';
import type { Editor } from 'tldraw';
import type { AIGenerationContext, AIGenerationChunk } from '../../types';

describe('useSingleGenerate', () => {
  let mockEditor: jest.Mocked<Editor>;
  let mockGenerate: jest.Mock;
  let mockOnComplete: jest.Mock;
  let mockOnError: jest.Mock;

  beforeEach(() => {
    // Create mock editor
    mockEditor = {
      createShape: jest.fn(),
      select: jest.fn(),
      markHistoryStoppingPoint: jest.fn(),
    } as any;

    // Create mock generate function
    mockGenerate = jest.fn();

    // Mock useAI hook
    (useAI as jest.Mock).mockReturnValue({
      generate: mockGenerate,
    });

    // Create callback mocks
    mockOnComplete = jest.fn();
    mockOnError = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleSingleGenerate', () => {
    it('should stream AI results and create HTML shape at click position', async () => {
      // Arrange
      const clickPosition = { x: 100, y: 200 };
      const context: AIGenerationContext = {
        prompt: 'Create a login form',
        designSystem: 'tailwind',
      };

      // Mock streaming chunks
      const chunks: AIGenerationChunk[] = [
        { type: 'html', content: '<div>', isComplete: false },
        { type: 'html', content: 'Hello</div>', isComplete: true },
        { type: 'css', content: '.test { color: red; }', isComplete: true },
        { type: 'js', content: 'console.log("test");', isComplete: true },
      ];

      mockGenerate.mockReturnValue((async function* () {
        for (const chunk of chunks) {
          yield chunk;
        }
        // Return the accumulated result
        return {
          html: '<div>Hello</div>',
          css: '.test { color: red; }',
          js: 'console.log("test");',
          identifiers: [],
        };
      })());

      // Act
      const { result } = renderHook(() =>
        useSingleGenerate(mockEditor, clickPosition, mockOnComplete, mockOnError)
      );

      await result.current.handleSingleGenerate(context);

      // Assert
      await waitFor(() => {
        expect(mockGenerate).toHaveBeenCalledWith(context);
        expect(mockEditor.createShape).toHaveBeenCalledWith({
          id: 'test-shape-id',
          type: 'html',
          x: 100,
          y: 200,
          props: {
            html: '<div>Hello</div>',
            css: '.test { color: red; }',
            js: 'console.log("test");',
            mode: 'preview',
            overrides: [],
            designSystem: 'tailwind',
            viewport: 'desktop',
            w: 800,
            h: 600,
          },
        });
        expect(mockEditor.select).toHaveBeenCalledWith('test-shape-id');
        expect(mockOnComplete).toHaveBeenCalled();
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });

    it('should call onError when no HTML is generated', async () => {
      // Arrange
      const clickPosition = { x: 100, y: 200 };
      const context: AIGenerationContext = {
        prompt: 'Create something',
      };

      // Mock empty generation - no HTML chunks, only CSS
      mockGenerate.mockReturnValue((async function* () {
        yield { type: 'css', content: '', isComplete: true };
        // Return empty result
        return {
          html: '',
          css: '',
          js: '',
          identifiers: [],
        };
      })());

      // Act
      const { result } = renderHook(() =>
        useSingleGenerate(mockEditor, clickPosition, mockOnComplete, mockOnError)
      );

      await result.current.handleSingleGenerate(context);

      // Assert
      await waitFor(() => {
        expect(mockEditor.createShape).not.toHaveBeenCalled();
        expect(mockOnComplete).not.toHaveBeenCalled();
        expect(mockOnError).toHaveBeenCalledWith('AI generation failed: No valid HTML generated');
      });
    });

    it('should call onError when generation fails', async () => {
      // Arrange
      const clickPosition = { x: 100, y: 200 };
      const context: AIGenerationContext = {
        prompt: 'Create a form',
      };

      const error = new Error('API rate limit exceeded');
      mockGenerate.mockReturnValue((async function* () {
        throw error;
      })());

      // Act
      const { result } = renderHook(() =>
        useSingleGenerate(mockEditor, clickPosition, mockOnComplete, mockOnError)
      );

      await result.current.handleSingleGenerate(context);

      // Assert
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          'AI generation failed: API rate limit exceeded'
        );
        expect(mockOnComplete).not.toHaveBeenCalled();
        expect(mockEditor.createShape).not.toHaveBeenCalled();
      });
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      const clickPosition = { x: 100, y: 200 };
      const context: AIGenerationContext = {
        prompt: 'Create a form',
      };

      mockGenerate.mockReturnValue((async function* () {
        throw 'Unknown error';
      })());

      // Act
      const { result } = renderHook(() =>
        useSingleGenerate(mockEditor, clickPosition, mockOnComplete, mockOnError)
      );

      await result.current.handleSingleGenerate(context);

      // Assert
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          'AI generation failed. Please try again.'
        );
      });
    });

    it('should not generate when editor is null', async () => {
      // Arrange
      const clickPosition = { x: 100, y: 200 };
      const context: AIGenerationContext = {
        prompt: 'Create a form',
      };

      // Act
      const { result } = renderHook(() =>
        useSingleGenerate(null, clickPosition, mockOnComplete, mockOnError)
      );

      await result.current.handleSingleGenerate(context);

      // Assert
      expect(mockGenerate).not.toHaveBeenCalled();
      expect(mockOnComplete).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should use default position when clickPosition is undefined', async () => {
      // Arrange
      const context: AIGenerationContext = {
        prompt: 'Create a form',
      };

      // Mock generation with result
      mockGenerate.mockReturnValue((async function* () {
        yield { type: 'html', content: '<div>Form</div>', isComplete: true };
        return {
          html: '<div>Form</div>',
          css: '',
          js: '',
          identifiers: [],
        };
      })());

      // Act
      const { result } = renderHook(() =>
        useSingleGenerate(mockEditor, undefined, mockOnComplete, mockOnError)
      );

      await result.current.handleSingleGenerate(context);

      // Assert
      await waitFor(() => {
        expect(mockGenerate).toHaveBeenCalledWith(context);
        expect(mockEditor.createShape).toHaveBeenCalledWith(
          expect.objectContaining({
            x: 100, // default position
            y: 100, // default position
          })
        );
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });

    it('should accumulate multiple chunks of the same type', async () => {
      // Arrange
      const clickPosition = { x: 100, y: 200 };
      const context: AIGenerationContext = {
        prompt: 'Create a complex component',
      };

      // Mock multiple HTML chunks
      const chunks: AIGenerationChunk[] = [
        { type: 'html', content: '<div>', isComplete: false },
        { type: 'html', content: '<h1>Title</h1>', isComplete: false },
        { type: 'html', content: '<p>Content</p>', isComplete: false },
        { type: 'html', content: '</div>', isComplete: true },
      ];

      mockGenerate.mockReturnValue((async function* () {
        for (const chunk of chunks) {
          yield chunk;
        }
        // Return the accumulated result
        return {
          html: '<div><h1>Title</h1><p>Content</p></div>',
          css: '',
          js: '',
          identifiers: [],
        };
      })());

      // Act
      const { result } = renderHook(() =>
        useSingleGenerate(mockEditor, clickPosition, mockOnComplete, mockOnError)
      );

      await result.current.handleSingleGenerate(context);

      // Assert
      await waitFor(() => {
        expect(mockEditor.createShape).toHaveBeenCalledWith(
          expect.objectContaining({
            props: expect.objectContaining({
              html: '<div><h1>Title</h1><p>Content</p></div>',
            }),
          })
        );
      });
    });
  });
});
