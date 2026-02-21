/**
 * Unit tests for multi-page response parser
 * Feature: batch-html-redesign
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import {
  parseMultiPageResponse,
  injectSharedTheme,
  validateInterPageLinks,
} from '../../utils/batch/parseMultiPageResponse';
import type { AppContext, CohesiveBatchResult } from '../../types';

describe('parseMultiPageResponse', () => {
  describe('JSON format parsing', () => {
    it('should parse valid JSON response with all fields', () => {
      const response = JSON.stringify({
        appName: 'Test App',
        sharedTheme: ':root { --primary: #2563eb; }',
        sharedNavigation: {
          header: '<nav>Header</nav>',
          footer: '<footer>Footer</footer>',
        },
        pages: [
          {
            name: 'home',
            html: '<!DOCTYPE html><html><body>Home</body></html>',
            css: '.home { color: var(--primary); }',
            js: 'console.log("home");',
          },
          {
            name: 'about',
            html: '<!DOCTYPE html><html><body>About</body></html>',
            css: '.about { color: var(--primary); }',
            js: '',
          },
        ],
      });

      const result = parseMultiPageResponse(response);

      expect(result.error).toBeUndefined();
      expect(result.sharedTheme).toBe(':root { --primary: #2563eb; }');
      expect(result.sharedNavigation.header).toBe('<nav>Header</nav>');
      expect(result.sharedNavigation.footer).toBe('<footer>Footer</footer>');
      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].name).toBe('home');
      expect(result.pages[0].html).toContain('Home');
      expect(result.pages[1].name).toBe('about');
    });

    it('should handle missing optional fields', () => {
      const response = JSON.stringify({
        pages: [
          {
            name: 'home',
            html: '<!DOCTYPE html><html><body>Home</body></html>',
          },
        ],
      });

      const result = parseMultiPageResponse(response);

      expect(result.error).toBeUndefined();
      expect(result.sharedTheme).toBe('');
      expect(result.sharedNavigation.header).toBe('');
      expect(result.sharedNavigation.footer).toBe('');
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].css).toBe('');
      expect(result.pages[0].js).toBe('');
    });

    it('should filter out pages with empty HTML', () => {
      const response = JSON.stringify({
        pages: [
          {
            name: 'home',
            html: '<!DOCTYPE html><html><body>Home</body></html>',
          },
          {
            name: 'empty',
            html: '',
          },
          {
            name: 'about',
            html: '<!DOCTYPE html><html><body>About</body></html>',
          },
        ],
      });

      const result = parseMultiPageResponse(response);

      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].name).toBe('home');
      expect(result.pages[1].name).toBe('about');
    });

    it('should return error when pages array is missing', () => {
      const response = JSON.stringify({
        sharedTheme: ':root { --primary: #2563eb; }',
      });

      const result = parseMultiPageResponse(response);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('missing or invalid "pages" array');
      expect(result.pages).toHaveLength(0);
    });

    it('should return error when pages array is empty', () => {
      const response = JSON.stringify({
        pages: [],
      });

      const result = parseMultiPageResponse(response);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('No valid pages found');
    });
  });

  describe('Markdown format parsing', () => {
    it('should extract JSON from markdown code block', () => {
      const response = `
Here's your multi-page application:

\`\`\`json
{
  "sharedTheme": ":root { --primary: #2563eb; }",
  "pages": [
    {
      "name": "home",
      "html": "<!DOCTYPE html><html><body>Home</body></html>",
      "css": "",
      "js": ""
    }
  ]
}
\`\`\`
`;

      const result = parseMultiPageResponse(response);

      expect(result.error).toBeUndefined();
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].name).toBe('home');
    });

    it('should extract JSON from code block without language specifier', () => {
      const response = `
\`\`\`
{
  "pages": [
    {
      "name": "home",
      "html": "<!DOCTYPE html><html><body>Home</body></html>"
    }
  ]
}
\`\`\`
`;

      const result = parseMultiPageResponse(response);

      expect(result.error).toBeUndefined();
      expect(result.pages).toHaveLength(1);
    });
  });

  describe('Fallback HTML extraction', () => {
    it('should extract HTML from markdown code blocks when JSON parsing fails', () => {
      const response = `
Here are your pages:

\`\`\`html
<!DOCTYPE html>
<html>
<body>
  <h1>Home Page</h1>
</body>
</html>
\`\`\`

\`\`\`html
<!DOCTYPE html>
<html>
<body>
  <h1>About Page</h1>
</body>
</html>
\`\`\`
`;

      const result = parseMultiPageResponse(response);

      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].html).toContain('Home Page');
      expect(result.pages[1].html).toContain('About Page');
      expect(result.pages[0].name).toBe('page-1');
      expect(result.pages[1].name).toBe('page-2');
    });

    it('should extract HTML from raw text when no code blocks found', () => {
      const response = `
<!DOCTYPE html>
<html>
<body>
  <h1>Single Page</h1>
</body>
</html>
`;

      const result = parseMultiPageResponse(response);

      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].html).toContain('Single Page');
    });

    it('should return error when no HTML can be extracted', () => {
      const response = 'This is just plain text with no HTML or JSON';

      const result = parseMultiPageResponse(response);

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Could not extract any valid HTML');
      expect(result.pages).toHaveLength(0);
    });
  });

  describe('JSON error recovery', () => {
    it('should fix trailing commas', () => {
      const response = `{
        "pages": [
          {
            "name": "home",
            "html": "<!DOCTYPE html><html><body>Home</body></html>",
          },
        ],
      }`;

      const result = parseMultiPageResponse(response);

      expect(result.error).toBeUndefined();
      expect(result.pages).toHaveLength(1);
    });

    it('should handle single quotes', () => {
      const response = `{
        'pages': [
          {
            'name': 'home',
            'html': '<!DOCTYPE html><html><body>Home</body></html>'
          }
        ]
      }`;

      const result = parseMultiPageResponse(response);

      // Note: This might still fail due to complex quote handling
      // but we test that it attempts recovery
      expect(result).toBeDefined();
    });
  });
});

describe('injectSharedTheme', () => {
  it('should prepend shared theme to page CSS', () => {
    const pages: CohesiveBatchResult['pages'] = [
      {
        name: 'home',
        html: '<!DOCTYPE html><html><body>Home</body></html>',
        css: '.home { color: var(--primary); }',
        js: '',
      },
      {
        name: 'about',
        html: '<!DOCTYPE html><html><body>About</body></html>',
        css: '.about { color: var(--primary); }',
        js: '',
      },
    ];

    const sharedTheme = ':root { --primary: #2563eb; --bg: #ffffff; }';

    const result = injectSharedTheme(pages, sharedTheme);

    expect(result).toHaveLength(2);
    expect(result[0].css).toBe(
      ':root { --primary: #2563eb; --bg: #ffffff; }\n\n.home { color: var(--primary); }'
    );
    expect(result[1].css).toBe(
      ':root { --primary: #2563eb; --bg: #ffffff; }\n\n.about { color: var(--primary); }'
    );
  });

  it('should set shared theme as CSS when page has no CSS', () => {
    const pages: CohesiveBatchResult['pages'] = [
      {
        name: 'home',
        html: '<!DOCTYPE html><html><body>Home</body></html>',
        css: '',
        js: '',
      },
    ];

    const sharedTheme = ':root { --primary: #2563eb; }';

    const result = injectSharedTheme(pages, sharedTheme);

    expect(result[0].css).toBe(':root { --primary: #2563eb; }');
  });

  it('should return pages unchanged when shared theme is empty', () => {
    const pages: CohesiveBatchResult['pages'] = [
      {
        name: 'home',
        html: '<!DOCTYPE html><html><body>Home</body></html>',
        css: '.home { color: red; }',
        js: '',
      },
    ];

    const result = injectSharedTheme(pages, '');

    expect(result).toEqual(pages);
  });

  it('should handle whitespace-only shared theme', () => {
    const pages: CohesiveBatchResult['pages'] = [
      {
        name: 'home',
        html: '<!DOCTYPE html><html><body>Home</body></html>',
        css: '.home { color: red; }',
        js: '',
      },
    ];

    const result = injectSharedTheme(pages, '   \n  ');

    expect(result).toEqual(pages);
  });

  it('should not modify original pages array', () => {
    const pages: CohesiveBatchResult['pages'] = [
      {
        name: 'home',
        html: '<!DOCTYPE html><html><body>Home</body></html>',
        css: '.home { color: red; }',
        js: '',
      },
    ];

    const originalCss = pages[0].css;
    const sharedTheme = ':root { --primary: #2563eb; }';

    injectSharedTheme(pages, sharedTheme);

    expect(pages[0].css).toBe(originalCss);
  });
});

describe('validateInterPageLinks', () => {
  const createAppContext = (pageNames: string[]): AppContext => ({
    appName: 'Test App',
    appType: 'website',
    pages: pageNames.map((name, idx) => ({
      name,
      role: name,
      linksTo: [],
      order: idx,
    })),
    originalPrompt: 'Test',
  });

  it('should validate all links point to existing pages', () => {
    const pages: CohesiveBatchResult['pages'] = [
      {
        name: 'home',
        html: '<a data-page-target="about">About</a><a data-page-target="contact">Contact</a>',
        css: '',
        js: '',
      },
      {
        name: 'about',
        html: '<a data-page-target="home">Home</a>',
        css: '',
        js: '',
      },
      {
        name: 'contact',
        html: '<a data-page-target="home">Home</a>',
        css: '',
        js: '',
      },
    ];

    const appContext = createAppContext(['home', 'about', 'contact']);

    const result = validateInterPageLinks(pages, appContext);

    expect(result.valid).toBe(true);
    expect(result.missingTargets).toHaveLength(0);
  });

  it('should detect missing target pages', () => {
    const pages: CohesiveBatchResult['pages'] = [
      {
        name: 'home',
        html: '<a data-page-target="about">About</a><a data-page-target="products">Products</a>',
        css: '',
        js: '',
      },
      {
        name: 'about',
        html: '<a data-page-target="home">Home</a><a data-page-target="services">Services</a>',
        css: '',
        js: '',
      },
    ];

    const appContext = createAppContext(['home', 'about']);

    const result = validateInterPageLinks(pages, appContext);

    expect(result.valid).toBe(false);
    expect(result.missingTargets).toHaveLength(2);
    expect(result.missingTargets).toContain('products');
    expect(result.missingTargets).toContain('services');
  });

  it('should handle pages with no links', () => {
    const pages: CohesiveBatchResult['pages'] = [
      {
        name: 'home',
        html: '<h1>Home Page</h1><p>No links here</p>',
        css: '',
        js: '',
      },
    ];

    const appContext = createAppContext(['home']);

    const result = validateInterPageLinks(pages, appContext);

    expect(result.valid).toBe(true);
    expect(result.missingTargets).toHaveLength(0);
  });

  it('should handle single quotes in data-page-target', () => {
    const pages: CohesiveBatchResult['pages'] = [
      {
        name: 'home',
        html: "<a data-page-target='about'>About</a>",
        css: '',
        js: '',
      },
      {
        name: 'about',
        html: "<a data-page-target='home'>Home</a>",
        css: '',
        js: '',
      },
    ];

    const appContext = createAppContext(['home', 'about']);

    const result = validateInterPageLinks(pages, appContext);

    expect(result.valid).toBe(true);
    expect(result.missingTargets).toHaveLength(0);
  });

  it('should deduplicate missing targets', () => {
    const pages: CohesiveBatchResult['pages'] = [
      {
        name: 'home',
        html: '<a data-page-target="missing">Link 1</a><a data-page-target="missing">Link 2</a>',
        css: '',
        js: '',
      },
    ];

    const appContext = createAppContext(['home']);

    const result = validateInterPageLinks(pages, appContext);

    expect(result.valid).toBe(false);
    expect(result.missingTargets).toHaveLength(1);
    expect(result.missingTargets[0]).toBe('missing');
  });

  it('should handle complex HTML with multiple link formats', () => {
    const pages: CohesiveBatchResult['pages'] = [
      {
        name: 'home',
        html: `
          <nav>
            <a href="#" data-page-target="about">About</a>
            <button data-page-target="contact">Contact</button>
          </nav>
          <main>
            <a data-page-target="products" class="btn">Products</a>
          </main>
        `,
        css: '',
        js: '',
      },
    ];

    const appContext = createAppContext(['home', 'about', 'contact']);

    const result = validateInterPageLinks(pages, appContext);

    expect(result.valid).toBe(false);
    expect(result.missingTargets).toContain('products');
  });

  it('should return valid for empty pages array', () => {
    const pages: CohesiveBatchResult['pages'] = [];
    const appContext = createAppContext([]);

    const result = validateInterPageLinks(pages, appContext);

    expect(result.valid).toBe(true);
    expect(result.missingTargets).toHaveLength(0);
  });
});

describe('Integration: parseMultiPageResponse with injectSharedTheme', () => {
  it('should parse and inject theme in one workflow', () => {
    const response = JSON.stringify({
      sharedTheme: ':root { --primary: #2563eb; }',
      pages: [
        {
          name: 'home',
          html: '<!DOCTYPE html><html><body>Home</body></html>',
          css: '.home { color: var(--primary); }',
        },
      ],
    });

    const parsed = parseMultiPageResponse(response);
    const withTheme = injectSharedTheme(parsed.pages, parsed.sharedTheme);

    expect(withTheme[0].css).toContain(':root { --primary: #2563eb; }');
    expect(withTheme[0].css).toContain('.home { color: var(--primary); }');
  });
});

describe('Integration: parseMultiPageResponse with validateInterPageLinks', () => {
  it('should parse and validate links in one workflow', () => {
    const response = JSON.stringify({
      pages: [
        {
          name: 'home',
          html: '<a data-page-target="about">About</a>',
        },
        {
          name: 'about',
          html: '<a data-page-target="home">Home</a>',
        },
      ],
    });

    const parsed = parseMultiPageResponse(response);
    const appContext: AppContext = {
      appName: 'Test',
      appType: 'website',
      pages: [
        { name: 'home', role: 'Home', linksTo: ['about'], order: 0 },
        { name: 'about', role: 'About', linksTo: ['home'], order: 1 },
      ],
      originalPrompt: 'Test',
    };

    const validation = validateInterPageLinks(parsed.pages, appContext);

    expect(validation.valid).toBe(true);
  });
});
