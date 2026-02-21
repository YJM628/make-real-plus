# CLAUDE.md

This file provides guidance for Claude Code when working with this project.

## Quick Navigation

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Development Workflow](#development-workflow)
- [Testing Guidelines](#testing-guidelines)
- [Code Quality](#code-quality)

## Project Overview

**make-real** is an AI-powered visual HTML editor built on React, TypeScript, and tldraw. Users can generate, visualize, and edit HTML pages through an interactive canvas interface with AI assistance.

**Key Features**:
- AI-powered HTML generation from natural language
- Visual editing with tldraw canvas integration
- Multiple rendering modes (Preview, Edit, Split)
- Responsive design support (desktop, tablet, mobile)
- Override system for tracking modifications
- Version history and restoration
- Batch generation and auto layout

## Tech Stack

### Core Technologies
- **Frontend**: React 19.2.0 + TypeScript 5.9.3
- **Build Tool**: Vite (Rolldown-Vite 7.2.5)
- **Canvas**: tldraw 4.3.1
- **Code Editor**: Monaco Editor 0.55.1
- **HTML Parser**: GrapesJS 0.22.14
- **Testing**: Jest 30.2.0 + fast-check 4.5.3 + Testing Library

### Development Tools
- **Linting**: ESLint 9.39.1
- **Formatting**: Prettier 3.8.1
- **Type Checking**: TypeScript strict mode

## Architecture

The project follows a layered architecture:

```
src/
├── components/       # React UI components
│   ├── canvas/       # tldraw canvas integration
│   ├── modes/        # Preview/Edit/Split rendering modes
│   ├── dialogs/      # AI input and other dialogs
│   ├── panels/       # Floating edit panels
│   ├── tools/        # Toolbar and selection tools
│   ├── editors/      # Code editor with syntax highlighting
│   └── import/       # HTML import functionality
├── core/            # Core business logic
│   ├── parser/      # HTML parser with identifier injection
│   ├── sync/        # Bidirectional sync engine
│   └── diff/        # Diff engine for export
├── services/        # External service integrations
│   └── ai/          # AI service (OpenAI/Anthropic/Mock)
├── hooks/           # React hooks for state management
├── utils/           # CSS, DOM, and performance utilities
├── types/           # TypeScript type definitions
└── __tests__/       # Unit and property-based tests
```

### Key Components

- **EditorCanvas**: Main canvas with tldraw integration and AI generation
- **AIInputDialog**: Dialog for natural language HTML generation
- **EditMode/PreviewMode/SplitMode**: Rendering modes for HTML visualization
- **AIService**: AI service integration with streaming support
- **HtmlParser**: Parse and validate HTML with identifier injection
- **SyncEngine**: Bidirectional synchronization between shapes and DOM

## Development Workflow

### Starting Development
```bash
npm install
npm run dev          # Start development server on http://localhost:5173
```

### Code Quality Standards
1. **Type Safety**: Use TypeScript strict mode, avoid `any` types
2. **Component Design**: Favor small, reusable components with clear responsibilities
3. **Error Handling**: Always handle errors with proper logging and user feedback
4. **Performance**: Use debouncing/throttling for user interactions, viewport culling for off-screen shapes
5. **Security**: Sanitize all HTML input, use sandboxed iframes for rendering

### Adding New Features
1. Write tests first (unit tests + property-based tests for universal properties)
2. Implement the feature following existing patterns
3. Ensure all tests pass (`npm test`)
4. Format with Prettier (`npm run format`)
5. Run ESLint (`npm run lint`)
6. Update documentation if needed

### AI Service Integration
The project supports multiple AI providers configured via `.env`:
- **OpenAI**: GPT-4 Turbo Preview
- **Anthropic**: Claude 3.5 Sonnet
- **Mock**: Development/testing without API calls

Default provider is mock for local development.

## Testing Guidelines

### Test Strategy
- **Unit Tests**: Test specific examples, edge cases, and error conditions
- **Property-Based Tests**: Verify universal properties across all inputs (100+ iterations)
- **Coverage Target**: 80%+ for branches, functions, lines, and statements

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for TDD
npm run test:coverage # Generate coverage report
```

### Test Organization
- Place tests in `src/__tests__/` directory
- Use descriptive test names that explain the behavior
- Test both happy paths and error cases
- Use property-based testing for functions with universal invariants

### Current Coverage
- **Total Tests**: 853 (774 unit + 79 property-based)
- **Coverage**: >80% for all metrics

## Code Quality

### Linting and Formatting
```bash
npm run lint          # Run ESLint
npm run format        # Format with Prettier
npm run format:check  # Check formatting
```

### TypeScript Configuration
- Strict mode enabled
- Path aliases configured for clean imports
- Separate configs for app and node environments

### Commit Guidelines
- Write clear, descriptive commit messages
- Reference related issues or task numbers
- Keep commits atomic and focused

## Common Tasks

### Adding a New Rendering Mode
1. Create component in `src/components/modes/`
2. Implement mode-specific rendering logic
3. Add mode switcher to toolbar
4. Write tests for the new mode
5. Update documentation

### Integrating New AI Provider
1. Add provider implementation in `src/services/ai/`
2. Update AIService interface
3. Add provider configuration to `.env.example`
4. Write tests for the new provider
5. Update documentation

### Adding New Shape Types
1. Extend shape handler in `src/components/canvas/`
2. Add shape-specific rendering logic
3. Implement shape-specific interactions
4. Write tests for the new shape
5. Update type definitions

## Performance Considerations

- **60fps rendering** target for <10 shapes
- **Memory usage** target <500MB
- **Viewport culling** for off-screen shapes
- **Debounced/throttled** user interactions
- **Lazy loading** for large HTML files

## Security Best Practices

- **XSS Protection**: HTML rendered in sandboxed iframes
- **Content Security Policy**: Strict CSP headers
- **Input Validation**: All user input validated before processing
- **External Resource Warnings**: Alert for external scripts/styles
- **AI Response Validation**: Generated code validated before use

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- Full keyboard support for all features
- ARIA labels on interactive elements
- Screen reader compatibility
- Clear visual focus indicators
- WCAG AA compliance for contrast

## Documentation

- [README.md](./README.md) - Project overview and usage guide
- [src/README.md](./src/README.md) - Code organization and architecture
- [PROJECT_SETUP.md](./PROJECT_SETUP.md) - Detailed setup and configuration
- [.kiro/specs/](./.kiro/specs/) - Requirements, design, and tasks

## Getting Help

For questions about:
- **Project structure**: See [src/README.md](./src/README.md)
- **Setup**: See [PROJECT_SETUP.md](./PROJECT_SETUP.md)
- **Requirements**: See [.kiro/specs/ai-html-visual-editor/requirements.md](./.kiro/specs/ai-html-visual-editor/requirements.md)
- **Design**: See [.kiro/specs/ai-html-visual-editor/design.md](./.kiro/specs/ai-html-visual-editor/design.md)
