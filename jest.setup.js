import '@testing-library/jest-dom'

// Polyfill fetch and related APIs for Node.js environment
global.fetch = jest.fn()
global.Request = jest.fn()
global.Response = jest.fn()
global.Headers = jest.fn()

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }) => <a href={href}>{children}</a>
})

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  PlusCircle: ({ className }) => <div className={className} data-testid="plus-circle-icon" />,
  Users: ({ className }) => <div className={className} data-testid="users-icon" />,
  FileText: ({ className }) => <div className={className} data-testid="file-text-icon" />,
  History: ({ className }) => <div className={className} data-testid="history-icon" />,
  User: ({ className }) => <div className={className} data-testid="user-icon" />,
  Bookmark: ({ className }) => <div className={className} data-testid="bookmark-icon" />,
  BarChart3: ({ className }) => <div className={className} data-testid="bar-chart-icon" />,
  LoaderCircle: ({ className }) => <div className={className} data-testid="loader-icon" />,
  ChevronRight: ({ className }) => <div className={className} data-testid="chevron-right-icon" />,
  CheckCircle: ({ className }) => <div className={className} data-testid="check-circle-icon" />,
  BarChart: ({ className }) => <div className={className} data-testid="bar-chart-icon" />,
  Trash2: ({ className }) => <div className={className} data-testid="trash-icon" />,
  Heart: ({ className }) => <div className={className} data-testid="heart-icon" />,
  Eye: ({ className }) => <div className={className} data-testid="eye-icon" />,
  RefreshCw: ({ className }) => <div className={className} data-testid="refresh-icon" />,
  AlertCircle: ({ className }) => <div className={className} data-testid="alert-circle-icon" />,
  AlertTriangle: ({ className }) => <div className={className} data-testid="alert-triangle-icon" />,
  Wifi: ({ className }) => <div className={className} data-testid="wifi-icon" />,
  WifiOff: ({ className }) => <div className={className} data-testid="wifi-off-icon" />,
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})