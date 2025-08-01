/**
 * Markdown Execution Engine for rendering and preview
 */

import { 
  ExecutionEngine, 
  CodeExecutionRequest, 
  CodeExecutionResult, 
  SupportedLanguage 
} from '../types';

export class MarkdownExecutionEngine implements ExecutionEngine {
  name = 'markdown';
  supportedLanguages: SupportedLanguage[] = ['markdown'];

  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const markdownString = request.code.trim();
      
      if (!markdownString) {
        return {
          success: true,
          output: 'No Markdown content provided',
          executionTime: Date.now() - startTime
        };
      }

      // Parse and render markdown
      const htmlOutput = this.parseMarkdown(markdownString);
      
      // Generate analysis
      const analysis = this.analyzeMarkdown(markdownString);
      
      // Create visual output with rendered HTML
      const visualOutput = this.createMarkdownVisualization(htmlOutput, analysis);

      return {
        success: true,
        output: `Markdown processed successfully!\n\n${analysis.summary}`,
        visualOutput,
        executionTime: Date.now() - startTime,
        metadata: {
          lines: analysis.lines,
          words: analysis.words,
          characters: analysis.characters,
          headings: analysis.headings,
          links: analysis.links,
          images: analysis.images,
          codeBlocks: analysis.codeBlocks
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Markdown processing error',
        executionTime: Date.now() - startTime
      };
    }
  }

  async validateCode(code: string): Promise<boolean> {
    // Markdown is generally always valid, but we can check for basic structure
    return true;
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for Markdown processing
  }

  // Private methods

  private parseMarkdown(markdown: string): string {
    // Simple markdown parser - in production, you'd use a library like marked or markdown-it
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />');

    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

    // Wrap consecutive list items in ul/ol tags
    html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
      return `<ul>${match}</ul>`;
    });

    // Blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr>');
    html = html.replace(/^\*\*\*$/gim, '<hr>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = `<p>${html}</p>`;

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');

    return html;
  }

  private analyzeMarkdown(markdown: string): {
    lines: number;
    words: number;
    characters: number;
    headings: number;
    links: number;
    images: number;
    codeBlocks: number;
    summary: string;
  } {
    const lines = markdown.split('\n').length;
    const words = markdown.split(/\s+/).filter(word => word.length > 0).length;
    const characters = markdown.length;
    
    const headings = (markdown.match(/^#{1,6}\s/gm) || []).length;
    const links = (markdown.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
    const images = (markdown.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []).length;
    const codeBlocks = (markdown.match(/```[\s\S]*?```/g) || []).length;

    let summary = `Markdown Analysis:\n`;
    summary += `- Lines: ${lines}\n`;
    summary += `- Words: ${words}\n`;
    summary += `- Characters: ${characters}\n`;
    summary += `- Headings: ${headings}\n`;
    summary += `- Links: ${links}\n`;
    summary += `- Images: ${images}\n`;
    summary += `- Code blocks: ${codeBlocks}\n`;

    return { lines, words, characters, headings, links, images, codeBlocks, summary };
  }

  private createMarkdownVisualization(htmlOutput: string, analysis: any): string {
    return `
      <div class="markdown-visualization space-y-4">
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 class="font-medium text-purple-800 mb-2 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Markdown Statistics
          </h4>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-purple-600 font-medium">Lines:</span> ${analysis.lines}
            </div>
            <div>
              <span class="text-purple-600 font-medium">Words:</span> ${analysis.words}
            </div>
            <div>
              <span class="text-purple-600 font-medium">Headings:</span> ${analysis.headings}
            </div>
            <div>
              <span class="text-purple-600 font-medium">Links:</span> ${analysis.links}
            </div>
            <div>
              <span class="text-purple-600 font-medium">Images:</span> ${analysis.images}
            </div>
            <div>
              <span class="text-purple-600 font-medium">Code blocks:</span> ${analysis.codeBlocks}
            </div>
          </div>
        </div>
        
        <div class="bg-white border rounded-lg p-6">
          <h4 class="font-medium text-gray-800 mb-4 pb-2 border-b">Rendered Preview</h4>
          <div class="prose prose-sm max-w-none markdown-content">
            ${htmlOutput}
          </div>
        </div>
      </div>
      
      <style>
        .markdown-content h1 { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 1rem 0; color: #1f2937; }
        .markdown-content h2 { font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.75rem 0; color: #374151; }
        .markdown-content h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem 0; color: #4b5563; }
        .markdown-content p { margin: 0.75rem 0; line-height: 1.6; color: #374151; }
        .markdown-content strong { font-weight: 600; color: #1f2937; }
        .markdown-content em { font-style: italic; }
        .markdown-content code { background: #f3f4f6; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875em; }
        .markdown-content pre { background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }
        .markdown-content pre code { background: none; padding: 0; color: inherit; }
        .markdown-content a { color: #3b82f6; text-decoration: underline; }
        .markdown-content a:hover { color: #1d4ed8; }
        .markdown-content ul { margin: 0.75rem 0; padding-left: 1.5rem; }
        .markdown-content li { margin: 0.25rem 0; }
        .markdown-content blockquote { border-left: 4px solid #d1d5db; padding-left: 1rem; margin: 1rem 0; font-style: italic; color: #6b7280; }
        .markdown-content hr { border: none; border-top: 1px solid #d1d5db; margin: 2rem 0; }
        .markdown-content img { border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
      </style>
    `;
  }
}