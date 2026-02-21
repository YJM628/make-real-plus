/**
 * Tests for CodeEditorDialog component
 */
import { render, screen } from '@testing-library/react';
import { CodeEditorDialog } from '../../components/canvas/dialogs/CodeEditorDialog';
import type { Editor } from 'tldraw';

// Mock CodeEditor component
jest.mock('../../components/editors/CodeEditor', () => ({
  CodeEditor: ({ html, css, js, onClose }: any) => (
    <div data-testid="code-editor-mock">
      <div>HTML: {html}</div>
      <div>CSS: {css}</div>
      <div>JS: {js}</div>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('CodeEditorDialog', () => {
  const createMockEditor = (shapes: any[] = []): Editor => {
    return {
      getSelectedShapes: jest.fn(() => shapes.filter((s: any) => s.selected)),
      getCurrentPageShapes: jest.fn(() => shapes),
      getShape: jest.fn((id: string) => shapes.find((s: any) => s.id === id)),
      updateShape: jest.fn(),
    } as any;
  };

  it('should not render when isOpen is false', () => {
    const mockEditor = createMockEditor();
    const mockOnClose = jest.fn();

    const { container } = render(
      <CodeEditorDialog isOpen={false} editor={mockEditor} onClose={mockOnClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should not render when there are no HTML shapes', () => {
    const mockEditor = createMockEditor([]);
    const mockOnClose = jest.fn();

    const { container } = render(
      <CodeEditorDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render CodeEditor with selected shape data', () => {
    const mockShapes = [
      {
        id: 'shape1',
        type: 'html',
        selected: true,
        props: {
          html: '<div>Test HTML</div>',
          css: '.test { color: red; }',
          js: 'console.log("test");',
        },
      },
    ];
    const mockEditor = createMockEditor(mockShapes);
    const mockOnClose = jest.fn();

    render(<CodeEditorDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />);

    expect(screen.getByTestId('code-editor-mock')).toBeInTheDocument();
    expect(screen.getByText('HTML: <div>Test HTML</div>')).toBeInTheDocument();
    expect(screen.getByText('CSS: .test { color: red; }')).toBeInTheDocument();
    expect(screen.getByText('JS: console.log("test");')).toBeInTheDocument();
  });

  it('should use first shape when no shape is selected', () => {
    const mockShapes = [
      {
        id: 'shape1',
        type: 'html',
        selected: false,
        props: {
          html: '<div>First Shape</div>',
          css: '',
          js: '',
        },
      },
      {
        id: 'shape2',
        type: 'html',
        selected: false,
        props: {
          html: '<div>Second Shape</div>',
          css: '',
          js: '',
        },
      },
    ];
    const mockEditor = createMockEditor(mockShapes);
    const mockOnClose = jest.fn();

    render(<CodeEditorDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />);

    expect(screen.getByText('HTML: <div>First Shape</div>')).toBeInTheDocument();
  });

  it('should filter out non-HTML shapes', () => {
    const mockShapes = [
      {
        id: 'shape1',
        type: 'rectangle',
        selected: false,
        props: {},
      },
      {
        id: 'shape2',
        type: 'html',
        selected: true,
        props: {
          html: '<div>HTML Shape</div>',
          css: '',
          js: '',
        },
      },
    ];
    const mockEditor = createMockEditor(mockShapes);
    const mockOnClose = jest.fn();

    render(<CodeEditorDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />);

    expect(screen.getByText('HTML: <div>HTML Shape</div>')).toBeInTheDocument();
  });
});
