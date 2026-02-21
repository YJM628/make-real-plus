/**
 * Height Reporter Script for iframe content measurement
 * 
 * This script is injected into iframe srcdoc to measure the actual content height
 * and report it to the parent window via postMessage.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

/**
 * Generates a self-executing JavaScript script that measures iframe content height
 * and reports it to the parent window.
 * 
 * The script:
 * - Measures document.body.scrollHeight
 * - Sends height via postMessage with type 'content-height'
 * - Re-measures on DOM mutations (MutationObserver)
 * - Re-measures on element resize (ResizeObserver)
 * - Re-measures on resource load (load event)
 * 
 * @returns A self-executing JavaScript string to be injected into iframe srcdoc
 */
export function getHeightReporterScript(): string {
  return `
    (function() {
      function reportHeight() {
        var height = document.body.scrollHeight;
        console.log('[HeightReporter] Measuring height:', height);
        if (height > 0) {
          console.log('[HeightReporter] Sending postMessage:', { type: 'content-height', height: height });
          window.parent.postMessage({ type: 'content-height', height: height }, '*');
        }
      }

      // Initial measurement
      console.log('[HeightReporter] Script loaded, starting initial measurement');
      reportHeight();

      // Re-measure on DOM changes (content updates, dynamic elements)
      var observer = new MutationObserver(function() {
        console.log('[HeightReporter] DOM mutation detected');
        reportHeight();
      });
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });

      // Re-measure after all resources (images, etc.) have loaded
      window.addEventListener('load', function() {
        console.log('[HeightReporter] Window load event');
        reportHeight();
      });

      // Re-measure on body size changes (ResizeObserver for modern browsers)
      if (typeof ResizeObserver !== 'undefined') {
        var resizeObserver = new ResizeObserver(function() {
          console.log('[HeightReporter] ResizeObserver triggered');
          reportHeight();
        });
        resizeObserver.observe(document.body);
      }
    })();
  `;
}
