/**
 * Unit tests for InteractiveModeContext
 * Feature: html-interactive-preview
 * Requirements: 1.1, 1.3
 */

import React from 'react';
import { render } from '@testing-library/react';
import { InteractiveModeContext } from '../../components/canvas/hooks/useInteractiveMode';

describe('InteractiveModeContext', () => {
  it('should provide default value of null', () => {
    let contextValue: string | null | undefined;

    const TestComponent = () => {
      contextValue = React.useContext(InteractiveModeContext);
      return <div>Test</div>;
    };

    render(<TestComponent />);

    expect(contextValue).toBeNull();
  });

  it('should provide custom value when wrapped in Provider', () => {
    let contextValue: string | null | undefined;

    const TestComponent = () => {
      contextValue = React.useContext(InteractiveModeContext);
      return <div>Test</div>;
    };

    render(
      <InteractiveModeContext.Provider value="shape-123">
        <TestComponent />
      </InteractiveModeContext.Provider>
    );

    expect(contextValue).toBe('shape-123');
  });

  it('should support null value in Provider', () => {
    let contextValue: string | null | undefined;

    const TestComponent = () => {
      contextValue = React.useContext(InteractiveModeContext);
      return <div>Test</div>;
    };

    render(
      <InteractiveModeContext.Provider value={null}>
        <TestComponent />
      </InteractiveModeContext.Provider>
    );

    expect(contextValue).toBeNull();
  });

  it('should support nested Providers with different values', () => {
    const values: (string | null)[] = [];

    const InnerComponent = () => {
      values.push(React.useContext(InteractiveModeContext));
      return <div>Inner</div>;
    };

    const MiddleComponent = () => {
      values.push(React.useContext(InteractiveModeContext));
      return (
        <InteractiveModeContext.Provider value="shape-inner">
          <InnerComponent />
        </InteractiveModeContext.Provider>
      );
    };

    const OuterComponent = () => {
      values.push(React.useContext(InteractiveModeContext));
      return (
        <InteractiveModeContext.Provider value="shape-outer">
          <MiddleComponent />
        </InteractiveModeContext.Provider>
      );
    };

    render(<OuterComponent />);

    expect(values).toEqual([null, 'shape-outer', 'shape-inner']);
  });
});
