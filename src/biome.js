import { loadModule, wrapError } from './wasm';

function isFormatContentDebug(options) {
  return 'debug' in options && options.debug !== undefined;
}
export default class Biome {
  module;
  workspace;
  constructor(module, workspace) {
    this.module = module;
    this.workspace = workspace;
  }

  /**
   * It creates a new instance of the class {Biome}.
   */
  static async create() {
    const module = await loadModule();
    const workspace = new module.Workspace();
    return new Biome(module, workspace);
  }

  /**
   * Stop this instance of Biome
   *
   * After calling `shutdown()` on this object, it should be considered
   * unusable as calling any method on it will fail
   */
  shutdown() {
    this.workspace.free();
  }

  /**
   * Allows to apply a custom configuration.
   *
   * If fails when the configuration is incorrect.
   *
   * @param configuration
   */
  applyConfiguration(configuration) {
    try {
      this.workspace.updateSettings({
        configuration,
        gitignore_matches: [],
      });
    } catch (e) {
      throw wrapError(e);
    }
  }

  withFile(path, content, func) {
    try {
      const biomePath = {
        path,
      };
      this.workspace.openFile({
        content,
        version: 0,
        path: biomePath,
      });
      try {
        return func(biomePath);
      } finally {
        this.workspace.closeFile({
          path: biomePath,
        });
      }
    } catch (err) {
      throw wrapError(err);
    }
  }

  /**
   * If formats some content.
   *
   * @param {string} content The content to format
   * @param {FormatContentOptions | FormatContentDebugOptions} options Options needed when formatting some content
   */
  formatContent(content, options) {
    return this.withFile(options.filePath, content, path => {
      let code = content;
      const { diagnostics } = this.workspace.pullDiagnostics({
        path,
        categories: ['Syntax'],
        max_diagnostics: Number.MAX_SAFE_INTEGER,
      });
      const hasErrors = diagnostics.some(
        diag => diag.severity === 'fatal' || diag.severity === 'error',
      );
      if (!hasErrors) {
        if (options.range) {
          const result = this.workspace.formatRange({
            path,
            range: options.range,
          });
          code = result.code;
        } else {
          const result = this.workspace.formatFile({
            path,
          });
          code = result.code;
        }
        if (isFormatContentDebug(options)) {
          const ir = this.workspace.getFormatterIr({
            path,
          });
          return {
            content: code,
            diagnostics,
            ir,
          };
        }
      }
      return {
        content: code,
        diagnostics,
      };
    });
  }

  /**
   * Lint the content of a file.
   *
   * @param {string} content The content to lint
   * @param {LintContentOptions} options Options needed when linting some content
   */
  lintContent(content, options) {
    return this.withFile(options.filePath, content, path => {
      return this.workspace.pullDiagnostics({
        path,
        categories: ['Syntax', 'Lint'],
        max_diagnostics: Number.MAX_SAFE_INTEGER,
      });
    });
  }

  /**
   * Print a list of diagnostics to an HTML string.
   *
   * @param {Diagnostic[]} diagnostics The list of diagnostics to print
   * @param {PrintDiagnosticsOptions} options Options needed for printing the diagnostics
   */
  printDiagnostics(diagnostics, options) {
    try {
      const printer = new this.module.DiagnosticPrinter(options.filePath, options.fileSource);
      try {
        for (const diag of diagnostics) {
          if (options.verbose) {
            printer.print_verbose(diag);
          } else {
            printer.print_simple(diag);
          }
        }
      } catch (err) {
        // Only call `free` if the `print` method throws, `finish` will
        // take care of deallocating the printer even if it fails
        printer.free();
        throw err;
      }
      return printer.finish();
    } catch (err) {
      throw wrapError(err);
    }
  }
}
