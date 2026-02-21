/**
 * Unit tests for Design System Adapters
 * Feature: ai-html-visual-editor
 * Requirements: 1.5, 1.7, 13.1, 13.2, 13.3, 13.4, 13.5
 */

import {
  DesignSystemRegistry,
  getDesignSystemAdapter,
  getDesignSystemInstructions,
  validateDesignSystemSyntax,
  getRequiredImports,
  MaterialUIAdapter,
  AntDesignAdapter,
  TailwindAdapter,
} from '../../services/design-systems';

describe('DesignSystemRegistry', () => {
  it('should support vanilla, material-ui, ant-design, and tailwind', () => {
    const types = DesignSystemRegistry.getSupportedTypes();
    expect(types).toContain('vanilla');
    expect(types).toContain('material-ui');
    expect(types).toContain('ant-design');
    expect(types).toContain('tailwind');
  });

  it('should return null for vanilla design system', () => {
    const adapter = DesignSystemRegistry.getAdapter('vanilla');
    expect(adapter).toBeNull();
  });

  it('should return MaterialUIAdapter for material-ui', () => {
    const adapter = DesignSystemRegistry.getAdapter('material-ui');
    expect(adapter).toBeInstanceOf(MaterialUIAdapter);
  });

  it('should return AntDesignAdapter for ant-design', () => {
    const adapter = DesignSystemRegistry.getAdapter('ant-design');
    expect(adapter).toBeInstanceOf(AntDesignAdapter);
  });

  it('should return TailwindAdapter for tailwind', () => {
    const adapter = DesignSystemRegistry.getAdapter('tailwind');
    expect(adapter).toBeInstanceOf(TailwindAdapter);
  });

  it('should throw error for unsupported design system', () => {
    expect(() => {
      DesignSystemRegistry.getAdapter('unsupported' as any);
    }).toThrow('Unsupported design system: unsupported');
  });

  it('should allow registering custom adapters', () => {
    const customAdapter = new MaterialUIAdapter();
    DesignSystemRegistry.registerAdapter('custom', () => customAdapter);
    
    const adapter = DesignSystemRegistry.getAdapter('custom' as any);
    expect(adapter).toBe(customAdapter);
  });

  it('should check if design system is supported', () => {
    expect(DesignSystemRegistry.isSupported('vanilla')).toBe(true);
    expect(DesignSystemRegistry.isSupported('material-ui')).toBe(true);
    expect(DesignSystemRegistry.isSupported('unsupported')).toBe(false);
  });
});

describe('MaterialUIAdapter', () => {
  const adapter = new MaterialUIAdapter();

  it('should have correct configuration', () => {
    const config = adapter.getConfig();
    expect(config.name).toBe('Material UI');
    expect(config.version).toBe('5.x');
    expect(config.packages).toContain('@mui/material');
    expect(config.stylesheets).toContain('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap');
  });

  it('should provide component syntax examples', () => {
    const syntax = adapter.getComponentSyntax();
    expect(syntax.length).toBeGreaterThan(0);
    
    const button = syntax.find(s => s.name === 'Button');
    expect(button).toBeDefined();
    expect(button?.example).toContain('variant="contained"');
    expect(button?.props).toContain('variant');
  });

  it('should generate prompt instructions', () => {
    const instructions = adapter.getPromptInstructions();
    expect(instructions).toContain('Material UI');
    expect(instructions).toContain('Button');
    expect(instructions).toContain('variant');
    expect(instructions).toContain('@mui/material');
  });

  it('should validate MUI component syntax', () => {
    const validHtml = '<Button variant="contained">Click</Button>';
    const result = adapter.validateSyntax(validHtml);
    expect(result.valid).toBe(true);
  });

  it('should warn when no MUI components detected', () => {
    const plainHtml = '<div><button>Click</button></div>';
    const result = adapter.validateSyntax(plainHtml);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('No Material UI components detected');
  });

  it('should warn about using class instead of className', () => {
    const html = '<Button class="my-button">Click</Button>';
    const result = adapter.validateSyntax(html);
    expect(result.warnings.some(w => w.includes('className'))).toBe(true);
  });

  it('should detect required imports', () => {
    const html = '<Button variant="contained"><TextField label="Name" /></Button>';
    const { imports } = adapter.getRequiredImports(html);
    expect(imports.length).toBeGreaterThan(0);
    expect(imports[0]).toContain('Button');
    expect(imports[0]).toContain('TextField');
  });
});

describe('AntDesignAdapter', () => {
  const adapter = new AntDesignAdapter();

  it('should have correct configuration', () => {
    const config = adapter.getConfig();
    expect(config.name).toBe('Ant Design');
    expect(config.version).toBe('5.x');
    expect(config.packages).toContain('antd');
  });

  it('should provide component syntax examples', () => {
    const syntax = adapter.getComponentSyntax();
    expect(syntax.length).toBeGreaterThan(0);
    
    const button = syntax.find(s => s.name === 'Button');
    expect(button).toBeDefined();
    expect(button?.example).toContain('type="primary"');
  });

  it('should generate prompt instructions', () => {
    const instructions = adapter.getPromptInstructions();
    expect(instructions).toContain('Ant Design');
    expect(instructions).toContain('Button');
    expect(instructions).toContain('type');
    expect(instructions).toContain('antd');
  });

  it('should validate Ant Design component syntax', () => {
    const validHtml = '<Button type="primary">Click</Button>';
    const result = adapter.validateSyntax(validHtml);
    expect(result.valid).toBe(true);
  });

  it('should warn when Form lacks Form.Item', () => {
    const html = '<Form><Input /></Form>';
    const result = adapter.validateSyntax(html);
    expect(result.warnings.some(w => w.includes('Form.Item'))).toBe(true);
  });

  it('should warn when Table lacks dataSource', () => {
    const html = '<Table columns={columns} />';
    const result = adapter.validateSyntax(html);
    expect(result.warnings.some(w => w.includes('dataSource'))).toBe(true);
  });

  it('should detect required imports', () => {
    const html = '<Button type="primary"><Input placeholder="Name" /></Button>';
    const { imports } = adapter.getRequiredImports(html);
    expect(imports.length).toBeGreaterThan(0);
    expect(imports[0]).toContain('Button');
    expect(imports[0]).toContain('Input');
  });
});

describe('TailwindAdapter', () => {
  const adapter = new TailwindAdapter();

  it('should have correct configuration', () => {
    const config = adapter.getConfig();
    expect(config.name).toBe('Tailwind CSS');
    expect(config.version).toBe('3.x');
    expect(config.stylesheets).toContain('https://cdn.tailwindcss.com');
  });

  it('should provide component patterns', () => {
    const syntax = adapter.getComponentSyntax();
    expect(syntax.length).toBeGreaterThan(0);
    
    const button = syntax.find(s => s.name === 'Button');
    expect(button).toBeDefined();
    expect(button?.example).toContain('bg-blue-500');
    expect(button?.example).toContain('hover:bg-blue-700');
  });

  it('should generate prompt instructions', () => {
    const instructions = adapter.getPromptInstructions();
    expect(instructions).toContain('Tailwind CSS');
    expect(instructions).toContain('utility classes');
    expect(instructions).toContain('bg-');
    expect(instructions).toContain('text-');
  });

  it('should validate Tailwind utility classes', () => {
    const validHtml = '<button class="bg-blue-500 text-white p-4">Click</button>';
    const result = adapter.validateSyntax(validHtml);
    expect(result.valid).toBe(true);
  });

  it('should warn when no Tailwind classes detected', () => {
    const plainHtml = '<div class="my-custom-class"><button>Click</button></div>';
    const result = adapter.validateSyntax(plainHtml);
    expect(result.warnings.some(w => w.includes('No Tailwind CSS utility classes'))).toBe(true);
  });

  it('should warn about inline styles', () => {
    const html = '<button style="background: blue;">Click</button>';
    const result = adapter.validateSyntax(html);
    expect(result.warnings.some(w => w.includes('Inline styles'))).toBe(true);
  });

  it('should warn about many custom classes', () => {
    const html = '<div class="class1 class2 class3 class4 class5 class6 class7">Content</div>';
    const result = adapter.validateSyntax(html);
    expect(result.warnings.some(w => w.includes('custom CSS classes'))).toBe(true);
  });

  it('should return CDN links for imports', () => {
    const html = '<button class="bg-blue-500">Click</button>';
    const { cdnLinks } = adapter.getRequiredImports(html);
    expect(cdnLinks).toContain('https://cdn.tailwindcss.com');
  });
});

describe('Helper Functions', () => {
  it('getDesignSystemAdapter should return correct adapter', () => {
    expect(getDesignSystemAdapter('vanilla')).toBeNull();
    expect(getDesignSystemAdapter('material-ui')).toBeInstanceOf(MaterialUIAdapter);
    expect(getDesignSystemAdapter('ant-design')).toBeInstanceOf(AntDesignAdapter);
    expect(getDesignSystemAdapter('tailwind')).toBeInstanceOf(TailwindAdapter);
  });

  it('getDesignSystemInstructions should return instructions', () => {
    const instructions = getDesignSystemInstructions('material-ui');
    expect(instructions).toContain('Material UI');
    expect(instructions.length).toBeGreaterThan(0);
  });

  it('getDesignSystemInstructions should return empty string for vanilla', () => {
    const instructions = getDesignSystemInstructions('vanilla');
    expect(instructions).toBe('');
  });

  it('validateDesignSystemSyntax should validate HTML', () => {
    const html = '<Button variant="contained">Click</Button>';
    const result = validateDesignSystemSyntax(html, 'material-ui');
    expect(result.valid).toBe(true);
  });

  it('validateDesignSystemSyntax should handle vanilla HTML', () => {
    const html = '<div><button>Click</button></div>';
    const result = validateDesignSystemSyntax(html, 'vanilla');
    expect(result.valid).toBe(true);
  });

  it('validateDesignSystemSyntax should reject empty HTML', () => {
    const result = validateDesignSystemSyntax('', 'vanilla');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('HTML is empty');
  });

  it('getRequiredImports should return imports and CDN links', () => {
    const html = '<Button>Click</Button>';
    const { imports, cdnLinks } = getRequiredImports(html, 'material-ui');
    expect(imports.length).toBeGreaterThan(0);
    expect(cdnLinks.length).toBeGreaterThan(0);
  });

  it('getRequiredImports should return empty for vanilla', () => {
    const html = '<button>Click</button>';
    const { imports, cdnLinks } = getRequiredImports(html, 'vanilla');
    expect(imports).toEqual([]);
    expect(cdnLinks).toEqual([]);
  });
});

describe('Edge Cases', () => {
  it('should handle empty HTML', () => {
    const adapter = new MaterialUIAdapter();
    const result = adapter.validateSyntax('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('HTML is empty');
  });

  it('should handle HTML with only whitespace', () => {
    const adapter = new TailwindAdapter();
    const result = adapter.validateSyntax('   \n  \t  ');
    expect(result.valid).toBe(false);
  });

  it('should handle HTML without any classes', () => {
    const adapter = new TailwindAdapter();
    const html = '<div><button>Click</button></div>';
    const result = adapter.validateSyntax(html);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should handle complex nested HTML', () => {
    const adapter = new MaterialUIAdapter();
    const html = `
      <div>
        <Card>
          <CardContent>
            <Typography variant="h5">Title</Typography>
            <Button variant="contained">Click</Button>
          </CardContent>
        </Card>
      </div>
    `;
    const result = adapter.validateSyntax(html);
    expect(result.valid).toBe(true);
  });

  it('should handle HTML with mixed design systems', () => {
    const adapter = new TailwindAdapter();
    const html = '<Button class="bg-blue-500">Click</Button>';
    const result = adapter.validateSyntax(html);
    expect(result.valid).toBe(true);
  });
});
