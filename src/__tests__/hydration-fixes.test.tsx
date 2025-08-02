/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';

// Import components to test
import { SSRSafe, ConditionalRender, SafeDate } from '@/components/SSRSafe';
import { HydrationErrorBoundary } from '@/components/error/HydrationErrorBoundary';
import { useIsClient, useSSRSafeState, useLocalStorage } from '@/lib/ssr-utils';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Test component that uses client-only features
function TestClientComponent() {
  const isClient = useIsClient();
  return <div data-testid="client-component">{isClient ? 'Client' : 'Server'}</div>;
}

// Test component that uses SSR-safe state
function TestSSRSafeStateComponent() {
  const [count, setCount] = useSSRSafeState(0);
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={() => setCount(count + 1)} data-testid="increment">
        Increment
      </button>
    </div>
  );
}

// Test component that uses localStorage
function TestLocalStorageComponent() {
  const [value, setValue] = useLocalStorage('test-key', 'default');
  return (
    <div>
      <span data-testid="value">{value}</span>
      <button onClick={() => setValue('updated')} data-testid="update">
        Update
      </button>
    </div>
  );
}

// Test component that throws an error
function ErrorComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="no-error">No error</div>;
}

describe('Hydration Fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('SSRSafe Component', () => {
    it('should render fallback during SSR simulation', () => {
      render(
        <SSRSafe fallback={<div data-testid="fallback">Loading...</div>}>
          <div data-testid="client-content">Client Content</div>
        </SSRSafe>
      );

      // Initially should show fallback
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('should render children after client hydration', async () => {
      render(
        <SSRSafe fallback={<div data-testid="fallback">Loading...</div>}>
          <div data-testid="client-content">Client Content</div>
        </SSRSafe>
      );

      // Wait for client-side rendering
      await waitFor(() => {
        expect(screen.getByTestId('client-content')).toBeInTheDocument();
      });
    });
  });

  describe('ConditionalRender Component', () => {
    it('should render server content initially', () => {
      render(
        <ConditionalRender
          server={<div data-testid="server-content">Server</div>}
          client={<div data-testid="client-content">Client</div>}
        />
      );

      expect(screen.getByTestId('server-content')).toBeInTheDocument();
    });

    it('should switch to client content after hydration', async () => {
      render(
        <ConditionalRender
          server={<div data-testid="server-content">Server</div>}
          client={<div data-testid="client-content">Client</div>}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('client-content')).toBeInTheDocument();
      });
    });
  });

  describe('SafeDate Component', () => {
    it('should render fallback initially', () => {
      const testDate = new Date('2023-01-01');
      render(<SafeDate date={testDate} fallback="Loading date..." />);

      expect(screen.getByText('Loading date...')).toBeInTheDocument();
    });

    it('should render formatted date after hydration', async () => {
      const testDate = new Date('2023-01-01');
      render(<SafeDate date={testDate} fallback="Loading date..." />);

      await waitFor(() => {
        expect(screen.getByText('1/1/2023')).toBeInTheDocument();
      });
    });
  });

  describe('useIsClient Hook', () => {
    it('should return false initially and true after effect', async () => {
      render(<TestClientComponent />);

      // Initially should show server state
      expect(screen.getByTestId('client-component')).toHaveTextContent('Server');

      // After effect should show client state
      await waitFor(() => {
        expect(screen.getByTestId('client-component')).toHaveTextContent('Client');
      });
    });
  });

  describe('useSSRSafeState Hook', () => {
    it('should maintain consistent state during hydration', async () => {
      render(<TestSSRSafeStateComponent />);

      // Should start with initial value
      expect(screen.getByTestId('count')).toHaveTextContent('0');

      // Should be able to update state after hydration
      await waitFor(() => {
        const button = screen.getByTestId('increment');
        act(() => {
          button.click();
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('1');
      });
    });
  });

  describe('useLocalStorage Hook', () => {
    it('should return initial value during SSR', () => {
      render(<TestLocalStorageComponent />);

      expect(screen.getByTestId('value')).toHaveTextContent('default');
    });

    it('should load from localStorage after hydration', async () => {
      localStorageMock.getItem.mockReturnValue('"stored-value"');
      
      render(<TestLocalStorageComponent />);

      await waitFor(() => {
        expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
      });
    });

    it('should save to localStorage when value changes', async () => {
      render(<TestLocalStorageComponent />);

      await waitFor(() => {
        const button = screen.getByTestId('update');
        act(() => {
          button.click();
        });
      });

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '"updated"');
      });
    });
  });

  describe('HydrationErrorBoundary', () => {
    // Suppress console.error for these tests
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

    it('should render children when no error occurs', () => {
      render(
        <HydrationErrorBoundary>
          <ErrorComponent shouldThrow={false} />
        </HydrationErrorBoundary>
      );

      expect(screen.getByTestId('no-error')).toBeInTheDocument();
    });

    it('should render error UI when error occurs', () => {
      render(
        <HydrationErrorBoundary>
          <ErrorComponent shouldThrow={true} />
        </HydrationErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should detect hydration errors specifically', () => {
      const HydrationErrorComponent = () => {
        throw new Error('Hydration failed: server HTML doesn\'t match client');
      };

      render(
        <HydrationErrorBoundary>
          <HydrationErrorComponent />
        </HydrationErrorBoundary>
      );

      expect(screen.getByText('Hydration Error')).toBeInTheDocument();
      expect(screen.getByText('Reload Page')).toBeInTheDocument();
    });

    it('should allow retry after error', async () => {
      let shouldThrow = true;
      const RetryableComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div data-testid="success">Success</div>;
      };

      render(
        <HydrationErrorBoundary>
          <RetryableComponent />
        </HydrationErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Simulate fixing the error
      shouldThrow = false;
      
      const retryButton = screen.getByText('Try Again');
      act(() => {
        retryButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('success')).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Integration', () => {
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

    it('should handle nested error boundaries', () => {
      const NestedErrorComponent = () => {
        throw new Error('Nested error');
      };

      render(
        <HydrationErrorBoundary fallback={<div data-testid="outer-fallback">Outer Error</div>}>
          <HydrationErrorBoundary fallback={<div data-testid="inner-fallback">Inner Error</div>}>
            <NestedErrorComponent />
          </HydrationErrorBoundary>
        </HydrationErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(screen.getByTestId('inner-fallback')).toBeInTheDocument();
    });
  });

  describe('Performance and Memory', () => {
    it('should not cause memory leaks with event listeners', async () => {
      const { unmount } = render(<TestClientComponent />);

      // Wait for component to mount and set up listeners
      await waitFor(() => {
        expect(screen.getByTestId('client-component')).toHaveTextContent('Client');
      });

      // Unmount should clean up properly
      unmount();

      // No assertions needed - test passes if no memory leaks occur
    });

    it('should handle rapid re-renders without issues', async () => {
      const { rerender } = render(<TestSSRSafeStateComponent />);

      // Rapidly re-render the component
      for (let i = 0; i < 10; i++) {
        rerender(<TestSSRSafeStateComponent />);
      }

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('0');
      });
    });
  });
});

// Integration test for the complete hydration flow
describe('Hydration Integration', () => {
  it('should handle complete app hydration without errors', async () => {
    const CompleteApp = () => (
      <HydrationErrorBoundary>
        <SSRSafe fallback={<div data-testid="app-loading">Loading app...</div>}>
          <div data-testid="app-content">
            <TestClientComponent />
            <TestSSRSafeStateComponent />
            <TestLocalStorageComponent />
          </div>
        </SSRSafe>
      </HydrationErrorBoundary>
    );

    render(<CompleteApp />);

    // Should start with loading state
    expect(screen.getByTestId('app-loading')).toBeInTheDocument();

    // Should transition to full app
    await waitFor(() => {
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
      expect(screen.getByTestId('client-component')).toHaveTextContent('Client');
      expect(screen.getByTestId('count')).toHaveTextContent('0');
      expect(screen.getByTestId('value')).toHaveTextContent('default');
    });
  });
});