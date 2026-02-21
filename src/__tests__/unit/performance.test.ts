/**
 * Unit Tests for Performance Optimization Utilities
 * Feature: ai-html-visual-editor
 * 
 * Tests for debounce, throttle, and viewport detection functions.
 * 
 * Requirements: 20.4, 20.5
 */

import { debounce, throttle, isInViewport } from '../../utils/performance';

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should delay function execution', () => {
    const func = jest.fn();
    const debounced = debounce(func, 100);

    debounced();
    expect(func).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should only execute once after multiple rapid calls', () => {
    const func = jest.fn();
    const debounced = debounce(func, 100);

    debounced();
    debounced();
    debounced();
    debounced();

    expect(func).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should reset timer on each call', () => {
    const func = jest.fn();
    const debounced = debounce(func, 100);

    debounced();
    jest.advanceTimersByTime(50);
    
    debounced(); // Reset timer
    jest.advanceTimersByTime(50);
    
    expect(func).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(50);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the debounced function', () => {
    const func = jest.fn();
    const debounced = debounce(func, 100);

    debounced('arg1', 'arg2', 123);
    jest.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('should use the last set of arguments', () => {
    const func = jest.fn();
    const debounced = debounce(func, 100);

    debounced('first');
    debounced('second');
    debounced('third');

    jest.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('third');
  });

  it('should handle zero wait time', () => {
    const func = jest.fn();
    const debounced = debounce(func, 0);

    debounced();
    expect(func).not.toHaveBeenCalled();

    jest.advanceTimersByTime(0);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should allow multiple executions if enough time passes', () => {
    const func = jest.fn();
    const debounced = debounce(func, 100);

    debounced();
    jest.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);

    debounced();
    jest.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(2);
  });

  it('should work with functions that return values', () => {
    const func = jest.fn(() => 'result');
    const debounced = debounce(func, 100);

    // Note: debounced functions don't return values immediately
    // This is expected behavior
    const result = debounced();
    expect(result).toBeUndefined();

    jest.advanceTimersByTime(100);
    expect(func).toHaveBeenCalled();
  });
});

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should execute immediately on first call', () => {
    const func = jest.fn();
    const throttled = throttle(func, 100);

    throttled();
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should not execute again during throttle period', () => {
    const func = jest.fn();
    const throttled = throttle(func, 100);

    throttled();
    throttled();
    throttled();

    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should execute with last arguments after throttle period', () => {
    const func = jest.fn();
    const throttled = throttle(func, 100);

    throttled('first');
    expect(func).toHaveBeenCalledWith('first');

    throttled('second');
    throttled('third');

    jest.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenLastCalledWith('third');
  });

  it('should allow execution after throttle period expires', () => {
    const func = jest.fn();
    const throttled = throttle(func, 100);

    throttled();
    expect(func).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);

    throttled();
    expect(func).toHaveBeenCalledTimes(2);
  });

  it('should handle rapid calls correctly', () => {
    const func = jest.fn();
    const throttled = throttle(func, 100);

    // First call executes immediately
    throttled(1);
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith(1);

    // Calls during throttle period
    throttled(2);
    throttled(3);
    throttled(4);
    expect(func).toHaveBeenCalledTimes(1);

    // After throttle period, last call executes
    jest.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenLastCalledWith(4);
  });

  it('should handle zero limit time', () => {
    const func = jest.fn();
    const throttled = throttle(func, 0);

    throttled();
    expect(func).toHaveBeenCalledTimes(1);

    throttled();
    expect(func).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(0);
    expect(func).toHaveBeenCalledTimes(2);
  });

  it('should pass all arguments correctly', () => {
    const func = jest.fn();
    const throttled = throttle(func, 100);

    throttled('a', 'b', 123);
    expect(func).toHaveBeenCalledWith('a', 'b', 123);

    throttled('x', 'y', 456);
    jest.advanceTimersByTime(100);
    expect(func).toHaveBeenLastCalledWith('x', 'y', 456);
  });

  it('should not execute trailing call if no calls during throttle', () => {
    const func = jest.fn();
    const throttled = throttle(func, 100);

    throttled();
    expect(func).toHaveBeenCalledTimes(1);

    // No calls during throttle period
    jest.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple throttle cycles', () => {
    const func = jest.fn();
    const throttled = throttle(func, 100);

    // First cycle
    throttled(1);
    throttled(2);
    jest.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(2);

    // Second cycle
    throttled(3);
    throttled(4);
    jest.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(4);
  });
});

describe('isInViewport', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('should return false for null element', () => {
    expect(isInViewport(null as any)).toBe(false);
  });

  it('should return false for undefined element', () => {
    expect(isInViewport(undefined as any)).toBe(false);
  });

  it('should return true for element fully in viewport', () => {
    // Mock getBoundingClientRect to return element in viewport
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 100,
      bottom: 200,
      right: 200,
      width: 100,
      height: 100,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    });

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

    expect(isInViewport(element)).toBe(true);
  });

  it('should return false for element completely above viewport', () => {
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: -200,
      left: 100,
      bottom: -100,
      right: 200,
      width: 100,
      height: 100,
      x: 100,
      y: -200,
      toJSON: () => ({}),
    });

    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

    expect(isInViewport(element)).toBe(false);
  });

  it('should return false for element completely below viewport', () => {
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 1000,
      left: 100,
      bottom: 1100,
      right: 200,
      width: 100,
      height: 100,
      x: 100,
      y: 1000,
      toJSON: () => ({}),
    });

    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

    expect(isInViewport(element)).toBe(false);
  });

  it('should return false for element completely to the left of viewport', () => {
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: -200,
      bottom: 200,
      right: -100,
      width: 100,
      height: 100,
      x: -200,
      y: 100,
      toJSON: () => ({}),
    });

    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });

    expect(isInViewport(element)).toBe(false);
  });

  it('should return false for element completely to the right of viewport', () => {
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 1500,
      bottom: 200,
      right: 1600,
      width: 100,
      height: 100,
      x: 1500,
      y: 100,
      toJSON: () => ({}),
    });

    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });

    expect(isInViewport(element)).toBe(false);
  });

  it('should return true for element partially in viewport (top edge)', () => {
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: -50,
      left: 100,
      bottom: 50,
      right: 200,
      width: 100,
      height: 100,
      x: 100,
      y: -50,
      toJSON: () => ({}),
    });

    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

    expect(isInViewport(element)).toBe(true);
  });

  it('should return true for element partially in viewport (bottom edge)', () => {
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 700,
      left: 100,
      bottom: 800,
      right: 200,
      width: 100,
      height: 100,
      x: 100,
      y: 700,
      toJSON: () => ({}),
    });

    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

    expect(isInViewport(element)).toBe(true);
  });

  it('should return true for element partially in viewport (left edge)', () => {
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: -50,
      bottom: 200,
      right: 50,
      width: 100,
      height: 100,
      x: -50,
      y: 100,
      toJSON: () => ({}),
    });

    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });

    expect(isInViewport(element)).toBe(true);
  });

  it('should return true for element partially in viewport (right edge)', () => {
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 1000,
      bottom: 200,
      right: 1100,
      width: 100,
      height: 100,
      x: 1000,
      y: 100,
      toJSON: () => ({}),
    });

    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });

    expect(isInViewport(element)).toBe(true);
  });

  it('should work with custom viewport', () => {
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 150,
      left: 150,
      bottom: 250,
      right: 250,
      width: 100,
      height: 100,
      x: 150,
      y: 150,
      toJSON: () => ({}),
    });

    const customViewport: DOMRect = {
      top: 100,
      left: 100,
      bottom: 300,
      right: 300,
      width: 200,
      height: 200,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    };

    expect(isInViewport(element, customViewport)).toBe(true);
  });

  it('should return false when element is outside custom viewport', () => {
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 400,
      left: 400,
      bottom: 500,
      right: 500,
      width: 100,
      height: 100,
      x: 400,
      y: 400,
      toJSON: () => ({}),
    });

    const customViewport: DOMRect = {
      top: 100,
      left: 100,
      bottom: 300,
      right: 300,
      width: 200,
      height: 200,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    };

    expect(isInViewport(element, customViewport)).toBe(false);
  });

  it('should handle element at exact viewport boundaries', () => {
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      left: 0,
      bottom: 768,
      right: 1024,
      width: 1024,
      height: 768,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

    expect(isInViewport(element)).toBe(true);
  });

  it('should handle very small elements', () => {
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 100,
      bottom: 101,
      right: 101,
      width: 1,
      height: 1,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    });

    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

    expect(isInViewport(element)).toBe(true);
  });

  it('should handle very large elements', () => {
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: -500,
      left: -500,
      bottom: 2000,
      right: 2000,
      width: 2500,
      height: 2500,
      x: -500,
      y: -500,
      toJSON: () => ({}),
    });

    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

    expect(isInViewport(element)).toBe(true);
  });
});

describe('debounce and throttle edge cases', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('debounce should handle function that throws error', () => {
    const func = jest.fn(() => {
      throw new Error('Test error');
    });
    const debounced = debounce(func, 100);

    debounced();
    
    expect(() => {
      jest.advanceTimersByTime(100);
    }).toThrow('Test error');
  });

  it('throttle should handle function that throws error', () => {
    const func = jest.fn(() => {
      throw new Error('Test error');
    });
    const throttled = throttle(func, 100);

    expect(() => {
      throttled();
    }).toThrow('Test error');
  });

  it('debounce should work with async functions', () => {
    const func = jest.fn(async () => 'result');
    const debounced = debounce(func, 100);

    debounced();
    jest.advanceTimersByTime(100);

    expect(func).toHaveBeenCalled();
  });

  it('throttle should work with async functions', () => {
    const func = jest.fn(async () => 'result');
    const throttled = throttle(func, 100);

    throttled();
    expect(func).toHaveBeenCalled();
  });
});
