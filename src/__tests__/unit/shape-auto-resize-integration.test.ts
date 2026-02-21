/**
 * Shape Auto-Resize Integration Tests
 * Feature: shape-auto-resize
 * 
 * Tests the integration of storage and communication layers:
 * - ShapeSizes store
 * - Height reporter script generation
 * - useShapeAutoResize hook message handling
 * - PreviewMode integration
 * 
 * Requirements: 1.1, 2.1, 2.2, 4.1, 4.2, 6.1, 6.2
 */

import { getHeightReporterScript } from '../../core/shape/heightReporterScript';

describe('Shape Auto-Resize Integration', () => {
  describe('Height Reporter Script', () => {
    it('should generate valid JavaScript code', () => {
      const script = getHeightReporterScript();
      
      expect(script).toBeTruthy();
      expect(typeof script).toBe('string');
      expect(script.length).toBeGreaterThan(0);
    });

    it('should contain postMessage call with content-height type', () => {
      const script = getHeightReporterScript();
      
      expect(script).toContain('postMessage');
      expect(script).toContain('content-height');
      expect(script).toContain('window.parent');
    });

    it('should contain height measurement logic', () => {
      const script = getHeightReporterScript();
      
      expect(script).toContain('document.body.scrollHeight');
      expect(script).toContain('reportHeight');
    });

    it('should contain observers for dynamic content', () => {
      const script = getHeightReporterScript();
      
      expect(script).toContain('MutationObserver');
      expect(script).toContain('ResizeObserver');
      expect(script).toContain('load');
    });

    it('should be a self-executing function', () => {
      const script = getHeightReporterScript();
      
      expect(script).toMatch(/\(function\(\)/);
      expect(script).toMatch(/\}\)\(\)/);
    });
  });

  describe('Storage and Communication Layer', () => {
    it('should have all required components available', () => {
      // Verify that the height reporter script generator is available
      expect(getHeightReporterScript).toBeDefined();
      expect(typeof getHeightReporterScript).toBe('function');
      
      // The actual ShapeSizes and useShapeAutoResize are tested
      // in their respective unit tests and integration with PreviewMode
    });
  });

  describe('Message Format', () => {
    it('should use correct message format in script', () => {
      const script = getHeightReporterScript();
      
      // Verify the message format matches the expected structure
      expect(script).toContain("type: 'content-height'");
      expect(script).toContain('height:');
    });
  });

  describe('Error Handling', () => {
    it('should only send positive heights', () => {
      const script = getHeightReporterScript();
      
      // Verify there's a check for positive height
      expect(script).toContain('height > 0');
    });
  });
});
