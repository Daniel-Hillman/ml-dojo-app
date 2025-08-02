'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'dropdown' | 'compact';
}

export function ThemeToggle({ className, variant = 'dropdown' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to system preference
      setTheme('system');
      applyTheme('system');
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', newTheme === 'dark');
    }
  };

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className={cn("h-8 w-8 p-0", className)}>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const getThemeIcon = (themeType: Theme) => {
    switch (themeType) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (themeType: Theme) => {
    switch (themeType) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
    }
  };

  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const nextTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
          changeTheme(nextTheme);
        }}
        className={cn("h-8 w-8 p-0", className)}
        title={`Current theme: ${getThemeLabel(theme)}. Click to cycle.`}
      >
        {getThemeIcon(theme)}
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg", className)}>
        {(['light', 'dark', 'system'] as Theme[]).map((themeOption) => (
          <Button
            key={themeOption}
            variant={theme === themeOption ? "default" : "ghost"}
            size="sm"
            onClick={() => changeTheme(themeOption)}
            className="h-7 w-7 p-0"
            title={getThemeLabel(themeOption)}
          >
            {getThemeIcon(themeOption)}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0", className)}
          title="Toggle theme"
        >
          {getThemeIcon(theme)}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => changeTheme('light')}
          className="flex items-center gap-2"
        >
          <Sun className="h-4 w-4" />
          Light
          {theme === 'light' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeTheme('dark')}
          className="flex items-center gap-2"
        >
          <Moon className="h-4 w-4" />
          Dark
          {theme === 'dark' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeTheme('system')}
          className="flex items-center gap-2"
        >
          <Monitor className="h-4 w-4" />
          System
          {theme === 'system' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Advanced theme customization component
export function ThemeCustomizer({ 
  isOpen, 
  onClose 
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [fontSize, setFontSize] = useState('medium');
  const [borderRadius, setBorderRadius] = useState('medium');

  const accentColors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Pink', value: '#ec4899' }
  ];

  const fontSizes = [
    { name: 'Small', value: 'small', scale: '0.875' },
    { name: 'Medium', value: 'medium', scale: '1' },
    { name: 'Large', value: 'large', scale: '1.125' }
  ];

  const borderRadiuses = [
    { name: 'None', value: 'none', radius: '0' },
    { name: 'Small', value: 'small', radius: '0.25rem' },
    { name: 'Medium', value: 'medium', radius: '0.5rem' },
    { name: 'Large', value: 'large', radius: '1rem' }
  ];

  useEffect(() => {
    if (isOpen) {
      // Load saved customizations
      const savedAccent = localStorage.getItem('accent-color');
      const savedFontSize = localStorage.getItem('font-size');
      const savedBorderRadius = localStorage.getItem('border-radius');

      if (savedAccent) setAccentColor(savedAccent);
      if (savedFontSize) setFontSize(savedFontSize);
      if (savedBorderRadius) setBorderRadius(savedBorderRadius);
    }
  }, [isOpen]);

  const applyCustomizations = () => {
    const root = document.documentElement;
    
    // Apply accent color
    root.style.setProperty('--primary', accentColor);
    localStorage.setItem('accent-color', accentColor);

    // Apply font size
    const fontScale = fontSizes.find(f => f.value === fontSize)?.scale || '1';
    root.style.setProperty('--font-scale', fontScale);
    localStorage.setItem('font-size', fontSize);

    // Apply border radius
    const radius = borderRadiuses.find(r => r.value === borderRadius)?.radius || '0.5rem';
    root.style.setProperty('--radius', radius);
    localStorage.setItem('border-radius', borderRadius);
  };

  useEffect(() => {
    applyCustomizations();
  }, [accentColor, fontSize, borderRadius]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div 
        className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Customize Theme
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="space-y-6">
          {/* Theme Toggle */}
          <div>
            <label className="text-sm font-medium mb-3 block">Theme Mode</label>
            <ThemeToggle variant="compact" />
          </div>

          {/* Accent Color */}
          <div>
            <label className="text-sm font-medium mb-3 block">Accent Color</label>
            <div className="grid grid-cols-3 gap-2">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setAccentColor(color.value)}
                  className={cn(
                    "w-full h-10 rounded-lg border-2 transition-all",
                    accentColor === color.value ? "border-gray-900 dark:border-white" : "border-transparent"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="text-sm font-medium mb-3 block">Font Size</label>
            <div className="space-y-2">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setFontSize(size.value)}
                  className={cn(
                    "w-full p-3 text-left rounded-lg border transition-colors",
                    fontSize === size.value 
                      ? "border-primary bg-primary/10" 
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <div className="font-medium">{size.name}</div>
                  <div className="text-sm text-gray-500">Scale: {size.scale}x</div>
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <label className="text-sm font-medium mb-3 block">Border Radius</label>
            <div className="space-y-2">
              {borderRadiuses.map((radius) => (
                <button
                  key={radius.value}
                  onClick={() => setBorderRadius(radius.value)}
                  className={cn(
                    "w-full p-3 text-left border transition-colors",
                    borderRadius === radius.value 
                      ? "border-primary bg-primary/10" 
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                  style={{ borderRadius: radius.radius }}
                >
                  <div className="font-medium">{radius.name}</div>
                  <div className="text-sm text-gray-500">{radius.radius}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <Button
            variant="outline"
            onClick={() => {
              setAccentColor('#3b82f6');
              setFontSize('medium');
              setBorderRadius('medium');
              localStorage.removeItem('accent-color');
              localStorage.removeItem('font-size');
              localStorage.removeItem('border-radius');
            }}
            className="w-full"
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook for theme management
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    const root = document.documentElement;
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', newTheme === 'dark');
    }
  };

  return {
    theme,
    changeTheme,
    mounted
  };
}