# ScreenshotSelector Component

## Overview

The `ScreenshotSelector` component provides screenshot selection functionality for AI-driven HTML modifications. It allows users to drag and draw a rectangular selection area over rendered HTML content, captures a screenshot of the selected region, and identifies all HTML elements within the selection bounds.

## Features

- **Semi-transparent overlay mask** (Requirement 8.1)
- **Drag-to-draw rectangular selection** (Requirement 8.2)
- **Screenshot capture using html2canvas** (Requirement 8.3)
- **Element identification using bounding box intersection** (Requirement 8.4)
- **Keyboard support** (Escape to cancel)
- **Visual feedback** (selection dimensions display)

## Usage

```typescript
import { ScreenshotSelector } from './components/tools';

function MyComponent() {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleComplete = (
    screenshot: Blob,
    elements: HTMLElement[],
    bounds: DOMRect
  ) => {
    console.log('Screenshot captured:', screenshot);
    console.log('Elements in selection:', elements);
    console.log('Selection bounds:', bounds);
    setIsSelecting(false);
    
    // Send to AI service for modifications
    // ...
  };

  const handleCancel = () => {
    setIsSelecting(false);
  };

  return (
    <div>
      <div ref={targetRef}>
        {/* Your HTML content here */}
      </div>
      
      {isSelecting && targetRef.current && (
        <ScreenshotSelector
          targetElement={targetRef.current}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
```

## Props

### `ScreenshotSelectorProps`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `targetElement` | `HTMLElement` | Yes | The HTML element to overlay and capture screenshots from |
| `onComplete` | `(screenshot: Blob, elements: HTMLElement[], bounds: DOMRect) => void` | Yes | Callback invoked when selection is complete with the screenshot, identified elements, and selection bounds |
| `onCancel` | `() => void` | Yes | Callback invoked when selection is cancelled (via button click or Escape key) |

## Behavior

### Selection Process

1. User clicks and drags on the overlay to draw a rectangular selection
2. Selection dimensions are displayed in real-time
3. On mouse release:
   - Screenshot of the selected area is captured using html2canvas
   - All HTML elements within the selection bounds are identified
   - `onComplete` callback is invoked with the results

### Element Identification

The component uses bounding box intersection detection to identify all HTML elements whose bounding rectangles intersect with the selection area. This includes:

- Elements fully contained within the selection
- Elements partially overlapping the selection
- Nested elements at any depth

Elements with zero width or height are excluded from the results.

### Keyboard Shortcuts

- **Escape**: Cancel selection and close the overlay

### Visual Feedback

- Semi-transparent black overlay (30% opacity) covers the target element
- Blue selection rectangle with 10% opacity fill
- Selection dimensions displayed above the rectangle
- Cancel button in the top-right corner

## Implementation Details

### Screenshot Capture

The component uses the `html2canvas` library to capture screenshots. The process:

1. Capture the entire target element as a canvas
2. Create a new canvas for the cropped region
3. Draw the selected portion onto the cropped canvas
4. Convert the canvas to a Blob (PNG format)

### Browser Compatibility

- Modern browsers with Canvas API support
- Requires `html2canvas` library
- Falls back to `toDataURL` if `toBlob` is not available

### Testing Limitations

Due to jsdom's limited Canvas API support, full end-to-end screenshot testing requires a real browser environment. Unit tests verify:

- UI rendering and interaction
- Selection rectangle drawing
- html2canvas invocation
- Error handling

Integration tests in a real browser (e.g., using Playwright or Cypress) are recommended for complete screenshot capture verification.

## Requirements Mapping

- **Requirement 8.1**: Semi-transparent overlay mask
- **Requirement 8.2**: Rectangular selection drag-to-draw
- **Requirement 8.3**: Screenshot capture using html2canvas
- **Requirement 8.4**: Element identification using bounding box intersection

## Dependencies

- `react`: UI framework
- `html2canvas`: Screenshot capture library

## Future Enhancements

- Configurable overlay opacity
- Customizable selection color
- Minimum selection size configuration
- Touch device support
- Multiple selection areas
- Selection history/undo
