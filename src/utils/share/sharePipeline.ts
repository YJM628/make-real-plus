/**
 * Share Pipeline - Orchestrates the share flow from canvas to self-contained HTML
 * Feature: share-app-link
 * Requirements: 2.1, 2.2, 2.5, 2.6
 *
 * This module coordinates the share process by reusing the existing export pipeline
 * stages and producing a single self-contained HTML string (via shareAssembler)
 * instead of a ZIP bundle.
 *
 * Pipeline stages:
 * 1. collectPagesFromCanvas - Gather all HTML shapes from canvas
 * 2. applyOverrides - Apply element overrides to HTML
 * 3. extractSharedCSS - Extract shared CSS and deduplicate
 * 4. convertLinks - Convert data-page-target to hash navigation (format: 'static')
 * 5. generateMockData - Scan for API calls and generate mock data
 * 6. resolveDesignSystemDeps - Collect and deduplicate CDN dependencies
 * 7. assembleShareHtml - Generate single self-contained inline HTML
 */

import type { Editor } from 'tldraw';
import type { ProcessedPage } from '../../types';
import { collectPagesFromCanvas } from '../batch/collectPages';
import { applyOverrides } from '../export/overrideApplier';
import { extractSharedCSS } from '../export/cssExtractor';
import { convertLinks } from '../export/linkConverter';
import { generateMockData } from '../export/mockDataGenerator';
import { resolveDesignSystemDeps } from '../export/designSystemResolver';
import { assembleShareHtml } from './shareAssembler';
import type { HtmlShape } from '../../core/shape/HybridHtmlShapeUtil';

/**
 * Result of the share pipeline assembly
 */
export interface ShareResult {
  /** Assembled self-contained HTML string */
  html: string;
  /** Inferred application name */
  appName: string;
}

/**
 * Collect canvas pages and assemble them into a single self-contained HTML string.
 *
 * Reuses the export pipeline processing stages (overrides, CSS extraction,
 * link conversion, mock data generation, design system resolution) but
 * produces a single inline HTML file suitable for IPFS sharing.
 *
 * @param editor - tldraw Editor instance
 * @returns ShareResult with the assembled HTML and inferred app name
 * @throws Error if canvas has no HTML pages
 *
 * Requirements:
 * - 2.1: Reuse Export_Pipeline processing stages
 * - 2.2: Assemble all pages into single self-contained HTML via assembleShareHtml
 * - 2.5: Apply overrides from shape's overrides property before assembly
 * - 2.6: Shared page content matches canvas preview mode
 */
export async function assembleShareableHtml(
  editor: Editor
): Promise<ShareResult> {
  console.log('[sharePipeline] Starting share assembly');

  // Stage 1: Collect pages from canvas
  console.log('[sharePipeline] Stage 1: Collecting pages from canvas');
  const collectedPages = collectPagesFromCanvas(editor);

  if (collectedPages.length === 0) {
    throw new Error('画布上没有 HTML 页面，请先生成页面');
  }

  console.log(
    `[sharePipeline] Collected ${collectedPages.length} pages:`,
    collectedPages.map((p) => p.name)
  );

  // Infer app name from canvas (reuse logic from ExportDialog)
  const appName = inferAppNameFromCanvas(editor);
  console.log(`[sharePipeline] Inferred app name: "${appName}"`);

  // Stage 2: Apply overrides to each page
  // Requirement 2.5: Apply overrides before assembly
  console.log('[sharePipeline] Stage 2: Applying overrides');
  const processedPages: ProcessedPage[] = [];

  for (const page of collectedPages) {
    const shape = findShapeByPageName(editor, page.name);
    const overrides = shape?.props.overrides || [];
    const designSystem = shape?.props.designSystem;

    const processed = applyOverrides(page, overrides);

    processedPages.push({
      ...processed,
      designSystem,
    });
  }

  console.log('[sharePipeline] Applied overrides to all pages');

  // Stage 3: Extract shared CSS
  console.log('[sharePipeline] Stage 3: Extracting shared CSS');
  const cssResult = extractSharedCSS(processedPages);
  console.log(
    `[sharePipeline] Extracted ${cssResult.sharedCSS.length} chars of shared CSS`
  );

  // Stage 4: Convert page links (format fixed as 'static' for share)
  console.log('[sharePipeline] Stage 4: Converting page links');
  const pageNames = processedPages.map((p) => p.name);
  const pagesWithLinks = processedPages.map((page) => ({
    ...page,
    html: convertLinks(page.html, pageNames, 'static'),
  }));
  console.log('[sharePipeline] Converted links for all pages');

  // Stage 5: Generate mock data
  console.log('[sharePipeline] Stage 5: Generating mock data');
  const mockResult = generateMockData(pagesWithLinks);
  console.log(
    `[sharePipeline] Generated ${mockResult.endpoints.length} mock endpoints`
  );

  // Stage 6: Resolve design system dependencies
  console.log('[sharePipeline] Stage 6: Resolving design system dependencies');
  const deps = resolveDesignSystemDeps(pagesWithLinks);
  console.log(
    `[sharePipeline] Resolved ${deps.stylesheets.length} stylesheets, ${deps.scripts.length} scripts`
  );

  // Stage 7: Assemble self-contained HTML
  console.log('[sharePipeline] Stage 7: Assembling self-contained HTML');
  const html = assembleShareHtml(
    pagesWithLinks,
    cssResult.sharedCSS,
    cssResult.pageCSS,
    deps,
    mockResult,
    appName
  );
  console.log(
    `[sharePipeline] Assembled HTML (${html.length} chars)`
  );

  console.log('[sharePipeline] Share assembly completed successfully');

  return { html, appName };
}

/**
 * Find a shape by matching its content to a page name.
 *
 * This is a helper to locate the original shape for a collected page so we can
 * access its overrides and designSystem properties.
 *
 * Reused from exportPipeline.ts with the same heuristic matching logic.
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
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);

    const titleText = titleMatch?.[1]?.toLowerCase() || '';
    const h1Text = h1Match?.[1]?.toLowerCase() || '';
    const pageNameLower = pageName.toLowerCase();

    if (titleText.includes(pageNameLower) || h1Text.includes(pageNameLower)) {
      return htmlShape;
    }

    // Check data-page-target attributes
    const dataPageTargetRegex = /data-page-target=["']([^"']+)["']/gi;
    let match;
    while ((match = dataPageTargetRegex.exec(html)) !== null) {
      if (match[1].toLowerCase() === pageNameLower) {
        return htmlShape;
      }
    }
  }

  return undefined;
}

/**
 * Infer application name from canvas context.
 *
 * Reuses the same logic as ExportDialog's inferAppNameFromCanvas:
 * 1. Try first shape's <title> tag
 * 2. Try first shape's <h1> tag
 * 3. Try meta application-name or og:title
 * 4. Fall back to 'my-app'
 *
 * @param editor - tldraw Editor instance
 * @returns Inferred application name
 */
function inferAppNameFromCanvas(editor: Editor): string {
  const shapes = editor.getCurrentPageShapes();
  const htmlShapes = shapes.filter((shape: any) => shape.type === 'html');

  if (htmlShapes.length === 0) {
    return 'my-app';
  }

  const firstShape = htmlShapes[0] as any;
  const html = firstShape.props.html || '';

  // Try title tag
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return sanitizeAppName(titleMatch[1]);
  }

  // Try h1 tag
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    return sanitizeAppName(h1Match[1]);
  }

  // Try meta name or og:title
  const metaNameMatch = html.match(
    /<meta[^>]*name=["']application-name["'][^>]*content=["']([^"']+)["']/i
  );
  if (metaNameMatch && metaNameMatch[1]) {
    return sanitizeAppName(metaNameMatch[1]);
  }

  const ogTitleMatch = html.match(
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
  );
  if (ogTitleMatch && ogTitleMatch[1]) {
    return sanitizeAppName(ogTitleMatch[1]);
  }

  return 'my-app';
}

/**
 * Sanitize a string to be a valid app name.
 *
 * @param name - Raw name string
 * @returns Sanitized app name
 */
function sanitizeAppName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30) || 'my-app'
  );
}
