/**
 * Tailwind CSS Design System Adapter
 * Feature: ai-html-visual-editor
 * Requirements: 1.5, 1.7, 13.3, 13.4
 */

import {
  BaseDesignSystemAdapter,
  type ComponentSyntax,
  type DesignSystemConfig,
} from './DesignSystemAdapter';

/**
 * Tailwind CSS Design System Adapter
 * 
 * Provides Tailwind CSS utility class conventions and patterns
 * for AI-generated code.
 */
export class TailwindAdapter extends BaseDesignSystemAdapter {
  /**
   * Get Tailwind CSS configuration
   */
  getConfig(): DesignSystemConfig {
    return {
      name: 'Tailwind CSS',
      version: '3.x',
      packages: ['tailwindcss'],
      stylesheets: [
        'https://cdn.tailwindcss.com',
      ],
      setup: `
// Tailwind CSS uses utility classes
// Include Tailwind CSS via CDN or build process
// Configure tailwind.config.js for customization
      `.trim(),
    };
  }

  /**
   * Get Tailwind CSS component patterns
   */
  getComponentSyntax(): ComponentSyntax[] {
    return [
      {
        name: 'Button',
        example: '<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Click Me</button>',
        props: ['class'],
      },
      {
        name: 'Input',
        example: '<input type="text" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Enter text" />',
        props: ['class', 'type', 'placeholder'],
      },
      {
        name: 'Card',
        example: `<div class="max-w-sm rounded overflow-hidden shadow-lg">
  <div class="px-6 py-4">
    <div class="font-bold text-xl mb-2">Card Title</div>
    <p class="text-gray-700 text-base">Card content goes here</p>
  </div>
</div>`,
        props: ['class'],
      },
      {
        name: 'Form',
        example: `<form class="w-full max-w-sm">
  <div class="mb-4">
    <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
      Username
    </label>
    <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="username" type="text" placeholder="Username">
  </div>
  <div class="flex items-center justify-between">
    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
      Sign In
    </button>
  </div>
</form>`,
        props: ['class'],
      },
      {
        name: 'Navigation',
        example: `<nav class="bg-gray-800">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center">
        <a href="#" class="text-white font-bold text-xl">Logo</a>
      </div>
      <div class="flex space-x-4">
        <a href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Home</a>
        <a href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">About</a>
      </div>
    </div>
  </div>
</nav>`,
        props: ['class'],
      },
      {
        name: 'Grid',
        example: `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="bg-white p-4 rounded shadow">Item 1</div>
  <div class="bg-white p-4 rounded shadow">Item 2</div>
  <div class="bg-white p-4 rounded shadow">Item 3</div>
</div>`,
        props: ['class'],
      },
      {
        name: 'Modal',
        example: `<div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
  <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
    <div class="mt-3 text-center">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Modal Title</h3>
      <div class="mt-2 px-7 py-3">
        <p class="text-sm text-gray-500">Modal content goes here</p>
      </div>
      <div class="items-center px-4 py-3">
        <button class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700">
          OK
        </button>
      </div>
    </div>
  </div>
</div>`,
        props: ['class'],
      },
      {
        name: 'Alert',
        example: '<div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert"><p class="font-bold">Info</p><p>This is an informational message.</p></div>',
        props: ['class', 'role'],
      },
    ];
  }

  /**
   * Generate AI prompt instructions for Tailwind CSS
   */
  getPromptInstructions(): string {
    return `
Use Tailwind CSS utility classes for styling. Follow these guidelines:

1. **Utility-First Approach**:
   - Use utility classes directly in HTML
   - Combine multiple utilities for complex styles
   - Example: class="bg-blue-500 text-white p-4 rounded-lg shadow-md"

2. **Color System**:
   - Colors: gray, red, yellow, green, blue, indigo, purple, pink
   - Shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900
   - Example: bg-blue-500, text-gray-700, border-red-300

3. **Spacing**:
   - Padding: p-{size}, px-{size}, py-{size}, pt-{size}, pr-{size}, pb-{size}, pl-{size}
   - Margin: m-{size}, mx-{size}, my-{size}, mt-{size}, mr-{size}, mb-{size}, ml-{size}
   - Sizes: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64
   - Example: p-4 (padding: 1rem), mx-auto (margin: 0 auto)

4. **Layout**:
   - Flexbox: flex, flex-row, flex-col, justify-center, items-center, space-x-4
   - Grid: grid, grid-cols-{n}, gap-{size}
   - Container: container, max-w-{size}
   - Example: <div class="flex justify-between items-center">

5. **Responsive Design**:
   - Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
   - Prefix utilities with breakpoint: md:flex, lg:grid-cols-3
   - Mobile-first approach: base styles apply to all, then override with breakpoints
   - Example: class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

6. **Typography**:
   - Font size: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl, text-4xl
   - Font weight: font-thin, font-normal, font-medium, font-semibold, font-bold
   - Text alignment: text-left, text-center, text-right
   - Example: class="text-2xl font-bold text-gray-900"

7. **Borders & Shadows**:
   - Border: border, border-{size}, border-{color}, rounded, rounded-{size}
   - Shadow: shadow-sm, shadow, shadow-md, shadow-lg, shadow-xl
   - Example: class="border border-gray-300 rounded-lg shadow-md"

8. **Interactive States**:
   - Hover: hover:bg-blue-700, hover:text-white
   - Focus: focus:outline-none, focus:ring-2, focus:ring-blue-500
   - Active: active:bg-blue-800
   - Example: class="bg-blue-500 hover:bg-blue-700 focus:ring-2"

9. **Common Patterns**:
   - Button: bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded
   - Input: shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none
   - Card: max-w-sm rounded overflow-hidden shadow-lg
   - Container: container mx-auto px-4

10. **Best Practices**:
    - Use semantic HTML elements
    - Add proper ARIA labels for accessibility
    - Use responsive utilities for mobile-first design
    - Combine utilities logically (layout → spacing → colors → typography)
    - Use max-w-* for content width constraints

Example structure:
\`\`\`html
<div class="container mx-auto px-4 py-8">
  <nav class="bg-gray-800 rounded-lg mb-8">
    <div class="flex items-center justify-between p-4">
      <h1 class="text-white text-xl font-bold">Logo</h1>
      <div class="flex space-x-4">
        <a href="#" class="text-gray-300 hover:text-white">Home</a>
        <a href="#" class="text-gray-300 hover:text-white">About</a>
      </div>
    </div>
  </nav>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Card Title</h2>
        <p class="text-gray-700">Card content goes here</p>
      </div>
      <div class="bg-gray-50 px-6 py-4">
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Learn More
        </button>
      </div>
    </div>
  </div>
</div>
\`\`\`

Generate clean, production-ready HTML with Tailwind CSS utility classes following these conventions.
    `.trim();
  }

  /**
   * Validate Tailwind CSS syntax
   */
  validateSyntax(html: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const result = super.validateSyntax(html);

    // Check for Tailwind utility classes
    const classes = this.extractClasses(html);
    const tailwindPatterns = [
      /^(bg|text|border|p|m|w|h|flex|grid|rounded|shadow)-/,
      /^(hover|focus|active):/,
      /^(sm|md|lg|xl|2xl):/,
    ];

    let hasTailwindClasses = false;
    for (const className of classes) {
      for (const pattern of tailwindPatterns) {
        if (pattern.test(className)) {
          hasTailwindClasses = true;
          break;
        }
      }
      if (hasTailwindClasses) break;
    }

    if (!hasTailwindClasses && classes.length > 0) {
      result.warnings.push(
        'No Tailwind CSS utility classes detected. Consider using Tailwind utilities like bg-*, text-*, p-*, etc.'
      );
    }

    // Warn if no classes at all
    if (classes.length === 0 && html.trim().length > 0) {
      result.warnings.push(
        'No CSS classes found. Consider using Tailwind utility classes for styling.'
      );
    }

    // Check for inline styles (anti-pattern with Tailwind)
    if (html.includes('style=')) {
      result.warnings.push(
        'Inline styles detected. Consider using Tailwind utility classes instead.'
      );
    }

    // Check for custom CSS classes without Tailwind utilities
    const customClasses = classes.filter(
      (c) => !tailwindPatterns.some((p) => p.test(c))
    );
    if (customClasses.length > 5) {
      result.warnings.push(
        `Many custom CSS classes detected (${customClasses.length}). Consider using Tailwind utilities for better consistency.`
      );
    }

    return result;
  }

  /**
   * Get required imports for Tailwind CSS
   */
  getRequiredImports(html: string): {
    imports: string[];
    cdnLinks: string[];
  } {
    const config = this.getConfig();
    return {
      imports: [],
      cdnLinks: config.stylesheets || [],
    };
  }
}
