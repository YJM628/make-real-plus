/**
 * Export Pipeline Tests
 * Feature: export-deployable-project
 * 
 * Tests the main export orchestration logic
 */

import { exportProject } from './exportPipeline';
import type { Editor } from 'tldraw';
import type { ExportOptions } from '../../types';

// Mock all the pipeline modules
jest.mock('../batch/collectPages');
jest.mock('./overrideApplier');
jest.mock('./cssExtractor');
jest.mock('./linkConverter');
jest.mock('./mockDataGenerator');
jest.mock('./designSystemResolver');
jest.mock('./staticAssembler');
jest.mock('./reactConverter');
jest.mock('./vueConverter');
jest.mock('./zipBundler');

import { collectPagesFromCanvas } from '../batch/collectPages';
import { applyOverrides } from './overrideApplier';
import { extractSharedCSS } from './cssExtractor';
import { convertLinks } from './linkConverter';
import { generateMockData } from './mockDataGenerator';
import { resolveDesignSystemDeps } from './designSystemResolver';
import { assembleStaticProject } from './staticAssembler';
import { assembleReactProject } from './reactConverter';
import { assembleVueProject } from './vueConverter';
import { bundleAndDownload } from './zipBundler';

const mockCollectPages = collectPagesFromCanvas as jest.Mock;
const mockApplyOverrides = applyOverrides as jest.Mock;
const mockExtractCSS = extractSharedCSS as jest.Mock;
const mockConvertLinks = convertLinks as jest.Mock;
const mockGenerateMock = generateMockData as jest.Mock;
const mockResolveDS = resolveDesignSystemDeps as jest.Mock;
const mockAssembleStatic = assembleStaticProject as jest.Mock;
const mockAssembleReact = assembleReactProject as jest.Mock;
const mockAssembleVue = assembleVueProject as jest.Mock;
const mockBundle = bundleAndDownload as jest.Mock;

describe('exportProject', () => {
  let mockEditor: Editor;
  let mockOptions: ExportOptions;
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock alert
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    // Create mock editor
    mockEditor = {
      getCurrentPageShapes: jest.fn().mockReturnValue([]),
    } as any;

    // Default export options
    mockOptions = {
      format: 'static',
      appName: 'Test App',
    };

    // Setup default mock implementations
    mockCollectPages.mockReturnValue([
      {
        name: 'home',
        html: '<html><head><title>Home</title></head><body><h1>Home</h1></body></html>',
        css: 'body { margin: 0; }',
        js: 'console.log("home");',
      },
    ]);

    mockApplyOverrides.mockImplementation((page) => ({
      name: page.name,
      html: page.html,
      css: page.css,
      js: page.js,
    }));

    mockExtractCSS.mockReturnValue({
      sharedCSS: '',
      pageCSS: new Map([['home', 'body { margin: 0; }']]),
    });

    mockConvertLinks.mockImplementation((html) => html);

    mockGenerateMock.mockReturnValue({
      endpoints: [],
      mockFiles: new Map(),
      interceptScript: '',
    });

    mockResolveDS.mockReturnValue({
      stylesheets: [],
      scripts: [],
    });

    mockAssembleStatic.mockReturnValue(
      new Map([['index.html', '<html>...</html>']])
    );

    mockAssembleReact.mockReturnValue(
      new Map([['package.json', '{}']])
    );

    mockAssembleVue.mockReturnValue(
      new Map([['package.json', '{}']])
    );

    mockBundle.mockResolvedValue(undefined);
  });

  describe('Empty Canvas Handling (Requirement 1.5)', () => {
    it('should show error and abort when canvas has no HTML shapes', async () => {
      // Mock empty canvas
      mockCollectPages.mockReturnValue([]);

      await exportProject(mockEditor, mockOptions);

      // Should show error alert
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('No HTML pages found')
      );

      // Should not proceed to other stages
      expect(mockApplyOverrides).not.toHaveBeenCalled();
      expect(mockBundle).not.toHaveBeenCalled();
    });

    it('should proceed when canvas has at least one HTML shape', async () => {
      // Default mock has one page
      await exportProject(mockEditor, mockOptions);

      // Should not show error
      expect(alertSpy).not.toHaveBeenCalled();

      // Should proceed to all stages
      expect(mockApplyOverrides).toHaveBeenCalled();
      expect(mockBundle).toHaveBeenCalled();
    });
  });

  describe('Format-Specific Assembly', () => {
    it('should call assembleStaticProject for static format', async () => {
      mockOptions.format = 'static';

      await exportProject(mockEditor, mockOptions);

      expect(mockAssembleStatic).toHaveBeenCalled();
      expect(mockAssembleReact).not.toHaveBeenCalled();
      expect(mockAssembleVue).not.toHaveBeenCalled();
    });

    it('should call assembleReactProject for react format', async () => {
      mockOptions.format = 'react';

      await exportProject(mockEditor, mockOptions);

      expect(mockAssembleReact).toHaveBeenCalled();
      expect(mockAssembleStatic).not.toHaveBeenCalled();
      expect(mockAssembleVue).not.toHaveBeenCalled();
    });

    it('should call assembleVueProject for vue format', async () => {
      mockOptions.format = 'vue';

      await exportProject(mockEditor, mockOptions);

      expect(mockAssembleVue).toHaveBeenCalled();
      expect(mockAssembleStatic).not.toHaveBeenCalled();
      expect(mockAssembleReact).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported format', async () => {
      mockOptions.format = 'angular' as any;

      await expect(exportProject(mockEditor, mockOptions)).rejects.toThrow(
        'Unsupported export format'
      );
    });
  });

  describe('ZIP File Naming', () => {
    it('should generate correct ZIP file name', async () => {
      mockOptions.appName = 'My Test App';
      mockOptions.format = 'static';

      await exportProject(mockEditor, mockOptions);

      expect(mockBundle).toHaveBeenCalledWith(
        expect.any(Map),
        'my-test-app-static-project.zip'
      );
    });

    it('should sanitize app name in ZIP file name', async () => {
      mockOptions.appName = 'My App!!! @#$%';
      mockOptions.format = 'react';

      await exportProject(mockEditor, mockOptions);

      expect(mockBundle).toHaveBeenCalledWith(
        expect.any(Map),
        'my-app-react-project.zip'
      );
    });

    it('should handle very long app names', async () => {
      mockOptions.appName = 'A'.repeat(100);
      mockOptions.format = 'vue';

      await exportProject(mockEditor, mockOptions);

      const expectedName = 'a'.repeat(50) + '-vue-project.zip';
      expect(mockBundle).toHaveBeenCalledWith(
        expect.any(Map),
        expectedName
      );
    });

    it('should use fallback name for empty app name', async () => {
      mockOptions.appName = '';
      mockOptions.format = 'static';

      await exportProject(mockEditor, mockOptions);

      expect(mockBundle).toHaveBeenCalledWith(
        expect.any(Map),
        'project-static-project.zip'
      );
    });
  });

  describe('Error Handling', () => {
    it('should show alert and re-throw on pipeline error', async () => {
      const testError = new Error('Test error');
      mockExtractCSS.mockImplementation(() => {
        throw testError;
      });

      await expect(exportProject(mockEditor, mockOptions)).rejects.toThrow(
        'Test error'
      );

      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('Export failed: Test error')
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockExtractCSS.mockImplementation(() => {
        // eslint-disable-next-line no-throw-literal
        throw 'String error';
      });

      // The function should still reject, but with the string wrapped
      await expect(exportProject(mockEditor, mockOptions)).rejects.toBeTruthy();

      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('An unexpected error occurred')
      );
    });
  });

  describe('Override Application (Requirement 8.3)', () => {
    it('should apply overrides from shapes to pages', async () => {
      const mockShape = {
        type: 'html',
        props: {
          html: '<html><head><title>Home</title></head><body><h1>Home</h1></body></html>',
          css: '',
          js: '',
          overrides: [
            {
              selector: 'h1',
              text: 'Modified Home',
              timestamp: Date.now(),
              aiGenerated: false,
            },
          ],
          designSystem: 'material-ui',
        },
      };

      (mockEditor.getCurrentPageShapes as jest.Mock).mockReturnValue([mockShape]);

      await exportProject(mockEditor, mockOptions);

      // Verify applyOverrides was called with the overrides
      expect(mockApplyOverrides).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'home' }),
        mockShape.props.overrides
      );
    });

    it('should handle pages without overrides', async () => {
      const mockShape = {
        type: 'html',
        props: {
          html: '<html><head><title>Home</title></head><body><h1>Home</h1></body></html>',
          css: '',
          js: '',
          overrides: [],
          designSystem: 'vanilla',
        },
      };

      (mockEditor.getCurrentPageShapes as jest.Mock).mockReturnValue([mockShape]);

      await exportProject(mockEditor, mockOptions);

      // Should still call applyOverrides with empty array
      expect(mockApplyOverrides).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'home' }),
        []
      );
    });
  });

  describe('Multi-Page Export', () => {
    it('should handle multiple pages correctly', async () => {
      const pages = [
        {
          name: 'home',
          html: '<html><body>Home</body></html>',
          css: 'body { margin: 0; }',
          js: '',
        },
        {
          name: 'products',
          html: '<html><body>Products</body></html>',
          css: 'body { padding: 0; }',
          js: '',
        },
        {
          name: 'about',
          html: '<html><body>About</body></html>',
          css: 'body { color: red; }',
          js: '',
        },
      ];

      mockCollectPages.mockReturnValue(pages);

      await exportProject(mockEditor, mockOptions);

      // Should apply overrides to all pages
      expect(mockApplyOverrides).toHaveBeenCalledTimes(3);

      // Should extract CSS from all pages
      expect(mockExtractCSS).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'home' }),
          expect.objectContaining({ name: 'products' }),
          expect.objectContaining({ name: 'about' }),
        ])
      );

      // Should convert links with all page names
      expect(mockConvertLinks).toHaveBeenCalledWith(
        expect.any(String),
        ['home', 'products', 'about'],
        'static'
      );
    });
  });
});
