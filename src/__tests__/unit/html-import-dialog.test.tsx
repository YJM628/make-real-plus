/**
 * Unit tests for HTML Import Dialog
 * Feature: ai-html-visual-editor
 * 
 * Tests the HTML import dialog component including:
 * - Dialog visibility
 * - Import button functionality
 * - Cancel functionality
 * - Error handling
 * 
 * Requirements: 16.1, 16.2
 */

import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HtmlImportDialog } from '../../components/import/HtmlImportDialog';
import * as htmlImporter from '../../utils/import/htmlImporter';

// Mock the htmlImporter module
jest.mock('../../utils/import/htmlImporter');

describe('HtmlImportDialog', () => {
  const mockOnImportSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <HtmlImportDialog
        isOpen={false}
        onImportSuccess={mockOnImportSuccess}
        onCancel={mockOnCancel}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <HtmlImportDialog
        isOpen={true}
        onImportSuccess={mockOnImportSuccess}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Import HTML Files')).toBeInTheDocument();
    expect(screen.getByText(/Select one or more HTML files/i)).toBeInTheDocument();
  });

  it('should display import features list', () => {
    render(
      <HtmlImportDialog
        isOpen={true}
        onImportSuccess={mockOnImportSuccess}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/Parse and validate the HTML structure/i)).toBeInTheDocument();
    expect(screen.getByText(/Automatically inject identifiers/i)).toBeInTheDocument();
    expect(screen.getByText(/Detect and warn about external resources/i)).toBeInTheDocument();
    expect(screen.getByText(/Remove external scripts for security/i)).toBeInTheDocument();
    expect(screen.getByText(/Arrange multiple files on the canvas/i)).toBeInTheDocument();
  });

  it('should have Cancel and Select Files buttons', () => {
    render(
      <HtmlImportDialog
        isOpen={true}
        onImportSuccess={mockOnImportSuccess}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Select Files')).toBeInTheDocument();
  });

  it('should call onCancel when Cancel button is clicked', () => {
    render(
      <HtmlImportDialog
        isOpen={true}
        onImportSuccess={mockOnImportSuccess}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when clicking outside the dialog', () => {
    const { container } = render(
      <HtmlImportDialog
        isOpen={true}
        onImportSuccess={mockOnImportSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Click on the backdrop (first child of container)
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should not call onCancel when clicking inside the dialog', () => {
    render(
      <HtmlImportDialog
        isOpen={true}
        onImportSuccess={mockOnImportSuccess}
        onCancel={mockOnCancel}
      />
    );

    const dialogContent = screen.getByText('Import HTML Files').parentElement;
    if (dialogContent) {
      fireEvent.click(dialogContent);
    }

    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should call selectAndImportHtmlFiles when Select Files is clicked', async () => {
    const mockResults = [
      {
        parseResult: {
          root: { tagName: 'DIV', children: [] } as any,
          elementMap: new Map(),
          styles: '',
          scripts: '',
          externalResources: { stylesheets: [], scripts: [], images: [] },
        },
        filename: 'test.html',
        warnings: { externalStylesheets: [], externalScripts: [] },
        identifiersInjected: true,
      },
    ];

    (htmlImporter.selectAndImportHtmlFiles as jest.Mock).mockResolvedValue(mockResults);

    render(
      <HtmlImportDialog
        isOpen={true}
        onImportSuccess={mockOnImportSuccess}
        onCancel={mockOnCancel}
      />
    );

    const selectButton = screen.getByText('Select Files');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(htmlImporter.selectAndImportHtmlFiles).toHaveBeenCalledWith({
        injectIdentifiers: true,
        allowExternalScripts: false,
        loadExternalStyles: false,
      });
    });
  });

  it('should call onImportSuccess with results after successful import', async () => {
    const mockResults = [
      {
        parseResult: {
          root: { tagName: 'DIV', children: [] } as any,
          elementMap: new Map(),
          styles: '',
          scripts: '',
          externalResources: { stylesheets: [], scripts: [], images: [] },
        },
        filename: 'test.html',
        warnings: { externalStylesheets: [], externalScripts: [] },
        identifiersInjected: true,
      },
    ];

    (htmlImporter.selectAndImportHtmlFiles as jest.Mock).mockResolvedValue(mockResults);

    render(
      <HtmlImportDialog
        isOpen={true}
        onImportSuccess={mockOnImportSuccess}
        onCancel={mockOnCancel}
      />
    );

    const selectButton = screen.getByText('Select Files');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(mockOnImportSuccess).toHaveBeenCalledWith(mockResults);
    });
  });

  it('should call onCancel when user cancels file selection', async () => {
    (htmlImporter.selectAndImportHtmlFiles as jest.Mock).mockResolvedValue([]);

    render(
      <HtmlImportDialog
        isOpen={true}
        onImportSuccess={mockOnImportSuccess}
        onCancel={mockOnCancel}
      />
    );

    const selectButton = screen.getByText('Select Files');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  it('should show loading state while importing', async () => {
    (htmlImporter.selectAndImportHtmlFiles as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    render(
      <HtmlImportDialog
        isOpen={true}
        onImportSuccess={mockOnImportSuccess}
        onCancel={mockOnCancel}
      />
    );

    const selectButton = screen.getByText('Select Files');
    fireEvent.click(selectButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Importing...')).toBeInTheDocument();
    });

    // Buttons should be disabled
    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Importing...')).toBeDisabled();
  });

  it('should display error message on import failure', async () => {
    const errorMessage = 'Failed to read file';
    (htmlImporter.selectAndImportHtmlFiles as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    );

    render(
      <HtmlImportDialog
        isOpen={true}
        onImportSuccess={mockOnImportSuccess}
        onCancel={mockOnCancel}
      />
    );

    const selectButton = screen.getByText('Select Files');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should prompt for external resources when detected', async () => {
    const mockResults = [
      {
        parseResult: {
          root: { tagName: 'DIV', children: [] } as any,
          elementMap: new Map(),
          styles: '',
          scripts: '',
          externalResources: {
            stylesheets: ['https://example.com/style.css'],
            scripts: ['https://example.com/script.js'],
            images: [],
          },
        },
        filename: 'test.html',
        warnings: {
          externalStylesheets: ['https://example.com/style.css'],
          externalScripts: ['https://example.com/script.js'],
        },
        identifiersInjected: true,
      },
    ];

    (htmlImporter.selectAndImportHtmlFiles as jest.Mock).mockResolvedValue(mockResults);
    (htmlImporter.promptForExternalResources as jest.Mock).mockResolvedValue({
      loadExternalStyles: false,
      allowExternalScripts: false,
    });

    render(
      <HtmlImportDialog
        isOpen={true}
        onImportSuccess={mockOnImportSuccess}
        onCancel={mockOnCancel}
      />
    );

    const selectButton = screen.getByText('Select Files');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(htmlImporter.promptForExternalResources).toHaveBeenCalledWith({
        externalStylesheets: ['https://example.com/style.css'],
        externalScripts: ['https://example.com/script.js'],
      });
    });
  });

  it('should handle multiple files with aggregated warnings', async () => {
    const mockResults = [
      {
        parseResult: {
          root: { tagName: 'DIV', children: [] } as any,
          elementMap: new Map(),
          styles: '',
          scripts: '',
          externalResources: {
            stylesheets: ['https://example.com/style1.css'],
            scripts: [],
            images: [],
          },
        },
        filename: 'test1.html',
        warnings: {
          externalStylesheets: ['https://example.com/style1.css'],
          externalScripts: [],
        },
        identifiersInjected: true,
      },
      {
        parseResult: {
          root: { tagName: 'DIV', children: [] } as any,
          elementMap: new Map(),
          styles: '',
          scripts: '',
          externalResources: {
            stylesheets: ['https://example.com/style2.css'],
            scripts: ['https://example.com/script.js'],
            images: [],
          },
        },
        filename: 'test2.html',
        warnings: {
          externalStylesheets: ['https://example.com/style2.css'],
          externalScripts: ['https://example.com/script.js'],
        },
        identifiersInjected: true,
      },
    ];

    (htmlImporter.selectAndImportHtmlFiles as jest.Mock).mockResolvedValue(mockResults);
    (htmlImporter.promptForExternalResources as jest.Mock).mockResolvedValue({
      loadExternalStyles: false,
      allowExternalScripts: false,
    });

    render(
      <HtmlImportDialog
        isOpen={true}
        onImportSuccess={mockOnImportSuccess}
        onCancel={mockOnCancel}
      />
    );

    const selectButton = screen.getByText('Select Files');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(htmlImporter.promptForExternalResources).toHaveBeenCalledWith({
        externalStylesheets: expect.arrayContaining([
          'https://example.com/style1.css',
          'https://example.com/style2.css',
        ]),
        externalScripts: ['https://example.com/script.js'],
      });
    });
  });
});
