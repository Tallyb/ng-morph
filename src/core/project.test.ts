import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Project as TsMorphProject, InMemoryFileSystemHost, SourceFile, ClassDeclaration, Decorator, Node, StructureKind, SyntaxKind } from 'ts-morph';
import { Project } from './project';
import { ComponentFile } from './component-file';
import { join } from 'node:path';

describe('Project', () => {
  let project: Project;
  let tsProject: TsMorphProject;
  let fileSystem: InMemoryFileSystemHost;

  const writeFiles = (files: Record<string, string>) => {
    Object.entries(files).forEach(([path, content]) => {
      fileSystem.writeFileSync(path, content);
    });
  };

  const createComponentWithTemplate = (name: string, selector: string, template: string = '<div>Test</div>') => {
    return `
      import { Component } from '@angular/core';
      @Component({
        selector: '${selector}',
        template: '${template}'
      })
      export class ${name}Component {}
    `;
  };

  const createComponentWithTemplateUrl = (name: string, selector: string, templateUrl: string = './test.component.html') => {
  return `
        import { Component } from '@angular/core';
        @Component({
          selector: '${selector}',
          templateUrl: '${templateUrl}'
        })
        export class ${name}Component {}
      `;
  };

  beforeEach(() => {
    // Set up virtual file system
    fileSystem = new InMemoryFileSystemHost();

    // Create tsconfig.json
    fileSystem.writeFileSync('tsconfig.json', JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'ES2020',
        moduleResolution: 'node',
        experimentalDecorators: true,
      }
    }));

    // Initialize ts-morph project with virtual file system
    tsProject = new TsMorphProject({
      tsConfigFilePath: 'tsconfig.json',
      fileSystem
    });

    // Initialize our project
    project = new Project(tsProject);
  });

  describe('constructor', () => {
    it('should create project with ts-morph project', () => {
      expect(project).toBeInstanceOf(Project);
      expect(project.getComponents()).toBeDefined();
    });

    it('should create project with custom tsconfig path', () => {
      fileSystem.writeFileSync('custom/tsconfig.json', JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
        }
      }));
      const customTsProject = new TsMorphProject({
        tsConfigFilePath: 'custom/tsconfig.json',
        fileSystem
      });
      const customProject = new Project(customTsProject);
      expect(customProject).toBeInstanceOf(Project);
    });
  });

  describe('createSourceFile', () => {
    const templateContent = '<div>Test Template</div>';
    const templateComponent = createComponentWithTemplate('Test', 'test-comp1', templateContent);
    const templateUrlComponent = createComponentWithTemplateUrl('Test', 'test-comp2', './test.component.html');

    beforeEach(() => {
      writeFiles({
        'test.component1.ts': templateComponent,
        'test.component2.ts': templateUrlComponent,
        'test.component.html': templateContent
      });
    });

    it('should create a new component file', () => {
      const sourceFile = project.createSourceFile('test.component.ts', templateComponent);
      expect(sourceFile).toBeDefined();
      expect(sourceFile.getFullText()).toContain('@Component');
      expect(sourceFile.getFullText()).toContain('<div>Test Template</div>');
      expect(project.getComponent('/test.component.ts')).toBeDefined();
    });

    it('should read template from external file', () => {
      const templateContent = '<div>Test Template</div>';
      const sourceFile = project.createSourceFile('test.component.ts', componentWithTemplateUrl);
      const component = project.getComponent('test.component.ts');
      expect(component?.getTemplate()).toBe(templateContent);
    });

    it('should not register non-component files', () => {
      const content = `export class NotAComponent {}`;
      const sourceFile = project.createSourceFile('test.service.ts', content);
      expect(sourceFile).toBeDefined();
      const component = project.getComponent('test.service.ts');
      expect(component).toBeUndefined();
    });

    it('should create component with external template when template file exists', () => {
      const componentWithTemplateUrl = `
        import { Component } from '@angular/core';
        @Component({
          selector: 'app-test',
          templateUrl: './test.component.html'
        })
        export class TestComponent {}
      `;
      const sourceFile = project.createSourceFile('test.component.ts', componentWithTemplateUrl);
      const component = project.getComponent('test.component.ts');

      expect(component).toBeDefined();
      expect(component?.getTemplate()).toBe(templateContent);
      expect(component?.isComponent()).toBe(true);
    });

    it('should throw error when template file does not exist', () => {
      const componentWithMissingTemplate = `
        import { Component } from '@angular/core';
        @Component({
          selector: 'app-test',
          templateUrl: './missing.component.html'
        })
        export class TestComponent {}
      `;

      const sourceFile = project.createSourceFile('test.component.ts', componentWithMissingTemplate);
      const component = project.getComponent('test.component.ts');

      expect(() => component?.getTemplate()).toThrow('Template file not found: ./missing.component.html');
    });

    it('should handle nested template paths correctly', () => {
      // Create a nested template file
      writeFiles({
        'src/components/nested/test.component.html': '<div>Nested Template</div>'
      });

      const componentWithNestedTemplate = `
        import { Component } from '@angular/core';
        @Component({
          selector: 'app-nested',
          templateUrl: './test.component.html'
        })
        export class NestedComponent {}
      `;

      const sourceFile = project.createSourceFile('src/components/nested/test.component.ts', componentWithNestedTemplate);
      const component = project.getComponent('src/components/nested/test.component.ts');

      expect(component).toBeDefined();
      expect(component?.getTemplate()).toBe('<div>Nested Template</div>');
    });
  });

  describe('getComponent', () => {
    const componentContent = createComponent('Test', 'app-test');

    beforeEach(() => {
      project.createSourceFile('test.component.ts', componentContent);
    });

    it('should return component file by path', () => {
      const component = project.getComponent('test.component.ts');
      expect(component).toBeInstanceOf(ComponentFile);
      expect(component?.getTemplate()).toBe('<div>Test</div>');
    });

    it('should return undefined for non-existent file', () => {
      const component = project.getComponent('non-existent.ts');
      expect(component).toBeUndefined();
    });
  });

  describe('getComponents', () => {
    beforeEach(() => {
      // Add multiple components
      const files = {
        'test1.component.ts': createComponent('Test1', 'app-test1', '<div>Test 1</div>'),
        'test2.component.ts': createComponent('Test2', 'app-test2', '<div>Test 2</div>')
      };
      Object.entries(files).forEach(([path, content]) => {
        tsProject.createSourceFile(path, content);
      });
      project = new Project(tsProject); // Reinitialize to process new files
    });

    it('should return all component files', () => {
      const components = project.getComponents();
      expect(components).toHaveLength(2);
      expect(components[0]).toBeInstanceOf(ComponentFile);
      expect(components[1]).toBeInstanceOf(ComponentFile);
    });
  });

  describe('getComponentsByPattern', () => {
    beforeEach(() => {
      // Add components in different directories
      const files = {
        'src/components/test1.component.ts': createComponent('Test1', 'app-test1', '<div>Test 1</div>'),
        'src/shared/test2.component.ts': createComponent('Test2', 'app-test2', '<div>Test 2</div>')
      };
      Object.entries(files).forEach(([path, content]) => {
        tsProject.createSourceFile(path, content);
      });
      project = new Project(tsProject); // Reinitialize to process new files
    });

    it('should return components matching pattern', () => {
      const components = project.getComponentsByPattern('**/components/**/*.ts');
      expect(components).toHaveLength(1);
      expect(components[0]?.getTemplate()).toBe('<div>Test 1</div>');
    });
  });

  describe('findComponentsBySelector', () => {
    beforeEach(() => {
      // Add components with different selectors
      const files = {
        'test1.component.ts': createComponent('Test1', 'app-test1', '<div>Test 1</div>'),
        'test2.component.ts': createComponent('Test2', 'app-test2', '<div>Test 2</div>')
      };
      Object.entries(files).forEach(([path, content]) => {
        tsProject.createSourceFile(path, content);
      });
      project = new Project(tsProject); // Reinitialize to process new files
    });

    it('should find component by selector', () => {
      const components = project.findComponentsBySelector('app-test1');
      expect(components).toHaveLength(1);
      expect(components[0]?.getTemplate()).toBe('<div>Test 1</div>');
    });

    it('should return empty array for non-existent selector', () => {
      const components = project.findComponentsBySelector('non-existent');
      expect(components).toHaveLength(0);
    });
  });
});

class MockProject {
  private files: Map<string, SourceFile> = new Map();

  constructor(private options: { tsConfigFilePath?: string; fileSystem?: InMemoryFileSystemHost }) {}

  addSourceFilesAtPaths(patterns: string | readonly string[]): SourceFile[] {
    const mockNode = {
      getSourceFile: () => mockSourceFile as unknown as SourceFile,
      getProject: () => this as unknown as TsMorphProject,
      getKind: () => SyntaxKind.ObjectLiteralExpression,
      getText: () => `{
        selector: 'app-test',
        template: '<div>Test</div>'
      }`,
      kind: SyntaxKind.ObjectLiteralExpression,
      flags: 0,
      compilerNode: {} as any,
      getChildAt: (index: number) => undefined,
      getChildren: () => [],
      getFirstChild: () => undefined,
      getLastChild: () => undefined,
      getChildCount: () => 0,
      getParent: () => undefined,
      getParentOrThrow: () => { throw new Error('No parent'); }
    } as unknown as Node;

    const mockDecorator = {
      getStructure: () => ({
        name: 'Component',
        kind: StructureKind.Decorator,
        arguments: [`{
          selector: 'app-test',
          template: '<div>Test</div>'
        }`]
      }),
      getName: () => 'Component',
      getArguments: () => [mockNode],
      getSourceFile: () => mockSourceFile as unknown as SourceFile
    } as unknown as Decorator;

    const mockClassDeclaration = {
      getDecorators: () => [mockDecorator],
      getName: () => 'TestComponent',
      getSourceFile: () => mockSourceFile as unknown as SourceFile
    } as unknown as ClassDeclaration;

    const mockSourceFile = {
      getFilePath: () => '/path/to/component.ts',
      getFullText: () => `
        import { Component } from '@angular/core';
        @Component({
          selector: 'app-test',
          template: '<div>Test</div>'
        })
        export class TestComponent {}`,
      getClasses: () => [mockClassDeclaration],
      getSourceFile: () => mockSourceFile as unknown as SourceFile
    } as unknown as SourceFile;

    this.files.set('/path/to/component.ts', mockSourceFile);
    return [mockSourceFile];
  }

  getSourceFile(fileNameOrPath: string): SourceFile | undefined {
    return this.files.get(fileNameOrPath);
  }

  getSourceFiles(pattern?: string | string[]): SourceFile[] {
    return Array.from(this.files.values());
  }
}