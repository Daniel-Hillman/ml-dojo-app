'use client';

import React, { useEffect, useState } from 'react';

interface ScreenReaderSupportProps {
  children: React.ReactNode;
}

export function ScreenReaderSupport({ children }: ScreenReaderSupportProps) {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    // Add ARIA live regions for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'live-region';
    document.body.appendChild(liveRegion);

    const assertiveRegion = document.createElement('div');
    assertiveRegion.setAttribute('aria-live', 'assertive');
    assertiveRegion.setAttribute('aria-atomic', 'true');
    assertiveRegion.className = 'sr-only';
    assertiveRegion.id = 'assertive-region';
    document.body.appendChild(assertiveRegion);

    return () => {
      document.body.removeChild(liveRegion);
      document.body.removeChild(assertiveRegion);
    };
  }, []);

  return (
    <>
      {children}
      <ScreenReaderStyles />
    </>
  );
}

// Screen reader only styles
function ScreenReaderStyles() {
  return (
    <style jsx global>{`
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      .sr-only-focusable:focus {
        position: static;
        width: auto;
        height: auto;
        padding: inherit;
        margin: inherit;
        overflow: visible;
        clip: auto;
        white-space: normal;
      }
    `}</style>
  );
}

// Announce messages to screen readers
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const regionId = priority === 'assertive' ? 'assertive-region' : 'live-region';
  const region = document.getElementById(regionId);
  
  if (region) {
    region.textContent = message;
    
    // Clear after a delay to allow for re-announcements
    setTimeout(() => {
      region.textContent = '';
    }, 1000);
  }
}

// Skip link component
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only-focusable absolute top-0 left-0 z-50 bg-blue-600 text-white px-4 py-2 rounded-br-md focus:not-sr-only"
    >
      {children}
    </a>
  );
}

// Accessible heading component
export function AccessibleHeading({ 
  level, 
  children, 
  id,
  className = '' 
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag id={id} className={className} tabIndex={-1}>
      {children}
    </Tag>
  );
}

// Accessible button component
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
  [key: string]: any;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Accessible form field component
export function AccessibleFormField({
  label,
  children,
  error,
  help,
  required = false,
  id
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  help?: string;
  required?: boolean;
  id: string;
}) {
  const errorId = error ? `${id}-error` : undefined;
  const helpId = help ? `${id}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ');

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      {React.cloneElement(children as React.ReactElement, {
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? 'true' : undefined,
        'aria-required': required
      })}
      
      {help && (
        <div id={helpId} className="text-sm text-gray-600 dark:text-gray-400">
          {help}
        </div>
      )}
      
      {error && (
        <div id={errorId} className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

// Accessible modal component
export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [previousFocus, setPreviousFocus] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviousFocus(document.activeElement as HTMLElement);
      
      // Focus the modal
      const modal = document.getElementById('modal');
      modal?.focus();
      
      // Trap focus within modal
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
        
        if (event.key === 'Tab') {
          trapFocus(event);
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        previousFocus?.focus();
      };
    }
  }, [isOpen, onClose, previousFocus]);

  const trapFocus = (event: KeyboardEvent) => {
    const modal = document.getElementById('modal');
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        id="modal"
        className={`bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 ${className}`}
        tabIndex={-1}
      >
        <h2 id="modal-title" className="text-lg font-semibold mb-4">
          {title}
        </h2>
        
        {children}
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Accessible table component
export function AccessibleTable({
  caption,
  headers,
  rows,
  className = ''
}: {
  caption: string;
  headers: string[];
  rows: string[][];
  className?: string;
}) {
  return (
    <table className={`w-full border-collapse ${className}`} role="table">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th
              key={index}
              className="border p-2 text-left bg-gray-50 dark:bg-gray-700"
              scope="col"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="border p-2">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Accessible progress indicator
export function AccessibleProgress({
  value,
  max,
  label,
  className = ''
}: {
  value: number;
  max: number;
  label: string;
  className?: string;
}) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={className}>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {percentage}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${percentage}% complete`}
        className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
      >
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Hook for screen reader announcements
export function useScreenReader() {
  const announcePolite = (message: string) => {
    announce(message, 'polite');
  };

  const announceAssertive = (message: string) => {
    announce(message, 'assertive');
  };

  return {
    announcePolite,
    announceAssertive
  };
}