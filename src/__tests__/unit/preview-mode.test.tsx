/**
 * PreviewMode Component Tests
 * 
 * Tests the PreviewMode component functionality including:
 * - Iframe rendering with srcdoc
 * - Override application before rendering
 * - Load and error event handling
 * - PostMessage communication
 * - Auto-resize integration (shape-auto-resize feature)
 * 
 * Requirements: 4.4, 4.5, 4.9, 4.1, 6.1, 6.2
 */

import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PreviewMode } from '../../components/modes/PreviewMode';
import { ElementOverride } from '../../types';

// Mock tldraw dependencies
jest.mock('tldraw', () => ({
  useEditor: jest.fn(() => ({
    sideEffects: {
      registerAfterDeleteHandler: jest.fn(),
    },
  })),
  createShapeId: (id: string) => id as any,
}));

// Mock ShapeSizes
jest.mock('../../core/shape/shapeSizes', () => ({
  ShapeSizes: {
    get: jest.fn(() => ({
      get: jest.fn(() => undefined),
    })),
    update: jest.fn(),
  },
}));

// Mock useShapeAutoResize hook
jest.mock('../../core/shape/useShapeAutoResize', () => ({
  useShapeAutoResize: jest.fn(),
}));

// Mock height reporter script
jest.mock('../../core/shape/heightReporterScript', () => ({
  getHeightReporterScript: jest.fn(() => 'function reportHeight() { window.parent.postMessage({ type: "content-height", height: 100 }, "*"); }'),
}));

describe('PreviewMode', () => {
  const mockHtml = '<div class="test">Hello World</div>';
  const mockCss = '.test { color: red; }';
  const mockJs = 'console.log("test");';
  const mockShapeId = 'test-shape' as any;

  beforeEach(() => {
    // Clear any previous mocks
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render iframe with srcdoc content', () => {
      const { container } = render(
        <PreviewMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
          shapeId={mockShapeId}
        />
      );

      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe?.getAttribute('srcdoc')).toContain(mockHtml);
      expect(iframe?.getAttribute('srcdoc')).toContain(mockCss);
      expect(iframe?.getAttribute('srcdoc')).toContain(mockJs);
    });

    it('should render with specified width and height', () => {
      const { container } = render(
        <PreviewMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
          shapeId={mockShapeId}
          width={1024}
          height={768}
        />
      );

      const iframe = container.querySelector('iframe');
      expect(iframe?.style.width).toBe('1024px');
      expect(iframe?.style.height).toBe('768px');
    });

    it('should apply sandbox attributes for security', () => {
      const { container } = render(
        <PreviewMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
          shapeId={mockShapeId}
        />
      );

      const iframe = container.querySelector('iframe');
      const sandbox = iframe?.getAttribute('sandbox');
      expect(sandbox).toContain('allow-scripts');
      expect(sandbox).toContain('allow-forms');
      expect(sandbox).toContain('allow-same-origin');
    });

    it('should show loading indicator initially', () => {
      const { getByText } = render(
        <PreviewMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
          shapeId={mockShapeId}
        />
      );

      expect(getByText('Loading preview...')).toBeInTheDocument();
    });

    it('should inject height reporter script into srcdoc', () => {
      const { container } = render(
        <PreviewMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
          shapeId={mockShapeId}
        />
      );

      const iframe = container.querySelector('iframe');
      const srcdoc = iframe?.getAttribute('srcdoc');
      expect(srcdoc).toContain('content-height');
      expect(srcdoc).toContain('reportHeight');
    });
  });

  describe('override application', () => {
    it('should apply overrides to HTML before rendering', () => {
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          text: 'Modified Text',
          timestamp: Date.now(),
          aiGenerated: false,
        },
      ];

      const { container } = render(
        <PreviewMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={overrides}
          shapeId={mockShapeId}
        />
      );

      const iframe = container.querySelector('iframe');
      const srcdoc = iframe?.getAttribute('srcdoc');
      expect(srcdoc).toContain('Modified Text');
    });

    it('should handle multiple overrides', () => {
      const html = '<div class="test">Text</div><p class="para">Paragraph</p>';
      const overrides: ElementOverride[] = [
        {
          selector: '.test',
          text: 'New Text',
          timestamp: Date.now(),
          aiGenerated: false,
        },
        {
          selector: '.para',
          styles: { color: 'blue' },
          timestamp: Date.now() + 1,
          aiGenerated: false,
        },
      ];

      const { container } = render(
        <PreviewMode
          html={html}
          css={mockCss}
          js={mockJs}
          overrides={overrides}
          shapeId={mockShapeId}
        />
      );

      const iframe = container.querySelector('iframe');
      const srcdoc = iframe?.getAttribute('srcdoc');
      expect(srcdoc).toContain('New Text');
      expect(srcdoc).toContain('color: blue');
    });

    it('should handle empty overrides array', () => {
      const { container } = render(
        <PreviewMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
          shapeId={mockShapeId}
        />
      );

      const iframe = container.querySelector('iframe');
      const srcdoc = iframe?.getAttribute('srcdoc');
      expect(srcdoc).toContain(mockHtml);
    });
  });

  describe('event handling', () => {
    it('should call onLoad when iframe loads', async () => {
      const onLoad = jest.fn();

      const { container } = render(
        <PreviewMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
          shapeId={mockShapeId}
          onLoad={onLoad}
        />
      );

      const iframe = container.querySelector('iframe');
      
      // Simulate iframe load event
      if (iframe) {
        const loadEvent = new Event('load');
        iframe.dispatchEvent(loadEvent);
      }

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalled();
      });
    });

    it('should handle invalid overrides gracefully', () => {
      const onError = jest.fn();
      const invalidOverrides: ElementOverride[] = [
        {
          selector: 'invalid>>selector',
          text: 'Text',
          timestamp: Date.now(),
          aiGenerated: false,
        },
      ];

      const { container } = render(
        <PreviewMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={invalidOverrides}
          shapeId={mockShapeId}
          onError={onError}
        />
      );

      // Should still render iframe even with invalid overrides
      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      
      // Original HTML should be rendered since override failed
      const srcdoc = iframe?.getAttribute('srcdoc');
      expect(srcdoc).toContain(mockHtml);
    });
  });

  describe('content generation', () => {
    it('should generate complete HTML document structure', () => {
      const { container } = render(
        <PreviewMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
          shapeId={mockShapeId}
        />
      );

      const iframe = container.querySelector('iframe');
      const srcdoc = iframe?.getAttribute('srcdoc');
      
      expect(srcdoc).toContain('<!DOCTYPE html>');
      expect(srcdoc).toContain('<html lang="en">');
      expect(srcdoc).toContain('<head>');
      expect(srcdoc).toContain('<body>');
      expect(srcdoc).toContain('<style>');
      expect(srcdoc).toContain('<script>');
    });

    it('should include viewport meta tag', () => {
      const { container } = render(
        <PreviewMode
          html={mockHtml}
          css={mockCss}
          js={mockJs}
          overrides={[]}
          shapeId={mockShapeId}
        />
      );

      const iframe = container.querySelector('iframe');
      const srcdoc = iframe?.getAttribute('srcdoc');
      
      expect(srcdoc).toContain('viewport');
      expect(srcdoc).toContain('width=device-width');
    });

    it('should handle empty CSS and JS', () => {
      const { container } = render(
        <PreviewMode
          html={mockHtml}
          css=""
          js=""
          overrides={[]}
          shapeId={mockShapeId}
        />
      );

      const iframe = container.querySelector('iframe');
      const srcdoc = iframe?.getAttribute('srcdoc');
      
      expect(srcdoc).toContain(mockHtml);
      expect(srcdoc).toContain('<style>');
      expect(srcdoc).toContain('<script>');
    });
  });
});
