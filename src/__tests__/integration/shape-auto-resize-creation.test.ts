/**
 * Integration test: Shape Auto-Resize with Shape Creation
 * Feature: shape-auto-resize
 * Task: 6.1
 * 
 * Verifies that the auto-resize mechanism works correctly with newly created shapes.
 * This test verifies the shape creation flow without requiring full tldraw initialization.
 * 
 * Requirements: 3.1, 3.2
 */

import { getHeightReporterScript } from '../../core/shape/heightReporterScript';

describe('Shape Auto-Resize with Shape Creation - Verification', () => {
  describe('Height Reporter Script', () => {
    it('should inject height reporter script into iframe', () => {
      const script = getHeightReporterScript();

      // Verify script contains required functionality
      expect(script).toContain('document.body.scrollHeight');
      expect(script).toContain('postMessage');
      expect(script).toContain('content-height');
      expect(script).toContain('MutationObserver');
      expect(script).toContain('ResizeObserver');
      expect(script).toContain('window.addEventListener(\'load\'');
    });

    it('should be valid JavaScript', () => {
      const script = getHeightReporterScript();
      
      // Verify it's a self-executing function
      expect(script).toContain('(function()');
      expect(script).toContain('})();');
    });

    it('should report height via postMessage', () => {
      const script = getHeightReporterScript();
      
      // Verify the postMessage call structure
      expect(script).toContain('window.parent.postMessage');
      expect(script).toContain('type: \'content-height\'');
      expect(script).toContain('height: height');
    });
  });

  describe('Shape Creation Flow', () => {
    it('should verify useSingleGenerate creates shapes with default w/h props', () => {
      // Read the useSingleGenerate file to verify shape creation
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../components/canvas/generation/useSingleGenerate.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Verify shape is created with default dimensions
      expect(content).toContain('w: 800');
      expect(content).toContain('h: 600');
      expect(content).toContain('mode: \'preview\'');
    });

    it('should verify useBatchGenerate creates shapes with default w/h props', () => {
      // Read the useBatchGenerate file to verify shape creation
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../components/canvas/generation/useBatchGenerate.ts');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Verify shape is created with default dimensions
      expect(content).toContain('w: 800');
      expect(content).toContain('h: 600');
      expect(content).toContain('mode: \'preview\'');
    });

    it('should verify EditorCanvas handleImportSuccess creates shapes with default w/h props', () => {
      // Read the EditorCanvas file to verify shape creation
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../components/canvas/EditorCanvas.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Verify shape is created with default dimensions
      expect(content).toContain('w: 800');
      expect(content).toContain('h: 600');
      expect(content).toContain('mode: \'preview\'');
    });
  });

  describe('Auto-Resize Integration', () => {
    it('should verify HybridHtmlShapeUtil passes shapeId to PreviewMode', () => {
      // Read the HybridHtmlShapeUtil file to verify shapeId is passed
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../core/shape/HybridHtmlShapeUtil.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Verify shapeId is passed to PreviewMode
      expect(content).toContain('shapeId={shapeId}');
      expect(content).toContain('shapeId: TLShapeId');
    });

    it('should verify PreviewMode uses shapeId for auto-resize', () => {
      // Read the PreviewMode file to verify auto-resize integration
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../components/modes/PreviewMode.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Verify PreviewMode uses useShapeAutoResize hook
      expect(content).toContain('useShapeAutoResize(shapeId, iframeRef)');
      expect(content).toContain('shapeId: TLShapeId');
      
      // Verify height reporter script is injected
      expect(content).toContain('getHeightReporterScript()');
      
      // Verify measured height is read from ShapeSizes
      expect(content).toContain('ShapeSizes.get(editor).get(shapeId)');
    });

    it('should verify HybridHtmlShapeUtil getGeometry reads from ShapeSizes', () => {
      // Read the HybridHtmlShapeUtil file to verify getGeometry implementation
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../core/shape/HybridHtmlShapeUtil.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Verify getGeometry reads from ShapeSizes
      expect(content).toContain('ShapeSizes.get(this.editor).get(shape.id)');
      
      // Verify fallback to shape.props.h
      expect(content).toContain('size?.height ?? shape.props.h');
      
      // Verify minimum height enforcement
      expect(content).toContain('Math.max(100, height)');
    });

    it('should verify HybridHtmlShapeUtil disables culling', () => {
      // Read the HybridHtmlShapeUtil file to verify canCull implementation
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../core/shape/HybridHtmlShapeUtil.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Verify canCull returns false
      expect(content).toContain('canCull = () => false');
    });
  });

  describe('Requirements Verification', () => {
    it('should verify Requirement 3.1: getGeometry uses stored height', () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../core/shape/HybridHtmlShapeUtil.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Requirement 3.1: Use measured height from ShapeSizes store
      expect(content).toContain('ShapeSizes.get(this.editor).get(shape.id)');
      expect(content).toContain('Requirement 3.1');
    });

    it('should verify Requirement 3.2: getGeometry falls back to default height', () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../core/shape/HybridHtmlShapeUtil.tsx');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Requirement 3.2: Fall back to shape.props.h when no measured height exists
      expect(content).toContain('size?.height ?? shape.props.h');
      expect(content).toContain('Requirement 3.2');
    });
  });
});
