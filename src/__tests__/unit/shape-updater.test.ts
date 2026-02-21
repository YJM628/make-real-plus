/**
 * Unit tests for shapeUpdater utility
 * Feature: editor-canvas-refactor
 * Requirements: 6.1, 6.4
 */

import { updateAllHtmlShapes } from '../../components/canvas/utils/shapeUpdater';
import type { Editor } from 'tldraw';

describe('shapeUpdater', () => {
  describe('updateAllHtmlShapes', () => {
    let mockEditor: Editor;
    let mockShapes: any[];

    beforeEach(() => {
      // Create mock shapes with different types
      mockShapes = [
        {
          id: 'shape1',
          type: 'html',
          props: { mode: 'edit', viewport: 'desktop' },
        },
        {
          id: 'shape2',
          type: 'html',
          props: { mode: 'preview', viewport: 'desktop' },
        },
        {
          id: 'shape3',
          type: 'geo',
          props: { w: 100, h: 100 },
        },
        {
          id: 'shape4',
          type: 'html',
          props: { mode: 'split', viewport: 'tablet' },
        },
      ];

      // Create mock editor
      mockEditor = {
        getCurrentPageShapes: jest.fn().mockReturnValue(mockShapes),
        updateShape: jest.fn(),
      } as unknown as Editor;
    });

    it('should update all HTML shapes with the provided properties', () => {
      // Requirement 6.1: Accept editor instance and properties update object
      updateAllHtmlShapes(mockEditor, { mode: 'preview' });

      // Should call updateShape for each HTML shape (3 times)
      expect(mockEditor.updateShape).toHaveBeenCalledTimes(3);

      // Verify each HTML shape was updated with merged properties
      expect(mockEditor.updateShape).toHaveBeenCalledWith({
        id: 'shape1',
        type: 'html',
        props: { mode: 'preview', viewport: 'desktop' },
      });

      expect(mockEditor.updateShape).toHaveBeenCalledWith({
        id: 'shape2',
        type: 'html',
        props: { mode: 'preview', viewport: 'desktop' },
      });

      expect(mockEditor.updateShape).toHaveBeenCalledWith({
        id: 'shape4',
        type: 'html',
        props: { mode: 'preview', viewport: 'tablet' },
      });
    });

    it('should only update HTML type shapes, ignoring other types', () => {
      // Requirement 6.4: Only update shapes with type 'html'
      updateAllHtmlShapes(mockEditor, { viewport: 'mobile' });

      // Should not update the 'geo' shape
      const calls = (mockEditor.updateShape as jest.Mock).mock.calls;
      const geoShapeUpdated = calls.some((call: any) => call[0].id === 'shape3');
      
      expect(geoShapeUpdated).toBe(false);
      expect(mockEditor.updateShape).toHaveBeenCalledTimes(3); // Only 3 HTML shapes
    });

    it('should merge properties without overwriting existing ones', () => {
      updateAllHtmlShapes(mockEditor, { mode: 'split' });

      // Verify that existing properties (like viewport) are preserved
      expect(mockEditor.updateShape).toHaveBeenCalledWith({
        id: 'shape1',
        type: 'html',
        props: { mode: 'split', viewport: 'desktop' },
      });

      expect(mockEditor.updateShape).toHaveBeenCalledWith({
        id: 'shape4',
        type: 'html',
        props: { mode: 'split', viewport: 'tablet' },
      });
    });

    it('should handle empty page with no shapes', () => {
      (mockEditor.getCurrentPageShapes as jest.Mock).mockReturnValue([]);

      updateAllHtmlShapes(mockEditor, { mode: 'preview' });

      // Should not call updateShape when there are no shapes
      expect(mockEditor.updateShape).not.toHaveBeenCalled();
    });

    it('should handle page with no HTML shapes', () => {
      const nonHtmlShapes = [
        { id: 'shape1', type: 'geo', props: {} },
        { id: 'shape2', type: 'arrow', props: {} },
      ];
      (mockEditor.getCurrentPageShapes as jest.Mock).mockReturnValue(nonHtmlShapes);

      updateAllHtmlShapes(mockEditor, { mode: 'preview' });

      // Should not call updateShape when there are no HTML shapes
      expect(mockEditor.updateShape).not.toHaveBeenCalled();
    });

    it('should update multiple properties at once', () => {
      updateAllHtmlShapes(mockEditor, { 
        mode: 'edit', 
        viewport: 'mobile',
        customProp: 'value'
      });

      // Verify all properties are merged
      expect(mockEditor.updateShape).toHaveBeenCalledWith({
        id: 'shape1',
        type: 'html',
        props: { 
          mode: 'edit', 
          viewport: 'mobile',
          customProp: 'value'
        },
      });
    });
  });
});
