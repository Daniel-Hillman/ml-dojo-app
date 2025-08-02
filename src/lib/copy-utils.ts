import { toast } from '@/hooks/use-toast';

/**
 * Copy text to clipboard with consistent toast notifications
 */
export async function copyToClipboard(
  text: string, 
  options: {
    successMessage?: string;
    errorMessage?: string;
    showToast?: boolean;
  } = {}
): Promise<boolean> {
  const {
    successMessage = 'Copied to clipboard!',
    errorMessage = 'Failed to copy to clipboard',
    showToast = true
  } = options;

  try {
    await navigator.clipboard.writeText(text);
    
    if (showToast) {
      toast({
        title: successMessage,
        description: `${text.length} characters copied`,
        variant: 'default'
      });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    
    if (showToast) {
      toast({
        title: errorMessage,
        description: 'Please try again or copy manually',
        variant: 'destructive'
      });
    }
    
    return false;
  }
}

/**
 * Copy code with syntax-specific messaging
 */
export async function copyCode(
  code: string,
  language?: string,
  showToast: boolean = true
): Promise<boolean> {
  const languageLabel = language ? ` ${language}` : '';
  
  return copyToClipboard(code, {
    successMessage: `${languageLabel} code copied!`,
    errorMessage: 'Failed to copy code',
    showToast
  });
}

/**
 * Copy URL with specific messaging
 */
export async function copyUrl(
  url: string,
  description: string = 'Link',
  showToast: boolean = true
): Promise<boolean> {
  return copyToClipboard(url, {
    successMessage: `${description} copied!`,
    errorMessage: 'Failed to copy link',
    showToast
  });
}

/**
 * Copy output/result with specific messaging
 */
export async function copyOutput(
  output: string,
  type: string = 'Output',
  showToast: boolean = true
): Promise<boolean> {
  return copyToClipboard(output, {
    successMessage: `${type} copied!`,
    errorMessage: 'Failed to copy output',
    showToast
  });
}

/**
 * Check if clipboard API is available
 */
export function isClipboardSupported(): boolean {
  return typeof navigator !== 'undefined' && 
         'clipboard' in navigator && 
         typeof navigator.clipboard.writeText === 'function';
}

/**
 * Fallback copy method for older browsers
 */
export function fallbackCopyToClipboard(text: string): boolean {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Fallback copy failed:', error);
    return false;
  }
}

/**
 * Universal copy function with fallback
 */
export async function universalCopy(
  text: string,
  options: {
    successMessage?: string;
    errorMessage?: string;
    showToast?: boolean;
  } = {}
): Promise<boolean> {
  const {
    successMessage = 'Copied to clipboard!',
    errorMessage = 'Failed to copy to clipboard',
    showToast = true
  } = options;

  // Try modern clipboard API first
  if (isClipboardSupported()) {
    return copyToClipboard(text, options);
  }
  
  // Fallback for older browsers
  const success = fallbackCopyToClipboard(text);
  
  if (showToast) {
    if (success) {
      toast({
        title: successMessage,
        description: `${text.length} characters copied`,
        variant: 'default'
      });
    } else {
      toast({
        title: errorMessage,
        description: 'Please copy manually (Ctrl+C)',
        variant: 'destructive'
      });
    }
  }
  
  return success;
}