import { describe, it, expect } from 'vitest';
import { Template } from './template';

describe('Template', () => {
  describe('constructor and basic getters', () => {
    it('should store and return template content', () => {
      const template = new Template('<div>Hello</div>', 'test.html');
      expect(template.getContent()).toBe('<div>Hello</div>');
      expect(template.getPath()).toBe('test.html');
    });
  });

  describe('parse()', () => {
    it('should parse template and return nodes', () => {
      const template = new Template('<div>Hello<span>World</span></div>', 'test.html');
      const nodes = template.parse();
      expect(nodes.length).toEqual(1);
    });
  });

  describe('findElements()', () => {
    it('should find elements by selector', () => {
      const template = new Template(`
        <div class="test">
          <span>Hello</span>
          <div class="test">World</div>
        </div>
      `, 'test.html');
      const elements = template.findElements('div.test');
      expect(elements.length).toBe(2);
      expect(elements[0].name).toBe('div');
      expect(elements[1].name).toBe('div');
    });
  });

  describe('findPropertyBindings()', () => {
    it('should find property bindings', () => {
      const template = new Template(`
        <div [title]="message1">Hello</div>
        <span [title]="message2">World</span>
      `, 'test.html');
      const bindings = template.findPropertyBindings('title');
      expect(bindings.length).toBe(2);
      expect(bindings[0].name).toBe('title');
      expect(bindings[1].name).toBe('title');
    });
  });

  describe('findEventBindings()', () => {
    it('should find event bindings', () => {
      const template = new Template(`
        <button (click)="onClick1()">Click me</button>
        <div (click)="onClick2()">Click me too</div>
      `, 'test.html');
      const bindings = template.findEventBindings('click');
      expect(bindings.length).toBe(2);
      expect(bindings[0].name).toBe('click');
      expect(bindings[1].name).toBe('click');
    });
  });

  describe('findInterpolations()', () => {
    it('should find interpolations', () => {
      const template = new Template(`
        <div>Hello {{name1}}</div>
        <div>World {{name2}}</div>
      `, 'test.html');
      const interpolations = template.findInterpolations();
      expect(interpolations.length).toBe(2);
    });
  });

  describe('getBindingDependencies()', () => {
    it('should get binding dependencies', () => {
      const template = new Template(`
        <div [title]="message1" (click)="onClick1()">
          Hello {{name1}}
        </div>
        <div [description]="message2" (click)="onClick2()">
          World {{name2}}
        </div>
      `, 'test.html');
      const dependencies = template.getBindingDependencies();
      expect(dependencies.length).toBeGreaterThan(4);
      expect(dependencies).toContain('message1');
      expect(dependencies).toContain('message2');
      expect(dependencies).toContain('onClick1()');
      expect(dependencies).toContain('onClick2()');
      expect(dependencies).toContain('name1');
      expect(dependencies).toContain('name2');
    });
  });

  describe('getErrors()', () => {
    it('should return parsing errors for invalid template', () => {
      const template = new Template(`
        <div [invalid1]="
        <div [invalid2]="
      `, 'test.html');
      template.parse(); // Force parsing
      const errors = template.getErrors();
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('getControlFlowExpressions()', () => {
    it('should find control flow expressions', () => {
      const template = new Template(`
        @if (condition1) {
          <div>True 1</div>
        }
        @if (condition2) {
          <div>True 2</div>
        }
      `, 'test.html');
      const expressions = template.getControlFlowExpressions();
      expect(expressions.length).toBe(2);
      expect(expressions[0].type).toBe('if');
      expect(expressions[1].type).toBe('if');
    });
  });

  describe('findMethodCalls()', () => {
    it('should find method calls in event handlers', () => {
      const template = new Template(`
        <button (click)="method1()">Click 1</button>
        <button (click)="method2($event)">Click 2</button>
      `, 'test.html');
      const methodCalls = template.findMethodCalls();
      expect(methodCalls.length).toBe(2);
      expect(methodCalls).toContain('method1');
      expect(methodCalls).toContain('method2');
    });
  });
});