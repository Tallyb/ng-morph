import {
  Project as TsMorphProject,
  SourceFile,
  Node,
  OptionalKind,
  SourceFileStructure,
  SourceFileCreateOptions,
  WriterFunction
} from 'ts-morph';
import { ComponentFile } from './component-file';

export interface ProjectOptions {
  tsConfigFilePath?: string;
  skipAddingFilesFromTsConfig?: boolean;
}

export class Project {
  private componentFiles: Map<string, ComponentFile> = new Map();
  private tsProject: TsMorphProject;

  constructor(tsProject: TsMorphProject) {
    this.tsProject = tsProject;
    this.initializeComponents();
  }

  /**
   * Initialize component files from all TypeScript files in the project
   */
  private initializeComponents(): void {
    const sourceFiles = this.tsProject.getSourceFiles('**/*.ts');
    for (const sourceFile of sourceFiles) {
      this.processSourceFile(sourceFile);
    }
  }

  /**
   * Process a source file and create a ComponentFile if it's an Angular component
   */
  private processSourceFile(sourceFile: SourceFile): void {
    const componentFile = new ComponentFile(sourceFile);
    if (componentFile.isComponent()) {
      this.componentFiles.set(sourceFile.getFilePath(), componentFile);
    }
  }

  /**
   * Create a new component file
   * @param filePath Path where to create the file
   * @param content Content of the file
   */
  createSourceFile(
    filePath: string,
    sourceFileText?: string | WriterFunction | OptionalKind<SourceFileStructure>,
    options?: SourceFileCreateOptions
  ): SourceFile {
    const sourceFile = this.tsProject.createSourceFile(filePath, sourceFileText, options);
    this.processSourceFile(sourceFile);
    return sourceFile;
  }

  /**
   * Get a component file by path
   * @param filePath Path to the component file
   */
  getComponent(filePath: string): ComponentFile | undefined {
    return this.componentFiles.get(filePath);
  }

  /**
   * Get all Angular components in the project
   */
  getComponents(): ComponentFile[] {
    return Array.from(this.componentFiles.values());
  }

  /**
   * Get all component files that match a specific pattern
   * @param pattern File pattern to match against
   */
  getComponentsByPattern(pattern: string): ComponentFile[] {
    const matchedFiles = this.tsProject.getSourceFiles(pattern);
    return matchedFiles
      .map(sourceFile => this.componentFiles.get(sourceFile.getFilePath()))
      .filter((file): file is ComponentFile => file !== undefined);
  }

  /**
   * Find components by selector
   * @param selector CSS selector to match against
   */
  findComponentsBySelector(selector: string): ComponentFile[] {
    return Array.from(this.componentFiles.values())
      .filter(component => {
        const decorator = component.getComponentDecorator();
        if (!decorator) return false;

        const args = decorator.getArguments();
        if (args.length === 0) return false;

        const decoratorConfig = args[0];
        if (!Node.isObjectLiteralExpression(decoratorConfig)) return false;

        const selectorProp = decoratorConfig.getProperty('selector');
        if (!selectorProp || !Node.isPropertyAssignment(selectorProp)) return false;

        const initializer = selectorProp.getInitializer();
        if (!Node.isStringLiteral(initializer)) return false;

        const componentSelector = initializer.getText().slice(1, -1); // Remove quotes
        return componentSelector === selector;
      });
  }

  /**
   * Get the underlying ts-morph project
   */
  getTsMorphProject(): TsMorphProject {
    return this.tsProject;
  }

  /**
   * Save all changes made to components
   */
  saveSync(): void {
    this.tsProject.saveSync();
  }
}