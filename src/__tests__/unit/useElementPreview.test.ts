/**
 * Unit tests for useElementPreview hook
 * Feature: floating-edit-panel-refactor
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { renderHook, act } from '@testing-library/react';
import { useElementPreview } from '../../hooks/useElementPreview';

/**
 * Helper: create a DOM element with specified text and styles,
 * append it to document.body, and return it.
 */
function createTestElement(
  text: string = 'Original text',
  styles: Record<string, string> = {}
): HTMLElement {
  const el = document.createElement('div');
  el.textContent = text;
  Object.entries(styles).forEach(([key, value]) => {
    el.style.setProperty(key, value);
  });
  document.body.appendChild(el);
  return el;
}

/**
 * Helper: clean up a test element from the DOM.
 */
function removeTestElement(el: HTMLElement): void {
  if (el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

describe('useElementPreview', () => {
  let testElement: HTMLElement;

  afterEach(() => {
    if (testElement && testElement.parentNode) {
      removeTestElement(testElement);
    }
  });

  describe('Initialization (Requirement 3.4)', () => {
    it('should save original textContent on initialization', () => {
      testElement = createTestElement('Hello World');

      const { result } = renderHook(() =>
        useElementPreview({
          element: testElement,
          visible: true,
          textContent: 'Hello World',
          styles: {},
        })
      );

      expect(result.current.initialTextContent).toBe('Hello World');
    });

    it('should save original computed styles on initialization', () => {
      testElement = createTestElement('Test');

      const { result } = renderHook(() =>
        useElementPreview({
          element: testElement,
          visible: true,
          textContent: 'Test',
          styles: {},
        })
      );

      // initialStyles should contain the tracked style keys
      expect(result.current.initialStyles).toHaveProperty('color');
      expect(result.current.initialStyles).toHaveProperty('backgroundColor');
      expect(result.current.initialStyles).toHaveProperty('fontSize');
      expect(result.current.initialStyles).toHaveProperty('padding');
      expect(result.current.initialStyles).toHaveProperty('margin');
    });

    it('should return empty values when element is null', () => {
      const { result } = renderHook(() =>
        useElementPreview({
          element: null,
          visible: false,
          textContent: '',
          styles: {},
        })
      );

      expect(result.current.initialTextContent).toBe('');
      expect(result.current.initialStyles).toEqual({});
    });

    it('should update initial state when element changes', () => {
      testElement = createTestElement('First element');

      const { result, rerender } = renderHook(
        (props) => useElementPreview(props),
        {
          initialProps: {
            element: testElement as HTMLElement | null,
            visible: true,
            textContent: 'First element',
            styles: {},
          },
        }
      );

      expect(result.current.initialTextContent).toBe('First element');

      // Create a new element
      const secondElement = createTestElement('Second element');

      rerender({
        element: secondElement,
        visible: true,
        textContent: 'Second element',
        styles: {},
      });

      expect(result.current.initialTextContent).toBe('Second element');

      removeTestElement(secondElement);
    });
  });

  describe('Text content preview (Requirement 3.1)', () => {
    it('should apply text content to DOM element when visible', () => {
      testElement = createTestElement('Original');

      renderHook(
        (props) => useElementPreview(props),
        {
          initialProps: {
            element: testElement,
            visible: true,
            textContent: 'Updated text',
            styles: {},
          },
        }
      );

      expect(testElement.textContent).toBe('Updated text');
    });

    it('should update text content when textContent prop changes', () => {
      testElement = createTestElement('Original');

      const { rerender } = renderHook(
        (props) => useElementPreview(props),
        {
          initialProps: {
            element: testElement,
            visible: true,
            textContent: 'First update',
            styles: {},
          },
        }
      );

      expect(testElement.textContent).toBe('First update');

      rerender({
        element: testElement,
        visible: true,
        textContent: 'Second update',
        styles: {},
      });

      expect(testElement.textContent).toBe('Second update');
    });

    it('should not apply text content when not visible', () => {
      testElement = createTestElement('Original');

      renderHook(
        (props) => useElementPreview(props),
        {
          initialProps: {
            element: testElement,
            visible: false,
            textContent: 'Should not apply',
            styles: {},
          },
        }
      );

      // When not visible, the text should remain as original
      // (restore is called when visible=false, reverting to initial)
      expect(testElement.textContent).toBe('Original');
    });
  });

  describe('Style preview (Requirement 3.2)', () => {
    it('should apply styles to DOM element when visible', () => {
      testElement = createTestElement('Test');

      renderHook(
        (props) => useElementPreview(props),
        {
          initialProps: {
            element: testElement,
            visible: true,
            textContent: 'Test',
            styles: { fontSize: '24px' },
          },
        }
      );

      // Check that the style was applied with important
      expect(testElement.style.getPropertyValue('font-size')).toBe('24px');
      expect(testElement.style.getPropertyPriority('font-size')).toBe('important');
    });

    it('should convert camelCase style keys to kebab-case when applying', () => {
      testElement = createTestElement('Test');

      renderHook(
        (props) => useElementPreview(props),
        {
          initialProps: {
            element: testElement,
            visible: true,
            textContent: 'Test',
            styles: { fontSize: '18px' },
          },
        }
      );

      // font-size (kebab-case) should be set
      expect(testElement.style.getPropertyValue('font-size')).toBe('18px');
    });

    it('should apply multiple styles simultaneously', () => {
      testElement = createTestElement('Test');

      renderHook(
        (props) => useElementPreview(props),
        {
          initialProps: {
            element: testElement,
            visible: true,
            textContent: 'Test',
            styles: {
              fontSize: '20px',
              padding: '10px',
              margin: '5px',
            },
          },
        }
      );

      expect(testElement.style.getPropertyValue('font-size')).toBe('20px');
      expect(testElement.style.getPropertyValue('padding')).toBe('10px');
      expect(testElement.style.getPropertyValue('margin')).toBe('5px');
    });

    it('should apply color styles with important priority', () => {
      testElement = createTestElement('Test');

      renderHook(
        (props) => useElementPreview(props),
        {
          initialProps: {
            element: testElement,
            visible: true,
            textContent: 'Test',
            styles: { color: '#ff0000' },
          },
        }
      );

      // jsdom may convert hex to rgb, so check that the property was set
      const colorValue = testElement.style.getPropertyValue('color');
      expect(colorValue).toBeTruthy();
      expect(testElement.style.getPropertyPriority('color')).toBe('important');
    });

    it('should not apply styles when not visible', () => {
      testElement = createTestElement('Test');

      renderHook(
        (props) => useElementPreview(props),
        {
          initialProps: {
            element: testElement,
            visible: false,
            textContent: 'Test',
            styles: { fontSize: '24px' },
          },
        }
      );

      // Style should not be applied when not visible
      expect(testElement.style.getPropertyValue('font-size')).toBe('');
    });
  });

  describe('Restore functionality (Requirement 3.3)', () => {
    it('should restore original textContent when restore() is called', () => {
      testElement = createTestElement('Original text');

      const { result } = renderHook(
        (props) => useElementPreview(props),
        {
          initialProps: {
            element: testElement,
            visible: true,
            textContent: 'Modified text',
            styles: {},
          },
        }
      );

      expect(testElement.textContent).toBe('Modified text');

      act(() => {
        result.current.restore();
      });

      expect(testElement.textContent).toBe('Original text');
    });

    it('should remove applied style properties when restore() is called', () => {
      testElement = createTestElement('Test');

      const { result } = renderHook(
        (props) => useElementPreview(props),
        {
          initialProps: {
            element: testElement,
            visible: true,
            textContent: 'Test',
            styles: {
              fontSize: '24px',
              padding: '10px',
            },
          },
        }
      );

      // Verify styles were applied
      expect(testElement.style.getPropertyValue('font-size')).toBe('24px');
      expect(testElement.style.getPropertyValue('padding')).toBe('10px');

      act(() => {
        result.current.restore();
      });

      // Verify styles were removed
      expect(testElement.style.getPropertyValue('font-size')).toBe('');
      expect(testElement.style.getPropertyValue('padding')).toBe('');
    });

    it('should automatically restore when visible becomes false', () => {
      testElement = createTestElement('Original');

      const { rerender } = renderHook(
        (props) => useElementPreview(props),
        {
          initialProps: {
            element: testElement,
            visible: true,
            textContent: 'Modified',
            styles: { fontSize: '24px', padding: '10px' },
          },
        }
      );

      expect(testElement.textContent).toBe('Modified');
      expect(testElement.style.getPropertyValue('font-size')).toBe('24px');

      // Set visible to false - should auto-restore
      rerender({
        element: testElement,
        visible: false,
        textContent: 'Modified',
        styles: { fontSize: '24px', padding: '10px' },
      });

      expect(testElement.textContent).toBe('Original');
      expect(testElement.style.getPropertyValue('font-size')).toBe('');
      expect(testElement.style.getPropertyValue('padding')).toBe('');
    });
  });

  describe('Edge cases', () => {
    it('should handle element with empty textContent', () => {
      testElement = createTestElement('');

      const { result } = renderHook(() =>
        useElementPreview({
          element: testElement,
          visible: true,
          textContent: '',
          styles: {},
        })
      );

      expect(result.current.initialTextContent).toBe('');
    });

    it('should not throw when restore is called with null element', () => {
      const { result } = renderHook(() =>
        useElementPreview({
          element: null,
          visible: false,
          textContent: '',
          styles: {},
        })
      );

      expect(() => {
        act(() => {
          result.current.restore();
        });
      }).not.toThrow();
    });

    it('should not throw when element is removed from DOM before restore', () => {
      testElement = createTestElement('Test');

      const { result } = renderHook(
        (props) => useElementPreview(props),
        {
          initialProps: {
            element: testElement,
            visible: true,
            textContent: 'Modified',
            styles: { fontSize: '24px' },
          },
        }
      );

      // Remove element from DOM
      removeTestElement(testElement);

      // restore should not throw
      expect(() => {
        act(() => {
          result.current.restore();
        });
      }).not.toThrow();

      // Prevent afterEach from trying to remove again
      testElement = null as unknown as HTMLElement;
    });

    it('should skip empty style values', () => {
      testElement = createTestElement('Test');

      renderHook(
        (props) => useElementPreview(props),
        {
          initialProps: {
            element: testElement,
            visible: true,
            textContent: 'Test',
            styles: { color: '', fontSize: '20px' },
          },
        }
      );

      // Empty color should not be applied (no important priority)
      expect(testElement.style.getPropertyPriority('color')).toBe('');
      // Non-empty fontSize should be applied
      expect(testElement.style.getPropertyValue('font-size')).toBe('20px');
    });
  });
});
