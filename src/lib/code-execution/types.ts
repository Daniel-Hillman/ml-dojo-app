/**
 * Core types and interfaces for the Live Code Execution System
 */

export type SupportedLanguage = 
  | 'javascript' | 'typescript' | 'html' | 'css'
  | 'python' | 'sql' | 'json' | 'yaml' | 'markdown'
  | 'regex' | 'bash';

export interface ExecutionOptions {
  timeout?: number;
  memoryLimit?: number;
  packages?: string[];
  sampleData?: string;
  enableNetworking?: boolean;
}

export interface CodeExecutionRequest {
  code: string;
  language: SupportedLanguage;
  options?: ExecutionOptions;
  sessionId?: string;
}

export interface CodeExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  visualOutput?: string; // For HTML previews, plots, etc.
  executionTime: number;
  memoryUsage?: number;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface ExecutionEngine {
  name: string;
  supportedLanguages: SupportedLanguage[];
  execute(request: CodeExecutionRequest): Promise<CodeExecutionResult>;
  validateCode?(code: string): Promise<boolean>;
  cleanup?(): Promise<void>;
}

export interface LanguageConfig {
  name: string;
  engine: string;
  fileExtension: string;
  syntaxHighlighting: string;
  defaultCode: string;
  supportedFeatures: LanguageFeature[];
  requiredPackages?: string[];
  executionTimeout: number;
  memoryLimit: number;
}

export type LanguageFeature = 
  | 'plotting' | 'dataAnalysis' | 'machineLearning'
  | 'livePreview' | 'interactivity' | 'networking'
  | 'fileSystem' | 'database' | 'validation';

export interface ResourceLimits {
  maxExecutionTime: number; // milliseconds
  maxMemoryUsage: number;   // bytes
  maxOutputSize: number;    // characters
  maxConcurrentExecutions: number;
}

export interface ExecutionSession {
  id: string;
  userId?: string;
  language: SupportedLanguage;
  code: string;
  results: CodeExecutionResult[];
  createdAt: Date;
  lastExecutedAt: Date;
  isPublic: boolean;
  tags: string[];
}

export const DEFAULT_LIMITS: ResourceLimits = {
  maxExecutionTime: 30000,    // 30 seconds
  maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  maxOutputSize: 10000,       // 10k characters
  maxConcurrentExecutions: 3  // per user
};