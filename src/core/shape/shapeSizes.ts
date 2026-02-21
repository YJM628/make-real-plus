/**
 * ShapeSizes - Global shape size storage using EditorAtom + AtomMap
 * Feature: shape-auto-resize
 * 
 * This module provides a reactive global store for shape sizes using tldraw v4's
 * EditorAtom and AtomMap pattern. The store maintains measured content heights
 * for HTML shapes and automatically cleans up entries when shapes are deleted.
 * 
 * Requirements: 2.1, 2.2
 */

import { EditorAtom, AtomMap } from 'tldraw';
import type { TLShapeId } from 'tldraw';

/**
 * Shape size entry stored in the AtomMap
 */
export interface ShapeSizeEntry {
  height: number; // Measured content height in pixels
}

/**
 * Global shape sizes storage
 * 
 * Uses EditorAtom + AtomMap to implement reactive size management.
 * The AtomMap stores measured content heights keyed by shape ID.
 * 
 * When a shape is deleted, the corresponding size entry is automatically
 * removed to prevent memory leaks.
 * 
 * Requirements:
 * - 2.1: Store measured content height for each shape by its shape ID
 * - 2.2: Remove size entry when shape is deleted
 */
export const ShapeSizes = new EditorAtom(
  'shape sizes',
  (editor) => {
    const map = new AtomMap<TLShapeId, ShapeSizeEntry>('shape sizes');

    // Register cleanup handler for shape deletion
    // Requirement 2.2: Prevent memory leaks by removing size entries
    editor.sideEffects.registerAfterDeleteHandler('shape', (shape) => {
      map.delete(shape.id);
    });

    return map;
  }
);
