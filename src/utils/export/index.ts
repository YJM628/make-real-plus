/**
 * Export Module - Public API
 * Feature: export-deployable-project
 * Requirements: 1.1
 * 
 * This module provides a unified export interface for all export-related functionality.
 * It exports the main entry point (exportProject) and all supporting utilities.
 */

// Main export pipeline entry point
export { exportProject } from './exportPipeline';

// Core processing modules
export { applyOverrides } from './overrideApplier';
export { extractSharedCSS } from './cssExtractor';
export { convertLinks } from './linkConverter';
export { generateMockData } from './mockDataGenerator';
export { resolveDesignSystemDeps } from './designSystemResolver';
export { generateRouterScript } from './routerScript';

// Project assemblers
export { assembleStaticProject } from './staticAssembler';
export { assembleReactProject } from './reactConverter';
export { assembleVueProject } from './vueConverter';

// ZIP bundler
export { bundleAndDownload } from './zipBundler';

// Re-export types from the main types file for convenience
export type {
  ExportOptions,
  ProcessedPage,
  CSSExtractionResult,
  MockEndpoint,
  MockGenerationResult,
} from '../../types';
