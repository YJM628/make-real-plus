/**
 * Custom Tools for tldraw
 * 
 * These tools extend tldraw's functionality with AI generation,
 * HTML import/export, and screenshot capabilities.
 */

import { StateNode } from 'tldraw';


/**
 * Export HTML Tool
 * Exports the current HTML shapes
 */
export class ExportHTMLTool extends StateNode {
  static override id = 'export-html';
  
  override onEnter() {
    // Trigger export
    const event = new CustomEvent('export-html');
    window.dispatchEvent(event);
    
    // Return to select tool
    this.editor.setCurrentTool('select');
  }
}

