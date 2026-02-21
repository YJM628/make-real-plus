/**
 * Unit tests for usePageNavigation hook
 * Feature: editor-canvas-refactor
 * Requirements: 4.1, 4.2, 4.3
 */

import { renderHook } from '@testing-library/react';
import { usePageNavigation } from '../../components/canvas/hooks/usePageNavigation';
import { PageLinkHandler } from '../../utils/batch/pageLinkHandler';
import type { Editor } from 'tldraw';

describe('usePageNavigation', () => {
  let mockEditor: Editor;

  beforeEach(() => {
    // Create a mock editor with necessary methods
    mockEditor = {
      getShape: jest.fn(),
      select: jest.fn(),
      zoomToSelection: jest.fn(),
    } as unknown as Editor;

    // Clear all timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('PageLinkHandler Reference', () => {
    it('should return a pageLinkHandlerRef', () => {
      // Requirement 4.3: Manage PageLinkHandler reference
      const { result } = renderHook(() => usePageNavigation(mockEditor));

      expect(result.current.pageLinkHandlerRef).toBeDefined();
      expect(result.current.pageLinkHandlerRef.current).toBeNull();
    });

    it('should allow setting PageLinkHandler instance', () => {
      // Requirement 4.3: Manage PageLinkHandler reference lifecycle
      const { result } = renderHook(() => usePageNavigation(mockEditor));

      const handler = new PageLinkHandler();
      result.current.pageLinkHandlerRef.current = handler;

      expect(result.current.pageLinkHandlerRef.current).toBe(handler);
    });
  });

  describe('Navigation Event Handling', () => {
    it('should navigate to target shape when navigateToPage event is dispatched', () => {
      // Requirement 4.1, 4.2: Listen for navigateToPage event and navigate to target
      const { result } = renderHook(() => usePageNavigation(mockEditor));

      // Set up PageLinkHandler with page mappings
      const handler = new PageLinkHandler();
      handler.registerPages(new Map([
        ['home', 'shape:home-123'],
        ['products', 'shape:products-456'],
      ]));
      result.current.pageLinkHandlerRef.current = handler;

      // Mock getShape to return a shape
      const mockShape = { id: 'shape:products-456', type: 'html' };
      (mockEditor.getShape as jest.Mock).mockReturnValue(mockShape);

      // Dispatch navigateToPage event
      const event = new CustomEvent('navigateToPage', {
        detail: {
          targetPage: 'products',
          sourcePage: 'home',
        },
      });
      document.dispatchEvent(event);

      // Should select the target shape
      expect(mockEditor.select).toHaveBeenCalledWith('shape:products-456');

      // Should zoom to selection after a delay
      jest.advanceTimersByTime(50);
      expect(mockEditor.zoomToSelection).toHaveBeenCalledWith({
        animation: { duration: 300 },
      });
    });

    it('should use PageLinkHandler to resolve target page name', () => {
      // Requirement 4.2: Use PageLinkHandler to find target shape
      const { result } = renderHook(() => usePageNavigation(mockEditor));

      const handler = new PageLinkHandler();
      const handlePageLinkClickSpy = jest.spyOn(handler, 'handlePageLinkClick');
      handler.registerPages(new Map([['about', 'shape:about-789']]));
      result.current.pageLinkHandlerRef.current = handler;

      const mockShape = { id: 'shape:about-789', type: 'html' };
      (mockEditor.getShape as jest.Mock).mockReturnValue(mockShape);

      const event = new CustomEvent('navigateToPage', {
        detail: {
          targetPage: 'about',
          sourcePage: 'home',
        },
      });
      document.dispatchEvent(event);

      expect(handlePageLinkClickSpy).toHaveBeenCalledWith('about');
      expect(handlePageLinkClickSpy).toHaveReturnedWith('shape:about-789');
    });

    it('should zoom to selection with animation', () => {
      // Requirement 4.2: Smooth scroll to target shape
      const { result } = renderHook(() => usePageNavigation(mockEditor));

      const handler = new PageLinkHandler();
      handler.registerPages(new Map([['contact', 'shape:contact-999']]));
      result.current.pageLinkHandlerRef.current = handler;

      const mockShape = { id: 'shape:contact-999', type: 'html' };
      (mockEditor.getShape as jest.Mock).mockReturnValue(mockShape);

      const event = new CustomEvent('navigateToPage', {
        detail: {
          targetPage: 'contact',
          sourcePage: 'home',
        },
      });
      document.dispatchEvent(event);

      // Zoom should be called after 50ms delay
      expect(mockEditor.zoomToSelection).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(50);
      
      expect(mockEditor.zoomToSelection).toHaveBeenCalledWith({
        animation: { duration: 300 },
      });
    });
  });

  describe('Silent Failure Handling', () => {
    it('should silently ignore when PageLinkHandler is not initialized', () => {
      // Requirement 4.2: Silently ignore when target doesn't exist
      renderHook(() => usePageNavigation(mockEditor));

      // Don't set pageLinkHandlerRef.current (leave it as null)

      const event = new CustomEvent('navigateToPage', {
        detail: {
          targetPage: 'products',
          sourcePage: 'home',
        },
      });
      document.dispatchEvent(event);

      // Should not call any editor methods
      expect(mockEditor.getShape).not.toHaveBeenCalled();
      expect(mockEditor.select).not.toHaveBeenCalled();
      expect(mockEditor.zoomToSelection).not.toHaveBeenCalled();
    });

    it('should silently ignore when target page does not exist', () => {
      // Requirement 4.2: Silently ignore when target doesn't exist
      const { result } = renderHook(() => usePageNavigation(mockEditor));

      const handler = new PageLinkHandler();
      handler.registerPages(new Map([['home', 'shape:home-123']]));
      result.current.pageLinkHandlerRef.current = handler;

      // Try to navigate to a non-existent page
      const event = new CustomEvent('navigateToPage', {
        detail: {
          targetPage: 'nonexistent',
          sourcePage: 'home',
        },
      });
      document.dispatchEvent(event);

      // Should not call editor methods
      expect(mockEditor.getShape).not.toHaveBeenCalled();
      expect(mockEditor.select).not.toHaveBeenCalled();
      expect(mockEditor.zoomToSelection).not.toHaveBeenCalled();
    });

    it('should silently ignore when target shape is not found on canvas', () => {
      // Requirement 4.2: Silently ignore when target doesn't exist
      const { result } = renderHook(() => usePageNavigation(mockEditor));

      const handler = new PageLinkHandler();
      handler.registerPages(new Map([['products', 'shape:products-456']]));
      result.current.pageLinkHandlerRef.current = handler;

      // Mock getShape to return null (shape not found)
      (mockEditor.getShape as jest.Mock).mockReturnValue(null);

      const event = new CustomEvent('navigateToPage', {
        detail: {
          targetPage: 'products',
          sourcePage: 'home',
        },
      });
      document.dispatchEvent(event);

      // Should call getShape but not select or zoom
      expect(mockEditor.getShape).toHaveBeenCalledWith('shape:products-456');
      expect(mockEditor.select).not.toHaveBeenCalled();
      expect(mockEditor.zoomToSelection).not.toHaveBeenCalled();
    });

    it('should silently ignore when target shape is undefined', () => {
      // Requirement 4.2: Silently ignore when target doesn't exist
      const { result } = renderHook(() => usePageNavigation(mockEditor));

      const handler = new PageLinkHandler();
      handler.registerPages(new Map([['about', 'shape:about-789']]));
      result.current.pageLinkHandlerRef.current = handler;

      // Mock getShape to return undefined
      (mockEditor.getShape as jest.Mock).mockReturnValue(undefined);

      const event = new CustomEvent('navigateToPage', {
        detail: {
          targetPage: 'about',
          sourcePage: 'home',
        },
      });
      document.dispatchEvent(event);

      expect(mockEditor.getShape).toHaveBeenCalledWith('shape:about-789');
      expect(mockEditor.select).not.toHaveBeenCalled();
      expect(mockEditor.zoomToSelection).not.toHaveBeenCalled();
    });
  });

  describe('Editor Lifecycle', () => {
    it('should not register event listeners when editor is null', () => {
      // Don't register listeners when editor is null
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      renderHook(() => usePageNavigation(null));

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('navigateToPage', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should register navigateToPage event listener when editor is provided', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      renderHook(() => usePageNavigation(mockEditor));

      expect(addEventListenerSpy).toHaveBeenCalledWith('navigateToPage', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() => usePageNavigation(mockEditor));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('navigateToPage', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should handle editor changing from null to defined', () => {
      // Edge case: editor starts as null, then becomes defined
      const { result, rerender } = renderHook(
        ({ editor }) => usePageNavigation(editor),
        { initialProps: { editor: null as Editor | null } }
      );

      const handler = new PageLinkHandler();
      handler.registerPages(new Map([['home', 'shape:home-123']]));
      result.current.pageLinkHandlerRef.current = handler;

      const mockShape = { id: 'shape:home-123', type: 'html' };
      (mockEditor.getShape as jest.Mock).mockReturnValue(mockShape);

      // Dispatch event - should not navigate yet
      const event1 = new CustomEvent('navigateToPage', {
        detail: { targetPage: 'home', sourcePage: 'index' },
      });
      document.dispatchEvent(event1);
      expect(mockEditor.select).not.toHaveBeenCalled();

      // Now provide the editor
      rerender({ editor: mockEditor });

      // Dispatch event again - should now navigate
      const event2 = new CustomEvent('navigateToPage', {
        detail: { targetPage: 'home', sourcePage: 'index' },
      });
      document.dispatchEvent(event2);
      expect(mockEditor.select).toHaveBeenCalledWith('shape:home-123');
    });
  });

  describe('Multiple Navigation Events', () => {
    it('should handle multiple navigation events sequentially', () => {
      const { result } = renderHook(() => usePageNavigation(mockEditor));

      const handler = new PageLinkHandler();
      handler.registerPages(new Map([
        ['home', 'shape:home-123'],
        ['products', 'shape:products-456'],
        ['about', 'shape:about-789'],
      ]));
      result.current.pageLinkHandlerRef.current = handler;

      // Mock getShape to return different shapes
      (mockEditor.getShape as jest.Mock)
        .mockReturnValueOnce({ id: 'shape:home-123', type: 'html' })
        .mockReturnValueOnce({ id: 'shape:products-456', type: 'html' })
        .mockReturnValueOnce({ id: 'shape:about-789', type: 'html' });

      // Navigate to home
      document.dispatchEvent(new CustomEvent('navigateToPage', {
        detail: { targetPage: 'home', sourcePage: 'index' },
      }));
      expect(mockEditor.select).toHaveBeenCalledWith('shape:home-123');

      // Navigate to products
      document.dispatchEvent(new CustomEvent('navigateToPage', {
        detail: { targetPage: 'products', sourcePage: 'home' },
      }));
      expect(mockEditor.select).toHaveBeenCalledWith('shape:products-456');

      // Navigate to about
      document.dispatchEvent(new CustomEvent('navigateToPage', {
        detail: { targetPage: 'about', sourcePage: 'products' },
      }));
      expect(mockEditor.select).toHaveBeenCalledWith('shape:about-789');

      expect(mockEditor.select).toHaveBeenCalledTimes(3);
    });

    it('should handle mix of valid and invalid navigation events', () => {
      const { result } = renderHook(() => usePageNavigation(mockEditor));

      const handler = new PageLinkHandler();
      handler.registerPages(new Map([['home', 'shape:home-123']]));
      result.current.pageLinkHandlerRef.current = handler;

      const mockShape = { id: 'shape:home-123', type: 'html' };
      (mockEditor.getShape as jest.Mock).mockReturnValue(mockShape);

      // Valid navigation
      document.dispatchEvent(new CustomEvent('navigateToPage', {
        detail: { targetPage: 'home', sourcePage: 'index' },
      }));
      expect(mockEditor.select).toHaveBeenCalledWith('shape:home-123');

      // Invalid navigation (non-existent page)
      document.dispatchEvent(new CustomEvent('navigateToPage', {
        detail: { targetPage: 'nonexistent', sourcePage: 'home' },
      }));
      // Should still only have been called once
      expect(mockEditor.select).toHaveBeenCalledTimes(1);

      // Another valid navigation
      document.dispatchEvent(new CustomEvent('navigateToPage', {
        detail: { targetPage: 'home', sourcePage: 'index' },
      }));
      expect(mockEditor.select).toHaveBeenCalledTimes(2);
    });
  });

  describe('Comprehensive Requirements Validation', () => {
    it('should satisfy all requirements', () => {
      // Comprehensive test validating Requirements 4.1, 4.2, 4.3
      const { result } = renderHook(() => usePageNavigation(mockEditor));

      // 4.3: Manage PageLinkHandler reference
      expect(result.current.pageLinkHandlerRef).toBeDefined();

      const handler = new PageLinkHandler();
      handler.registerPages(new Map([
        ['home', 'shape:home-123'],
        ['products', 'shape:products-456'],
      ]));
      result.current.pageLinkHandlerRef.current = handler;

      const mockShape = { id: 'shape:products-456', type: 'html' };
      (mockEditor.getShape as jest.Mock).mockReturnValue(mockShape);

      // 4.1, 4.2: Listen for navigateToPage event and navigate
      const event = new CustomEvent('navigateToPage', {
        detail: {
          targetPage: 'products',
          sourcePage: 'home',
        },
      });
      document.dispatchEvent(event);

      // 4.2: Use PageLinkHandler to find target shape
      expect(mockEditor.getShape).toHaveBeenCalledWith('shape:products-456');
      
      // 4.2: Select target shape
      expect(mockEditor.select).toHaveBeenCalledWith('shape:products-456');
      
      // 4.2: Zoom to selection
      jest.advanceTimersByTime(50);
      expect(mockEditor.zoomToSelection).toHaveBeenCalledWith({
        animation: { duration: 300 },
      });

      // 4.2: Silently ignore when target doesn't exist
      (mockEditor.getShape as jest.Mock).mockReturnValue(null);
      const invalidEvent = new CustomEvent('navigateToPage', {
        detail: { targetPage: 'nonexistent', sourcePage: 'home' },
      });
      document.dispatchEvent(invalidEvent);
      // Should still only have been called once (no error thrown)
      expect(mockEditor.select).toHaveBeenCalledTimes(1);
    });
  });
});
