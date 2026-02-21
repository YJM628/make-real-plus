/**
 * placeholderHtml - Pure functions for generating placeholder and error HTML
 * Feature: batch-generation-placeholder-shapes
 * Requirements: 2.1, 2.2, 2.3, 2.4, 4.2, 4.3
 * 
 * Generates HTML content for placeholder shapes during batch generation.
 * Placeholder shapes show a gray background with shimmer animation while pages are being generated.
 * Error shapes show a red border with error message when generation fails.
 */

/**
 * Generate placeholder HTML with shimmer loading animation
 * 
 * Creates a gray placeholder shape with:
 * - Gray background (#E5E7EB)
 * - Centered page name text
 * - Shimmer animation (1.5s cycle) flowing left to right
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * 
 * @param pageName - Name of the page being generated
 * @returns Complete HTML string with inline styles and animation
 * 
 * @example
 * ```typescript
 * const html = generatePlaceholderHtml('home');
 * // Returns HTML with gray background, "home" text, and shimmer effect
 * ```
 */
export function generatePlaceholderHtml(pageName: string): string {
  return `
<!DOCTYPE html>
<html style="height:100%;margin:0;padding:0;">
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  </style>
</head>
<body style="width:100%;height:100%;background:#E5E7EB;display:flex;
             align-items:center;justify-content:center;position:relative;
             overflow:hidden;font-family:system-ui,sans-serif;margin:0;padding:0;">
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;">
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;
                background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);
                animation:shimmer 1.5s infinite;"></div>
  </div>
  <span style="position:relative;z-index:1;color:#6B7280;font-size:18px;
               font-weight:500;">${escapeHtml(pageName)}</span>
</body>
</html>
  `.trim();
}

/**
 * Generate error state HTML for failed page generation
 * 
 * Creates an error placeholder shape with:
 * - Light red background (#FEF2F2)
 * - Red border (#EF4444)
 * - Page name and error message
 * - No shimmer animation
 * 
 * Requirements: 4.2, 4.3
 * 
 * @param pageName - Name of the page that failed
 * @param errorMessage - Error message to display
 * @returns Complete HTML string with error styling
 * 
 * @example
 * ```typescript
 * const html = generateErrorHtml('home', 'Network timeout');
 * // Returns HTML with red border and error message
 * ```
 */
export function generateErrorHtml(pageName: string, errorMessage: string): string {
  return `
<!DOCTYPE html>
<html style="height:100%;margin:0;padding:0;">
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
  </style>
</head>
<body style="width:100%;height:100%;background:#FEF2F2;display:flex;
             flex-direction:column;align-items:center;justify-content:center;
             border:2px solid #EF4444;font-family:system-ui,sans-serif;margin:0;padding:0;">
  <span style="color:#EF4444;font-size:18px;font-weight:500;">${escapeHtml(pageName)}</span>
  <span style="color:#DC2626;font-size:14px;margin-top:8px;">生成失败: ${escapeHtml(errorMessage)}</span>
</body>
</html>
  `.trim();
}

/**
 * Escape HTML special characters to prevent XSS
 * @private
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
