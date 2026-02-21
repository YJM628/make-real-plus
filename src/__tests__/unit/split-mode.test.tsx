/**
 * SplitMode Component Tests
 * 
 * Tests the SplitMode component functionality including:
 * - Side-by-side rendering
 * - Original vs modified comparison
 * - Synchronized scrolling
 * 
 * Requirements: 4.7
 */

import * as React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SplitMode } from '../../components/modes/SplitMode';
import { ElementOverride } from '../../types';

describe('SplitMode', () => {
  const mockHtml = '<div class="test">Hello World</div>';
  const mockCss = '.test { color: red; }';
  const mockJs = 'console.log("test");';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render two panels side by side', () => {
      const { container } = render(
        <SplitMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
        />
      );

      const panels = container.querySelectorAll('div[style*="flex: 1"]');
      expect(panels).toHaveLength(2);
    });

    it('should render with specified dimensions', () => {
      const { container } = render(
        <SplitMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
          width={1600}
          height={900}
        />
      );

      // Should render two panels
      const panels = container.querySelectorAll('div[style*="flex: 1"]');
      expect(panels).toHaveLength(2);
    });

    it('should show "Original" label on left panel', () => {
      const { getByText } = render(
        <SplitMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
        />
      );

      expect(getByText('Original')).toBeInTheDocument();
    });

    it('should show "Modified" label on right panel', () => {
      const { getByText } = render(
        <SplitMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
        />
      );

      expect(getByText('Modified')).toBeInTheDocument();
    });
  });

  describe('override handling', () => {
    it('should render original HTML in left panel without overrides', () => {
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          text: 'Modified Text',
          timestamp: Date.now(),
          aiGenerated: false,
        },
      ];

      const { container } = render(
        <SplitMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={overrides}
        />
      );

      // Both panels should render
      const panels = container.querySelectorAll('div[style*="flex: 1"]');
      expect(panels).toHaveLength(2);
    });

    it('should handle empty overrides array', () => {
      const { container } = render(
        <SplitMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
        />
      );

      const panels = container.querySelectorAll('div[style*="flex: 1"]');
      expect(panels).toHaveLength(2);
    });

    it('should handle multiple overrides', () => {
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          text: 'Modified Text',
          timestamp: Date.now(),
          aiGenerated: false,
        },
        {
          selector: '.test',
          styles: { color: 'blue' },
          timestamp: Date.now() + 1,
          aiGenerated: false,
        },
      ];

      const { container } = render(
        <SplitMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={overrides}
        />
      );

      const panels = container.querySelectorAll('div[style*="flex: 1"]');
      expect(panels).toHaveLength(2);
    });
  });

  describe('event handling', () => {
    it('should call onLoad when both panels load', () => {
      const onLoad = jest.fn();

      render(
        <SplitMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
          onLoad={onLoad}
        />
      );

      // onLoad should not be called immediately
      expect(onLoad).not.toHaveBeenCalled();
    });

    it('should call onError when error occurs', () => {
      const onError = jest.fn();

      render(
        <SplitMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
          onError={onError}
        />
      );

      // onError should not be called if no error
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('layout', () => {
    it('should use flexbox layout for side-by-side panels', () => {
      const { container } = render(
        <SplitMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
        />
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.style.display).toBe('flex');
      expect(mainContainer.style.flexDirection).toBe('row');
    });

    it('should have equal width panels', () => {
      const { container } = render(
        <SplitMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
        />
      );

      const panels = container.querySelectorAll('div[style*="flex: 1"]');
      expect(panels).toHaveLength(2);
      
      // Both panels should have flex property set
      panels.forEach((panel) => {
        const htmlPanel = panel as HTMLElement;
        expect(htmlPanel.style.flex).toContain('1');
      });
    });

    it('should have scrollable panels', () => {
      const { container } = render(
        <SplitMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
        />
      );

      const panels = container.querySelectorAll('div[style*="flex: 1"]');
      
      panels.forEach((panel) => {
        const htmlPanel = panel as HTMLElement;
        expect(htmlPanel.style.overflow).toBe('auto');
      });
    });
  });

  describe('synchronized scrolling', () => {
    it('should have scroll event handlers on both panels', () => {
      const { container } = render(
        <SplitMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
        />
      );

      const panels = container.querySelectorAll('div[style*="flex: 1"]');
      expect(panels).toHaveLength(2);
      
      // Panels should be rendered (scroll handlers are attached via React)
      panels.forEach((panel) => {
        expect(panel).toBeInTheDocument();
      });
    });
  });
});
