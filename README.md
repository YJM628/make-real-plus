# AI-Driven HTML Visual Editor

An AI-powered visual editor for HTML built on React, TypeScript, and tldraw. Generate, visualize, and edit HTML pages through an interactive canvas interface.

## Features

- 🤖 **AI-Powered Generation**: Generate HTML pages from natural language descriptions
- 🎨 **Visual Editing**: Edit HTML elements directly on a tldraw canvas
- 🔄 **Multiple Rendering Modes**: Preview, Edit, and Split comparison modes
- 📱 **Responsive Design**: Support for desktop, tablet, and mobile viewports
- 🎯 **Precise Selection**: Click any HTML element to select and edit it
- 📝 **Override System**: Track modifications without changing original code
- 🔍 **Screenshot Selection**: Select regions for AI-powered modifications
- 📚 **Design System Integration**: Support for Material UI, Ant Design, and Tailwind CSS
- ⏱️ **Version History**: Track and restore previous versions
- 🚀 **Batch Generation**: Generate multiple related pages at once

## Quick Start

```bash
# Install dependencies
npm install

# Configure AI Service (Optional - uses mock by default)
cp .env.example .env
# Edit .env and add your API key

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## AI Service Configuration

The editor supports multiple AI providers. By default, it uses a mock service for development.

### Quick Setup

1. **Copy the environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Choose your AI provider** and add your API key to `.env`:

   **Option A: OpenAI (GPT-4)**
   ```env
   VITE_AI_PROVIDER=openai
   VITE_OPENAI_API_KEY=sk-your-api-key-here
   VITE_OPENAI_MODEL=gpt-4-turbo-preview
   ```

   **Option B: Anthropic (Claude)**
   ```env
   VITE_AI_PROVIDER=anthropic
   VITE_ANTHROPIC_API_KEY=sk-ant-your-api-key-here
   VITE_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
   ```

   **Option C: Mock (Development)**
   ```env
   VITE_AI_PROVIDER=mock
   ```

3. **Restart the development server**:
   ```bash
   npm run dev
   ```

📖 **For detailed configuration instructions, see [AI_SERVICE_SETUP.md](./AI_SERVICE_SETUP.md)**

## Project Status

✅ **All Core Features Complete** (Tasks 1-28)
- ✅ Project initialization and infrastructure
- ✅ Data models and utility functions
- ✅ HTML parser with identifier injection
- ✅ Override storage system
- ✅ Bidirectional sync engine
- ✅ Diff engine and export functionality
- ✅ AI service integration with streaming
- ✅ Custom tldraw shape handler
- ✅ Rendering modes (Preview/Edit/Split)
- ✅ Floating edit panel
- ✅ Screenshot selection tool
- ✅ Batch generation and auto layout
- ✅ Toolbar and mode switching
- ✅ HTML import functionality
- ✅ Code editor with syntax highlighting
- ✅ Responsive design support
- ✅ Version history and restoration
- ✅ Canvas interactions (double-click, undo/redo)
- ✅ Drag/resize override integration
- ✅ Performance optimizations
- ✅ Error handling and validation
- ✅ Security measures (XSS protection)
- ✅ Accessibility support
- ✅ Comprehensive test coverage (853 tests passing)

See [PROJECT_SETUP.md](./PROJECT_SETUP.md) for detailed setup information.

## Documentation

- [Project Setup](./PROJECT_SETUP.md) - Detailed setup and configuration
- [Source Code Structure](./src/README.md) - Code organization and architecture
- [Requirements](./.kiro/specs/ai-html-visual-editor/requirements.md) - Feature requirements
- [Design Document](./.kiro/specs/ai-html-visual-editor/design.md) - Architecture and design
- [Implementation Tasks](./.kiro/specs/ai-html-visual-editor/tasks.md) - Development roadmap

## Technology Stack

- **Frontend**: React 19.2.0 + TypeScript 5.9.3
- **Build Tool**: Vite (Rolldown-Vite 7.2.5)
- **Canvas**: tldraw
- **Testing**: Jest + fast-check + Testing Library
- **Code Quality**: ESLint + Prettier

## Development

```bash
# Development server
npm run dev

# Run tests
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage

# Code quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run format:check     # Check formatting
```

## Architecture

The project follows a layered architecture:

1. **Component Layer**: React UI components and rendering modes
2. **Core Layer**: HTML parser, sync engine, diff engine
3. **Services Layer**: AI service integration
4. **Utils Layer**: CSS, DOM, and performance utilities
5. **Hooks Layer**: React hooks for state management

## Testing Strategy

- **Unit Tests**: Specific examples, edge cases, error conditions
- **Property-Based Tests**: Universal properties across all inputs (100+ iterations)
- **Coverage Target**: 80% for branches, functions, lines, and statements

## Contributing

1. Create a feature branch
2. Write tests first (unit + property tests)
3. Implement the feature
4. Ensure all tests pass
5. Format and lint code
6. Submit pull request

## License

[Add your license information here]


## Usage Guide

### Getting Started

1. **Start the Application**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser.

2. **Generate HTML with AI**
   - Double-click anywhere on the empty canvas
   - Enter a natural language description (e.g., "Create a modern login form")
   - Optionally select a design system (Tailwind CSS, Material UI, Ant Design)
   - Click "Generate" or press Ctrl/Cmd+Enter
   - The AI will generate HTML, CSS, and JavaScript and create a shape on the canvas

3. **Edit HTML Elements**
   - Press `E` or click the Edit mode button to enter edit mode
   - Click any element in the HTML to select it
   - Use the floating edit panel to modify:
     - **Content Tab**: Edit text content
     - **Styles Tab**: Adjust colors, sizes, spacing
     - **AI Tab**: Use natural language to modify the element
   - Drag elements to reposition them
   - Resize elements by dragging the corners

4. **View Modes**
   - **Preview Mode (P)**: View the HTML as it would appear in a browser
   - **Edit Mode (E)**: Select and edit individual elements
   - **Split Mode (S)**: Compare original and modified HTML side-by-side

5. **Import Existing HTML**
   - Click the Import button in the toolbar
   - Select one or more HTML files
   - The editor will parse and display them on the canvas
   - External resources (CSS, JS) will be detected with security warnings

6. **Export Your Work**
   - Click the Export button
   - Choose export format:
     - **Single File**: All HTML, CSS, JS in one file
     - **Separate Files**: HTML, CSS, JS in separate files
   - Download the generated files

7. **Batch Generation**
   - Use natural language to request multiple pages
   - Example: "Create a website with home, about, and contact pages"
   - The AI will generate all pages and arrange them automatically
   - Pages are positioned left-to-right with 50px spacing

8. **Screenshot Selection**
   - Click the Screenshot tool button
   - Drag to select a region of the HTML
   - The AI will analyze and suggest improvements
   - Preview changes before applying

9. **Version History**
   - Click the History button to view all modifications
   - Each change is timestamped and labeled
   - Click any version to preview it
   - Click "Restore" to revert to that version

10. **Keyboard Shortcuts**
    - `P`: Switch to Preview mode
    - `E`: Switch to Edit mode
    - `S`: Switch to Split mode
    - `Ctrl/Cmd + Z`: Undo
    - `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y`: Redo
    - `Ctrl/Cmd + Enter`: Submit AI dialog
    - `Escape`: Close dialogs

### Advanced Features

#### Responsive Design
- Use the viewport selector to switch between Desktop, Tablet, and Mobile views
- Modifications made in different viewports generate responsive media queries
- Export includes all responsive CSS

#### Design Systems
- Select a design system when generating HTML
- The AI will use appropriate components and styling
- Supported systems: Tailwind CSS, Material UI, Ant Design

#### Override System
- All modifications are stored as "overrides"
- Original HTML remains unchanged
- Overrides can be merged, exported, or discarded
- Supports position, size, text, styles, and HTML changes

#### Code Editor
- Click "View Code" to open the code editor
- Edit HTML, CSS, and JavaScript directly
- Syntax highlighting and error detection
- Changes are validated before applying

### Tips and Best Practices

1. **Be Specific with AI Prompts**: The more detailed your description, the better the results
2. **Use Design Systems**: They provide consistent styling and components
3. **Test Responsiveness**: Always check your design in different viewport sizes
4. **Save Versions**: Use the history feature to save important milestones
5. **Export Regularly**: Download your work to avoid losing progress
6. **Review Security Warnings**: Be cautious when importing HTML with external scripts

### Troubleshooting

**AI Generation Fails**
- Check your internet connection
- Try a simpler prompt
- Ensure the AI service is configured correctly

**Elements Won't Select in Edit Mode**
- Make sure you're in Edit mode (press `E`)
- Click directly on the element, not the background
- Some elements may be too small to select easily

**Import Fails**
- Ensure the HTML file is valid
- Check for syntax errors in the HTML
- Large files (>100KB) may take longer to process

**Performance Issues**
- Reduce the number of shapes on the canvas
- Use Preview mode instead of Edit mode when not editing
- Close unused browser tabs

## API Reference

### Core Components

#### EditorCanvas
Main canvas component with tldraw integration and AI generation.

```typescript
import { EditorCanvas } from './components/canvas/EditorCanvas';

<EditorCanvas />
```

#### AIInputDialog
Dialog for AI-driven HTML generation.

```typescript
import { AIInputDialog } from './components/dialogs/AIInputDialog';

<AIInputDialog
  open={true}
  onClose={() => {}}
  onSubmit={(context) => {}}
  position={{ x: 100, y: 200 }}
/>
```

#### EditMode, PreviewMode, SplitMode
Rendering mode components.

```typescript
import { EditMode, PreviewMode, SplitMode } from './components/modes';

<PreviewMode html={html} css={css} js={js} overrides={[]} />
<EditMode html={html} css={css} overrides={[]} onElementDrag={...} />
<SplitMode html={html} css={css} js={js} overrides={[]} />
```

### Core Services

#### AIService
AI service for HTML generation.

```typescript
import { AIService } from './services/ai/AIService';

const aiService = new AIService();
const generator = aiService.generateHtml({
  prompt: 'Create a login form',
  designSystem: 'tailwind'
});

for await (const chunk of generator) {
  console.log(chunk.type, chunk.content);
}
```

#### HtmlParser
Parse and validate HTML.

```typescript
import { HtmlParser } from './core/parser/HtmlParser';

const parser = new HtmlParser();
const result = parser.parse('<div>Hello</div>');
```

#### SyncEngine
Bidirectional synchronization between shapes and DOM.

```typescript
import { SyncEngine } from './core/sync/SyncEngine';

const syncEngine = new SyncEngine();
syncEngine.initSync(shapeId, html, css, js);
syncEngine.applyOverride(shapeId, override);
```

### Utility Functions

#### CSS Utilities
```typescript
import {
  generateCssSelector,
  parseCssString,
  mergeStyles,
  adjustPositioningForDrag
} from './utils/css';
```

#### Performance Utilities
```typescript
import {
  debounce,
  throttle,
  isInViewport
} from './utils/performance';
```

## Test Coverage

Current test coverage: **853 tests passing**

- Unit Tests: 774 tests
- Property-Based Tests: 79 tests
- Coverage: >80% for all metrics

Run tests with:
```bash
npm test                 # All tests
npm run test:coverage    # With coverage report
npm run test:watch       # Watch mode
```

## Performance

- **60fps rendering** for <10 shapes
- **Memory usage** <500MB
- **AI response** with progress indicator after 10s
- **Large file warning** for HTML >100KB
- **Viewport culling** for off-screen shapes
- **Debounced/throttled** user interactions

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security

- **XSS Protection**: HTML rendered in sandboxed iframes
- **Content Security Policy**: Strict CSP headers
- **Input Validation**: All user input is validated
- **External Resource Warnings**: Alerts for external scripts/styles
- **AI Response Validation**: Generated code is validated before use

## Accessibility

- **Keyboard Navigation**: Full keyboard support for all features
- **ARIA Labels**: Proper ARIA attributes on all interactive elements
- **Screen Reader Support**: Compatible with screen readers
- **Focus Indicators**: Clear visual focus indicators
- **WCAG AA Compliance**: Meets WCAG AA contrast requirements

