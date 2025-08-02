'use client';

import React, { useEffect, useState } from 'react';
import { Contrast, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HighContrastModeProps {
  children: React.ReactNode;
}

export function HighContrastMode({ children }: HighContrastModeProps) {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [contrastLevel, setContrastLevel] = useState<'normal' | 'high' | 'maximum'>('normal');

  useEffect(() => {
    // Check for saved preference
    const saved = localStorage.getItem('high-contrast-mode');
    const savedLevel = localStorage.getItem('contrast-level') as 'normal' | 'high' | 'maximum';
    
    if (saved === 'true') {
      setIsHighContrast(true);
      setContrastLevel(savedLevel || 'high');
    }

    // Check for system preference
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    if (mediaQuery.matches && !saved) {
      setIsHighContrast(true);
      setContrastLevel('high');
    }

    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches && !localStorage.getItem('high-contrast-mode')) {
        setIsHighContrast(true);
        setContrastLevel('high');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Apply high contrast styles
    const root = document.documentElement;
    
    if (isHighContrast) {
      root.classList.add('high-contrast');
      root.classList.add(`contrast-${contrastLevel}`);
      
      // Apply CSS custom properties for high contrast
      applyHighContrastStyles(contrastLevel);
    } else {
      root.classList.remove('high-contrast', 'contrast-normal', 'contrast-high', 'contrast-maximum');
      removeHighContrastStyles();
    }

    // Save preference
    localStorage.setItem('high-contrast-mode', isHighContrast.toString());
    localStorage.setItem('contrast-level', contrastLevel);
  }, [isHighContrast, contrastLevel]);

  const applyHighContrastStyles = (level: 'normal' | 'high' | 'maximum') => {
    const root = document.documentElement;
    
    switch (level) {
      case 'high':
        root.style.setProperty('--hc-bg-primary', '#000000');
        root.style.setProperty('--hc-bg-secondary', '#1a1a1a');
        root.style.setProperty('--hc-text-primary', '#ffffff');
        root.style.setProperty('--hc-text-secondary', '#e0e0e0');
        root.style.setProperty('--hc-border', '#ffffff');
        root.style.setProperty('--hc-accent', '#00ff00');
        root.style.setProperty('--hc-error', '#ff0000');
        root.style.setProperty('--hc-warning', '#ffff00');
        root.style.setProperty('--hc-success', '#00ff00');
        break;
        
      case 'maximum':
        root.style.setProperty('--hc-bg-primary', '#000000');
        root.style.setProperty('--hc-bg-secondary', '#000000');
        root.style.setProperty('--hc-text-primary', '#ffffff');
        root.style.setProperty('--hc-text-secondary', '#ffffff');
        root.style.setProperty('--hc-border', '#ffffff');
        root.style.setProperty('--hc-accent', '#ffffff');
        root.style.setProperty('--hc-error', '#ffffff');
        root.style.setProperty('--hc-warning', '#ffffff');
        root.style.setProperty('--hc-success', '#ffffff');
        break;
        
      default:
        // Normal contrast - no changes needed
        break;
    }
  };

  const removeHighContrastStyles = () => {
    const root = document.documentElement;
    const properties = [
      '--hc-bg-primary',
      '--hc-bg-secondary',
      '--hc-text-primary',
      '--hc-text-secondary',
      '--hc-border',
      '--hc-accent',
      '--hc-error',
      '--hc-warning',
      '--hc-success'
    ];
    
    properties.forEach(prop => root.style.removeProperty(prop));
  };

  const toggleHighContrast = () => {
    setIsHighContrast(!isHighContrast);
  };

  const cycleContrastLevel = () => {
    const levels: ('normal' | 'high' | 'maximum')[] = ['normal', 'high', 'maximum'];
    const currentIndex = levels.indexOf(contrastLevel);
    const nextIndex = (currentIndex + 1) % levels.length;
    setContrastLevel(levels[nextIndex]);
  };

  return (
    <>
      {children}
      
      {/* High contrast styles */}
      <HighContrastStyles />
      
      {/* Contrast controls */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleHighContrast}
          className="flex items-center gap-2"
          title="Toggle high contrast mode"
        >
          <Contrast size={16} />
          {isHighContrast ? 'Disable' : 'Enable'} High Contrast
        </Button>
        
        {isHighContrast && (
          <Button
            variant="outline"
            size="sm"
            onClick={cycleContrastLevel}
            className="flex items-center gap-2"
            title="Cycle contrast level"
          >
            <Eye size={16} />
            Contrast: {contrastLevel}
          </Button>
        )}
      </div>
    </>
  );
}

// High contrast CSS styles
function HighContrastStyles() {
  return (
    <style jsx global>{`
      .high-contrast {
        /* Force high contrast colors */
        filter: contrast(150%);
      }
      
      .high-contrast.contrast-high {
        --tw-bg-opacity: 1;
        --tw-text-opacity: 1;
      }
      
      .high-contrast.contrast-high * {
        background-color: var(--hc-bg-primary, #000000) !important;
        color: var(--hc-text-primary, #ffffff) !important;
        border-color: var(--hc-border, #ffffff) !important;
      }
      
      .high-contrast.contrast-high input,
      .high-contrast.contrast-high textarea,
      .high-contrast.contrast-high select {
        background-color: var(--hc-bg-secondary, #1a1a1a) !important;
        color: var(--hc-text-primary, #ffffff) !important;
        border: 2px solid var(--hc-border, #ffffff) !important;
      }
      
      .high-contrast.contrast-high button {
        background-color: var(--hc-bg-secondary, #1a1a1a) !important;
        color: var(--hc-text-primary, #ffffff) !important;
        border: 2px solid var(--hc-border, #ffffff) !important;
      }
      
      .high-contrast.contrast-high button:hover,
      .high-contrast.contrast-high button:focus {
        background-color: var(--hc-accent, #00ff00) !important;
        color: var(--hc-bg-primary, #000000) !important;
      }
      
      .high-contrast.contrast-high a {
        color: var(--hc-accent, #00ff00) !important;
        text-decoration: underline !important;
      }
      
      .high-contrast.contrast-high a:hover,
      .high-contrast.contrast-high a:focus {
        background-color: var(--hc-accent, #00ff00) !important;
        color: var(--hc-bg-primary, #000000) !important;
      }
      
      .high-contrast.contrast-high .text-red-500,
      .high-contrast.contrast-high .text-red-600,
      .high-contrast.contrast-high .text-destructive {
        color: var(--hc-error, #ff0000) !important;
      }
      
      .high-contrast.contrast-high .text-yellow-500,
      .high-contrast.contrast-high .text-yellow-600,
      .high-contrast.contrast-high .text-warning {
        color: var(--hc-warning, #ffff00) !important;
      }
      
      .high-contrast.contrast-high .text-green-500,
      .high-contrast.contrast-high .text-green-600,
      .high-contrast.contrast-high .text-success {
        color: var(--hc-success, #00ff00) !important;
      }
      
      .high-contrast.contrast-maximum {
        filter: contrast(200%) brightness(150%);
      }
      
      .high-contrast.contrast-maximum * {
        background-color: #000000 !important;
        color: #ffffff !important;
        border-color: #ffffff !important;
        text-shadow: 0 0 2px #ffffff !important;
      }
      
      .high-contrast.contrast-maximum img,
      .high-contrast.contrast-maximum svg {
        filter: invert(1) contrast(200%);
      }
      
      /* Focus indicators for high contrast */
      .high-contrast *:focus {
        outline: 3px solid var(--hc-accent, #00ff00) !important;
        outline-offset: 2px !important;
      }
      
      /* Code blocks in high contrast */
      .high-contrast pre,
      .high-contrast code {
        background-color: var(--hc-bg-secondary, #1a1a1a) !important;
        color: var(--hc-text-primary, #ffffff) !important;
        border: 1px solid var(--hc-border, #ffffff) !important;
      }
      
      /* Ensure text is readable */
      .high-contrast .text-gray-500,
      .high-contrast .text-gray-600,
      .high-contrast .text-muted-foreground {
        color: var(--hc-text-secondary, #e0e0e0) !important;
      }
      
      /* High contrast for syntax highlighting */
      .high-contrast .hljs {
        background: var(--hc-bg-secondary, #1a1a1a) !important;
        color: var(--hc-text-primary, #ffffff) !important;
      }
      
      .high-contrast .hljs-keyword,
      .high-contrast .hljs-selector-tag,
      .high-contrast .hljs-built_in {
        color: var(--hc-accent, #00ff00) !important;
        font-weight: bold !important;
      }
      
      .high-contrast .hljs-string,
      .high-contrast .hljs-attr {
        color: var(--hc-warning, #ffff00) !important;
      }
      
      .high-contrast .hljs-number,
      .high-contrast .hljs-literal {
        color: var(--hc-success, #00ff00) !important;
      }
      
      .high-contrast .hljs-comment {
        color: var(--hc-text-secondary, #e0e0e0) !important;
        font-style: italic !important;
      }
    `}</style>
  );
}

// Hook for high contrast mode
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [contrastLevel, setContrastLevel] = useState<'normal' | 'high' | 'maximum'>('normal');

  useEffect(() => {
    const saved = localStorage.getItem('high-contrast-mode');
    const savedLevel = localStorage.getItem('contrast-level') as 'normal' | 'high' | 'maximum';
    
    setIsHighContrast(saved === 'true');
    setContrastLevel(savedLevel || 'normal');
  }, []);

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    localStorage.setItem('high-contrast-mode', newValue.toString());
  };

  const setContrast = (level: 'normal' | 'high' | 'maximum') => {
    setContrastLevel(level);
    localStorage.setItem('contrast-level', level);
  };

  return {
    isHighContrast,
    contrastLevel,
    toggleHighContrast,
    setContrast
  };
}

// Accessible color utility
export function getAccessibleColor(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): string {
  // This would implement WCAG color contrast calculations
  // For now, return high contrast colors when needed
  const isHighContrast = document.documentElement.classList.contains('high-contrast');
  
  if (isHighContrast) {
    return foreground === '#000000' ? '#ffffff' : '#000000';
  }
  
  return foreground;
}

// Component for testing color contrast
export function ContrastTester({
  foreground,
  background,
  text = 'Sample text'
}: {
  foreground: string;
  background: string;
  text?: string;
}) {
  const ratio = calculateContrastRatio(foreground, background);
  const wcagAA = ratio >= 4.5;
  const wcagAAA = ratio >= 7;

  return (
    <div className="p-4 border rounded">
      <div
        className="p-4 rounded mb-2"
        style={{ color: foreground, backgroundColor: background }}
      >
        {text}
      </div>
      <div className="text-sm space-y-1">
        <div>Contrast Ratio: {ratio.toFixed(2)}:1</div>
        <div className={wcagAA ? 'text-green-600' : 'text-red-600'}>
          WCAG AA: {wcagAA ? 'Pass' : 'Fail'}
        </div>
        <div className={wcagAAA ? 'text-green-600' : 'text-red-600'}>
          WCAG AAA: {wcagAAA ? 'Pass' : 'Fail'}
        </div>
      </div>
    </div>
  );
}

// Calculate contrast ratio between two colors
function calculateContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Get relative luminance of a color
function getLuminance(color: string): number {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Apply gamma correction
  const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}