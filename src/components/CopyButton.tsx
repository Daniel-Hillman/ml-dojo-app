'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { copyCode, copyToClipboard, copyUrl, copyOutput } from '@/lib/copy-utils';

interface CopyButtonProps {
  text: string;
  type?: 'code' | 'text' | 'url' | 'output';
  language?: string;
  description?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showToast?: boolean;
  children?: React.ReactNode;
  iconOnly?: boolean;
}

export function CopyButton({
  text,
  type = 'text',
  language,
  description,
  variant = 'outline',
  size = 'sm',
  className,
  showToast = true,
  children,
  iconOnly = false
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let success = false;

    switch (type) {
      case 'code':
        success = await copyCode(text, language, showToast);
        break;
      case 'url':
        success = await copyUrl(text, description || 'Link', showToast);
        break;
      case 'output':
        success = await copyOutput(text, description || 'Output', showToast);
        break;
      default:
        success = await copyToClipboard(text, {
          successMessage: description ? `${description} copied!` : undefined,
          showToast
        });
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const buttonSize = {
    sm: 'h-8 px-2',
    md: 'h-9 px-3',
    lg: 'h-10 px-4'
  }[size];

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }[size];

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        'transition-all duration-200',
        copied && 'bg-green-50 border-green-200 text-green-700',
        iconOnly && buttonSize,
        className
      )}
      title={`Copy ${type === 'code' ? `${language || ''} code` : type}`}
    >
      {copied ? (
        <Check className={cn(iconSize, 'text-green-600')} />
      ) : (
        <Copy className={iconSize} />
      )}
      {!iconOnly && (
        <span className="ml-2">
          {children || (copied ? 'Copied!' : 'Copy')}
        </span>
      )}
    </Button>
  );
}

// Specialized copy buttons for common use cases
export function CopyCodeButton({
  code,
  language,
  className,
  ...props
}: {
  code: string;
  language?: string;
  className?: string;
} & Omit<CopyButtonProps, 'text' | 'type'>) {
  return (
    <CopyButton
      text={code}
      type="code"
      language={language}
      className={className}
      {...props}
    />
  );
}

export function CopyUrlButton({
  url,
  description = 'Link',
  className,
  ...props
}: {
  url: string;
  description?: string;
  className?: string;
} & Omit<CopyButtonProps, 'text' | 'type' | 'description'>) {
  return (
    <CopyButton
      text={url}
      type="url"
      description={description}
      className={className}
      {...props}
    />
  );
}

export function CopyOutputButton({
  output,
  outputType = 'Output',
  className,
  ...props
}: {
  output: string;
  outputType?: string;
  className?: string;
} & Omit<CopyButtonProps, 'text' | 'type' | 'description'>) {
  return (
    <CopyButton
      text={output}
      type="output"
      description={outputType}
      className={className}
      {...props}
    />
  );
}

// Hook for copy functionality
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string, options?: Parameters<typeof copyToClipboard>[1]) => {
    const success = await copyToClipboard(text, options);
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    
    return success;
  };

  return { copy, copied };
}