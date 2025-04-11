/**
 * Regular expression for parsing CSS selectors
 */
const SELECTOR_REGEXP = new RegExp(
  '(\\:not\\()|' + // 1: ":not("
    '(([\\.\\#]?)[-\\w]+)|' + // 2: "tag"; 3: "."/"\#";
    // "-" should appear first in the regexp below as FF31 parses "[.-\w]" as a range
    '(?:\\[([-.\\w*\\\\$]+)(?:=(["\']?)([^\\]"\']*)\\5)?\\])|' + // 4: attribute; 5: attribute_string; 6: attribute_value
    '(\\))|' + // 7: ")"
    '(\\s*,\\s*)', // 8: ","
  'g'
);

/**
 * Represents a parsed CSS selector with its components
 */
export class CssSelector {
  element: string | null = null;
  classNames: string[] = [];
  attrs: string[] = [];
  notSelectors: CssSelector[] = [];

  /**
   * Parse a CSS selector string into CssSelector objects
   */
  static parse(selector: string): CssSelector[] {
    const results: CssSelector[] = [];
    let cssSelector = new CssSelector();
    let match: RegExpExecArray | null;
    let current = cssSelector;
    let inNot = false;

    SELECTOR_REGEXP.lastIndex = 0;
    while ((match = SELECTOR_REGEXP.exec(selector))) {
      if (match[1]) { // :not(
        if (inNot) {
          throw new Error('Nesting :not in a selector is not allowed');
        }
        inNot = true;
        current = new CssSelector();
        cssSelector.notSelectors.push(current);
      }

      const tag = match[2];
      if (tag) {
        const prefix = match[3];
        if (prefix === '#') {
          current.addAttribute('id', tag.slice(1));
        } else if (prefix === '.') {
          current.addClassName(tag.slice(1));
        } else {
          current.setElement(tag);
        }
      }

      const attribute = match[4];
      if (attribute) {
        current.addAttribute(attribute, match[6] || '');
      }

      if (match[7]) { // )
        inNot = false;
        current = cssSelector;
      }

      if (match[8]) { // ,
        if (inNot) {
          throw new Error('Multiple selectors in :not are not supported');
        }
        results.push(cssSelector);
        cssSelector = current = new CssSelector();
      }
    }

    results.push(cssSelector);
    return results;
  }

  setElement(element: string | null = null) {
    this.element = element;
  }

  addClassName(name: string) {
    this.classNames.push(name.toLowerCase());
  }

  addAttribute(name: string, value: string = '') {
    this.attrs.push(name, value.toLowerCase());
  }

  /**
   * Check if this selector matches a given element
   */
  matches(element: {
    tagName?: string;
    classList?: string[];
    attributes?: { name: string; value: string }[];
  }): boolean {
    // Check element tag
    if (this.element && (!element.tagName || this.element.toLowerCase() !== element.tagName.toLowerCase())) {
      return false;
    }

    // Check classes
    if (this.classNames.length > 0) {
      const elementClasses = new Set(element.classList?.map(c => c.toLowerCase()) || []);
      if (!this.classNames.every(className => elementClasses.has(className))) {
        return false;
      }
    }

    // Check attributes
    if (this.attrs.length > 0) {
      const elementAttrs = new Map(
        element.attributes?.map(attr => [attr.name.toLowerCase(), attr.value.toLowerCase()]) || []
      );

      for (let i = 0; i < this.attrs.length; i += 2) {
        const name = this.attrs[i].toLowerCase();
        const value = this.attrs[i + 1];

        if (!elementAttrs.has(name)) {
          return false;
        }
        if (value && elementAttrs.get(name) !== value) {
          return false;
        }
      }
    }

    // Check :not selectors
    if (this.notSelectors.length > 0) {
      if (this.notSelectors.some(notSelector => notSelector.matches(element))) {
        return false;
      }
    }

    return true;
  }

  toString(): string {
    let res: string = this.element || '';

    if (this.classNames) {
      this.classNames.forEach(klass => res += `.${klass}`);
    }

    if (this.attrs) {
      for (let i = 0; i < this.attrs.length; i += 2) {
        const name = this.attrs[i];
        const value = this.attrs[i + 1];
        res += `[${name}${value ? '=' + value : ''}]`;
      }
    }

    this.notSelectors.forEach(notSelector => res += `:not(${notSelector})`);

    return res;
  }
}