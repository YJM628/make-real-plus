/**
 * Unit tests for ThemeEditorPanel component
 * Feature: global-theme-editor
 * Requirements: 1.3, 4.1, 4.2
 *
 * Tests:
 * - Panel renders when isOpen=true, doesn't render when isOpen=false
 * - Panel loads and displays CSS variables grouped by category
 * - Page group selector appears when multiple groups exist
 * - Page group switching calls selectGroup
 * - Empty state when no page groups exist
 * - Error message display
 * - Close button calls onClose
 */

import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeEditorPanel } from './ThemeEditorPanel';
import type { UseThemeEditorReturn } from '../hooks/useThemeEditor';

// --- Mock useThemeEditor hook ---
const mockUseThemeEditor = jest.fn<UseThemeEditorReturn, [any]>();

jest.mock('../hooks/useThemeEditor', () => ({
  useThemeEditor: (...args: any[]) => mockUseThemeEditor(args[0]),
}));

// --- Helper: create a default mock return value ---
function createMockHookReturn(
  overrides: Partial<UseThemeEditorReturn> = {}
): UseThemeEditorReturn {
  return {
    pageGroups: [],
    selectedGroupId: null,
    cssVariables: [],
    sharedNavigation: null,
    selectGroup: jest.fn(),
    updateVariable: jest.fn(),
    updateNavigation: jest.fn(),
    error: null,
    ...overrides,
  };
}

// --- Helper: create a mock editor ---
function createMockEditor() {
  return {
    getShape: jest.fn(),
    updateShape: jest.fn(),
  } as any;
}

describe('ThemeEditorPanel', () => {
  beforeEach(() => {
    mockUseThemeEditor.mockReset();
  });

  describe('panel visibility', () => {
    it('should not render when isOpen is false', () => {
      mockUseThemeEditor.mockReturnValue(createMockHookReturn());
      const editor = createMockEditor();

      const { container } = render(
        <ThemeEditorPanel isOpen={false} editor={editor} onClose={jest.fn()} />
      );

      expect(container.innerHTML).toBe('');
      expect(screen.queryByTestId('theme-editor-panel')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true (Requirement 1.3)', () => {
      mockUseThemeEditor.mockReturnValue(createMockHookReturn());
      const editor = createMockEditor();

      render(
        <ThemeEditorPanel isOpen={true} editor={editor} onClose={jest.fn()} />
      );

      expect(screen.getByTestId('theme-editor-panel')).toBeInTheDocument();
      expect(screen.getByText('全局主题编辑器')).toBeInTheDocument();
    });
  });

  describe('loading data on open (Requirement 1.3)', () => {
    it('should display CSS variables grouped by category when data is loaded', () => {
      mockUseThemeEditor.mockReturnValue(
        createMockHookReturn({
          pageGroups: [
            {
              groupId: 'group-1',
              shapeIds: ['s1', 's2'],
              sharedTheme: '',
              sharedNavigation: { header: '', footer: '' },
              pageNameToShapeId: new Map(),
            },
          ],
          selectedGroupId: 'group-1',
          cssVariables: [
            { name: '--primary-color', value: '#3b82f6', category: 'color' },
            { name: '--font-family', value: 'sans-serif', category: 'font' },
            { name: '--spacing', value: '16px', category: 'spacing' },
          ],
          sharedNavigation: { header: '<nav>H</nav>', footer: '<footer>F</footer>' },
        })
      );

      render(
        <ThemeEditorPanel isOpen={true} editor={createMockEditor()} onClose={jest.fn()} />
      );

      // Category headers should be displayed
      expect(screen.getByText('🎨 颜色')).toBeInTheDocument();
      expect(screen.getByText('🔤 字体')).toBeInTheDocument();
      expect(screen.getByText('📏 间距')).toBeInTheDocument();

      // CSS variables section header
      expect(screen.getByText('CSS 变量')).toBeInTheDocument();

      // Color variable should use color input
      expect(screen.getByTestId('color-input---primary-color')).toBeInTheDocument();

      // Font variable should use text input
      expect(screen.getByTestId('text-input---font-family')).toBeInTheDocument();

      // Spacing variable should use text input
      expect(screen.getByTestId('text-input---spacing')).toBeInTheDocument();
    });

    it('should display shared navigation textareas when navigation data exists', () => {
      mockUseThemeEditor.mockReturnValue(
        createMockHookReturn({
          pageGroups: [
            {
              groupId: 'group-1',
              shapeIds: ['s1'],
              sharedTheme: '',
              sharedNavigation: { header: '<nav>Header</nav>', footer: '<footer>Footer</footer>' },
              pageNameToShapeId: new Map(),
            },
          ],
          selectedGroupId: 'group-1',
          cssVariables: [],
          sharedNavigation: { header: '<nav>Header</nav>', footer: '<footer>Footer</footer>' },
        })
      );

      render(
        <ThemeEditorPanel isOpen={true} editor={createMockEditor()} onClose={jest.fn()} />
      );

      expect(screen.getByText('共享导航')).toBeInTheDocument();
      expect(screen.getByTestId('nav-header-textarea')).toHaveValue('<nav>Header</nav>');
      expect(screen.getByTestId('nav-footer-textarea')).toHaveValue('<footer>Footer</footer>');
    });
  });

  describe('page group selector (Requirements 4.1, 4.2)', () => {
    it('should show page group selector when multiple groups exist', () => {
      mockUseThemeEditor.mockReturnValue(
        createMockHookReturn({
          pageGroups: [
            {
              groupId: 'group-1',
              shapeIds: ['s1', 's2'],
              sharedTheme: '',
              sharedNavigation: { header: '', footer: '' },
              pageNameToShapeId: new Map(),
            },
            {
              groupId: 'group-2',
              shapeIds: ['s3'],
              sharedTheme: '',
              sharedNavigation: { header: '', footer: '' },
              pageNameToShapeId: new Map(),
            },
          ],
          selectedGroupId: 'group-1',
          cssVariables: [],
          sharedNavigation: null,
        })
      );

      render(
        <ThemeEditorPanel isOpen={true} editor={createMockEditor()} onClose={jest.fn()} />
      );

      const selector = screen.getByTestId('page-group-selector');
      expect(selector).toBeInTheDocument();

      // Should display group IDs with page counts
      expect(screen.getByText('group-1 (2 页)')).toBeInTheDocument();
      expect(screen.getByText('group-2 (1 页)')).toBeInTheDocument();
    });

    it('should NOT show page group selector when only one group exists', () => {
      mockUseThemeEditor.mockReturnValue(
        createMockHookReturn({
          pageGroups: [
            {
              groupId: 'group-1',
              shapeIds: ['s1'],
              sharedTheme: '',
              sharedNavigation: { header: '', footer: '' },
              pageNameToShapeId: new Map(),
            },
          ],
          selectedGroupId: 'group-1',
          cssVariables: [],
          sharedNavigation: null,
        })
      );

      render(
        <ThemeEditorPanel isOpen={true} editor={createMockEditor()} onClose={jest.fn()} />
      );

      expect(screen.queryByTestId('page-group-selector')).not.toBeInTheDocument();
    });

    it('should call selectGroup when page group is switched (Requirement 4.2)', () => {
      const mockSelectGroup = jest.fn();
      mockUseThemeEditor.mockReturnValue(
        createMockHookReturn({
          pageGroups: [
            {
              groupId: 'group-1',
              shapeIds: ['s1'],
              sharedTheme: '',
              sharedNavigation: { header: '', footer: '' },
              pageNameToShapeId: new Map(),
            },
            {
              groupId: 'group-2',
              shapeIds: ['s2', 's3'],
              sharedTheme: '',
              sharedNavigation: { header: '', footer: '' },
              pageNameToShapeId: new Map(),
            },
          ],
          selectedGroupId: 'group-1',
          selectGroup: mockSelectGroup,
          cssVariables: [],
          sharedNavigation: null,
        })
      );

      render(
        <ThemeEditorPanel isOpen={true} editor={createMockEditor()} onClose={jest.fn()} />
      );

      const selector = screen.getByTestId('page-group-selector');
      fireEvent.change(selector, { target: { value: 'group-2' } });

      expect(mockSelectGroup).toHaveBeenCalledWith('group-2');
    });
  });

  describe('empty state', () => {
    it('should show empty message when no page groups exist', () => {
      mockUseThemeEditor.mockReturnValue(
        createMockHookReturn({
          pageGroups: [],
          selectedGroupId: null,
          cssVariables: [],
          sharedNavigation: null,
        })
      );

      render(
        <ThemeEditorPanel isOpen={true} editor={createMockEditor()} onClose={jest.fn()} />
      );

      expect(
        screen.getByText('画布上没有页面组，请先批量生成页面')
      ).toBeInTheDocument();
    });

    it('should show no-data message when group exists but has no theme data', () => {
      mockUseThemeEditor.mockReturnValue(
        createMockHookReturn({
          pageGroups: [
            {
              groupId: 'group-1',
              shapeIds: ['s1'],
              sharedTheme: '',
              sharedNavigation: { header: '', footer: '' },
              pageNameToShapeId: new Map(),
            },
          ],
          selectedGroupId: 'group-1',
          cssVariables: [],
          sharedNavigation: null,
        })
      );

      render(
        <ThemeEditorPanel isOpen={true} editor={createMockEditor()} onClose={jest.fn()} />
      );

      expect(
        screen.getByText('当前页面组没有共享主题数据')
      ).toBeInTheDocument();
    });
  });

  describe('error display', () => {
    it('should display error message when error state is set', () => {
      mockUseThemeEditor.mockReturnValue(
        createMockHookReturn({
          error: '变更未能应用，请检查页面组是否有效',
        })
      );

      render(
        <ThemeEditorPanel isOpen={true} editor={createMockEditor()} onClose={jest.fn()} />
      );

      const errorEl = screen.getByTestId('theme-editor-error');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl).toHaveTextContent('变更未能应用，请检查页面组是否有效');
    });

    it('should not display error element when error is null', () => {
      mockUseThemeEditor.mockReturnValue(
        createMockHookReturn({ error: null })
      );

      render(
        <ThemeEditorPanel isOpen={true} editor={createMockEditor()} onClose={jest.fn()} />
      );

      expect(screen.queryByTestId('theme-editor-error')).not.toBeInTheDocument();
    });
  });

  describe('close button', () => {
    it('should call onClose when close button is clicked', () => {
      mockUseThemeEditor.mockReturnValue(createMockHookReturn());
      const mockOnClose = jest.fn();

      render(
        <ThemeEditorPanel isOpen={true} editor={createMockEditor()} onClose={mockOnClose} />
      );

      const closeButton = screen.getByTestId('theme-editor-close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('CSS variable editing controls', () => {
    it('should call updateVariable when a color input changes', () => {
      const mockUpdateVariable = jest.fn();
      mockUseThemeEditor.mockReturnValue(
        createMockHookReturn({
          pageGroups: [
            {
              groupId: 'g1',
              shapeIds: ['s1'],
              sharedTheme: '',
              sharedNavigation: { header: '', footer: '' },
              pageNameToShapeId: new Map(),
            },
          ],
          selectedGroupId: 'g1',
          cssVariables: [
            { name: '--primary-color', value: '#3b82f6', category: 'color' },
          ],
          sharedNavigation: { header: '', footer: '' },
          updateVariable: mockUpdateVariable,
        })
      );

      render(
        <ThemeEditorPanel isOpen={true} editor={createMockEditor()} onClose={jest.fn()} />
      );

      const colorInput = screen.getByTestId('color-input---primary-color');
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });

      expect(mockUpdateVariable).toHaveBeenCalledWith('--primary-color', '#ff0000');
    });

    it('should call updateVariable when a text input changes', () => {
      const mockUpdateVariable = jest.fn();
      mockUseThemeEditor.mockReturnValue(
        createMockHookReturn({
          pageGroups: [
            {
              groupId: 'g1',
              shapeIds: ['s1'],
              sharedTheme: '',
              sharedNavigation: { header: '', footer: '' },
              pageNameToShapeId: new Map(),
            },
          ],
          selectedGroupId: 'g1',
          cssVariables: [
            { name: '--font-family', value: 'sans-serif', category: 'font' },
          ],
          sharedNavigation: { header: '', footer: '' },
          updateVariable: mockUpdateVariable,
        })
      );

      render(
        <ThemeEditorPanel isOpen={true} editor={createMockEditor()} onClose={jest.fn()} />
      );

      const textInput = screen.getByTestId('text-input---font-family');
      fireEvent.change(textInput, { target: { value: 'monospace' } });

      expect(mockUpdateVariable).toHaveBeenCalledWith('--font-family', 'monospace');
    });
  });

  describe('navigation editing', () => {
    it('should call updateNavigation when header textarea changes', () => {
      const mockUpdateNavigation = jest.fn();
      mockUseThemeEditor.mockReturnValue(
        createMockHookReturn({
          pageGroups: [
            {
              groupId: 'g1',
              shapeIds: ['s1'],
              sharedTheme: '',
              sharedNavigation: { header: '<nav>Old</nav>', footer: '<footer>F</footer>' },
              pageNameToShapeId: new Map(),
            },
          ],
          selectedGroupId: 'g1',
          cssVariables: [],
          sharedNavigation: { header: '<nav>Old</nav>', footer: '<footer>F</footer>' },
          updateNavigation: mockUpdateNavigation,
        })
      );

      render(
        <ThemeEditorPanel isOpen={true} editor={createMockEditor()} onClose={jest.fn()} />
      );

      const headerTextarea = screen.getByTestId('nav-header-textarea');
      fireEvent.change(headerTextarea, { target: { value: '<nav>New Header</nav>' } });

      expect(mockUpdateNavigation).toHaveBeenCalledWith({ header: '<nav>New Header</nav>' });
    });

    it('should call updateNavigation when footer textarea changes', () => {
      const mockUpdateNavigation = jest.fn();
      mockUseThemeEditor.mockReturnValue(
        createMockHookReturn({
          pageGroups: [
            {
              groupId: 'g1',
              shapeIds: ['s1'],
              sharedTheme: '',
              sharedNavigation: { header: '<nav>H</nav>', footer: '<footer>Old</footer>' },
              pageNameToShapeId: new Map(),
            },
          ],
          selectedGroupId: 'g1',
          cssVariables: [],
          sharedNavigation: { header: '<nav>H</nav>', footer: '<footer>Old</footer>' },
          updateNavigation: mockUpdateNavigation,
        })
      );

      render(
        <ThemeEditorPanel isOpen={true} editor={createMockEditor()} onClose={jest.fn()} />
      );

      const footerTextarea = screen.getByTestId('nav-footer-textarea');
      fireEvent.change(footerTextarea, { target: { value: '<footer>New Footer</footer>' } });

      expect(mockUpdateNavigation).toHaveBeenCalledWith({ footer: '<footer>New Footer</footer>' });
    });
  });
});
