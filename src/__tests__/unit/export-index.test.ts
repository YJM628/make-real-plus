/**
 * Export Module Index Tests
 * Feature: export-deployable-project
 * 
 * Tests that all public exports are available from the index module.
 */

import * as ExportModule from './index';

describe('Export Module Index', () => {
  describe('Main Entry Point', () => {
    it('should export exportProject function', () => {
      expect(ExportModule.exportProject).toBeDefined();
      expect(typeof ExportModule.exportProject).toBe('function');
    });
  });

  describe('Core Processing Modules', () => {
    it('should export applyOverrides function', () => {
      expect(ExportModule.applyOverrides).toBeDefined();
      expect(typeof ExportModule.applyOverrides).toBe('function');
    });

    it('should export extractSharedCSS function', () => {
      expect(ExportModule.extractSharedCSS).toBeDefined();
      expect(typeof ExportModule.extractSharedCSS).toBe('function');
    });

    it('should export convertLinks function', () => {
      expect(ExportModule.convertLinks).toBeDefined();
      expect(typeof ExportModule.convertLinks).toBe('function');
    });

    it('should export generateMockData function', () => {
      expect(ExportModule.generateMockData).toBeDefined();
      expect(typeof ExportModule.generateMockData).toBe('function');
    });

    it('should export resolveDesignSystemDeps function', () => {
      expect(ExportModule.resolveDesignSystemDeps).toBeDefined();
      expect(typeof ExportModule.resolveDesignSystemDeps).toBe('function');
    });

    it('should export generateRouterScript function', () => {
      expect(ExportModule.generateRouterScript).toBeDefined();
      expect(typeof ExportModule.generateRouterScript).toBe('function');
    });
  });

  describe('Project Assemblers', () => {
    it('should export assembleStaticProject function', () => {
      expect(ExportModule.assembleStaticProject).toBeDefined();
      expect(typeof ExportModule.assembleStaticProject).toBe('function');
    });

    it('should export assembleReactProject function', () => {
      expect(ExportModule.assembleReactProject).toBeDefined();
      expect(typeof ExportModule.assembleReactProject).toBe('function');
    });

    it('should export assembleVueProject function', () => {
      expect(ExportModule.assembleVueProject).toBeDefined();
      expect(typeof ExportModule.assembleVueProject).toBe('function');
    });
  });

  describe('ZIP Bundler', () => {
    it('should export bundleAndDownload function', () => {
      expect(ExportModule.bundleAndDownload).toBeDefined();
      expect(typeof ExportModule.bundleAndDownload).toBe('function');
    });
  });

  describe('Type Exports', () => {
    it('should have all type exports available', () => {
      // TypeScript will catch if types are not exported correctly at compile time
      // This test just verifies the module structure is correct
      const moduleKeys = Object.keys(ExportModule);
      
      // Verify we have the expected number of function exports
      const functionExports = moduleKeys.filter(
        key => typeof (ExportModule as any)[key] === 'function'
      );
      
      expect(functionExports.length).toBe(11); // 11 function exports
    });
  });

  describe('Module Integration', () => {
    it('should allow importing individual functions', () => {
      // This test verifies that tree-shaking will work correctly
      const {
        exportProject,
        applyOverrides,
        extractSharedCSS,
        convertLinks,
        generateMockData,
        resolveDesignSystemDeps,
        generateRouterScript,
        assembleStaticProject,
        assembleReactProject,
        assembleVueProject,
        bundleAndDownload,
      } = ExportModule;

      expect(exportProject).toBeDefined();
      expect(applyOverrides).toBeDefined();
      expect(extractSharedCSS).toBeDefined();
      expect(convertLinks).toBeDefined();
      expect(generateMockData).toBeDefined();
      expect(resolveDesignSystemDeps).toBeDefined();
      expect(generateRouterScript).toBeDefined();
      expect(assembleStaticProject).toBeDefined();
      expect(assembleReactProject).toBeDefined();
      expect(assembleVueProject).toBeDefined();
      expect(bundleAndDownload).toBeDefined();
    });
  });
});
