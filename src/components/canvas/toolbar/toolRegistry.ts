/**
 * toolRegistry - Centralized tool registration
 * 
 * This module provides a single source of truth for custom tools,
 * eliminating duplication between tool classes and UI definitions.
 */

import type { TLStateNodeConstructor } from 'tldraw';
import { ExportHTMLTool } from '../../tools/CustomTools';

/**
 * Tool registration entry
 */
export interface ToolRegistration {
  /** Tool class constructor */
  toolClass: TLStateNodeConstructor;
  /** Tool ID (must match toolClass.id) */
  id: string;
  /** Display label */
  label: string;
  /** Icon name from tldraw icons */
  icon: string;
  /** Keyboard shortcut */
  kbd?: string;
}

/**
 * Registry of all custom tools
 * 
 * This is the single source of truth for custom tools.
 * Both the tool classes and UI definitions are derived from this registry.
 * 
 * Note: Generate AI tool is removed from toolbar since there's a dedicated
 * AI panel on the left side of the interface.
 */
export const TOOL_REGISTRY: ToolRegistration[] = [
  {
    toolClass: ExportHTMLTool,
    id: 'export-html',
    label: 'Export',
    icon: 'share-1',
    kbd: 'x',
  },
];

/**
 * Get all tool classes for Tldraw
 */
export function getToolClasses(): TLStateNodeConstructor[] {
  return TOOL_REGISTRY.map(reg => reg.toolClass);
}

/**
 * Get tool UI definitions for uiOverrides
 */
export function getToolDefinitions(editor: any) {
  const toolDefs: Record<string, any> = {};
  
  TOOL_REGISTRY.forEach(({ id, label, icon, kbd }) => {
    toolDefs[id] = {
      id,
      label,
      icon,
      kbd,
      onSelect: () => {
        editor.setCurrentTool(id);
      },
    };
  });
  
  return toolDefs;
}
