import {
  TmplAstNode,
  TmplAstElement,
  TmplAstText,
  TmplAstTemplate,
  TmplAstTextAttribute,
  TmplAstBoundAttribute,
  TmplAstBoundEvent,
  TmplAstBoundText,
  TmplAstContent,
  TmplAstReference,
  TmplAstVariable,
  TmplAstIfBlock,
  TmplAstForLoopBlock,
  TmplAstSwitchBlock,
  TmplAstSwitchBlockCase,
  TmplAstDeferredBlock,
  TmplAstDeferredTrigger,
  TmplAstDeferredBlockLoading,
  TmplAstDeferredBlockError,
  TmplAstDeferredBlockPlaceholder,
  ParseSourceSpan,
} from '@angular/compiler';

/**
 * Re-export Angular template AST types with more descriptive names
 * These types represent the core building blocks of an Angular template
 */
export type {
  TmplAstNode as TemplateNode,                           // Base type for all template nodes
  TmplAstElement as ElementNode,                         // Regular HTML elements
  TmplAstText as TextNode,                               // Text content nodes
  TmplAstTemplate as TemplateElement,                    // <ng-template> elements
  TmplAstTextAttribute as AttributeNode,                 // Regular HTML attributes
  TmplAstBoundAttribute as PropertyBindingNode,          // Property bindings ([prop]="value")
  TmplAstBoundEvent as EventBindingNode,                 // Event bindings ((event)="handler()")
  TmplAstBoundText as BoundTextNode,                     // Interpolation nodes ({{ value }})
  TmplAstContent as ContentNode,                         // Content projection (<ng-content>)
  TmplAstReference as ReferenceNode,                     // Template references (#var)
  TmplAstVariable as VariableNode,                       // Template variables (let-var)
  TmplAstIfBlock as IfBlockNode,                         // @if blocks
  TmplAstForLoopBlock as ForBlockNode,                   // @for blocks
  TmplAstSwitchBlock as SwitchBlockNode,                 // @switch blocks
  TmplAstSwitchBlockCase as CaseBlockNode,               // @case blocks
  TmplAstDeferredBlock as DeferBlockNode,                // @defer blocks
  TmplAstDeferredTrigger as DeferTriggerNode,            // @defer trigger conditions
  TmplAstDeferredBlockLoading as DeferLoadingNode,       // @defer loading state
  TmplAstDeferredBlockError as DeferErrorNode,           // @defer error state
  TmplAstDeferredBlockPlaceholder as DeferPlaceholderNode, // @defer placeholder content
  ParseSourceSpan as TemplateSourceSpan,                 // Source location information
};

/**
 * Helper function to check node type that handles Angular's suffixed class names
 */
function checkNodeType(node: TmplAstNode, typeName: string): boolean {
  return node.constructor.name.startsWith(typeName);
}

/**
 * Type guards for specific node types
 * These functions help narrow down node types in a type-safe way
 */
export const is = {
  element: (node: TmplAstNode): node is TmplAstElement =>
    checkNodeType(node, 'Element'),
  text: (node: TmplAstNode): node is TmplAstText =>
    checkNodeType(node, 'Text'),
  template: (node: TmplAstNode): node is TmplAstTemplate =>
    checkNodeType(node, 'Template'),
  attribute: (node: TmplAstNode): node is TmplAstTextAttribute =>
    checkNodeType(node, 'TextAttribute'),
  propertyBinding: (node: TmplAstNode): node is TmplAstBoundAttribute =>
    checkNodeType(node, 'BoundAttribute'),
  eventBinding: (node: TmplAstNode): node is TmplAstBoundEvent =>
    checkNodeType(node, 'BoundEvent'),
  boundText: (node: TmplAstNode): node is TmplAstBoundText =>
    checkNodeType(node, 'BoundText'),
  content: (node: TmplAstNode): node is TmplAstContent =>
    checkNodeType(node, 'Content'),
  reference: (node: TmplAstNode): node is TmplAstReference =>
    checkNodeType(node, 'Reference'),
  variable: (node: TmplAstNode): node is TmplAstVariable =>
    checkNodeType(node, 'Variable'),
  ifBlock: (node: TmplAstNode): node is TmplAstIfBlock =>
    checkNodeType(node, 'IfBlock'),
  forBlock: (node: TmplAstNode): node is TmplAstForLoopBlock =>
    checkNodeType(node, 'ForLoopBlock'),
  switchBlock: (node: TmplAstNode): node is TmplAstSwitchBlock =>
    checkNodeType(node, 'SwitchBlock'),
  caseBlock: (node: TmplAstNode): node is TmplAstSwitchBlockCase =>
    checkNodeType(node, 'SwitchBlockCase'),
  deferBlock: (node: TmplAstNode): node is TmplAstDeferredBlock =>
    checkNodeType(node, 'DeferredBlock'),
  deferLoading: (node: TmplAstNode): node is TmplAstDeferredBlockLoading =>
    checkNodeType(node, 'DeferredBlockLoading'),
  deferError: (node: TmplAstNode): node is TmplAstDeferredBlockError =>
    checkNodeType(node, 'DeferredBlockError'),
  deferPlaceholder: (node: TmplAstNode): node is TmplAstDeferredBlockPlaceholder =>
    checkNodeType(node, 'DeferredBlockPlaceholder'),
};

/**
 * Represents the type of an Angular template node
 * This enum provides a simpler way to identify node types compared to instanceof checks
 */
export enum NodeKind {
  Element = 'Element',
  Text = 'Text',
  Comment = 'Comment',
  Attribute = 'Attribute',
  PropertyBinding = 'PropertyBinding',
  EventBinding = 'EventBinding',
  TwoWayBinding = 'TwoWayBinding',
  Interpolation = 'Interpolation',
  Template = 'Template',
  Content = 'Content',
  Reference = 'Reference',
  Variable = 'Variable',
  Directive = 'Directive',
  // Angular 19 control flow
  If = 'If',
  Else = 'Else',
  For = 'For',
  Empty = 'Empty',
  Switch = 'Switch',
  Case = 'Case',
  Default = 'Default',
  Defer = 'Defer',
  DeferPlaceholder = 'DeferPlaceholder',
  DeferLoading = 'DeferLoading',
  DeferError = 'DeferError'
}

/**
 * Helper functions for working with template nodes
 */
export function hasKind<T extends TmplAstNode>(node: TmplAstNode, kind: NodeKind): node is T {
  return checkNodeType(node, kind);
}

export function isNodeOfKind<T extends TmplAstNode>(node: TmplAstNode, kind: NodeKind): node is T {
  return checkNodeType(node, kind);
}