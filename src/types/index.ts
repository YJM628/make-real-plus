/**
 * Core TypeScript types and interfaces for the AI-driven HTML Visual Editor
 * Feature: ai-html-visual-editor
 */

/**
 * Viewport configuration for responsive design
 */
export type ViewportConfig =
  | 'desktop' // 1920x1080
  | 'tablet' // 768x1024
  | 'mobile' // 375x667
  | { width: number; height: number }; // Custom size

/**
 * Element override data structure that tracks HTML element modifications
 * without changing the original code
 */
export interface ElementOverride {
  /** Unique CSS selector identifying the target element */
  selector: string;

  /** Text content modification (optional) */
  text?: string;

  /** CSS style overrides (optional) */
  styles?: Record<string, string>;

  /** Complete HTML replacement (optional) */
  html?: string;

  /** Attributes to add/modify (optional) */
  attributes?: Record<string, string>;

  /** Position override (for dragging) */
  position?: { x: number; y: number };

  /** Size override (for resizing) */
  size?: { width: number; height: number };

  /** Modification timestamp */
  timestamp: number;

  /** Whether this was AI-generated */
  aiGenerated: boolean;

  /** Original values for restoration */
  original?: {
    text?: string;
    styles?: Record<string, string>;
    html?: string;
    attributes?: Record<string, string>;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  };
}

/**
 * Parsed HTML element with metadata
 */
export interface ParsedElement {
  /** Unique identifier (id or data-uuid) */
  identifier: string;

  /** HTML tag name */
  tagName: string;

  /** Element attributes */
  attributes: Record<string, string>;

  /** Inline styles */
  inlineStyles: Record<string, string>;

  /** Computed CSS selector */
  selector: string;

  /** Text content */
  textContent: string;

  /** Child elements */
  children: ParsedElement[];

  /** Parent element reference */
  parent?: ParsedElement;

  /** Bounding box information */
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Result of HTML parsing
 */
export interface HtmlParseResult {
  /** Root element information */
  root: ParsedElement;

  /** Flat map of all elements indexed by identifier */
  elementMap: Map<string, ParsedElement>;

  /** CSS styles extracted from <style> tags */
  styles: string;

  /** JavaScript extracted from <script> tags */
  scripts: string;

  /** External resource links */
  externalResources: {
    stylesheets: string[];
    scripts: string[];
    images: string[];
  };
}

/**
 * History entry for version management
 */
export interface HistoryEntry {
  timestamp: number;
  override: ElementOverride;
  tag?: string;
  note?: string;
}

/**
 * Sync state maintained by the sync engine
 */
export interface SyncState {
  /** Current HTML shape ID */
  shapeId: string;

  /** Original HTML structure */
  originalHtml: HtmlParseResult;

  /** Current overrides */
  overrides: ElementOverride[];

  /** DOM reference (for edit mode) */
  domRoot?: HTMLElement;

  /** Shape reference */
  shapeRef?: HtmlShapeProps;

  /** Sync status */
  status: 'synced' | 'pending' | 'error';

  /** Last sync timestamp */
  lastSync: number;

  /** Modification history */
  history: HistoryEntry[];
}

/**
 * tldraw HTML shape properties
 */
export interface HtmlShapeProps {
  id: string;
  type: 'html';
  x: number;
  y: number;
  width: number;
  height: number;
  props: {
    html: string;
    css: string;
    js: string;
    mode: 'preview' | 'edit' | 'split';
    overrides: ElementOverride[];
    designSystem?: string;
    viewport?: ViewportConfig;
  };
}

/**
 * Single page specification for batch generation
 * Feature: batch-html-redesign
 */
export interface PageSpec {
  /** Page identifier name (e.g., "home", "products", "cart") */
  name: string;

  /** Page role description (e.g., "首页", "产品列表页") */
  role: string;

  /** Page names this page should link to */
  linksTo: string[];

  /** Page ordering weight (for canvas layout) */
  order: number;
}

/**
 * Application context describing the entire web application structure
 * Feature: batch-html-redesign
 */
export interface AppContext {
  /** Application name */
  appName: string;

  /** Application type (e.g., "ecommerce", "blog", "dashboard", "portfolio") */
  appType: string;

  /** List of page specifications */
  pages: PageSpec[];

  /** User's original prompt */
  originalPrompt: string;

  /** Design system preference */
  designSystem?: string;
}

/**
 * AI generation context sent to the AI service
 */
export interface AIGenerationContext {
  /** User prompt */
  prompt: string;

  /** Design system preference */
  designSystem?: string;

  /** Screenshot context (optional) */
  screenshot?: Blob;

  /** HTML structure of selected elements (optional) */
  selectedElements?: ParsedElement[];

  /** Full HTML of current page (for context) */
  currentHtml?: string;

  /** Whether this is batch generation */
  batchGeneration?: {
    count: number;
    pageTypes: string[];
    /** Application context for cohesive batch generation */
    appContext?: AppContext;
  };
}

/**
 * AI generation chunk (streaming)
 */
export interface AIGenerationChunk {
  type: 'html' | 'css' | 'js';
  content: string;
  isComplete: boolean;
}

/**
 * Single page completion event for batch generation
 * Feature: streaming-batch-render
 */
export interface BatchPageChunk {
  type: 'page-complete';
  page: {
    name: string;
    html: string;
    css: string;
    js: string;
  };
  pageIndex: number;
  totalPages: number;
}

/**
 * Batch generation progress event
 * Feature: streaming-batch-render
 */
export interface BatchProgressChunk {
  type: 'batch-progress';
  pagesCompleted: number;
  totalPages: number;
}

/**
 * Union type for batch streaming events
 * Feature: streaming-batch-render
 */
export type BatchStreamEvent = AIGenerationChunk | BatchPageChunk | BatchProgressChunk;

/**
 * AI generation result
 */
export interface AIGenerationResult {
  html: string;
  css: string;
  js: string;
  identifiers: string[]; // List of generated identifiers
  error?: string;
}

/**
 * Batch generation result
 */
export interface BatchGenerationResult {
  pages: Array<{
    name: string;
    html: string;
    css: string;
    js: string;
  }>;
  error?: string;
  /** Optional shared theme CSS (for cohesive batch generation) */
  sharedTheme?: string;
  /** Optional shared navigation components (for cohesive batch generation) */
  sharedNavigation?: {
    header: string;
    footer: string;
  };
}

/**
 * Cohesive batch generation result with shared theme and navigation
 * Feature: batch-html-redesign
 */
export interface CohesiveBatchResult {
  /** Shared theme CSS (CSS variables and common styles) */
  sharedTheme: string;

  /** Shared navigation components */
  sharedNavigation: {
    header: string;
    footer: string;
  };

  /** Individual page contents */
  pages: Array<{
    name: string;
    html: string;
    css: string;
    js: string;
  }>;

  /** Parsing error if any */
  error?: string;
}

/**
 * Page group for tracking related pages and shared components
 * Feature: batch-html-redesign
 */
export interface PageGroup {
  /** Unique group identifier */
  groupId: string;

  /** Shape IDs of all pages in this group */
  shapeIds: string[];

  /** Shared theme CSS */
  sharedTheme: string;

  /** Shared navigation components */
  sharedNavigation: {
    header: string;
    footer: string;
  };

  /** Mapping from page name to shape ID */
  pageNameToShapeId: Map<string, string>;
}

/**
 * AI optimization result
 */
export interface AIOptimizationResult {
  html?: string;
  styles?: Record<string, string>;
  error?: string;
}

/**
 * HTML diff result
 */
export interface HtmlDiff {
  added: ParsedElement[];
  modified: Array<{
    selector: string;
    changes: ElementOverride;
  }>;
  removed: ParsedElement[];
}

/**
 * Export result
 */
export interface ExportResult {
  html: string;
  css?: string;
  js?: string;
}

/**
 * Export options for deployable project generation
 * Feature: export-deployable-project
 */
export interface ExportOptions {
  /** Target export format */
  format: 'static' | 'react' | 'vue';
  
  /** Application name for the exported project */
  appName: string;
}

/**
 * Processed page data after applying overrides
 * Feature: export-deployable-project
 */
export interface ProcessedPage {
  /** Page name/identifier */
  name: string;
  
  /** HTML content with overrides applied */
  html: string;
  
  /** CSS styles */
  css: string;
  
  /** JavaScript code */
  js: string;
  
  /** Design system type (optional) */
  designSystem?: string;
}

/**
 * Result of CSS extraction and deduplication
 * Feature: export-deployable-project
 */
export interface CSSExtractionResult {
  /** Shared CSS rules extracted from multiple pages */
  sharedCSS: string;
  
  /** Page-specific CSS rules (page name -> CSS content) */
  pageCSS: Map<string, string>;
}

/**
 * Mock API endpoint specification
 * Feature: export-deployable-project
 */
export interface MockEndpoint {
  /** HTTP method (GET, POST, etc.) */
  method: string;
  
  /** API path (e.g., /api/products) */
  path: string;
  
  /** Mock response data */
  mockData: object;
}

/**
 * Result of mock data generation
 * Feature: export-deployable-project
 */
export interface MockGenerationResult {
  /** Discovered API endpoints */
  endpoints: MockEndpoint[];
  
  /** Mock data files (file path -> JSON content) */
  mockFiles: Map<string, string>;
  
  /** Fetch interceptor script for redirecting API calls to mock data */
  interceptScript: string;
}

/**
 * IPFS pinning service provider type
 * Feature: share-app-link
 */
export type IpfsProvider = 'pinata' | 'web3storage';

/**
 * Result of uploading HTML content to IPFS
 * Feature: share-app-link
 */
export interface IpfsUploadResult {
  /** IPFS Content Identifier */
  cid: string;

  /** Public gateway access URL */
  gatewayUrl: string;

  /** Provider used for upload */
  provider: IpfsProvider;
}

/**
 * Result of the share pipeline assembly
 * Feature: share-app-link
 */
export interface ShareResult {
  /** Assembled self-contained HTML string */
  html: string;

  /** Application name */
  appName: string;
}

/**
 * Share dialog state machine phases
 * Feature: share-app-link
 */
export type ShareDialogState =
  | { phase: 'idle' }
  | { phase: 'assembling' }
  | { phase: 'uploading' }
  | { phase: 'success'; gatewayUrl: string; cid: string }
  | { phase: 'error'; message: string };
