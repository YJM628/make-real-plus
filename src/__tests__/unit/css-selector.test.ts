/**
 * Unit tests for CSS Selector Utilities
 * Feature: ai-html-visual-editor
 */

import {
  generateCssSelector,
  validateSelector,
  findElement,
  generatePositionBasedSelector,
  generateCssSelectorFromElement,
} from '../../utils/css/selector';
import type { ParsedElement } from '../../types';

describe('CSS Selector Utilities', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Create a container for DOM tests
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
  });

  describe('generateCssSelector', () => {
    it('should generate selector using id when available', () => {
      const element: ParsedElement = {
        identifier: 'elem-1',
        tagName: 'div',
        attributes: { id: 'my-element' },
        inlineStyles: {},
        selector: '',
        textContent: '',
        children: [],
      };

      const selector = generateCssSelector(element);
      expect(selector).toBe('#my-element');
    });

    it('should escape special characters in id', () => {
      const element: ParsedElement = {
        identifier: 'elem-1',
        tagName: 'div',
        attributes: { id: 'my:element.test' },
        inlineStyles: {},
        selector: '',
        textContent: '',
        children: [],
      };

      const selector = generateCssSelector(element);
      expect(selector).toContain('my\\:element\\.test');
    });

    it('should generate selector using data-uuid when id is not available', () => {
      const element: ParsedElement = {
        identifier: 'elem-1',
        tagName: 'div',
        attributes: { 'data-uuid': 'uuid-123' },
        inlineStyles: {},
        selector: '',
        textContent: '',
        children: [],
      };

      const selector = generateCssSelector(element);
      expect(selector).toBe('[data-uuid="uuid-123"]');
    });

    it('should generate selector using tag and classes', () => {
      const element: ParsedElement = {
        identifier: 'elem-1',
        tagName: 'div',
        attributes: { class: 'btn btn-primary' },
        inlineStyles: {},
        selector: '',
        textContent: '',
        children: [],
      };

      const selector = generateCssSelector(element);
      expect(selector).toBe('div.btn.btn-primary');
    });

    it('should include nth-child when element has parent', () => {
      const parent: ParsedElement = {
        identifier: 'parent',
        tagName: 'div',
        attributes: {},
        inlineStyles: {},
        selector: '',
        textContent: '',
        children: [],
      };

      const child1: ParsedElement = {
        identifier: 'child-1',
        tagName: 'span',
        attributes: {},
        inlineStyles: {},
        selector: '',
        textContent: '',
        children: [],
        parent,
      };

      const child2: ParsedElement = {
        identifier: 'child-2',
        tagName: 'span',
        attributes: {},
        inlineStyles: {},
        selector: '',
        textContent: '',
        children: [],
        parent,
      };

      parent.children = [child1, child2];

      const selector = generateCssSelector(child2);
      expect(selector).toContain('span:nth-child(2)');
    });

    it('should build path from root for nested elements', () => {
      const root: ParsedElement = {
        identifier: 'root',
        tagName: 'div',
        attributes: { id: 'root' },
        inlineStyles: {},
        selector: '',
        textContent: '',
        children: [],
      };

      const child: ParsedElement = {
        identifier: 'child',
        tagName: 'span',
        attributes: {},
        inlineStyles: {},
        selector: '',
        textContent: '',
        children: [],
        parent: root,
      };

      root.children = [child];

      const selector = generateCssSelector(child);
      expect(selector).toBe('#root > span:nth-child(1)');
    });

    it('should handle elements with no identifying attributes', () => {
      const element: ParsedElement = {
        identifier: 'elem-1',
        tagName: 'div',
        attributes: {},
        inlineStyles: {},
        selector: '',
        textContent: '',
        children: [],
      };

      const selector = generateCssSelector(element);
      expect(selector).toBe('div');
    });
  });

  describe('validateSelector', () => {
    it('should return true for unique selector', () => {
      container.innerHTML = '<div id="unique">Content</div>';
      
      const isValid = validateSelector('#unique', container);
      expect(isValid).toBe(true);
    });

    it('should return false for non-unique selector', () => {
      container.innerHTML = `
        <div class="item">Item 1</div>
        <div class="item">Item 2</div>
      `;
      
      const isValid = validateSelector('.item', container);
      expect(isValid).toBe(false);
    });

    it('should return false for selector that matches no elements', () => {
      container.innerHTML = '<div>Content</div>';
      
      const isValid = validateSelector('#nonexistent', container);
      expect(isValid).toBe(false);
    });

    it('should return false for invalid selector syntax', () => {
      container.innerHTML = '<div>Content</div>';
      
      const isValid = validateSelector('###invalid', container);
      expect(isValid).toBe(false);
    });

    it('should handle complex selectors', () => {
      container.innerHTML = `
        <div class="parent">
          <span class="child">Unique</span>
        </div>
      `;
      
      const isValid = validateSelector('.parent > .child', container);
      expect(isValid).toBe(true);
    });
  });

  describe('findElement', () => {
    it('should find element by valid selector', () => {
      container.innerHTML = '<div id="target">Target</div>';
      
      const element = findElement('#target', container);
      expect(element).not.toBeNull();
      expect(element?.id).toBe('target');
    });

    it('should return null for non-existent selector', () => {
      container.innerHTML = '<div>Content</div>';
      
      const element = findElement('#nonexistent', container);
      expect(element).toBeNull();
    });

    it('should use position fallback when selector fails', () => {
      container.innerHTML = '<div id="target" style="position: absolute; left: 100px; top: 100px; width: 50px; height: 50px;">Target</div>';
      container.style.position = 'relative';
      
      // Mock elementFromPoint
      const targetElement = container.querySelector('#target') as HTMLElement;
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => targetElement;
      
      const element = findElement('#nonexistent', container, { x: 125, y: 125 });
      
      // Restore original
      document.elementFromPoint = originalElementFromPoint;
      
      expect(element).not.toBeNull();
      expect(element?.id).toBe('target');
    });

    it('should return null when both selector and position fail', () => {
      container.innerHTML = '<div>Content</div>';
      
      // Mock elementFromPoint to return null
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => null;
      
      const element = findElement('#nonexistent', container, { x: -1000, y: -1000 });
      
      // Restore original
      document.elementFromPoint = originalElementFromPoint;
      
      expect(element).toBeNull();
    });

    it('should handle invalid selector with position fallback', () => {
      container.innerHTML = '<div id="target">Target</div>';
      const targetElement = container.querySelector('#target') as HTMLElement;
      
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = () => targetElement;
      
      const element = findElement('###invalid', container, { x: 0, y: 0 });
      
      document.elementFromPoint = originalElementFromPoint;
      
      expect(element).not.toBeNull();
    });
  });

  describe('generatePositionBasedSelector', () => {
    it('should generate path from root to element', () => {
      container.innerHTML = `
        <div id="root">
          <ul>
            <li>Item 1</li>
            <li id="target">Item 2</li>
          </ul>
        </div>
      `;
      
      const root = container.querySelector('#root') as HTMLElement;
      const target = container.querySelector('#target') as HTMLElement;
      
      const selector = generatePositionBasedSelector(target, root);
      expect(selector).toBe('div > ul:nth-child(1) > li:nth-child(2)');
    });

    it('should handle deeply nested elements', () => {
      container.innerHTML = `
        <div id="root">
          <section>
            <article>
              <p id="target">Text</p>
            </article>
          </section>
        </div>
      `;
      
      const root = container.querySelector('#root') as HTMLElement;
      const target = container.querySelector('#target') as HTMLElement;
      
      const selector = generatePositionBasedSelector(target, root);
      expect(selector).toContain('section:nth-child(1)');
      expect(selector).toContain('article:nth-child(1)');
      expect(selector).toContain('p:nth-child(1)');
    });

    it('should handle element with multiple siblings', () => {
      container.innerHTML = `
        <div id="root">
          <span>First</span>
          <span>Second</span>
          <span id="target">Third</span>
        </div>
      `;
      
      const root = container.querySelector('#root') as HTMLElement;
      const target = container.querySelector('#target') as HTMLElement;
      
      const selector = generatePositionBasedSelector(target, root);
      expect(selector).toBe('div > span:nth-child(3)');
    });

    it('should return empty path if element is not in root', () => {
      container.innerHTML = '<div id="root"></div>';
      const root = container.querySelector('#root') as HTMLElement;
      
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      
      const selector = generatePositionBasedSelector(outsideElement, root);
      // The selector will still be generated, but it won't be relative to root
      expect(selector).toBeTruthy();
      expect(selector).not.toContain('#root');
      
      document.body.removeChild(outsideElement);
    });
  });

  describe('generateCssSelectorFromElement', () => {
    it('should prefer id selector', () => {
      container.innerHTML = '<div id="my-id" class="my-class">Content</div>';
      const element = container.querySelector('#my-id') as HTMLElement;
      
      const selector = generateCssSelectorFromElement(element, container);
      expect(selector).toBe('#my-id');
    });

    it('should use data-uuid when id is not available', () => {
      container.innerHTML = '<div data-uuid="uuid-123" class="my-class">Content</div>';
      const element = container.querySelector('[data-uuid]') as HTMLElement;
      
      const selector = generateCssSelectorFromElement(element, container);
      expect(selector).toBe('[data-uuid="uuid-123"]');
    });

    it('should build selector with classes', () => {
      container.innerHTML = '<div class="btn btn-primary">Button</div>';
      const element = container.querySelector('.btn') as HTMLElement;
      
      const selector = generateCssSelectorFromElement(element, container);
      expect(selector).toContain('div');
      expect(selector).toContain('.btn');
      expect(selector).toContain('.btn-primary');
    });

    it('should fallback to position-based selector if not unique', () => {
      container.innerHTML = `
        <div class="item">Item 1</div>
        <div class="item">Item 2</div>
      `;
      const elements = container.querySelectorAll('.item');
      const secondItem = elements[1] as HTMLElement;
      
      const selector = generateCssSelectorFromElement(secondItem, container);
      expect(selector).toContain(':nth-child(2)');
    });

    it('should handle elements with no classes', () => {
      container.innerHTML = '<span>Text</span>';
      const element = container.querySelector('span') as HTMLElement;
      
      const selector = generateCssSelectorFromElement(element, container);
      expect(selector).toContain('span');
    });

    it('should escape special characters in classes', () => {
      container.innerHTML = '<div class="my:class">Content</div>';
      const element = container.querySelector('[class]') as HTMLElement;
      
      const selector = generateCssSelectorFromElement(element, container);
      expect(selector).toContain('my\\:class');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty container', () => {
      container.innerHTML = '';
      
      const element = findElement('#anything', container);
      expect(element).toBeNull();
    });

    it('should handle elements with empty class attribute', () => {
      const element: ParsedElement = {
        identifier: 'elem-1',
        tagName: 'div',
        attributes: { class: '' },
        inlineStyles: {},
        selector: '',
        textContent: '',
        children: [],
      };

      const selector = generateCssSelector(element);
      expect(selector).toBe('div');
    });

    it('should handle elements with whitespace-only class attribute', () => {
      const element: ParsedElement = {
        identifier: 'elem-1',
        tagName: 'div',
        attributes: { class: '   ' },
        inlineStyles: {},
        selector: '',
        textContent: '',
        children: [],
      };

      const selector = generateCssSelector(element);
      expect(selector).toBe('div');
    });

    it('should handle very deeply nested elements', () => {
      let html = '<div id="root">';
      for (let i = 0; i < 10; i++) {
        html += `<div class="level-${i}">`;
      }
      html += '<span id="deep">Deep</span>';
      for (let i = 0; i < 10; i++) {
        html += '</div>';
      }
      html += '</div>';
      
      container.innerHTML = html;
      const root = container.querySelector('#root') as HTMLElement;
      const deep = container.querySelector('#deep') as HTMLElement;
      
      const selector = generatePositionBasedSelector(deep, root);
      expect(selector).toBeTruthy();
      expect(selector.split('>').length).toBeGreaterThan(5);
    });
  });
});
