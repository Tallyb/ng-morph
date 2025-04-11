import { SourceFile, Node, Decorator } from 'ts-morph';

/**
 * Represents an Angular component file
 */
export class ComponentFile {
  private templateContent: string | null = null;
  private componentDecorator: Decorator | null = null;
  private sourceFile: SourceFile;

  constructor(sourceFile: SourceFile) {
    this.sourceFile = sourceFile;
    this.findComponentDecorator();
    this.parseTemplate();
  }

  /**
   * Get the component decorator
   */
  getComponentDecorator(): Decorator | null {
    return this.componentDecorator;
  }

  /**
   * Find the @Component decorator in the source file
   */
  private findComponentDecorator(): void {
    const classes = this.sourceFile.getClasses();

    for (const classDecl of classes) {
      const decorator = classDecl.getDecorator('Component');
      if (decorator) {
        this.componentDecorator = decorator;
        break;
      }
    }
  }

  /**
   * Parse the template from the component decorator
   * @throws Error if template URL is specified but file doesn't exist
   */
  private parseTemplate(): void {
    if (!this.componentDecorator) return;

    const args = this.componentDecorator.getArguments();
    if (args.length === 0) return;

    const decoratorConfig = args[0];
    if (!Node.isObjectLiteralExpression(decoratorConfig)) return;

    // Try to get inline template
    const templateProp = decoratorConfig.getProperty('template');
    if (templateProp && Node.isPropertyAssignment(templateProp)) {
      const initializer = templateProp.getInitializer();
      if (Node.isStringLiteral(initializer)) {
        this.templateContent = initializer.getText().slice(1, -1); // Remove quotes
        return;
      }
    }

    // Try to get template from file
    const templateUrlProp = decoratorConfig.getProperty('templateUrl');
    if (templateUrlProp && Node.isPropertyAssignment(templateUrlProp)) {
      const initializer = templateUrlProp.getInitializer();
      if (Node.isStringLiteral(initializer)) {
        const templatePath = initializer.getText().slice(1, -1); // Remove quotes

        // Resolve the template path relative to the component file
        const componentDir = this.sourceFile.getDirectoryPath();
        const fullTemplatePath = `${componentDir}/${templatePath}`;

        // Try to get the template file from ts-morph project
        const project = this.sourceFile.getProject();
        try {
          const templateFile = project.getSourceFileOrThrow(fullTemplatePath);
          this.templateContent = templateFile.getFullText();
        } catch (error) {
          throw new Error(`Template file not found: ${templatePath}`);
        }
      }
    }
  }

  /**
   * Get the underlying ts-morph SourceFile
   */
  getSourceFile(): SourceFile {
    return this.sourceFile;
  }

  /**
   * Get the file path
   */
  getFilePath(): string {
    return this.sourceFile.getFilePath();
  }

  /**
   * Get the source file content
   */
  getContent(): string {
    return this.sourceFile.getFullText();
  }

  /**
   * Get the template content
   */
  getTemplate(): string | null {
    return this.templateContent;
  }

  /**
   * Check if the file contains an Angular component
   */
  isComponent(): boolean {
    return this.componentDecorator !== null;
  }

  /**
   * Get the component class name
   */
  getComponentClassName(): string | null {
    if (!this.componentDecorator) return null;

    const classDecl = this.componentDecorator.getParent();
    if (!Node.isClassDeclaration(classDecl)) return null;

    return classDecl.getName() || null;
  }
}