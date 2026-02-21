/**
 * useShadowDom Hook
 * 
 * Manages Shadow DOM creation, content injection, and event delegation.
 * Uses event delegation pattern for better performance and dynamic content support.
 */

import * as React from 'react';

export interface UseShadowDomOptions {
  html: string;
  css: string;
  onElementClick?: (element: HTMLElement) => void;
  onElementMouseEnter?: (element: HTMLElement) => void;
  onElementMouseLeave?: (element: HTMLElement) => void;
}

export function useShadowDom(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseShadowDomOptions
): React.RefObject<ShadowRoot | null> {
  const { html, css, onElementClick, onElementMouseEnter, onElementMouseLeave } = options;
  const shadowRootRef = React.useRef<ShadowRoot | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) {
      console.log('[useShadowDom] No container ref');
      return;
    }

    console.log('[useShadowDom] Setting up Shadow DOM');

    // Create Shadow DOM if not exists
    if (!shadowRootRef.current) {
      shadowRootRef.current = containerRef.current.attachShadow({ mode: 'open' });
      console.log('[useShadowDom] Created Shadow DOM');
    }

    const shadowRoot = shadowRootRef.current;

    // Clear previous content
    shadowRoot.innerHTML = '';

    // Create style element
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      ${css}
      
      /* Edit mode specific styles */
      .edit-mode-highlight {
        outline: 2px solid #1890ff !important;
        outline-offset: 2px;
        cursor: move;
      }
      
      .edit-mode-selected {
        outline: 2px solid #1890ff !important;
        outline-offset: 2px;
      }
      
      /* Ensure root container allows pointer events */
      :host {
        pointer-events: auto !important;
      }
    `;
    shadowRoot.appendChild(styleElement);

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.style.width = '100%';
    contentContainer.style.height = '100%';
    contentContainer.style.pointerEvents = 'auto'; // Ensure clicks can reach child elements
    
    // Extract body content if HTML contains full document structure
    // AI often generates complete HTML documents with <html>, <head>, <body> tags
    // We need to extract just the body content for Shadow DOM
    // Use DOMParser to properly parse the HTML document
    if (html.trim().startsWith('<!DOCTYPE') || html.trim().startsWith('<html')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const bodyElement = doc.body;
      if (bodyElement) {
        contentContainer.innerHTML = bodyElement.innerHTML;
      } else {
        contentContainer.innerHTML = html;
      }
    } else {
      contentContainer.innerHTML = html;
    }
    
    shadowRoot.appendChild(contentContainer);

    // Event delegation: handle all events at container level
    const handleClick = (event: Event) => {
      console.log('[useShadowDom] Click event detected on:', event.target);
      const target = event.target as HTMLElement;
      if (target && target !== contentContainer) {
        event.stopPropagation();
        event.preventDefault();
        console.log('[useShadowDom] Calling onElementClick');
        onElementClick?.(target);
      }
    };

    const handleMouseEnter = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && target !== contentContainer) {
        onElementMouseEnter?.(target);
      }
    };

    const handleMouseLeave = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && target !== contentContainer) {
        onElementMouseLeave?.(target);
      }
    };

    // Use event delegation on container - use capture phase for better event handling
    contentContainer.addEventListener('click', handleClick, { capture: true });
    contentContainer.addEventListener('mouseenter', handleMouseEnter, { capture: true });
    contentContainer.addEventListener('mouseleave', handleMouseLeave, { capture: true });
    console.log('[useShadowDom] Event listeners attached to content container');

    // Cleanup
    return () => {
      contentContainer.removeEventListener('click', handleClick, { capture: true });
      contentContainer.removeEventListener('mouseenter', handleMouseEnter, { capture: true });
      contentContainer.removeEventListener('mouseleave', handleMouseLeave, { capture: true });
    };
  }, [html, css, onElementClick, onElementMouseEnter, onElementMouseLeave]);

  return shadowRootRef;
}
