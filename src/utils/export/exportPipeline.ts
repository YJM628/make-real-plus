/**
 * Export Pipeline - Main orchestrator for project export
 * Feature: export-deployable-project
 * Requirements: 1.5, 8.3
 * 
 * This module coordinates the entire export process by chaining together
 * all the export stages in a linear pipeline:
 * 
 * 1. collectPages - Gather all HTML shapes from canvas
 * 2. applyOverrides - Apply element overrides to HTML
 * 3. extractCSS - Extract shared CSS and deduplicate
 * 4. convertLinks - Convert data-page-target to navigation links
 * 5. generateMock - Scan for API calls and generate mock data
 * 6. resolveDesignSystem - Collect and deduplicate CDN dependencies
 * 7. assemble - Generate project structure based on format
 * 8. zip - Bundle files and trigger download
 */

import type { Editor } from 'tldraw';
import type { ExportOptions, ProcessedPage } from '../../types';
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
import type { HtmlShape } from '../../core/shape/HybridHtmlShapeUtil';

/**
 * Export a complete deployable project from the canvas
 * 
 * This is the main entry point for the export feature. It orchestrates
 * the entire export pipeline from collecting pages to downloading the ZIP.
 * 
 * Pipeline stages:
 * 1. **Collect Pages** - Gather all HTML shapes from canvas
 * 2. **Apply Overrides** - Apply element modifications to HTML
 * 3. **Extract CSS** - Deduplicate common styles
 * 4. **Convert Links** - Transform data-page-target to navigation
 * 5. **Generate Mock** - Create mock API data if needed
 * 6. **Resolve Design System** - Collect CDN dependencies
 * 7. **Assemble** - Generate project structure (static/React/Vue)
 * 8. **Bundle & Download** - Create ZIP and trigger download
 * 
 * @param editor - tldraw Editor instance
 * @param options - Export configuration (format, app name)
 * @throws Error if canvas is empty or export fails
 * 
 * @example
 * ```typescript
 * await exportProject(editor, {
 *   format: 'static',
 *   appName: 'My Web App'
 * });
 * ```
 * 
 * Requirements:
 * - 1.5: Show error and abort if canvas has no HTML shapes
 * - 8.3: Export reflects latest edited state (overrides applied)
 */
export async function exportProject(
  editor: Editor,
  options: ExportOptions
): Promise<void> {
  console.log('[exportPipeline] Starting export with options:', options);

  try {
    // Stage 1: Collect pages from canvas
    console.log('[exportPipeline] Stage 1: Collecting pages from canvas');
    const collectedPages = collectPagesFromCanvas(editor);

    // Requirement 1.5: Abort if canvas is empty
    if (collectedPages.length === 0) {
      const errorMessage = 'No HTML pages found on canvas. Please generate some pages before exporting.';
      console.error('[exportPipeline]', errorMessage);
      alert(errorMessage);
      return;
    }

    console.log(`[exportPipeline] Collected ${collectedPages.length} pages:`, 
      collectedPages.map(p => p.name));

    // Stage 2: Apply overrides to each page
    console.log('[exportPipeline] Stage 2: Applying overrides');
    const processedPages: ProcessedPage[] = [];
    
    for (const page of collectedPages) {
      // Get the shape to access overrides and design system
      const shape = findShapeByPageName(editor, page.name);
      const overrides = shape?.props.overrides || [];
      const designSystem = shape?.props.designSystem;

      // Apply overrides to the page
      const processed = applyOverrides(page, overrides);
      
      // Add design system info
      processedPages.push({
        ...processed,
        designSystem,
      });
    }

    console.log('[exportPipeline] Applied overrides to all pages');

    // Stage 3: Extract shared CSS
    console.log('[exportPipeline] Stage 3: Extracting shared CSS');
    const cssResult = extractSharedCSS(processedPages);
    console.log(`[exportPipeline] Extracted ${cssResult.sharedCSS.length} chars of shared CSS`);

    // Stage 4: Convert page links
    console.log('[exportPipeline] Stage 4: Converting page links');
    const pageNames = processedPages.map(p => p.name);
    const pagesWithLinks = processedPages.map(page => ({
      ...page,
      html: convertLinks(page.html, pageNames, options.format),
    }));
    console.log('[exportPipeline] Converted links for all pages');

    // Stage 5: Generate mock data
    console.log('[exportPipeline] Stage 5: Generating mock data');
    const mockResult = generateMockData(pagesWithLinks);
    console.log(`[exportPipeline] Generated ${mockResult.endpoints.length} mock endpoints`);

    // Stage 6: Resolve design system dependencies
    console.log('[exportPipeline] Stage 6: Resolving design system dependencies');
    const deps = resolveDesignSystemDeps(pagesWithLinks);
    console.log(`[exportPipeline] Resolved ${deps.stylesheets.length} stylesheets, ${deps.scripts.length} scripts`);

    // Stage 7: Assemble project based on format
    console.log(`[exportPipeline] Stage 7: Assembling ${options.format} project`);
    let projectFiles: Map<string, string>;

    switch (options.format) {
      case 'static':
        projectFiles = assembleStaticProject(
          pagesWithLinks,
          cssResult.sharedCSS,
          cssResult.pageCSS,
          deps,
          mockResult,
          options.appName
        );
        break;

      case 'react':
        projectFiles = assembleReactProject(
          pagesWithLinks,
          cssResult.sharedCSS,
          cssResult.pageCSS,
          deps,
          mockResult,
          options.appName
        );
        break;

      case 'vue':
        projectFiles = assembleVueProject(
          pagesWithLinks,
          cssResult.sharedCSS,
          cssResult.pageCSS,
          deps,
          mockResult,
          options.appName
        );
        break;

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    console.log(`[exportPipeline] Assembled ${projectFiles.size} files`);

    // Stage 8: Bundle and download
    console.log('[exportPipeline] Stage 8: Bundling and downloading');
    const zipFileName = `${sanitizeFileName(options.appName)}-${options.format}-project.zip`;
    await bundleAndDownload(projectFiles, zipFileName);

    console.log('[exportPipeline] Export completed successfully');
  } catch (error) {
    console.error('[exportPipeline] Export failed:', error);
    
    // Show user-friendly error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred during export';
    
    alert(`Export failed: ${errorMessage}\n\nPlease check the console for details.`);
    
    // Re-throw for debugging
    throw error;
  }
}

/**
 * Find a shape by matching its content to a page name
 * 
 * This is a helper function to locate the original shape for a collected page,
 * so we can access its overrides and design system properties.
 * 
 * @param editor - tldraw Editor instance
 * @param pageName - Page name to search for
 * @returns The matching HTML shape, or undefined if not found
 */
function findShapeByPageName(
  editor: Editor,
  pageName: string
): HtmlShape | undefined {
  const allShapes = editor.getCurrentPageShapes();
  
  for (const shape of allShapes) {
    if (shape.type !== 'html') continue;
    
    const htmlShape = shape as HtmlShape;
    const { html } = htmlShape.props;
    
    // Try to match by checking if the HTML contains the page name
    // This is a heuristic - we look for the page name in title, h1, or data-page-target
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    
    const titleText = titleMatch?.[1]?.toLowerCase() || '';
    const h1Text = h1Match?.[1]?.toLowerCase() || '';
    const pageNameLower = pageName.toLowerCase();
    
    // Check if page name appears in title or h1
    if (titleText.includes(pageNameLower) || h1Text.includes(pageNameLower)) {
      return htmlShape;
    }
    
    // Check if page name appears in data-page-target attributes
    // (this helps identify the current page by its navigation links)
    const dataPageTargetRegex = /data-page-target=["']([^"']+)["']/gi;
    let match;
    while ((match = dataPageTargetRegex.exec(html)) !== null) {
      if (match[1].toLowerCase() === pageNameLower) {
        // This shape references the page name, likely it IS that page
        return htmlShape;
      }
    }
  }
  
  return undefined;
}

/**
 * Sanitize a file name by removing invalid characters
 * 
 * @param fileName - Original file name
 * @returns Sanitized file name safe for file systems
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) || 'project';
}
