# ng-morph

A powerful library for analyzing and transforming Angular templates, inspired by ts-morph. This library provides a programmatic way to analyze, manipulate, and transform Angular templates using a simple and intuitive API.

## Installation

```bash
npm install ng-morph
```

## Features

- Parse and analyze Angular templates
- Extract information about components, bindings, and events
- Analyze control flow structures (@if, @for, @switch)
- Find and manipulate template elements
- Type-safe template manipulation
- Built on top of Angular's compiler
- Seamless integration with ts-morph for full-stack analysis

## Usage

### Setup and Workflow

1. First, create a ts-morph project for your TypeScript manipulations:
```typescript
import { Project as TsMorphProject } from 'ts-morph';
import { Project } from 'ng-morph';

// Create a ts-morph project
const tsProject = new TsMorphProject({
  tsConfigFilePath: 'tsconfig.json'
});

// Add your source files to ts-morph project
tsProject.addSourceFilesAtPaths('src/**/*.ts');

// Create ng-morph project with your ts-morph instance
const ngMorph = new Project(tsProject);
```

2. ng-morph will automatically:
   - Scan all TypeScript files for Angular components
   - Create ComponentFile instances for each component
   - Parse templates (both inline and external)
   - Throw errors if template files are missing

3. You can then analyze components and templates:
```typescript
// Get all components
const components = ngMorph.getComponents();

// Find components by selector
const appComponents = ngMorph.findComponentsBySelector('app-root');

// Analyze a specific component
const component = ngMorph.getComponent('src/app/my.component.ts');
if (component) {
  const template = component.getTemplate();

  // Find elements
  const buttons = template.findElements('button');

  // Analyze event handlers
  const handlers = template.getEventHandlers();

  // Find property bindings
  const bindings = template.findPropertyBindings('disabled');

  // Analyze control flow
  const controlFlow = template.getControlFlowExpressions();
}
```

## API Reference

### Project

- `new Project(tsProject: TsMorphProject)`: Create a new project with a ts-morph instance
- `getComponent(path: string)`: Get a component by path
- `getComponents()`: Get all components
- `getComponentsByPattern(pattern: string)`: Get components matching a file pattern
- `findComponentsBySelector(selector: string)`: Find components by selector
- `getTsMorphProject()`: Get the underlying ts-morph project instance

### ComponentFile

- `getTemplate()`: Get the component's template
- `isComponent()`: Check if file is a component
- `getComponentClassName()`: Get the component class name
- `getComponentDecorator()`: Get the @Component decorator
- `getSourceFile()`: Get the underlying ts-morph SourceFile

### Template

- `findElements(selector: string)`: Find elements by selector
- `findPropertyBindings(name: string)`: Find property bindings
- `findEventBindings(name: string)`: Find event bindings
- `findInterpolations()`: Find text interpolations
- `getEventHandlers()`: Get all event handlers
- `getPropertyBindings()`: Get all property bindings
- `getControlFlowExpressions()`: Get control flow expressions
- `validateBindings()`: Validate all bindings

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
