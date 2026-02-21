/**
 * HybridHtmlShapeUtil - Custom tldraw shape handler for HTML rendering
 * Feature: ai-html-visual-editor
 * 
 * This shape utility handles HTML content rendering in different modes:
 * - Preview: Full HTML rendering with CSS/JS execution in iframe
 * - Edit: Interactive element selection using GrapesJS editor
 * 
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */

import * as React from 'react';
import {
  HTMLContainer,
  Rectangle2d,
  ShapeUtil,
  type TLShape,
  type TLShapeId,
  type TLResizeInfo,
  T,
  useEditor,
} from 'tldraw';
import type { ElementOverride, ViewportConfig } from '../../types';
import { PreviewMode } from '../../components/modes/PreviewMode';
import { InteractiveModeContext } from '../../components/canvas/hooks/useInteractiveMode';
import { ShapeSizes } from './shapeSizes';

/**
 * Shape type constant for HTML shapes
 */
export const HTML_SHAPE_TYPE = 'html' as const;

/**
 * Declare the HTML shape type in tldraw's global shape props map
 */
declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [HTML_SHAPE_TYPE]: {
      html: string;
      css: string;
      js: string;
      mode: 'preview' | 'edit';
      overrides: ElementOverride[];
      designSystem?: string;
      viewport?: ViewportConfig;
      w: number; // width
      h: number; // height
    };
  }
}

/**
 * HTML shape type definition for tldraw
 */
export type HtmlShape = TLShape<typeof HTML_SHAPE_TYPE>;

/**
 * HybridHtmlShapeUtil - Custom shape handler for HTML content
 * 
 * Handles rendering HTML in different modes and manages interactions
 * with the HTML content including resizing, rotating, and pointer events.
 */
export class HybridHtmlShapeUtil extends ShapeUtil<HtmlShape> {
  /**
   * Shape type identifier
   */
  static override type = HTML_SHAPE_TYPE;

  /**
   * Props validator for tldraw
   * All shape props must be JSON serializable
   */
  static override props = {
    html: T.string,
    css: T.string,
    js: T.string,
    mode: T.literalEnum('preview', 'edit'),
    overrides: T.arrayOf(
      T.object({
        selector: T.string,
        text: T.optional(T.string),
        styles: T.optional(T.dict(T.string, T.string)),
        html: T.optional(T.string),
        attributes: T.optional(T.dict(T.string, T.string)),
        position: T.optional(T.object({ x: T.number, y: T.number })),
        size: T.optional(T.object({ width: T.number, height: T.number })),
        timestamp: T.number,
        aiGenerated: T.boolean,
        original: T.optional(
          T.object({
            text: T.optional(T.string),
            styles: T.optional(T.dict(T.string, T.string)),
            html: T.optional(T.string),
            attributes: T.optional(T.dict(T.string, T.string)),
            position: T.optional(T.object({ x: T.number, y: T.number })),
            size: T.optional(T.object({ width: T.number, height: T.number })),
          })
        ),
      })
    ),
    designSystem: T.optional(T.string),
    viewport: T.optional(T.literalEnum('desktop', 'tablet', 'mobile')),
    w: T.number,
    h: T.number,
  };

  /**
   * Get default properties for new HTML shapes
   * Requirements: 2.1
   */
  getDefaultProps(): HtmlShape['props'] {
    return {
      html: '<div>Empty HTML Shape</div>',
      css: '',
      js: '',
      mode: 'preview',
      overrides: [],
      designSystem: undefined,
      viewport: 'desktop',
      w: 800,
      h: 600,
    };
  }

  /**
   * Get geometry for hit detection and bounds calculation
   * Requirements: 2.4
   * Feature: shape-auto-resize - Requirements 3.1, 3.2, 3.3, 3.5
   * 
   * Reactively reads measured content height from ShapeSizes store.
   * Falls back to shape.props.h when no measured height exists.
   * Enforces minimum height of 100px.
   */
  getGeometry(shape: HtmlShape) {
    // Requirement 3.1: Use measured height from ShapeSizes store
    // Use .get() to make this reactive - tldraw will re-call getGeometry when the atom changes
    const sizeMap = ShapeSizes.get(this.editor);
    const size = sizeMap.get(shape.id);
    
    // Requirement 3.2: Fall back to shape.props.h when no measured height exists
    const height = size?.height ?? shape.props.h;
    
    console.log('[HybridHtmlShapeUtil] getGeometry:', { 
      shapeId: shape.id, 
      measuredHeight: size?.height, 
      propsHeight: shape.props.h,
      finalHeight: height 
    });
    
    // Requirement 3.5: Enforce minimum height of 100px
    // Requirement 3.3: Width always uses shape.props.w
    return new Rectangle2d({
      width: shape.props.w,
      height: Math.max(100, height),
      isFilled: true,
    });
  }

  /**
   * Render the HTML shape based on current mode
   * Requirements: 2.1, 2.2
   * Feature: html-interactive-preview - Requirements 1.2, 2.3
   * Feature: shape-auto-resize - Use hook in component method
   */
  component(shape: HtmlShape) {
    const { mode, html, css, js, overrides, viewport, w, h } = shape.props;

    // Feature: html-interactive-preview
    // Get interactive mode state from context
    // Requirement 1.2: Enable pointer events when shape is in interactive mode
    const interactiveShapeId = React.useContext(InteractiveModeContext);
    const isInteractive = interactiveShapeId === shape.id;
    
    // Requirement 1.2, 2.3: Set pointerEvents based on interactive state
    // - 'all' when interactive: allows user to interact with HTML content
    // - 'none' otherwise: allows tldraw to capture events for canvas operations
    const pointerEvents = isInteractive ? 'all' : 'none';
    
    // Feature: shape-auto-resize
    // Get measured height from ShapeSizes store
    const editor = useEditor();
    const sizeMap = ShapeSizes.get(editor);
    const measuredHeight = sizeMap.get(shape.id)?.height;
    const effectiveHeight = measuredHeight ?? h;

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: w,
          height: effectiveHeight, // Use measured height if available
          overflow: 'hidden',
          pointerEvents, // Dynamic based on interactive mode
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            pointerEvents, // Dynamic based on interactive mode
          }}
        >
          {this.renderMode(mode, html, css, js, overrides, viewport, w, effectiveHeight, shape.id as TLShapeId)}
        </div>
      </HTMLContainer>
    );
  }

  /**
   * Render content based on mode
   * @private
   * Feature: shape-auto-resize - Requirement 6.1
   */
  private renderMode(
    mode: 'preview' | 'edit',
    html: string,
    css: string,
    js: string,
    overrides: ElementOverride[],
    _viewport: ViewportConfig | undefined,
    width: number,
    height: number,
    shapeId: TLShapeId
  ): React.ReactElement {
    switch (mode) {
      case 'preview':
        return (
          <PreviewMode
            html={html}
            css={css}
            js={js}
            overrides={overrides}
            width={width}
            height={height}
            shapeId={shapeId}
          />
        );
      default:
        return <div>Unknown mode</div>;
    }
  }

  /**
   * Render selection indicator
   * Requirements: 2.4
   * Feature: shape-auto-resize - Use actual geometry bounds
   */
  indicator(shape: HtmlShape) {
    // Use getShapeGeometry to get the actual bounds (including measured height)
    const bounds = this.editor.getShapeGeometry(shape).bounds;
    
    return (
      <rect
        width={bounds.width}
        height={bounds.height}
        fill="none"
        stroke="var(--color-selected)"
        strokeWidth={2}
      />
    );
  }

  /**
   * Handle shape resize
   * Requirements: 2.5
   */
  onResize = (shape: HtmlShape, info: TLResizeInfo<HtmlShape>) => {
    // Calculate new dimensions based on scale
    const newW = shape.props.w * info.scaleX;
    const newH = shape.props.h * info.scaleY;

    return {
      id: shape.id,
      type: shape.type,
      props: {
        ...shape.props,
        w: Math.max(100, newW), // Minimum width of 100px
        h: Math.max(100, newH), // Minimum height of 100px
      },
    };
  };

  /**
   * Handle shape rotation
   * Requirements: 2.4
   */
  onRotate = () => {
    // HTML shapes don't support rotation in this implementation
    // Return shape unchanged
  };

  /**
   * Handle pointer down event
   * Requirements: 2.4
   */
  onPointerDown = () => {
    // Pointer events are now handled by useEditModeClick hook
    // which listens to editor.on('event', ...) for better integration
  };

  /**
   * Handle pointer move event
   * Requirements: 2.4
   */
  onPointerMove = () => {
    // Pointer events will be handled by EditMode component
  };

  /**
   * Handle pointer up event
   * Requirements: 2.4
   */
  onPointerUp = () => {
    // Pointer events are now handled by useEditModeClick hook
  };

  /**
   * Check if shape can be resized
   */
  canResize = () => true;

  /**
   * Check if shape can be rotated
   */
  canRotate = () => false; // Disable rotation for HTML shapes

  /**
   * Check if shape can be bound to other shapes
   */
  canBind = () => false;

  /**
   * Check if shape can be culled when off-screen
   * Feature: shape-auto-resize - Requirements 5.1, 5.2
   *
   * Returns false to prevent tldraw from culling off-screen shapes.
   * This ensures shapes continue to be measured even when not visible,
   * allowing the auto-resize mechanism to work correctly.
   */
  canCull = () => false;

}
