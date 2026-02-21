# React Hooks

This directory contains custom React hooks used throughout the application.

## EditMode Hooks

These hooks were extracted from the EditMode component refactoring to provide modular, reusable functionality:

### useShadowDom
Manages Shadow DOM creation, content injection, and event delegation.

```typescript
const shadowRootRef = useShadowDom(containerRef, {
  html: '<div>Content</div>',
  css: '.class { color: red; }',
  onElementClick: (element) => console.log('Clicked:', element),
  onElementMouseEnter: (element) => console.log('Hover:', element),
  onElementMouseLeave: (element) => console.log('Leave:', element),
});
```

**Features:**
- Event delegation pattern for better performance
- Automatic cleanup on unmount
- Supports dynamic content updates

### useElementSelect
Manages element selection state and highlighting.

```typescript
const {
  selectedElement,
  handleElementClick,
  handleElementMouseEnter,
  handleElementMouseLeave,
  clearSelection,
} = useElementSelect({
  containerRef,
  shadowRootRef,
  generateSelector: (element, root) => '#id',
  onElementSelect: (selector, element) => console.log('Selected:', selector),
  onElementDeselect: () => console.log('Deselected'),
});
```

**Features:**
- Click selection with highlighting
- Hover effects
- Outside click detection
- CSS selector generation

### useDrag
Manages element dragging with position updates and tooltip display.

```typescript
const { isDragging, startDrag, tooltip } = useDrag({
  element: selectedElement?.element || null,
  selector: '.my-element',
  containerRef,
  onDragEnd: (selector, position) => console.log('Dragged to:', position),
});
```

**Features:**
- Smooth drag interactions
- Position calculation relative to container
- Automatic positioning strategy adjustments (flex/grid → absolute)
- Real-time tooltip with coordinates

### useResize
Manages element resizing with 8-directional handles.

```typescript
const { isResizing, startResize, tooltip } = useResize({
  element: selectedElement?.element || null,
  selector: '.my-element',
  containerRef,
  onResizeEnd: (selector, size) => console.log('Resized to:', size),
});
```

**Features:**
- 8-directional resize (nw, ne, sw, se, n, s, e, w)
- Size and position calculations
- Minimum size constraints
- Real-time tooltip with dimensions

## Other Hooks

### useAI
Provides AI generation and optimization capabilities.

### useElementPreview
Manages DOM element preview and restoration for editing workflows.

## Best Practices

1. **Single Responsibility**: Each hook should have one clear purpose
2. **Composability**: Hooks should work well together
3. **Cleanup**: Always clean up side effects in return functions
4. **Dependencies**: Be explicit about dependencies in useEffect/useCallback
5. **TypeScript**: Provide proper types for all parameters and return values

## Testing

Hooks should be tested using `@testing-library/react-hooks` or by testing components that use them.

Example:
```typescript
import { renderHook } from '@testing-library/react-hooks';
import { useDrag } from './useDrag';

test('useDrag should initialize with isDragging false', () => {
  const { result } = renderHook(() => useDrag({
    element: null,
    selector: '',
    containerRef: { current: null },
  }));
  
  expect(result.current.isDragging).toBe(false);
});
```
