// Core exports
export { Project } from './core/project';
export type { ProjectOptions } from './core/project';
export { ComponentFile } from './core/component-file';
export { Template } from './core/template';

// AST types exports
export {
  type TemplateNode,
  type ElementNode,
  type PropertyBindingNode,
  type EventBindingNode,
  type BoundTextNode,
  type AttributeNode,
  NodeKind,
  is,
  hasKind,
  isNodeOfKind
} from './ast/types';

// Template types exports
export type {
  BindingError,
  EventHandler,
  PropertyBinding,
  ControlFlowExpression
} from './core/template';

function main() {
  console.log('Hello, TypeScript with Biome!');
}

main();