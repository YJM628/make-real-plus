/**
 * HTML Importer
 * Feature: ai-html-visual-editor
 * 
 * Handles importing existing HTML files into the editor.
 * Detects external resources, prompts for security risks,
 * and injects identifiers for interactive elements.
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 */

import { htmlParser } from '../../core/parser/HtmlParser';
import type { HtmlParseResult } from '../../types';

/**
 * Result of HTML import operation
 */
export interface HtmlImportResult {
  /** Parsed HTML structure */
  parseResult: HtmlParseResult;
  
  /** Original HTML content */
  htmlContent: string;
  
  /** Original filename */
  filename: string;
  
  /** Warnings about external resources */
  warnings: {
    externalStylesheets: string[];
    externalScripts: string[];
  };
  
  /** Whether identifiers were injected */
  identifiersInjected: boolean;
}

/**
 * Options for HTML import
 */
export interface HtmlImportOptions {
  /** Whether to load external stylesheets */
  loadExternalStyles?: boolean;
  
  /** Whether to allow external scripts (security risk) */
  allowExternalScripts?: boolean;
  
  /** Whether to inject identifiers for elements missing them */
  injectIdentifiers?: boolean;
}

/**
 * Opens a file selection dialog and imports HTML files
 * 
 * @param options - Import options
 * @returns Promise resolving to array of import results
 * 
 * Requirements: 16.1, 16.2
 */
export async function selectAndImportHtmlFiles(
  options: HtmlImportOptions = {}
): Promise<HtmlImportResult[]> {
  return new Promise((resolve, reject) => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.htm';
    input.multiple = true; // Support multiple file selection
    
    // Handle file selection
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      
      if (!files || files.length === 0) {
        resolve([]);
        return;
      }
      
      try {
        const results: HtmlImportResult[] = [];
        
        // Process each selected file
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const result = await importHtmlFile(file, options);
          results.push(result);
        }
        
        resolve(results);
      } catch (error) {
        reject(error);
      }
    };
    
    // Handle cancellation
    input.oncancel = () => {
      resolve([]);
    };
    
    // Trigger file selection dialog
    input.click();
  });
}

/**
 * Imports a single HTML file
 * 
 * @param file - File object to import
 * @param options - Import options
 * @returns Promise resolving to import result
 * 
 * Requirements: 16.2, 16.3, 16.4, 16.5
 */
export async function importHtmlFile(
  file: File,
  options: HtmlImportOptions = {}
): Promise<HtmlImportResult> {
  // Read file content
  const htmlContent = await readFileAsText(file);
  
  // Parse HTML to detect external resources
  const externalResources = htmlParser.extractExternalResources(htmlContent);
  
  // Prepare warnings
  const warnings = {
    externalStylesheets: externalResources.stylesheets,
    externalScripts: externalResources.scripts,
  };
  
  // Process HTML based on options
  let processedHtml = htmlContent;
  let identifiersInjected = false;
  
  // Inject identifiers if requested (default: true)
  if (options.injectIdentifiers !== false) {
    processedHtml = htmlParser.injectIdentifiers(processedHtml);
    identifiersInjected = true;
  }
  
  // Remove external scripts if not allowed (default: remove for security)
  if (options.allowExternalScripts !== true && externalResources.scripts.length > 0) {
    processedHtml = removeExternalScripts(processedHtml);
  }
  
  // Optionally load external stylesheets
  if (options.loadExternalStyles === true && externalResources.stylesheets.length > 0) {
    processedHtml = await inlineExternalStylesheets(processedHtml, externalResources.stylesheets);
  }
  
  // Parse the processed HTML
  const parseResult = htmlParser.parse(processedHtml);
  
  return {
    parseResult,
    htmlContent: processedHtml,
    filename: file.name,
    warnings,
    identifiersInjected,
  };
}

/**
 * Reads a file as text
 * 
 * @param file - File to read
 * @returns Promise resolving to file content as string
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Removes external script tags from HTML
 * 
 * @param html - HTML string
 * @returns HTML string with external scripts removed
 * 
 * Requirements: 16.4
 */
function removeExternalScripts(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Find and remove all script tags with src attribute
  const scriptTags = doc.querySelectorAll('script[src]');
  scriptTags.forEach(script => script.remove());
  
  return doc.body.innerHTML;
}

/**
 * Attempts to fetch and inline external stylesheets
 * 
 * Note: This may fail due to CORS restrictions. In production,
 * this should be handled by a backend proxy.
 * 
 * @param html - HTML string
 * @param stylesheetUrls - Array of stylesheet URLs
 * @returns HTML string with inlined stylesheets
 * 
 * Requirements: 16.3
 */
async function inlineExternalStylesheets(
  html: string,
  stylesheetUrls: string[]
): Promise<string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Find all link tags for stylesheets
  const linkTags = doc.querySelectorAll('link[rel="stylesheet"]');
  
  for (const link of linkTags) {
    const href = link.getAttribute('href');
    if (!href || !stylesheetUrls.includes(href)) {
      continue;
    }
    
    try {
      // Attempt to fetch the stylesheet
      const response = await fetch(href);
      if (response.ok) {
        const cssContent = await response.text();
        
        // Create a style tag with the fetched content
        const styleTag = doc.createElement('style');
        styleTag.textContent = cssContent;
        
        // Replace the link tag with the style tag
        link.parentNode?.replaceChild(styleTag, link);
      }
    } catch (error) {
      // Silently fail - keep the original link tag
      console.warn(`Failed to fetch stylesheet: ${href}`, error);
    }
  }
  
  return doc.body.innerHTML;
}

/**
 * Prompts user about external resources and returns import options
 * 
 * @param warnings - Warnings about external resources
 * @returns Promise resolving to user's choices
 * 
 * Requirements: 16.3, 16.4
 */
export async function promptForExternalResources(warnings: {
  externalStylesheets: string[];
  externalScripts: string[];
}): Promise<{
  loadExternalStyles: boolean;
  allowExternalScripts: boolean;
}> {
  return new Promise((resolve) => {
    let loadExternalStyles = false;
    let allowExternalScripts = false;
    
    // Prompt for external stylesheets
    if (warnings.externalStylesheets.length > 0) {
      const styleMessage = `This HTML file contains ${warnings.externalStylesheets.length} external stylesheet(s):\n\n${warnings.externalStylesheets.join('\n')}\n\nWould you like to load these stylesheets? (Note: This may fail due to CORS restrictions)`;
      loadExternalStyles = confirm(styleMessage);
    }
    
    // Prompt for external scripts (security warning)
    if (warnings.externalScripts.length > 0) {
      const scriptMessage = `⚠️ SECURITY WARNING ⚠️\n\nThis HTML file contains ${warnings.externalScripts.length} external script(s):\n\n${warnings.externalScripts.join('\n')}\n\nExternal scripts can pose security risks. They will be removed by default.\n\nDo you want to allow these scripts? (NOT RECOMMENDED)`;
      allowExternalScripts = confirm(scriptMessage);
    }
    
    resolve({ loadExternalStyles, allowExternalScripts });
  });
}

/**
 * Calculates positions for auto-arranging multiple imported HTML shapes
 * 
 * @param count - Number of shapes to arrange
 * @param shapeWidth - Width of each shape
 * @param spacing - Spacing between shapes (default: 50px)
 * @returns Array of {x, y} positions
 * 
 * Requirements: 16.6
 */
export function calculateAutoLayoutPositions(
  count: number,
  shapeWidth: number = 800,
  spacing: number = 50
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  
  // Arrange shapes horizontally from left to right
  for (let i = 0; i < count; i++) {
    positions.push({
      x: i * (shapeWidth + spacing),
      y: 0,
    });
  }
  
  return positions;
}
