# AI-Driven HTML Visual Editor - Source Code Structure

## Directory Structure

```
src/
├── components/       # React UI components
│   ├── modes/       # Rendering mode components (PreviewMode, EditMode, SplitMode)
│   ├── panels/      # UI panels (FloatingEditPanel, etc.)
│   ├── tools/       # Tool components (ScreenshotSelector, CodeEditor, etc.)
│   └── toolbar/     # Toolbar components
├── core/            # Core engine implementations
│   ├── parser/      # HTML parser
│   ├── sync/        # Sync engine
│   ├── diff/        # Diff engine
│   └── shape/       # tldraw shape utilities
├── services/        # External service integrations
│   └── ai/          # AI service integration
├── utils/           # Utility functions
│   ├── css/         # CSS selector and style utilities
│   ├── dom/         # DOM manipulation utilities
│   └── performance/ # Performance optimization utilities
├── hooks/           # React hooks
│   └── useAI.ts     # AI integration hook
├── types/           # TypeScript type definitions
│   └── index.ts     # Core types and interfaces
├── __tests__/       # Test files
│   ├── unit/        # Unit tests
│   └── property/    # Property-based tests
└── main.tsx         # Application entry point
```

## Architecture Layers

### 1. Component Layer (components/)
React components for UI and rendering modes:
- **modes/**: PreviewMode, EditMode, SplitMode
- **panels/**: FloatingEditPanel
- **tools/**: ScreenshotSelector, CodeEditor
- **toolbar/**: Toolbar and related components

### 2. Core Layer (core/)
Core engine implementations:
- **parser/**: HtmlParser - Parse HTML to structured data
- **sync/**: SyncEngine - Bidirectional sync between tldraw shapes and HTML DOM
- **diff/**: DiffEngine - Calculate differences and generate exports
- **shape/**: HybridHtmlShapeUtil - Custom tldraw shape handler

### 3. Services Layer (services/)
External service integrations:
- **ai/**: AI service for HTML generation and optimization

### 4. Utils Layer (utils/)
Helper functions and utilities:
- **css/**: CSS selector generation, style parsing and manipulation
- **dom/**: DOM manipulation and element finding
- **performance/**: Debounce, throttle, viewport checking

### 5. Hooks Layer (hooks/)
React hooks for state management and AI integration:
- **useAI**: Hook for AI generation and optimization

## Testing Strategy

### Unit Tests (src/__tests__/unit/)
- Test specific examples and edge cases
- Test error conditions and validation
- Test component interactions

### Property-Based Tests (src/__tests__/property/)
- Test universal properties across all inputs
- Use fast-check library with 100+ iterations
- Reference design document properties

## Development Guidelines

1. **Type Safety**: All code must be fully typed with TypeScript
2. **Testing**: Write both unit tests and property tests for new functionality
3. **Code Style**: Use Prettier for formatting, ESLint for linting
4. **Documentation**: Add JSDoc comments for public APIs
5. **Performance**: Consider performance implications, especially for DOM operations

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint
```
