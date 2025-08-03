'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  codeExecutor, 
  sessionManager, 
  SupportedLanguage, 
  CodeExecutionResult,
  getLanguageConfig 
} from '@/lib/code-execution';
import { getBlankTemplates, getDefaultBlankTemplate } from '@/lib/code-execution/blank-templates';
import { ClientOnlySyntaxHighlightedEditor } from './ClientOnly';
import { TemplateBrowser } from './TemplateBrowser';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  Copy, 
  Share2, 
  Settings, 
  Maximize2, 
  Minimize2,
  AlertCircle,
  CheckCircle,
  Clock,
  BookOpen,
  Code,
  FileText,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface LiveCodeBlockProps {
  initialCode?: string;
  language?: SupportedLanguage;
  showOutput?: boolean;
  allowEdit?: boolean;
  height?: string;
  showLanguageSelector?: boolean;
  showControls?: boolean;
  showTemplateButton?: boolean;
  showBlankTemplates?: boolean;
  onCodeChange?: (code: string) => void;
  onExecutionComplete?: (result: CodeExecutionResult) => void;
  onLanguageChange?: (language: SupportedLanguage) => void;
  onTemplateRequest?: () => void;
  className?: string;
}

export const LiveCodeBlock: React.FC<LiveCodeBlockProps> = ({
  initialCode = '',
  language = 'javascript',
  showOutput = true,
  allowEdit = true,
  height = '400px',
  showLanguageSelector = true,
  showControls = true,
  showTemplateButton = false,
  showBlankTemplates = true,
  onCodeChange,
  onExecutionComplete,
  onLanguageChange,
  onTemplateRequest,
  className = ''
}) => {
  const [code, setCode] = useState(initialCode);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(language);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'preview' | 'errors'>('console');
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  
  const outputRef = useRef<HTMLDivElement>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  // Get language configuration
  const languageConfig = getLanguageConfig(currentLanguage);

  // Initialize session
  useEffect(() => {
    sessionManager.createSession(currentLanguage, code, undefined, false);
  }, []);

  // Handle code changes
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    sessionManager.updateSessionCode(sessionId, newCode);
    onCodeChange?.(newCode);
  }, [sessionId, onCodeChange]);

  // Handle language changes
  const handleLanguageChange = useCallback((newLanguage: SupportedLanguage) => {
    setCurrentLanguage(newLanguage);
    
    // Set default code for new language if current code is empty or default
    const config = getLanguageConfig(newLanguage);
    if (!code.trim() || code === getLanguageConfig(currentLanguage).defaultCode) {
      handleCodeChange(config.defaultCode);
    }
    
    onLanguageChange?.(newLanguage);
  }, [code, currentLanguage, handleCodeChange, onLanguageChange]);

  // Handle blank template selection
  const handleBlankTemplate = useCallback((templateCode: string) => {
    handleCodeChange(templateCode);
  }, [handleCodeChange]);

  // Handle template browser selection
  const handleTemplateBrowserSelect = useCallback((template: any) => {
    handleCodeChange(template.code);
    setShowTemplateBrowser(false);
  }, [handleCodeChange]);

  // Execute code
  const executeCode = useCallback(async () => {
    if (!code.trim() || isExecuting) return;

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const result = await codeExecutor.execute({
        code,
        language: currentLanguage,
        sessionId
      });

      setExecutionResult(result);
      sessionManager.addExecutionResult(sessionId, result);
      onExecutionComplete?.(result);

      // Handle iframe display for web languages
      if (['html', 'css', 'javascript', 'typescript'].includes(currentLanguage)) {
        displayWebOutput(result);
      }

      // Auto-switch to appropriate tab based on result
      if (result.error) {
        setActiveTab('errors');
      } else if (result.visualOutput) {
        setActiveTab('preview');
      } else {
        setActiveTab('console');
      }

    } catch (error) {
      const errorResult: CodeExecutionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0
      };
      setExecutionResult(errorResult);
      setActiveTab('errors');
    } finally {
      setIsExecuting(false);
    }
  }, [code, currentLanguage, sessionId, isExecuting, onExecutionComplete]);

  // Display web output in iframe
  const displayWebOutput = useCallback((result: CodeExecutionResult) => {
    if (!iframeContainerRef.current || !result.visualOutput) return;

    // Clear previous iframe
    iframeContainerRef.current.innerHTML = '';

    // Get iframe from web engine
    const webEngine = (codeExecutor as any).engines?.get('web');
    if (webEngine && typeof webEngine.getIframe === 'function') {
      const iframe = webEngine.getIframe(sessionId);
      if (iframe) {
        // Clone the iframe to avoid moving the original
        const clonedIframe = iframe.cloneNode(true) as HTMLIFrameElement;
        clonedIframe.style.display = 'block';
        clonedIframe.style.width = '100%';
        clonedIframe.style.height = '100%';
        clonedIframe.style.border = 'none';
        clonedIframe.style.borderRadius = '4px';
        clonedIframe.style.background = 'hsl(var(--card))';
        
        // Copy the content from original iframe
        try {
          const originalDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (originalDoc) {
            clonedIframe.onload = () => {
              const clonedDoc = clonedIframe.contentDocument || clonedIframe.contentWindow?.document;
              if (clonedDoc) {
                clonedDoc.open();
                clonedDoc.write(originalDoc.documentElement.outerHTML);
                clonedDoc.close();
              }
            };
            clonedIframe.src = 'about:blank';
          }
        } catch (error) {
          console.warn('Failed to copy iframe content:', error);
          // Fallback: just show the iframe as-is
          clonedIframe.src = 'about:blank';
        }
        
        iframeContainerRef.current.appendChild(clonedIframe);
      }
    } else {
      // Fallback: create iframe from HTML content
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '4px';
      iframe.style.background = 'hsl(var(--card))';
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      
      iframe.onload = () => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc && result.visualOutput) {
            doc.open();
            doc.write(result.visualOutput);
            doc.close();
          }
        } catch (error) {
          console.warn('Failed to inject content into fallback iframe:', error);
        }
      };
      
      iframe.src = 'about:blank';
      iframeContainerRef.current.appendChild(iframe);
    }
  }, [sessionId]);

  // Copy code to clipboard
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      // Could add toast notification here
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  }, [code]);

  // Share code
  const shareCode = useCallback(() => {
    // Implementation for sharing functionality
    const shareUrl = `${window.location.origin}/code/${sessionId}`;
    navigator.clipboard.writeText(shareUrl);
    // Could add toast notification here
  }, [sessionId]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            executeCode();
            break;
          case 's':
            e.preventDefault();
            // Could implement save functionality
            break;
        }
      }
    };

    if (allowEdit) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [allowEdit, executeCode]);

  // Render execution status
  const renderExecutionStatus = () => {
    if (isExecuting) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="w-3 h-3 animate-spin" />
          Executing...
        </Badge>
      );
    }

    if (executionResult) {
      return (
        <Badge 
          variant={executionResult.success ? "default" : "destructive"}
          className="flex items-center gap-1"
        >
          {executionResult.success ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          {executionResult.success ? 'Success' : 'Error'}
          <span className="text-xs ml-1">
            ({executionResult.executionTime}ms)
          </span>
        </Badge>
      );
    }

    return null;
  };

  return (
    <div className={`live-code-block ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''} ${className}`}>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Live Code Editor</CardTitle>
            <div className="flex items-center gap-2">
              {renderExecutionStatus()}
              {showControls && (
                <div className="flex items-center gap-1">
                  {showTemplateButton && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onTemplateRequest}
                      title="Browse templates"
                    >
                      <BookOpen className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyCode}
                    title="Copy code"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareCode}
                    title="Share code"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {showLanguageSelector && (
              <Select value={currentLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="yaml">YAML</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Blank Templates Dropdown */}
            {showBlankTemplates && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    New
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Blank Templates</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {getBlankTemplates(currentLanguage).map((template) => (
                    <DropdownMenuItem
                      key={template.name}
                      onClick={() => handleBlankTemplate(template.code)}
                    >
                      <Code className="w-4 h-4 mr-2" />
                      {template.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Template Browser */}
            {showTemplateButton && (
              <Dialog open={showTemplateBrowser} onOpenChange={setShowTemplateBrowser}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Templates
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Code Templates</DialogTitle>
                  </DialogHeader>
                  <TemplateBrowser
                    language={currentLanguage}
                    onTemplateSelect={handleTemplateBrowserSelect}
                    showLanguageFilter={true}
                    compact={false}
                  />
                </DialogContent>
              </Dialog>
            )}
            
            <Button
              onClick={executeCode}
              disabled={isExecuting || !code.trim()}
              className="flex items-center gap-2"
            >
              {isExecuting ? (
                <Square className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isExecuting ? 'Stop' : 'Run'}
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {languageConfig.name} • Ctrl+Enter to run
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className={`grid ${showOutput ? 'grid-cols-2' : 'grid-cols-1'} h-full`}>
            {/* Code Editor */}
            <div className="border-r">
              <div className="relative code-container" style={{ height }}>
                {allowEdit ? (
                  <ClientOnlySyntaxHighlightedEditor
                    value={code}
                    onChange={handleCodeChange}
                    language={currentLanguage}
                    height={height}
                    theme="dark"
                    placeholder={`Enter ${languageConfig.name} code here...`}
                    onExecute={executeCode}
                    className="w-full h-full syntax-highlighted-editor"
                  />
                ) : (
                  <SyntaxHighlighter
                    language={languageConfig.syntaxHighlighting}
                    style={vscDarkPlus}
                    className="absolute inset-0 w-full h-full !m-0"
                    customStyle={{
                      padding: '16px',
                      fontSize: '14px',
                      height: '100%',
                      overflow: 'auto',
                      scrollbarGutter: 'stable'
                    }}
                  >
                    {code}
                  </SyntaxHighlighter>
                )}
              </div>
            </div>

            {/* Output Panel */}
            {showOutput && (
              <div className="flex flex-col" style={{ height }}>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="console">Console</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="errors">Errors</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="console" className="flex-1 p-4 overflow-auto" style={{ scrollbarGutter: 'stable' }}>
                    <div ref={outputRef} className="font-mono text-sm whitespace-pre-wrap">
                      {executionResult?.output || 'No output yet. Run your code to see results.'}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="preview" className="flex-1 p-0">
                    <div 
                      ref={iframeContainerRef} 
                      className="w-full h-full bg-slate-900 rounded-md relative"
                      style={{ minHeight: '300px' }}
                    >
                      {executionResult?.visualOutput ? (
                        <iframe
                          srcDoc={executionResult.visualOutput}
                          className="w-full h-full border-0 rounded-md"
                          style={{ minHeight: '300px' }}
                          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                          title="Code Preview"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <div className="text-center">
                            <div className="text-lg mb-2">🖼️</div>
                            <p>No preview available</p>
                            <p className="text-sm">Run HTML, CSS, or JavaScript code to see visual output</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="errors" className="flex-1 p-4 overflow-auto" style={{ scrollbarGutter: 'stable' }}>
                    <div className="font-mono text-sm text-red-600">
                      {executionResult?.error || 'No errors.'}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};