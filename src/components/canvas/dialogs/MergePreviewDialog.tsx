/**
 * MergePreviewDialog - Full-screen dialog for merged multi-page preview
 * Feature: multi-page-merge-preview
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3, 6.4, 7.3
 */
import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { CollectedPage } from '../../../utils/batch/collectPages';
import { buildMergePageHtml } from '../../../utils/batch/mergePreviewRouter';

interface MergePreviewDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** List of collected pages to preview */
  pages: CollectedPage[];
  /** Callback when dialog is closed */
  onClose: () => void;
}

/**
 * Message format for navigation requests from iframe
 */
interface MergeNavigateMessage {
  type: 'merge-navigate';
  targetPage: string;
}

/**
 * MergePreviewDialog provides a full-screen interactive preview of merged pages
 * 
 * This component:
 * - Renders pages in a single iframe using srcdoc replacement for navigation
 * - Listens to postMessage events from iframe for page navigation
 * - Supports Escape key and close button to exit preview
 * - Configures iframe sandbox for full interactivity (forms, scripts, etc.)
 * 
 * Requirements:
 * - 2.1: Full-screen overlay rendering
 * - 2.2: Contains iframe for merged page content
 * - 2.3: Default to first page on open
 * - 2.4: Close button in top-right corner
 * - 2.5: Escape key closes dialog
 * - 3.2: Replace iframe content on navigation
 * - 3.3: Update current page state on navigation
 * - 3.4: Warn and stay on current page if target doesn't exist
 * - 6.1: Enable sandbox permissions for full interactivity
 * - 6.2: Allow form input and submission
 * - 6.3: Execute page JavaScript
 * - 6.4: Reload page content on each navigation (no state preservation)
 * - 7.3: Handle postMessage navigation requests from iframe
 */
export const MergePreviewDialog: React.FC<MergePreviewDialogProps> = ({
  isOpen,
  pages,
  onClose,
}) => {
  // Requirement 2.3: Default to first page
  const [currentPage, setCurrentPage] = useState<string>(
    pages.length > 0 ? pages[0].name : ''
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Update currentPage when pages change (e.g., dialog reopens with different pages)
  useEffect(() => {
    if (pages.length > 0 && !pages.find((p) => p.name === currentPage)) {
      setCurrentPage(pages[0].name);
    }
  }, [pages, currentPage]);

  // Requirement 2.5: Handle Escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, onClose]);

  // Requirement 7.3: Listen to postMessage for navigation requests from iframe
  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      // Only process messages from our iframe
      if (
        !iframeRef.current ||
        event.source !== iframeRef.current.contentWindow
      ) {
        return;
      }

      const message = event.data as MergeNavigateMessage;

      // Check if this is a merge navigation message
      if (message.type !== 'merge-navigate') {
        return;
      }

      const targetPage = message.targetPage;

      // Requirement 3.4: Check if target page exists
      const pageExists = pages.some((p) => p.name === targetPage);

      if (!pageExists) {
        console.warn(
          `[MergePreviewDialog] Navigation target "${targetPage}" not found in page registry. Staying on current page.`
        );
        return;
      }

      // Requirement 3.3: Update current page state
      // Requirement 3.2: This will trigger srcdoc update via the render logic below
      setCurrentPage(targetPage);
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen, pages]);

  // Build HTML for current page
  const currentPageData = pages.find((p) => p.name === currentPage);
  const allPageNames = pages.map((p) => p.name);

  // Requirement 3.2: Build complete HTML with routing script
  // Requirement 6.4: Each navigation produces fresh content (no state preservation)
  const srcdoc = currentPageData
    ? buildMergePageHtml(currentPageData, allPageNames)
    : '<html><body><p>No page selected</p></body></html>';

  if (!isOpen) {
    return null;
  }

  // Handle empty pages case
  if (pages.length === 0) {
    return (
      <div
        ref={dialogRef}
        style={{
          // Requirement 2.1: Full-screen overlay
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <div
          style={{
            backgroundColor: '#1e1e1e',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#fff', marginBottom: '16px' }}>
            No Pages Available
          </h2>
          <p style={{ color: '#999', marginBottom: '24px' }}>
            No batch-generated pages found on the canvas.
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dialogRef}
      style={{
        // Requirement 2.1: Full-screen overlay
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header with close button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2
            style={{
              margin: 0,
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            Merge Preview
          </h2>
          <span
            style={{
              color: '#999',
              fontSize: '14px',
            }}
          >
            {currentPage}
          </span>
        </div>

        {/* Requirement 2.4: Close button */}
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4b5563';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6b7280';
          }}
        >
          Close (Esc)
        </button>
      </div>

      {/* Requirement 2.2: Iframe for merged page content */}
      {/* Requirement 6.1: Sandbox permissions for full interactivity */}
      {/* Requirement 6.2: allow-forms for form input/submission */}
      {/* Requirement 6.3: allow-scripts for JavaScript execution */}
      <iframe
        ref={iframeRef}
        srcDoc={srcdoc}
        sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-popups"
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          backgroundColor: '#fff',
        }}
        title={`Merge Preview - ${currentPage}`}
      />
    </div>
  );
};
