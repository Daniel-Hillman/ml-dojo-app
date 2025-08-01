import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CodeOutput } from '../CodeOutput';
import { CodeExecutionResult } from '@/lib/code-execution';

// Mock data for testing
const mockSuccessResult: CodeExecutionResult = {
  success: true,
  output: 'Hello, World!\nThis is test output',
  executionTime: 150,
  memoryUsage: 1024 * 1024,
  sessionId: 'test-session-123',
  metadata: {
    linesOfCode: 5,
    packagesLoaded: ['numpy']
  }
};

const mockErrorResult: CodeExecutionResult = {
  success: false,
  error: 'SyntaxError: invalid syntax\n  File "<stdin>", line 1\n    print("Hello"\n                ^\nSyntaxError: invalid syntax',
  executionTime: 50,
  sessionId: 'test-session-456'
};

const mockVisualResult: CodeExecutionResult = {
  success: true,
  output: 'Plot generated',
  visualOutput: '<div>Sample visual output</div>',
  executionTime: 300,
  memoryUsage: 2 * 1024 * 1024
};

const mockEmptyResult: CodeExecutionResult = {
  success: true,
  executionTime: 25
};

describe('CodeOutput Component', () => {
  it('renders success result with console output', () => {
    render(<CodeOutput result={mockSuccessResult} language="python" />);
    
    expect(screen.getByText('Execution Result')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('150ms')).toBeInTheDocument();
  });

  it('renders error result with error tab active by default', () => {
    render(<CodeOutput result={mockErrorResult} language="python" />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('SyntaxError')).toBeInTheDocument();
  });

  it('renders visual output with preview tab', () => {
    render(<CodeOutput result={mockVisualResult} language="python" />);
    
    expect(screen.getByText('Visual Output')).toBeInTheDocument();
  });

  it('renders empty state when no output', () => {
    render(<CodeOutput result={mockEmptyResult} language="javascript" />);
    
    expect(screen.getByText('No output generated')).toBeInTheDocument();
    expect(screen.getByText('Run your code to see results here')).toBeInTheDocument();
  });

  it('switches between tabs correctly', () => {
    render(<CodeOutput result={mockSuccessResult} language="python" />);
    
    // Should have console and info tabs
    const consoleTab = screen.getByRole('tab', { name: /console/i });
    const infoTab = screen.getByRole('tab', { name: /info/i });
    
    expect(consoleTab).toBeInTheDocument();
    expect(infoTab).toBeInTheDocument();
    
    // Click info tab
    fireEvent.click(infoTab);
    expect(screen.getByText('Execution Information')).toBeInTheDocument();
  });

  it('formats execution time correctly', () => {
    const longResult: CodeExecutionResult = {
      success: true,
      output: 'test',
      executionTime: 2500 // 2.5 seconds
    };
    
    render(<CodeOutput result={longResult} language="python" />);
    expect(screen.getByText('2.5s')).toBeInTheDocument();
  });

  it('formats memory usage correctly', () => {
    render(<CodeOutput result={mockVisualResult} language="python" />);
    
    // Click info tab to see memory usage
    const infoTab = screen.getByRole('tab', { name: /info/i });
    fireEvent.click(infoTab);
    
    expect(screen.getByText('2.0MB')).toBeInTheDocument();
  });

  it('respects defaultTab prop', () => {
    render(<CodeOutput result={mockSuccessResult} language="python" defaultTab="info" />);
    
    // Info tab should be active by default
    expect(screen.getByText('Execution Information')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CodeOutput result={mockSuccessResult} language="python" className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows iframe for HTML output', () => {
    const htmlResult: CodeExecutionResult = {
      success: true,
      visualOutput: '<html><body>Test HTML</body></html>',
      executionTime: 100
    };
    
    render(<CodeOutput result={htmlResult} language="html" defaultTab="preview" />);
    
    expect(screen.getByTitle('Code Preview')).toBeInTheDocument();
    expect(screen.getByText('Interactive')).toBeInTheDocument();
  });

  it('parses error messages correctly', () => {
    render(<CodeOutput result={mockErrorResult} language="python" defaultTab="errors" />);
    
    expect(screen.getByText('SyntaxError')).toBeInTheDocument();
    expect(screen.getByText('invalid syntax')).toBeInTheDocument();
  });

  it('shows metadata when available', () => {
    render(<CodeOutput result={mockSuccessResult} language="python" defaultTab="info" />);
    
    expect(screen.getByText('Session Details')).toBeInTheDocument();
    expect(screen.getByText('Additional Information')).toBeInTheDocument();
  });

  it('hides metadata when showMetadata is false', () => {
    render(<CodeOutput result={mockSuccessResult} language="python" showMetadata={false} />);
    
    // Info tab should not be available
    expect(screen.queryByRole('tab', { name: /info/i })).not.toBeInTheDocument();
  });

  // Enhanced tests for new features
  it('handles warning errors with appropriate styling', () => {
    const warningResult: CodeExecutionResult = {
      success: false,
      error: 'DeprecationWarning: This feature is deprecated\n  File "test.py", line 5',
      executionTime: 100
    };
    
    render(<CodeOutput result={warningResult} language="python" defaultTab="errors" />);
    
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('DeprecationWarning')).toBeInTheDocument();
  });

  it('shows syntax error suggestions', () => {
    const syntaxErrorResult: CodeExecutionResult = {
      success: false,
      error: 'SyntaxError: invalid syntax\n  File "test.py", line 1',
      executionTime: 50
    };
    
    render(<CodeOutput result={syntaxErrorResult} language="python" defaultTab="errors" />);
    
    expect(screen.getByText('Suggestion')).toBeInTheDocument();
    expect(screen.getByText(/Check for missing brackets/)).toBeInTheDocument();
  });

  it('displays line and character counts for console output', () => {
    const multiLineResult: CodeExecutionResult = {
      success: true,
      output: 'Line 1\nLine 2\nLine 3',
      executionTime: 100
    };
    
    render(<CodeOutput result={multiLineResult} language="python" />);
    
    expect(screen.getByText('3 lines')).toBeInTheDocument();
    expect(screen.getByText('20 chars')).toBeInTheDocument();
  });

  it('shows copy and download buttons for console output', () => {
    render(<CodeOutput result={mockSuccessResult} language="python" />);
    
    expect(screen.getByTitle('Copy output')).toBeInTheDocument();
    expect(screen.getByTitle('Download output')).toBeInTheDocument();
  });

  it('handles mobile responsive tabs correctly', () => {
    render(<CodeOutput result={mockSuccessResult} language="python" />);
    
    // Check that tabs have mobile-friendly classes
    const consoleTab = screen.getByRole('tab', { name: /console/i });
    expect(consoleTab).toHaveClass('text-xs', 'sm:text-sm');
  });

  it('renders enhanced error formatting with line numbers', () => {
    const detailedErrorResult: CodeExecutionResult = {
      success: false,
      error: 'TypeError: unsupported operand type(s)\n  File "script.py", line 42\n    result = "hello" + 5\n                     ^\nTypeError: can\'t concatenate str and int',
      executionTime: 75
    };
    
    render(<CodeOutput result={detailedErrorResult} language="python" defaultTab="errors" />);
    
    expect(screen.getByText('TypeError')).toBeInTheDocument();
    expect(screen.getByText('line 42')).toBeInTheDocument();
  });

  it('handles different visual output types correctly', () => {
    const plotResult: CodeExecutionResult = {
      success: true,
      visualOutput: '<svg><rect width="100" height="100"/></svg>',
      executionTime: 200
    };
    
    render(<CodeOutput result={plotResult} language="python" defaultTab="preview" />);
    
    expect(screen.getByText('Visual Output')).toBeInTheDocument();
  });

  it('shows appropriate empty states for each tab', () => {
    const emptyTabsResult: CodeExecutionResult = {
      success: true,
      executionTime: 50
    };
    
    render(<CodeOutput result={emptyTabsResult} language="python" showMetadata={true} />);
    
    // Should show empty state
    expect(screen.getByText('No output generated')).toBeInTheDocument();
  });
});