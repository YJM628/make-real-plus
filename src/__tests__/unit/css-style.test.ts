/**
 * Unit Tests for CSS Style Utilities
 * Feature: ai-html-visual-editor
 * 
 * Tests for style parsing, manipulation, and application functions.
 * 
 * Requirements: 6.2, 6.4, 6.7
 */

import {
  parseCssString,
  styleToCssString,
  mergeStyles,
  getComputedStyles,
  applyStyles,
  getPositioningType,
  adjustPositioningForDrag,
} from '../../utils/css/style';

describe('parseCssString', () => {
  it('should parse simple CSS string', () => {
    const css = 'color: red; font-size: 16px;';
    const result = parseCssString(css);
    
    expect(result).toEqual({
      color: 'red',
      fontSize: '16px',
    });
  });

  it('should handle CSS without trailing semicolon', () => {
    const css = 'color: blue; margin: 10px';
    const result = parseCssString(css);
    
    expect(result).toEqual({
      color: 'blue',
      margin: '10px',
    });
  });

  it('should handle empty string', () => {
    const result = parseCssString('');
    expect(result).toEqual({});
  });

  it('should handle whitespace', () => {
    const css = '  color : red ;  font-size : 16px  ';
    const result = parseCssString(css);
    
    expect(result).toEqual({
      color: 'red',
      fontSize: '16px',
    });
  });

  it('should skip invalid declarations', () => {
    const css = 'color: red; invalid; font-size: 16px;';
    const result = parseCssString(css);
    
    expect(result).toEqual({
      color: 'red',
      fontSize: '16px',
    });
  });

  it('should handle complex property values', () => {
    const css = 'background: url("image.png") no-repeat center; transform: translate(10px, 20px);';
    const result = parseCssString(css);
    
    expect(result).toEqual({
      background: 'url("image.png") no-repeat center',
      transform: 'translate(10px, 20px)',
    });
  });

  it('should convert kebab-case to camelCase', () => {
    const css = 'background-color: blue; border-top-width: 2px;';
    const result = parseCssString(css);
    
    expect(result).toEqual({
      backgroundColor: 'blue',
      borderTopWidth: '2px',
    });
  });

  it('should handle null or undefined input', () => {
    expect(parseCssString(null as any)).toEqual({});
    expect(parseCssString(undefined as any)).toEqual({});
  });
});

describe('styleToCssString', () => {
  it('should convert style object to CSS string', () => {
    const styles = {
      color: 'red',
      fontSize: '16px',
    };
    const result = styleToCssString(styles);
    
    expect(result).toBe('color: red; font-size: 16px;');
  });

  it('should handle empty object', () => {
    const result = styleToCssString({});
    expect(result).toBe('');
  });

  it('should skip undefined, null, and empty values', () => {
    const styles = {
      color: 'red',
      fontSize: undefined as any,
      margin: null as any,
      padding: '',
    };
    const result = styleToCssString(styles);
    
    expect(result).toBe('color: red;');
  });

  it('should convert camelCase to kebab-case', () => {
    const styles = {
      backgroundColor: 'blue',
      borderTopWidth: '2px',
    };
    const result = styleToCssString(styles);
    
    expect(result).toBe('background-color: blue; border-top-width: 2px;');
  });

  it('should handle complex property values', () => {
    const styles = {
      background: 'url("image.png") no-repeat center',
      transform: 'translate(10px, 20px)',
    };
    const result = styleToCssString(styles);
    
    expect(result).toBe('background: url("image.png") no-repeat center; transform: translate(10px, 20px);');
  });

  it('should handle null or undefined input', () => {
    expect(styleToCssString(null as any)).toBe('');
    expect(styleToCssString(undefined as any)).toBe('');
  });
});

describe('mergeStyles', () => {
  it('should merge multiple style objects', () => {
    const styles1 = { color: 'red', fontSize: '16px' };
    const styles2 = { color: 'blue', margin: '10px' };
    const result = mergeStyles(styles1, styles2);
    
    expect(result).toEqual({
      color: 'blue', // Later value overrides
      fontSize: '16px',
      margin: '10px',
    });
  });

  it('should handle empty objects', () => {
    const result = mergeStyles({}, {}, {});
    expect(result).toEqual({});
  });

  it('should handle single object', () => {
    const styles = { color: 'red' };
    const result = mergeStyles(styles);
    
    expect(result).toEqual({ color: 'red' });
  });

  it('should handle null or undefined inputs', () => {
    const styles = { color: 'red' };
    const result = mergeStyles(null as any, styles, undefined as any);
    
    expect(result).toEqual({ color: 'red' });
  });

  it('should be idempotent when merging same object', () => {
    const styles = { color: 'red', fontSize: '16px' };
    const result1 = mergeStyles(styles);
    const result2 = mergeStyles(result1);
    
    expect(result2).toEqual(result1);
  });

  it('should merge three or more objects', () => {
    const styles1 = { color: 'red' };
    const styles2 = { fontSize: '16px' };
    const styles3 = { margin: '10px' };
    const result = mergeStyles(styles1, styles2, styles3);
    
    expect(result).toEqual({
      color: 'red',
      fontSize: '16px',
      margin: '10px',
    });
  });
});

describe('getComputedStyles', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.top = '10px';
    element.style.left = '20px';
    element.style.width = '100px';
    element.style.height = '50px';
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('should extract computed styles', () => {
    const styles = getComputedStyles(element);
    
    expect(styles.position).toBe('absolute');
    expect(styles.top).toBe('10px');
    expect(styles.left).toBe('20px');
    expect(styles.width).toBe('100px');
    expect(styles.height).toBe('50px');
  });

  it('should extract specific properties when requested', () => {
    const styles = getComputedStyles(element, ['position', 'width']);
    
    expect(styles.position).toBe('absolute');
    expect(styles.width).toBe('100px');
    expect(Object.keys(styles).length).toBeLessThanOrEqual(2);
  });

  it('should handle camelCase property names', () => {
    element.style.backgroundColor = 'red';
    const styles = getComputedStyles(element, ['backgroundColor']);
    
    expect(styles.backgroundColor).toBeTruthy();
  });

  it('should skip auto and none values by default', () => {
    const staticElement = document.createElement('div');
    document.body.appendChild(staticElement);
    
    const styles = getComputedStyles(staticElement);
    
    // Auto and none values should be filtered out
    expect(styles.top).toBeUndefined();
    expect(styles.transform).toBeUndefined();
    
    document.body.removeChild(staticElement);
  });
});

describe('applyStyles', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.removeChild(element);
  });

  it('should apply styles to element', () => {
    const styles = {
      color: 'red',
      fontSize: '16px',
    };
    
    applyStyles(element, styles);
    
    expect(element.style.color).toBe('red');
    expect(element.style.fontSize).toBe('16px');
  });

  it('should handle camelCase property names', () => {
    const styles = {
      backgroundColor: 'blue',
    };
    
    applyStyles(element, styles);
    
    expect(element.style.backgroundColor).toBe('blue');
  });

  it('should handle kebab-case property names', () => {
    const styles = {
      'background-color': 'green',
    };
    
    applyStyles(element, styles);
    
    expect(element.style.backgroundColor).toBe('green');
  });

  it('should skip undefined and null values', () => {
    const styles = {
      color: 'red',
      fontSize: undefined as any,
      margin: null as any,
    };
    
    applyStyles(element, styles);
    
    expect(element.style.color).toBe('red');
    // fontSize and margin should not be set
  });

  it('should handle null or undefined element', () => {
    expect(() => applyStyles(null as any, { color: 'red' })).not.toThrow();
    expect(() => applyStyles(undefined as any, { color: 'red' })).not.toThrow();
  });

  it('should handle null or undefined styles', () => {
    expect(() => applyStyles(element, null as any)).not.toThrow();
    expect(() => applyStyles(element, undefined as any)).not.toThrow();
  });
});

describe('getPositioningType', () => {
  let element: HTMLElement;
  let parent: HTMLElement;

  beforeEach(() => {
    parent = document.createElement('div');
    element = document.createElement('div');
    parent.appendChild(element);
    document.body.appendChild(parent);
  });

  afterEach(() => {
    document.body.removeChild(parent);
  });

  it('should detect absolute positioning', () => {
    element.style.position = 'absolute';
    expect(getPositioningType(element)).toBe('absolute');
  });

  it('should detect fixed positioning', () => {
    element.style.position = 'fixed';
    expect(getPositioningType(element)).toBe('fixed');
  });

  it('should detect relative positioning', () => {
    element.style.position = 'relative';
    expect(getPositioningType(element)).toBe('relative');
  });

  it('should detect flex item', () => {
    parent.style.display = 'flex';
    expect(getPositioningType(element)).toBe('flex');
  });

  it('should detect grid item', () => {
    parent.style.display = 'grid';
    expect(getPositioningType(element)).toBe('grid');
  });

  it('should default to static', () => {
    expect(getPositioningType(element)).toBe('static');
  });

  it('should detect inline-flex parent', () => {
    parent.style.display = 'inline-flex';
    expect(getPositioningType(element)).toBe('flex');
  });

  it('should detect inline-grid parent', () => {
    parent.style.display = 'inline-grid';
    expect(getPositioningType(element)).toBe('grid');
  });
});

describe('adjustPositioningForDrag', () => {
  let element: HTMLElement;
  let parent: HTMLElement;

  beforeEach(() => {
    parent = document.createElement('div');
    parent.style.position = 'relative';
    parent.style.width = '500px';
    parent.style.height = '500px';
    
    element = document.createElement('div');
    element.style.width = '100px';
    element.style.height = '50px';
    
    parent.appendChild(element);
    document.body.appendChild(parent);
  });

  afterEach(() => {
    document.body.removeChild(parent);
  });

  it('should not change absolute positioning', () => {
    element.style.position = 'absolute';
    element.style.left = '10px';
    element.style.top = '20px';
    
    adjustPositioningForDrag(element);
    
    expect(element.style.position).toBe('absolute');
    expect(element.style.left).toBe('10px');
    expect(element.style.top).toBe('20px');
  });

  it('should not change fixed positioning', () => {
    element.style.position = 'fixed';
    element.style.left = '10px';
    element.style.top = '20px';
    
    adjustPositioningForDrag(element);
    
    expect(element.style.position).toBe('fixed');
  });

  it('should convert flex item to absolute', () => {
    parent.style.display = 'flex';
    
    adjustPositioningForDrag(element);
    
    expect(element.style.position).toBe('absolute');
    expect(element.style.left).toBeTruthy();
    expect(element.style.top).toBeTruthy();
    expect(element.style.width).toBe('100px');
    expect(element.style.height).toBe('50px');
  });

  it('should convert grid item to absolute', () => {
    parent.style.display = 'grid';
    
    adjustPositioningForDrag(element);
    
    expect(element.style.position).toBe('absolute');
    expect(element.style.left).toBeTruthy();
    expect(element.style.top).toBeTruthy();
  });

  it('should convert static to relative', () => {
    // Element is static by default
    adjustPositioningForDrag(element);
    
    expect(element.style.position).toBe('relative');
  });

  it('should remove flex properties when converting flex item', () => {
    parent.style.display = 'flex';
    element.style.flex = '1';
    
    adjustPositioningForDrag(element);
    
    // Flex property should be cleared (empty string)
    expect(element.style.flex).toBe('');
  });

  it('should remove grid properties when converting grid item', () => {
    parent.style.display = 'grid';
    element.style.gridColumn = '1 / 3';
    element.style.gridRow = '1 / 2';
    
    adjustPositioningForDrag(element);
    
    // Grid properties should be cleared (empty string)
    expect(element.style.gridColumn).toBe('');
    expect(element.style.gridRow).toBe('');
  });
});

describe('parseCssString and styleToCssString round trip', () => {
  it('should be reversible for simple styles', () => {
    const original = { color: 'red', fontSize: '16px', margin: '10px' };
    const cssString = styleToCssString(original);
    const parsed = parseCssString(cssString);
    
    expect(parsed).toEqual(original);
  });

  it('should handle complex styles', () => {
    const original = {
      backgroundColor: 'blue',
      borderTopWidth: '2px',
      transform: 'translate(10px, 20px)',
    };
    const cssString = styleToCssString(original);
    const parsed = parseCssString(cssString);
    
    expect(parsed).toEqual(original);
  });
});
