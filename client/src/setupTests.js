import '@testing-library/jest-dom'
import { vi } from 'vitest'

const createLocalStorageMock = () => {
  let store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
}

const mock = createLocalStorageMock()

try {
  Object.defineProperty(window, 'localStorage', {
    value: mock,
    writable: true,
  })
} catch {}

try {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mock,
    writable: true,
  })
} catch {}

// Mock Leaflet
vi.mock('leaflet', () => {
  const mockIconDefault = function () {}
  mockIconDefault.prototype = {}
  mockIconDefault.mergeOptions = vi.fn()

  return {
    default: {
      Icon: {
        Default: mockIconDefault,
      },
      icon: vi.fn(() => ({})),
      latLngBounds: vi.fn(() => ({
        isValid: () => true,
      })),
    },
    Icon: {
      Default: mockIconDefault,
    },
  }
})

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Polyline: () => <div data-testid="polyline" />,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    fitBounds: vi.fn(),
    setView: vi.fn(),
  }),
}))

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="recharts-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))
