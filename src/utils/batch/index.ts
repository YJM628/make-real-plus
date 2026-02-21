/**
 * Batch generation utilities
 * Feature: ai-html-visual-editor, batch-html-redesign, per-page-batch-generation, multi-page-merge-preview
 */

export {
  parseBatchRequest,
  createBatchContext,
  parseAppContext,
  type BatchRequestParseResult,
} from './parseBatchRequest';

export { buildPerPagePrompt, extractHtmlSections } from './buildPerPagePrompt';

// buildCohesivePrompt is deprecated and no longer re-exported from this barrel.
// The file src/utils/batch/buildCohesivePrompt.ts is retained for backward
// compatibility but should not be used in new code paths.
// import { buildCohesivePrompt } from './buildCohesivePrompt';

export {
  parseMultiPageResponse,
  injectSharedTheme,
  validateInterPageLinks,
} from './parseMultiPageResponse';

export { PageLinkHandler } from './pageLinkHandler';

export { collectPages, type CollectedPage } from './collectPages';

export { buildMergePageHtml } from './mergePreviewRouter';

export {
  normalizePageName,
  resolvePageName,
  DEFAULT_ROLE_ALIASES,
} from './pageNameResolver';
