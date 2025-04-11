import {
  parseTemplate,
  TmplAstNode,
  TmplAstElement,
  TmplAstBoundAttribute,
  TmplAstBoundEvent,
  TmplAstBoundText,
  ParseSourceSpan,
  ParsedTemplate,
  AST,
  ASTWithSource,
  PropertyRead,
  Call,
  ImplicitReceiver,
  LiteralPrimitive,
  TmplAstIfBlock,
  TmplAstForLoopBlock,
  TmplAstSwitchBlock,
  TmplAstSwitchBlockCase,
} from '@angular/compiler';

import {
  is,
} from '../ast/types.js';

import { CssSelector } from '../core/selector.js';

export interface BindingError {
  message: string;
  span: ParseSourceSpan;
  level: 'error' | 'warning';
}

export interface EventHandler {
  name: string;           // Name of the method being called
  arguments: string[];    // Arguments passed to the method
  fullText: string;       // Full handler text
  sourceSpan: ParseSourceSpan;
}

export interface PropertyBinding {
  name: string;           // Name of the property
  value: string;         // Raw value expression
  isLiteral: boolean;    // Whether the value is a literal
  referencedProperties: string[]; // Properties referenced in the binding
  sourceSpan: ParseSourceSpan;
}

export interface ControlFlowExpression {
  type: 'if' | 'for' | 'switch' | 'case';
  expression: string;
  referencedProperties: string[];
  sourceSpan: ParseSourceSpan;
}

export class Template {
  private parsedTemplate: ParsedTemplate | null = null;
  private errors: BindingError[] = [];

  constructor(
    private content: string,
    private path: string
  ) {}

  /**
   * Get the template content
   */
  getContent(): string {
    return this.content;
  }

  /**
   * Get the template file path
   */
  getPath(): string {
    return this.path;
  }

  /**
   * Parse the template and return all nodes
   */
  parse(): TmplAstNode[] {
    if (!this.parsedTemplate) {
      this.parsedTemplate = parseTemplate(this.content, this.path);
      if (this.parsedTemplate.errors) {
        this.errors = this.parsedTemplate.errors.map(error => ({
          message: error.msg,
          span: error.span,
          level: 'error'
        }));
      }
    }
    return this.parsedTemplate.nodes;
  }

  /**
   * Get all parsing errors
   */
  getErrors(): BindingError[] {
    if (!this.parsedTemplate) {
      this.parse();
    }
    return this.errors;
  }

  /**
   * Find all elements that match a given selector
   */
  findElements(selector: string): TmplAstElement[] {
    const nodes = this.parse();
    const elements: TmplAstElement[] = [];

    this.traverseNodes(nodes, node => {
      if (is.element(node) && this.matchesSelector(node, selector)) {
        elements.push(node);
      }
    });

    return elements;
  }

  /**
   * Find all property bindings by name
   */
  findPropertyBindings(propertyName: string): TmplAstBoundAttribute[] {
    const nodes = this.parse();
    const bindings: TmplAstBoundAttribute[] = [];

    this.traverseNodes(nodes, node => {
      if (is.element(node)) {
        const matches = node.inputs.filter(input => input.name === propertyName);
        bindings.push(...matches);
      }
    });

    return bindings;
  }

  /**
   * Find all event bindings by name
   */
  findEventBindings(eventName: string): TmplAstBoundEvent[] {
    const nodes = this.parse();
    const bindings: TmplAstBoundEvent[] = [];

    this.traverseNodes(nodes, node => {
      if (is.element(node)) {
        const matches = node.outputs.filter(output => output.name === eventName);
        bindings.push(...matches);
      }
    });

    return bindings;
  }

  /**
   * Find all text interpolations
   */
  findInterpolations(): TmplAstBoundText[] {
    const nodes = this.parse();
    const interpolations: TmplAstBoundText[] = [];

    this.traverseNodes(nodes, node => {
      if (is.boundText(node)) {
        interpolations.push(node);
      }
    });

    return interpolations;
  }

  /**
   * Get all properties used in bindings
   */
  getBindingDependencies(): string[] {
    const nodes = this.parse();
    const dependencies = new Set<string>();

    this.traverseNodes(nodes, node => {
      if (is.propertyBinding(node)) {
        // Extract property name from binding expression
        dependencies.add(node.name);
      }
      if (is.eventBinding(node)) {
        // Extract method names from event handlers
        const handlerText = node.handler.toString();
        dependencies.add(handlerText);
      }
      if (is.boundText(node)) {
        // Extract properties from interpolation
        const expressionText = node.value.toString();
        dependencies.add(expressionText);
      }
    });

    return Array.from(dependencies);
  }

  /**
   * Validate all bindings in the template
   */
  validateBindings(): BindingError[] {
    if (!this.parsedTemplate) {
      this.parse();
    }
    return this.errors;
  }

  /**
   * Helper method to traverse the AST
   */
  private traverseNodes(nodes: TmplAstNode[], visitor: (node: TmplAstNode) => void): void {
    const stack = [...nodes];

    while (stack.length > 0) {
      const current = stack.pop()!;
      visitor(current);

      // Check node type using the kind property
      if (is.element(current)) {
        stack.push(...current.children);
      } else if (is.template(current)) {
        stack.push(...current.children);
      } else if (is.ifBlock(current)) {
        current.branches.forEach(branch => {
          stack.push(...branch.children);
        });
      } else if (is.forBlock(current)) {
        stack.push(...current.children);
      } else if (is.switchBlock(current)) {
        current.cases.forEach(case_ => {
          stack.push(...case_.children);
        });
      }
    }
  }

  /**
   * Helper method to check if an element matches a CSS selector
   */
  private matchesSelector(element: TmplAstElement, selector: string): boolean {
    const selectors = CssSelector.parse(selector);

    // Convert TmplAstElement to format expected by CssSelector.matches
    const elementInfo = {
      tagName: element.name,
      classList: [] as string[],
      attributes: [
        // Regular attributes
        ...element.attributes.map(attr => ({
          name: attr.name,
          value: attr.value || ''
        })),
        // Input bindings (property bindings)
        ...element.inputs.map(input => ({
          name: input.name,
          value: input.value instanceof ASTWithSource ? input.value.source || '' : ''
        }))
      ]
    };

    // Extract classes from class attribute if present
    const classAttr = element.attributes.find(attr => attr.name === 'class');
    if (classAttr) {
      elementInfo.classList = classAttr.value.split(/\s+/).filter(Boolean);
    }

    // Match any of the comma-separated selectors
    return selectors.some(cssSelector => cssSelector.matches(elementInfo));
  }

  /**
   * Get detailed information about all event handlers in the template
   */
  getEventHandlers(): EventHandler[] {
    const nodes = this.parse();
    const handlers: EventHandler[] = [];

    this.traverseNodes(nodes, node => {
      if (is.element(node)) {
        node.outputs.forEach(output => {
          const handler = this.analyzeEventHandler(output);
          if (handler) {
            handlers.push(handler);
          }
        });
      }
    });

    return handlers;
  }

  /**
   * Get detailed information about all property bindings in the template
   */
  getPropertyBindings(): PropertyBinding[] {
    const nodes = this.parse();
    const bindings: PropertyBinding[] = [];

    this.traverseNodes(nodes, node => {
      if (is.element(node)) {
        node.inputs.forEach(input => {
          const binding = this.analyzePropertyBinding(input);
          if (binding) {
            bindings.push(binding);
          }
        });
      }
    });

    return bindings;
  }

  /**
   * Find all method calls in event handlers
   */
  findMethodCalls(): string[] {
    const handlers = this.getEventHandlers();
    return [...new Set(handlers.map(h => h.name))];
  }

  /**
   * Find all properties referenced in bindings
   */
  findReferencedProperties(): string[] {
    const bindings = this.getPropertyBindings();
    const properties = new Set<string>();

    bindings.forEach(binding => {
      binding.referencedProperties.forEach(prop =>
        properties.add(prop)
      );
    });

    return Array.from(properties);
  }

  /**
   * Analyze an event binding to extract handler information
   */
  private analyzeEventHandler(event: TmplAstBoundEvent): EventHandler | null {
    const ast = event.handler;
    if (!(ast instanceof ASTWithSource)) return null;

    const expression = ast.ast;
    let name = '';
    let args: string[] = [];

    if (expression instanceof Call) {
      const receiver = expression.receiver;
      if (receiver instanceof PropertyRead) {
        name = receiver.name;
      }
      args = expression.args.map(arg => arg.toString());
    } else if (expression instanceof PropertyRead) {
      name = expression.name;
    }

    return {
      name,
      arguments: args,
      fullText: ast.toString(),
      sourceSpan: event.sourceSpan
    };
  }

  /**
   * Analyze a property binding to extract value information
   */
  private analyzePropertyBinding(binding: TmplAstBoundAttribute): PropertyBinding | null {
    const ast = binding.value;
    if (!(ast instanceof ASTWithSource)) return null;

    const expression = ast.ast;
    const referencedProperties: string[] = [];

    // Collect referenced properties
    this.traverseAST(expression, node => {
      if (node instanceof PropertyRead && node.receiver instanceof ImplicitReceiver) {
        referencedProperties.push(node.name);
      }
    });

    return {
      name: binding.name,
      value: ast.toString(),
      isLiteral: expression instanceof LiteralPrimitive,
      referencedProperties,
      sourceSpan: binding.sourceSpan
    };
  }

  /**
   * Helper method to traverse the expression AST
   */
  private traverseAST(ast: AST, visitor: (node: AST) => void): void {
    visitor(ast);

    if (ast instanceof Call) {
      ast.args.forEach(arg => this.traverseAST(arg, visitor));
      this.traverseAST(ast.receiver, visitor);
    } else if (ast instanceof PropertyRead && ast.receiver) {
      this.traverseAST(ast.receiver, visitor);
    }
  }

  /**
   * Get all control flow expressions (@if, @for, @switch)
   */
  getControlFlowExpressions(): ControlFlowExpression[] {
    const nodes = this.parse();
    const expressions: ControlFlowExpression[] = [];

    this.traverseNodes(nodes, node => {
      if (node instanceof TmplAstIfBlock) {
        expressions.push(this.analyzeIfExpression(node));
      }
      else if (node instanceof TmplAstForLoopBlock) {
        expressions.push(this.analyzeForExpression(node));
      }
      else if (node instanceof TmplAstSwitchBlock) {
        expressions.push(this.analyzeSwitchExpression(node));
      }
      else if (node instanceof TmplAstSwitchBlockCase) {
        expressions.push(this.analyzeCaseExpression(node));
      }
    });

    return expressions;
  }

  /**
   * Find all properties referenced in control flow expressions
   */
  findControlFlowDependencies(): string[] {
    const expressions = this.getControlFlowExpressions();
    const dependencies = new Set<string>();

    expressions.forEach(expr => {
      expr.referencedProperties.forEach(prop =>
        dependencies.add(prop)
      );
    });

    return Array.from(dependencies);
  }

  private analyzeIfExpression(node: TmplAstIfBlock): ControlFlowExpression {
    const referencedProperties: string[] = [];
    const expr = node.branches[0]?.expression;

    if (expr instanceof ASTWithSource) {
      this.traverseAST(expr.ast, ast => {
        if (ast instanceof PropertyRead && ast.receiver instanceof ImplicitReceiver) {
          referencedProperties.push(ast.name);
        }
      });
    }

    return {
      type: 'if',
      expression: expr?.toString() || '',
      referencedProperties,
      sourceSpan: node.sourceSpan
    };
  }

  private analyzeForExpression(node: TmplAstForLoopBlock): ControlFlowExpression {
    const referencedProperties: string[] = [];
    const expr = node.expression;

    if (expr instanceof ASTWithSource) {
      this.traverseAST(expr.ast, ast => {
        if (ast instanceof PropertyRead && ast.receiver instanceof ImplicitReceiver) {
          referencedProperties.push(ast.name);
        }
      });
    }

    return {
      type: 'for',
      expression: expr?.toString() || '',
      referencedProperties,
      sourceSpan: node.sourceSpan
    };
  }

  private analyzeSwitchExpression(node: TmplAstSwitchBlock): ControlFlowExpression {
    const referencedProperties: string[] = [];
    const expr = node.expression;

    if (expr instanceof ASTWithSource) {
      this.traverseAST(expr.ast, ast => {
        if (ast instanceof PropertyRead && ast.receiver instanceof ImplicitReceiver) {
          referencedProperties.push(ast.name);
        }
      });
    }

    return {
      type: 'switch',
      expression: expr?.toString() || '',
      referencedProperties,
      sourceSpan: node.sourceSpan
    };
  }

  private analyzeCaseExpression(node: TmplAstSwitchBlockCase): ControlFlowExpression {
    const referencedProperties: string[] = [];
    const expr = node.expression;

    if (expr instanceof ASTWithSource) {
      this.traverseAST(expr.ast, ast => {
        if (ast instanceof PropertyRead && ast.receiver instanceof ImplicitReceiver) {
          referencedProperties.push(ast.name);
        }
      });
    }

    return {
      type: 'case',
      expression: expr?.toString() || '',
      referencedProperties,
      sourceSpan: node.sourceSpan
    };
  }
}