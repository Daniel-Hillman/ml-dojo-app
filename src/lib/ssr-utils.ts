'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if we're running on the client side
 * Prevents hydration mismatches by ensuring consistent behavior
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * SSR-safe state hook that prevents hydration mismatches
 * Returns the initial value on server and first client render,
 * then allows state updates
 */
export function useSSRSafeState<T>(
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(initialValue);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Return initial value during SSR and first client render
  if (!isClient) {
    return [initialValue, setState];
  }

  return [state, setState];
}

/**
 * SSR-safe localStorage hook
 * Prevents hydration mismatches when using localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [isClient, setIsClient] = useState(false);
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    setIsClient(true);
    
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Return initial value during SSR
  if (!isClient) {
    return [initialValue, setValue];
  }

  return [storedValue, setValue];
}

/**
 * SSR-safe sessionStorage hook
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [isClient, setIsClient] = useState(false);
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    setIsClient(true);
    
    try {
      const item = window.sessionStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (isClient) {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  };

  if (!isClient) {
    return [initialValue, setValue];
  }

  return [storedValue, setValue];
}

/**
 * Hook for media queries that prevents hydration mismatches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia(query);
      setMatches(mediaQuery.matches);

      const handler = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };

      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [query]);

  // Return false during SSR to prevent hydration mismatches
  return isClient ? matches : false;
}

/**
 * Hook for window dimensions that prevents hydration mismatches
 */
export function useWindowSize(): { width: number; height: number } {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Return default values during SSR
  return isClient ? windowSize : { width: 0, height: 0 };
}

/**
 * Utility function to check if we're in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Utility function to safely access window object
 */
export function safeWindow(): Window | undefined {
  return isBrowser() ? window : undefined;
}

/**
 * Utility function to safely access document object
 */
export function safeDocument(): Document | undefined {
  return isBrowser() ? document : undefined;
}

/**
 * Hook for safe access to navigator object
 */
export function useNavigator(): Navigator | undefined {
  const [navigator, setNavigator] = useState<Navigator | undefined>(undefined);

  useEffect(() => {
    if (isBrowser()) {
      setNavigator(window.navigator);
    }
  }, []);

  return navigator;
}

/**
 * Hook for detecting user's preferred color scheme
 */
export function usePreferredColorScheme(): 'light' | 'dark' | null {
  const [scheme, setScheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    if (isBrowser()) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setScheme(mediaQuery.matches ? 'dark' : 'light');

      const handler = (e: MediaQueryListEvent) => {
        setScheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  return scheme;
}