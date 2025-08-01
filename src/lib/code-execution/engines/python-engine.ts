/**
 * Python Execution Engine using Pyodide WebAssembly runtime
 */

import { 
  ExecutionEngine, 
  CodeExecutionRequest, 
  CodeExecutionResult, 
  SupportedLanguage 
} from '../types';

// Pyodide types
interface PyodideInterface {
  runPython(code: string): any;
  loadPackage(packages: string | string[]): Promise<void>;
  globals: any;
  registerJsModule(name: string, module: any): void;
  unregisterJsModule(name: string): void;
  toPy(obj: any): any;
  toJs(obj: any): any;
  version: string;
}

declare global {
  interface Window {
    loadPyodide: (config?: any) => Promise<PyodideInterface>;
  }
}

export class PythonExecutionEngine implements ExecutionEngine {
  name = 'pyodide';
  supportedLanguages: SupportedLanguage[] = ['python'];
  
  private pyodide: PyodideInterface | null = null;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;
  private loadedPackages = new Set<string>();
  private outputBuffer: string[] = [];

  constructor() {
    // Initialize Pyodide loading only in browser environment
    if (typeof window !== 'undefined') {
      this.initializePyodide();
    }
  }

  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Ensure Pyodide is loaded
      await this.ensurePyodideLoaded();
      
      if (!this.pyodide) {
        throw new Error('Pyodide failed to load');
      }

      // Load required packages
      if (request.options?.packages) {
        await this.loadPackages(request.options.packages);
      }

      // Clear output buffer
      this.outputBuffer = [];
      
      // Set up execution timeout
      const timeout = request.options?.timeout || 30000;
      const executionPromise = this.executeWithTimeout(request.code, timeout);
      
      // Execute Python code with timeout
      let result: any;
      try {
        result = await executionPromise;
      } catch (pythonError) {
        return {
          success: false,
          error: this.formatPythonError(pythonError),
          output: this.outputBuffer.join('\n'),
          executionTime: Date.now() - startTime
        };
      }

      // Capture any final output
      const output = this.outputBuffer.join('\n');
      
      // Handle different result types
      let visualOutput: string | undefined;
      if (this.isMatplotlibPlot(result)) {
        visualOutput = await this.renderMatplotlibPlot();
      }

      // Check for pandas DataFrames and render them as HTML tables
      let dataOutput: string | undefined;
      try {
        const hasDataFrames = this.pyodide.runPython(`
import sys
import pandas as pd

# Check if there are any DataFrames in the global namespace
# Create a copy of globals to avoid iteration issues
globals_copy = dict(globals())
dataframes = []
for name, obj in globals_copy.items():
    if isinstance(obj, pd.DataFrame) and not name.startswith('_'):
        dataframes.append((name, obj))

len(dataframes) > 0
        `);

        if (hasDataFrames) {
          dataOutput = this.pyodide.runPython(`
# Render DataFrames as HTML using the same globals copy
html_output = []
for name, df in dataframes:
    html_output.append(f'<h4 class="font-medium mb-2">DataFrame: {name}</h4>')
    html_output.append(df.to_html(classes='table-auto border-collapse border border-gray-300', 
                                  table_id=f'df-{name}',
                                  escape=False,
                                  max_rows=100))
    html_output.append('<div class="mb-4"></div>')

'<div class="space-y-4">' + ''.join(html_output) + '</div>'
          `);
        }
      } catch (error) {
        // DataFrame rendering failed, continue without it
        console.warn('Failed to render DataFrames:', error);
      }

      // Check memory usage if available
      const memoryUsage = this.getMemoryUsage();

      // Combine visual outputs
      let combinedVisualOutput = visualOutput;
      if (dataOutput) {
        if (combinedVisualOutput) {
          combinedVisualOutput = `${dataOutput}<div class="mt-6">${combinedVisualOutput}</div>`;
        } else {
          combinedVisualOutput = dataOutput;
        }
      }

      return {
        success: true,
        output: output || (result !== undefined ? String(result) : ''),
        visualOutput: combinedVisualOutput,
        executionTime: Date.now() - startTime,
        memoryUsage,
        metadata: {
          pythonVersion: this.pyodide.version,
          loadedPackages: Array.from(this.loadedPackages),
          hasPlots: Boolean(visualOutput),
          hasDataFrames: Boolean(dataOutput)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Python execution error',
        executionTime: Date.now() - startTime
      };
    }
  }

  async validateCode(code: string): Promise<boolean> {
    try {
      await this.ensurePyodideLoaded();
      
      if (!this.pyodide) {
        return false;
      }

      // Try to compile the code without executing it
      this.pyodide.runPython(`
import ast
try:
    ast.parse("""${code.replace(/"/g, '\\"')}""")
    __validation_result__ = True
except SyntaxError:
    __validation_result__ = False
      `);
      
      return this.pyodide.globals.get('__validation_result__');
    } catch {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    // Clear output buffer
    this.outputBuffer = [];
    
    // Reset Python globals if needed
    if (this.pyodide) {
      try {
        this.pyodide.runPython(`
# Clear user-defined variables but keep built-ins
import builtins
user_vars = [name for name in globals() if not name.startswith('_') and name not in dir(builtins)]
for var in user_vars:
    del globals()[var]
        `);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  // Private methods

  private async initializePyodide(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadPyodideRuntime();
    return this.loadPromise;
  }

  private async loadPyodideRuntime(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Pyodide can only run in browser environment');
    }

    this.isLoading = true;

    try {
      // Load Pyodide script if not already loaded
      if (!window.loadPyodide) {
        await this.loadPyodideScript();
      }

      // Initialize Pyodide
      this.pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
        stdout: (text: string) => {
          this.outputBuffer.push(text);
        },
        stderr: (text: string) => {
          this.outputBuffer.push(text);
        }
      });

      // Load essential packages
      await this.loadEssentialPackages();

    } catch (error) {
      throw new Error(`Failed to load Pyodide: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadPyodideScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Pyodide script'));
      document.head.appendChild(script);
    });
  }

  private async loadEssentialPackages(): Promise<void> {
    if (!this.pyodide) return;

    // Core ML and data science packages (removed seaborn as it's not reliably available in Pyodide)
    const essentialPackages = [
      'numpy', 
      'pandas', 
      'matplotlib', 
      'scikit-learn',
      'scipy'
    ];
    
    // Optional packages that might not be available
    const optionalPackages = [
      'seaborn'
    ];
    
    try {
      // Load essential packages individually for better error handling
      for (const pkg of essentialPackages) {
        try {
          await this.pyodide.loadPackage(pkg);
          this.loadedPackages.add(pkg);
          console.log(`✓ Loaded essential package: ${pkg}`);
        } catch (error) {
          console.warn(`⚠ Failed to load essential package ${pkg}:`, error);
        }
      }

      // Try to load optional packages
      for (const pkg of optionalPackages) {
        try {
          await this.pyodide.loadPackage(pkg);
          this.loadedPackages.add(pkg);
          console.log(`✓ Loaded optional package: ${pkg}`);
        } catch (error) {
          console.warn(`⚠ Optional package ${pkg} not available:`, error);
        }
      }
    } catch (error) {
      console.warn('Error during package loading:', error);
    }

    // Set up matplotlib for inline plotting
    if (this.loadedPackages.has('matplotlib')) {
      try {
        this.pyodide.runPython(`
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
plt.ioff()  # Turn off interactive mode
        `);
        console.log('✓ Matplotlib configured for inline plotting');
      } catch (error) {
        console.warn('Failed to configure matplotlib:', error);
      }
    }

    console.log(`Loaded packages: ${Array.from(this.loadedPackages).join(', ')}`);
  }

  private async ensurePyodideLoaded(): Promise<void> {
    if (this.pyodide) {
      return;
    }

    if (this.isLoading && this.loadPromise) {
      await this.loadPromise;
      return;
    }

    await this.initializePyodide();
  }

  private async loadPackages(packages: string[]): Promise<void> {
    if (!this.pyodide) {
      throw new Error('Pyodide not loaded');
    }

    const packagesToLoad = packages.filter(pkg => !this.loadedPackages.has(pkg));
    
    if (packagesToLoad.length === 0) {
      return;
    }

    // Load packages individually to handle failures gracefully
    const failedPackages: string[] = [];
    const successfulPackages: string[] = [];

    for (const pkg of packagesToLoad) {
      try {
        await this.pyodide.loadPackage(pkg);
        this.loadedPackages.add(pkg);
        successfulPackages.push(pkg);
        console.log(`✓ Loaded package: ${pkg}`);
      } catch (error) {
        failedPackages.push(pkg);
        console.warn(`⚠ Failed to load package ${pkg}:`, error);
      }
    }

    // Only throw error if all packages failed to load
    if (failedPackages.length === packagesToLoad.length) {
      throw new Error(`Failed to load all requested packages: ${failedPackages.join(', ')}`);
    }

    // Log results
    if (successfulPackages.length > 0) {
      console.log(`Successfully loaded: ${successfulPackages.join(', ')}`);
    }
    if (failedPackages.length > 0) {
      console.warn(`Failed to load: ${failedPackages.join(', ')}`);
    }
  }



  private formatPythonError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error && error.message) {
      return error.message;
    }

    // Try to extract Python traceback
    try {
      return String(error);
    } catch {
      return 'Unknown Python error occurred';
    }
  }

  private isMatplotlibPlot(result: any): boolean {
    // Check if matplotlib was used and a plot was created
    if (!this.pyodide || !this.loadedPackages.has('matplotlib')) {
      return false;
    }

    try {
      const hasActiveFigure = this.pyodide.runPython(`
import matplotlib.pyplot as plt
len(plt.get_fignums()) > 0
      `);
      return Boolean(hasActiveFigure);
    } catch {
      return false;
    }
  }

  private hasSeabornPlot(): boolean {
    // Check if seaborn was used (seaborn uses matplotlib backend)
    if (!this.pyodide || !this.loadedPackages.has('seaborn')) {
      return false;
    }

    try {
      // Seaborn plots are also matplotlib figures
      return this.isMatplotlibPlot(null);
    } catch {
      return false;
    }
  }

  private async renderMatplotlibPlot(): Promise<string> {
    if (!this.pyodide) {
      return '';
    }

    try {
      // Enhanced plot rendering with better quality and multiple format support
      const imageData = this.pyodide.runPython(`
import matplotlib.pyplot as plt
import io
import base64

# Get all figure numbers
fig_nums = plt.get_fignums()
if not fig_nums:
    ""  # No figures to render

# Render all figures (usually just one, but handle multiple)
images = []
for fig_num in fig_nums:
    fig = plt.figure(fig_num)
    
    # Save plot to bytes buffer with high quality
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=150, 
                facecolor='white', edgecolor='none', 
                pad_inches=0.1, transparent=False)
    buf.seek(0)
    
    # Convert to base64
    image_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    images.append(f'data:image/png;base64,{image_base64}')
    
    buf.close()

# Close all figures to free memory
plt.close('all')

# Return the first image (most common case) or combine multiple
images[0] if len(images) == 1 else images
      `);

      // Handle single image or multiple images
      if (typeof imageData === 'string') {
        return imageData;
      } else if (Array.isArray(imageData) && imageData.length > 0) {
        // For multiple plots, create an HTML container
        const plotsHtml = imageData.map((img, idx) => 
          `<div class="mb-4">
            <h4 class="text-sm font-medium mb-2">Plot ${idx + 1}</h4>
            <img src="${img}" alt="Plot ${idx + 1}" class="max-w-full h-auto border rounded" />
          </div>`
        ).join('');
        
        return `<div class="space-y-4">${plotsHtml}</div>`;
      }

      return '';
    } catch (error) {
      console.error('Failed to render matplotlib plot:', error);
      return '';
    }
  }

  private async executeWithTimeout(code: string, timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Python execution timed out after ${timeout}ms`));
      }, timeout);

      try {
        const result = this.pyodide!.runPython(code);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  private getMemoryUsage(): number | undefined {
    if (!this.pyodide) {
      return undefined;
    }

    try {
      // Get memory usage from Pyodide if available
      const memoryInfo = this.pyodide.runPython(`
import sys
import gc

# Force garbage collection
gc.collect()

# Get memory info (this is approximate)
memory_usage = sys.getsizeof(globals())
memory_usage
      `);

      return typeof memoryInfo === 'number' ? memoryInfo : undefined;
    } catch {
      // Memory tracking not available or failed
      return undefined;
    }
  }
}