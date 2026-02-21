/**
 * PreviewMode Component
 * 
 * Renders HTML content in an iframe for full CSS/JS execution and user interaction.
 * Supports:
 * - Full HTML/CSS/JS rendering with srcdoc
 * - Applying overrides before rendering
 * - iframe communication via postMessage
 * - Preserving page state (form inputs, scroll position)
 * - Complete user interaction (button clicks, form inputs, event triggers)
 * - Auto-resize based on iframe content height (shape-auto-resize feature)
 * 
 * Requirements: 4.4, 4.5, 4.9, 4.1, 6.1, 6.2
 */

import * as React from 'react';
import { useEditor, type TLShapeId } from 'tldraw';
import type { ElementOverride } from '../../types';
import { DiffEngine } from '../../core/diff/DiffEngine';
import { useShapeAutoResize } from '../../core/shape/useShapeAutoResize';
import { getHeightReporterScript } from '../../core/shape/heightReporterScript';
import { ShapeSizes } from '../../core/shape/shapeSizes';

export interface PreviewModeProps {
  html: string;
  css: string;
  js: string;
  overrides: ElementOverride[];
  width?: number;
  height?: number;
  shapeId: TLShapeId; // Required for auto-resize feature
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const PreviewMode: React.FC<PreviewModeProps> = ({
  html,
  css,
  js,
  overrides,
  width = 800,
  height = 600,
  shapeId,
  onLoad,
  onError,
}) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const diffEngine = React.useRef(new DiffEngine()).current;
  const editor = useEditor();

  // Setup auto-resize hook to listen for content height messages
  // Requirement 4.1: Receive and process content-height messages
  useShapeAutoResize(shapeId, iframeRef);

  // Read measured height from ShapeSizes store
  // Requirement 6.1: Update iframe height to match measured content height
  const measuredHeight = ShapeSizes.get(editor).get(shapeId)?.height;
  const effectiveHeight = measuredHeight ?? height;

  // Apply overrides to HTML before rendering
  const modifiedHtml = React.useMemo(() => {
    try {
      return diffEngine.applyOverrides(html, overrides);
    } catch (error) {
      console.error('Failed to apply overrides:', error);
      onError?.(error as Error);
      return html;
    }
  }, [html, overrides, diffEngine, onError]);

  // Generate complete HTML document with CSS and JS
  // Requirement 6.2: Inject height reporter script for content measurement
  const srcdocContent = React.useMemo(() => {
    const heightScript = '<script>' + getHeightReporterScript() + '<\/script>';

    // Comprehensive navigation block script — intercepts all forms of navigation:
    // link clicks, form submissions, window.location, window.open
    // Only allows data-page-target links (inter-page navigation) and anchor links (#)
    const navBlock = [
      '<script>',
      '(function() {',
      '  document.addEventListener("click", function(e) {',
      '    var link = e.target.closest ? e.target.closest("a") : null;',
      '    if (!link) return;',
      '    if (link.hasAttribute("data-page-target")) return;',
      '    var href = link.getAttribute("href");',
      '    if (!href || href === "#") return;',
      '    if (href.charAt(0) === "#") return;',
      '    if (href.indexOf("javascript:") === 0) return;',
      '    e.preventDefault();',
      '    e.stopPropagation();',
      '    e.stopImmediatePropagation();',
      '  }, true);',
      '  document.addEventListener("submit", function(e) {',
      '    var form = e.target;',
      '    var action = form && form.getAttribute ? form.getAttribute("action") : null;',
      '    if (!action || action === "#" || action.charAt(0) === "#") return;',
      '    e.preventDefault();',
      '  }, true);',
      '  window.open = function() { return null; };',
      '  try {',
      '    var loc = window.location;',
      '    Object.defineProperty(window, "location", {',
      '      get: function() { return loc; },',
      '      set: function() {},',
      '      configurable: false',
      '    });',
      '  } catch(ex) {}',
      '  if (window.location.assign) window.location.assign = function() {};',
      '  if (window.location.replace) window.location.replace = function() {};',
      '})();',
      '<\/script>',
    ].join('\n');

    const extraScripts = navBlock + '\n' + heightScript;

    // Head-level tags: CSP to block navigation + base target to catch anything that slips through
    const cspMeta = '<meta http-equiv="Content-Security-Policy" content="navigate-to \'none\';">';
    const baseMeta = '<base target="_blank">';
    const headInjection = cspMeta + '\n' + baseMeta;

    // Check if AI-generated HTML is a full document (contains <html or <!DOCTYPE)
    const isFullDocument = /<!DOCTYPE|<html[\s>]/i.test(modifiedHtml);

    if (isFullDocument) {
      // AI returned a full HTML document — inject our scripts and head tags
      let doc = modifiedHtml;

      // Inject head-level tags (CSP + base) and optional CSS into <head>
      const headTags = css.trim()
        ? headInjection + '\n<style>' + css + '</style>'
        : headInjection;

      if (doc.includes('</head>')) {
        doc = doc.replace('</head>', headTags + '\n</head>');
      } else if (doc.includes('<body')) {
        doc = doc.replace(/<body/i, headTags + '\n<body');
      } else if (/<html[^>]*>/i.test(doc)) {
        doc = doc.replace(/<html[^>]*>/i, function(match) {
          return match + '\n<head>' + headTags + '</head>';
        });
      }

      // Inject navigation block script FIRST, then height reporter, then optional extra JS
      const jsTag = js.trim() ? '<script>' + js + '<\/script>' : '';
      const scripts = jsTag ? extraScripts + '\n' + jsTag : extraScripts;

      if (doc.includes('</body>')) {
        doc = doc.replace('</body>', scripts + '\n</body>');
      } else if (doc.includes('</html>')) {
        doc = doc.replace('</html>', scripts + '\n</html>');
      } else {
        doc += scripts;
      }

      return doc;
    }

    // AI returned a fragment — wrap it in a full document
    return [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  ' + headInjection,
      '  <style>' + css + '</style>',
      '</head>',
      '<body>',
      '  ' + modifiedHtml,
      '  ' + extraScripts,
      '  <script>' + js + '<\/script>',
      '</body>',
      '</html>',
    ].join('\n');
  }, [modifiedHtml, css, js]);

  // Handle iframe load event
  React.useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    iframe.addEventListener('load', handleLoad);

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [onLoad, onError]);

  // Setup postMessage communication
  React.useEffect(() => {
    if (!isLoaded || !iframeRef.current) return;

    const handleMessage = (event: MessageEvent) => {
      // Handle messages from iframe
      if (event.source !== iframeRef.current?.contentWindow) return;

      const { type, data } = event.data;

      switch (type) {
        case 'state-update':
          console.log('State update from iframe:', data);
          break;
        case 'error':
          console.error('Error from iframe:', data);
          onError?.(new Error(data.message));
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isLoaded, onError]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <iframe
        ref={iframeRef}
        srcDoc={srcdocContent}
        sandbox="allow-scripts allow-forms allow-modals"
        style={{
          width: `${width}px`,
          height: `${effectiveHeight}px`,
          border: 'none',
          display: 'block',
        }}
        title="HTML Preview"
      />
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            fontSize: '14px',
          }}
        >
          Loading preview...
        </div>
      )}
    </div>
  );
};
