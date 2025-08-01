/**
 * Python Execution Worker
 * Provides isolated Python execution using Web Workers and Pyodide
 */

// This file will be loaded as a Web Worker
declare const self: DedicatedWorkerGlobalScope;

interface WorkerMessage {
  type: 'execute' | 'terminate' | 'install_packages';
  id: string;
  code?: string;
  packages?: string[];
  timeout?: number;
}

interface WorkerResponse {
  type: 'result' | 'error' | 'progress' | 'packages_installed';
  id: string;
  success?: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  plots?: string[];
  progress?: string;
}

class PythonWorker {
  private pyodide: any = null;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;
  private executionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    self.onmessage = this.handleMessage.bind(this);
    this.initializePyodide();
  }

  private async initializePyodide(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadPyodideRuntime();
    return this.loadPromise;
  }

  private async loadPyodideRuntime(): Promise<void> {
    this.isLoading = true;
    
    try {
      // Import Pyodide
      importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js');
      
      this.pyodide = await (self as any).loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
        stdout: (text: string) => {
          // Capture stdout
          this.sendProgress('stdout', text);
        },
        stderr: (text: string) => {
          // Capture stderr
          this.sendProgress('stderr', text);
        }
      });

      // Install common packages
      await this.installDefaultPackages();
      
      // Set up security restrictions
      this.setupSecurityRestrictions();
      
      console.log('Pyodide loaded successfully in worker');
      
    } catch (error) {
      console.error('Failed to load Pyodide in worker:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  private async installDefaultPackages(): Promise<void> {
    const packages = ['numpy', 'pandas', 'matplotlib'];
    
    try {
      this.sendProgress('progress', 'Installing Python packages...');
      await this.pyodide.loadPackage(packages);
      this.sendProgress('progress', 'Python packages installed successfully');
    } catch (error) {
      console.warn('Failed to install some packages:', error);
      this.sendProgress('progress', 'Some packages failed to install');
    }
  }

  private setupSecurityRestrictions(): void {
    // Disable dangerous modules and functions
    this.pyodide.runPython(`
import sys
import builtins

# List of dangerous modules to block
BLOCKED_MODULES = {
    'os', 'sys', 'subprocess', 'socket', 'urllib', 'requests',
    'http', 'ftplib', 'smtplib', 'telnetlib', 'webbrowser',
    'tempfile', 'shutil', 'glob', 'pickle', 'marshal',
    'importlib', '__builtin__', '__builtins__'
}

# Store original import function
original_import = builtins.__import__

def secure_import(name, globals=None, locals=None, fromlist=(), level=0):
    # Check if module is in blocked list
    if name in BLOCKED_MODULES or (fromlist and any(f in BLOCKED_MODULES for f in fromlist)):
        raise ImportError(f"Module '{name}' is not allowed for security reasons")
    
    # Allow safe modules
    return original_import(name, globals, locals, fromlist, level)

# Replace import function
builtins.__import__ = secure_import

# Block dangerous built-in functions
dangerous_builtins = ['eval', 'exec', 'compile', '__import__', 'open', 'input']
for func_name in dangerous_builtins:
    if hasattr(builtins, func_name):
        def blocked_function(*args, **kwargs):
            raise RuntimeError(f"Function '{func_name}' is not allowed for security reasons")
        setattr(builtins, func_name, blocked_function)

print("Security restrictions applied")
    `);
  }

  private async handleMessage(event: MessageEvent<WorkerMessage>): Promise<void> {
    const { type, id, code, packages, timeout } = event.data;

    try {
      switch (type) {
        case 'execute':
          if (code) {
            await this.executePython(id, code, timeout);
          }
          break;
        
        case 'install_packages':
          if (packages) {
            await this.installPackages(id, packages);
          }
          break;
        
        case 'terminate':
          this.terminateExecution(id);
          break;
      }
    } catch (error) {
      this.sendResponse({
        type: 'error',
        id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async executePython(id: string, code: string, timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Ensure Pyodide is loaded
      await this.initializePyodide();
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.sendResponse({
          type: 'error',
          id,
          success: false,
          error: `Execution timed out after ${timeout}ms`
        });
      }, timeout);
      
      this.executionTimeouts.set(id, timeoutId);
      
      // Capture output
      let output = '';
      let plots: string[] = [];
      
      // Set up output capture
      this.pyodide.runPython(`
import sys
from io import StringIO
import matplotlib.pyplot as plt
import base64
from io import BytesIO

# Capture stdout
old_stdout = sys.stdout
sys.stdout = captured_output = StringIO()

# Set up matplotlib for web
plt.switch_backend('Agg')
      `);
      
      // Execute user code
      this.pyodide.runPython(code);
      
      // Get captured output
      output = this.pyodide.runPython(`
captured_output.getvalue()
      `);
      
      // Check for matplotlib plots
      const plotsData = this.pyodide.runPython(`
import matplotlib.pyplot as plt
import base64
from io import BytesIO

plots_data = []
for i in plt.get_fignums():
    fig = plt.figure(i)
    buf = BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=100)
    buf.seek(0)
    img_data = base64.b64encode(buf.read()).decode()
    plots_data.append(f"data:image/png;base64,{img_data}")
    buf.close()

plt.close('all')  # Clean up
plots_data
      `);
      
      if (plotsData && plotsData.length > 0) {
        plots = plotsData;
      }
      
      // Restore stdout
      this.pyodide.runPython(`
sys.stdout = old_stdout
      `);
      
      // Clear timeout
      clearTimeout(timeoutId);
      this.executionTimeouts.delete(id);
      
      // Send result
      this.sendResponse({
        type: 'result',
        id,
        success: true,
        output: output || 'Code executed successfully',
        executionTime: Date.now() - startTime,
        plots
      });
      
    } catch (error) {
      // Clear timeout
      const timeoutId = this.executionTimeouts.get(id);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.executionTimeouts.delete(id);
      }
      
      this.sendResponse({
        type: 'error',
        id,
        success: false,
        error: error instanceof Error ? error.message : 'Python execution error',
        executionTime: Date.now() - startTime
      });
    }
  }

  private async installPackages(id: string, packages: string[]): Promise<void> {
    try {
      await this.initializePyodide();
      
      this.sendProgress('progress', `Installing packages: ${packages.join(', ')}`);
      await this.pyodide.loadPackage(packages);
      
      this.sendResponse({
        type: 'packages_installed',
        id,
        success: true
      });
      
    } catch (error) {
      this.sendResponse({
        type: 'error',
        id,
        success: false,
        error: `Failed to install packages: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  private terminateExecution(id: string): void {
    const timeoutId = this.executionTimeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.executionTimeouts.delete(id);
    }
    
    // Note: We can't actually terminate running Python code in Pyodide
    // This is a limitation of the current implementation
    this.sendResponse({
      type: 'result',
      id,
      success: false,
      error: 'Execution terminated by user'
    });
  }

  private sendResponse(response: WorkerResponse): void {
    self.postMessage(response);
  }

  private sendProgress(type: string, message: string): void {
    // Send progress updates (this could be enhanced to include execution ID)
    self.postMessage({
      type: 'progress',
      id: 'progress',
      progress: `${type}: ${message}`
    });
  }
}

// Initialize the worker
new PythonWorker();