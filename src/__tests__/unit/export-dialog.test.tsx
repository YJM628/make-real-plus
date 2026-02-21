/**
 * ExportDialog - Unit tests
 * Feature: export-deployable-project
 * Requirements: 6.1, 6.3, 6.4
 */

import * as React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportDialog } from './ExportDialog';
import { exportProject } from '../../utils/export/exportPipeline';
import type { Editor } from 'tldraw';

// Mock the exportPipeline module
jest.mock('../../utils/export/exportPipeline', () => ({
  exportProject: jest.fn(),
}));

describe('ExportDialog', () => {
  let mockEditor: Editor;
  let mockOnClose: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a minimal mock editor
    mockEditor = {
      getCurrentPageShapes: jest.fn(() => [
        {
          type: 'html',
          props: {
            html: '<html><head><title>Test App</title></head><body><h1>Welcome</h1></body></html>',
          },
        },
      ]),
    } as any;

    mockOnClose = jest.fn();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <ExportDialog isOpen={false} editor={mockEditor} onClose={mockOnClose} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    expect(screen.getByText('Export Project')).toBeTruthy();
    expect(screen.getByLabelText('Application Name')).toBeTruthy();
    expect(screen.getByText('Export Format')).toBeTruthy();
  });

  it('should infer app name from canvas on open', () => {
    render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    const appNameInput = screen.getByLabelText('Application Name') as HTMLInputElement;
    expect(appNameInput.value).toBe('test-app');
  });

  it('should default to static format', () => {
    render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    const staticRadio = screen.getByLabelText(/Static HTML/i) as HTMLInputElement;
    expect(staticRadio.checked).toBe(true);
  });

  it('should allow changing export format', () => {
    render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    const reactRadio = screen.getByLabelText(/React Project/i) as HTMLInputElement;
    fireEvent.click(reactRadio);
    
    expect(reactRadio.checked).toBe(true);
  });

  it('should allow changing app name', () => {
    render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    const appNameInput = screen.getByLabelText('Application Name') as HTMLInputElement;
    fireEvent.change(appNameInput, { target: { value: 'my-custom-app' } });
    
    expect(appNameInput.value).toBe('my-custom-app');
  });

  it('should call exportProject with correct options when Export button is clicked', async () => {
    const mockExportProject = exportProject as jest.MockedFunction<typeof exportProject>;
    mockExportProject.mockResolvedValue(undefined);

    render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    // Change format to React
    const reactRadio = screen.getByLabelText(/React Project/i);
    fireEvent.click(reactRadio);
    
    // Change app name
    const appNameInput = screen.getByLabelText('Application Name');
    fireEvent.change(appNameInput, { target: { value: 'my-react-app' } });
    
    // Click export button
    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(mockExportProject).toHaveBeenCalledWith(mockEditor, {
        format: 'react',
        appName: 'my-react-app',
      });
    });
  });

  it('should close dialog after successful export', async () => {
    const mockExportProject = exportProject as jest.MockedFunction<typeof exportProject>;
    mockExportProject.mockResolvedValue(undefined);

    render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should show error message if export fails', async () => {
    const mockExportProject = exportProject as jest.MockedFunction<typeof exportProject>;
    mockExportProject.mockRejectedValue(new Error('Export failed'));

    render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Export failed/i)).toBeTruthy();
    });
    
    // Dialog should not close on error
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should disable export button when app name is empty', () => {
    render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    // Clear app name
    const appNameInput = screen.getByLabelText('Application Name');
    fireEvent.change(appNameInput, { target: { value: '' } });
    
    const exportButton = screen.getByRole('button', { name: /Export/i }) as HTMLButtonElement;
    expect(exportButton.disabled).toBe(true);
  });

  it('should close dialog when Cancel button is clicked', () => {
    render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close dialog when clicking outside', () => {
    const { container } = render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    // Click on the backdrop (first child of container)
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not close dialog when clicking inside', () => {
    render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    const dialogContent = screen.getByText('Export Project').parentElement;
    fireEvent.click(dialogContent!);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should show loading state during export', async () => {
    const mockExportProject = exportProject as jest.MockedFunction<typeof exportProject>;
    // Make export take some time
    mockExportProject.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/Exporting.../i)).toBeTruthy();
    });
  });

  it('should handle keyboard shortcuts', async () => {
    const mockExportProject = exportProject as jest.MockedFunction<typeof exportProject>;
    mockExportProject.mockResolvedValue(undefined);

    render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    const dialogContent = screen.getByText('Export Project').parentElement;
    
    // Press Enter to export
    fireEvent.keyDown(dialogContent!, { key: 'Enter' });
    
    await waitFor(() => {
      expect(mockExportProject).toHaveBeenCalled();
    });
  });

  it('should close on Escape key', () => {
    render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    const dialogContent = screen.getByText('Export Project').parentElement;
    
    // Press Escape to close
    fireEvent.keyDown(dialogContent!, { key: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show recommended badge on static format', () => {
    render(
      <ExportDialog isOpen={true} editor={mockEditor} onClose={mockOnClose} />
    );
    
    expect(screen.getByText('RECOMMENDED')).toBeTruthy();
  });

  it('should fallback to "my-app" if no title or h1 found', () => {
    const editorWithoutTitle = {
      getCurrentPageShapes: jest.fn(() => [
        {
          type: 'html',
          props: {
            html: '<div>No title here</div>',
          },
        },
      ]),
    } as any;

    render(
      <ExportDialog isOpen={true} editor={editorWithoutTitle} onClose={mockOnClose} />
    );
    
    const appNameInput = screen.getByLabelText('Application Name') as HTMLInputElement;
    expect(appNameInput.value).toBe('my-app');
  });

  it('should infer app name from h1 if no title', () => {
    const editorWithH1 = {
      getCurrentPageShapes: jest.fn(() => [
        {
          type: 'html',
          props: {
            html: '<h1>My Awesome App</h1>',
          },
        },
      ]),
    } as any;

    render(
      <ExportDialog isOpen={true} editor={editorWithH1} onClose={mockOnClose} />
    );
    
    const appNameInput = screen.getByLabelText('Application Name') as HTMLInputElement;
    expect(appNameInput.value).toBe('my-awesome-app');
  });

  it('should sanitize app name correctly', () => {
    const editorWithSpecialChars = {
      getCurrentPageShapes: jest.fn(() => [
        {
          type: 'html',
          props: {
            html: '<title>My App!!! @#$ 123</title>',
          },
        },
      ]),
    } as any;

    render(
      <ExportDialog isOpen={true} editor={editorWithSpecialChars} onClose={mockOnClose} />
    );
    
    const appNameInput = screen.getByLabelText('Application Name') as HTMLInputElement;
    expect(appNameInput.value).toBe('my-app-123');
  });
});
