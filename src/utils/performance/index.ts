/**
 * Performance Optimization Utilities
 * Feature: ai-html-visual-editor
 * 
 * Provides functions for optimizing performance through debouncing,
 * throttling, and viewport detection.
 * 
 * Requirements: 20.4, 20.5
 */

/**
 * Creates a debounced function that delays invoking func until after
 * wait milliseconds have elapsed since the last time the debounced
 * function was invoked.
 * 
 * Debouncing is useful for expensive operations that should only run
 * after the user has stopped performing an action (e.g., search input,
 * window resize).
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 * 
 * Requirements: 20.5
 * 
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 * 
 * // Only the last call within 300ms will execute
 * debouncedSearch('a');
 * debouncedSearch('ab');
 * debouncedSearch('abc'); // Only this will execute after 300ms
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>): void {
    // Clear the previous timeout if it exists
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set a new timeout
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a throttled function that only invokes func at most once per
 * every limit milliseconds.
 * 
 * Throttling is useful for rate-limiting expensive operations that should
 * run periodically during continuous user actions (e.g., scroll handlers,
 * drag operations).
 * 
 * @param func - The function to throttle
 * @param limit - The number of milliseconds to throttle invocations to
 * @returns A throttled version of the function
 * 
 * Requirements: 20.5
 * 
 * @example
 * const throttledScroll = throttle(() => {
 *   console.log('Scroll position:', window.scrollY);
 * }, 100);
 * 
 * // Will execute at most once every 100ms during scrolling
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return function throttled(...args: Parameters<T>): void {
    if (!inThrottle) {
      // Execute immediately if not in throttle period
      func(...args);
      inThrottle = true;
      lastArgs = null;

      setTimeout(() => {
        inThrottle = false;
        
        // If there were calls during throttle period, execute with last args
        if (lastArgs !== null) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      // Store the last arguments to execute after throttle period
      lastArgs = args;
    }
  };
}

/**
 * Checks if an HTML element is currently visible within the viewport.
 * 
 * This is useful for implementing viewport culling - only rendering
 * elements that are actually visible to the user, which improves
 * performance when dealing with many elements.
 * 
 * @param element - The HTML element to check
 * @param viewport - Optional viewport rectangle. If not provided, uses the window viewport.
 * @returns True if the element is at least partially visible in the viewport
 * 
 * Requirements: 20.4
 * 
 * @example
 * const element = document.getElementById('my-element');
 * if (isInViewport(element)) {
 *   // Render or update the element
 * } else {
 *   // Skip rendering to save performance
 * }
 */
export function isInViewport(
  element: HTMLElement,
  viewport?: DOMRect
): boolean {
  if (!element) {
    return false;
  }

  const elementRect = element.getBoundingClientRect();

  // Use provided viewport or default to window viewport
  const viewportRect = viewport || {
    top: 0,
    left: 0,
    bottom: window.innerHeight || document.documentElement.clientHeight,
    right: window.innerWidth || document.documentElement.clientWidth,
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;

  // Check if rectangles intersect
  // Elements intersect if they overlap in both horizontal and vertical axes
  const horizontalOverlap =
    elementRect.left < viewportRect.right &&
    elementRect.right > viewportRect.left;

  const verticalOverlap =
    elementRect.top < viewportRect.bottom &&
    elementRect.bottom > viewportRect.top;

  return horizontalOverlap && verticalOverlap;
}
