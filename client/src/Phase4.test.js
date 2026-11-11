import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import SocketContext from './context/SocketContext'
import Header from './components/Header'
import Confirmation from './components/Confirmation'
import Admin from './pages/Admin'
import * as adminApi from './api/admin'
import { useBookingStatus } from './hooks/useBookingStatus'

const renderWithProviders = (ui, { socketValue = null } = {}) => {
  const defaultSocketValue = {
    socket: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      connected: true,
      id: 'mock-socket-1',
    },
    connectionStatus: 'connected',
    isConnected: true,
    ...socketValue,
  }

  return render(
    <BrowserRouter>
      <AuthProvider>
        <SocketContext.Provider value={defaultSocketValue}>
          <ToastProvider>{ui}</ToastProvider>
        </SocketContext.Provider>
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Phase 4 Client Real-Time Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Header Socket Connection Status Dot
  describe('Header socket status indicator', () => {
    it('displays socket connection dot with proper status classes and tooltips', () => {
      // Mock logged in user in localStorage
      localStorage.setItem(
        'travel_trip_user',
        JSON.stringify({ id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'USER' })
      )

      const { rerender } = renderWithProviders(<Header />, {
        socketValue: { connectionStatus: 'connected' },
      })

      const dot = screen.getByTestId('socket-status-dot')
      expect(dot).toBeInTheDocument()
      expect(dot).toHaveClass('dot-connected')
      expect(dot).toHaveAttribute('title', 'Real-time: connected')

      // Rerender with reconnecting
      renderWithProviders(<Header />, {
        socketValue: { connectionStatus: 'reconnecting' },
      })
      const dots = screen.getAllByTestId('socket-status-dot')
      expect(dots[dots.length - 1]).toHaveClass('dot-reconnecting')
    })
  })

  // 2. useBookingStatus Hook
  describe('useBookingStatus Hook', () => {
    const TestComponent = ({ bookingId, initialStatus }) => {
      const { status, isUpdated } = useBookingStatus(bookingId, initialStatus)
      return (
        <div>
          <span data-testid="hook-status">{status}</span>
          <span data-testid="hook-updated">{isUpdated ? 'YES' : 'NO'}</span>
        </div>
      )
    }

    it('subscribes to booking:<id> and updates status when booking:status event arrives', async () => {
      let eventCallback = null
      const mockSocket = {
        on: vi.fn((event, cb) => {
          if (event === 'booking:status') {
            eventCallback = cb
          }
        }),
        off: vi.fn(),
        emit: vi.fn(),
        connected: true,
        id: 'mock-socket-hook',
      }

      renderWithProviders(
        <TestComponent bookingId="booking-123" initialStatus="PENDING" />,
        { socketValue: { socket: mockSocket } }
      )

      expect(mockSocket.emit).toHaveBeenCalledWith('join:booking', 'booking-123')
      expect(screen.getByTestId('hook-status')).toHaveTextContent('PENDING')
      expect(screen.getByTestId('hook-updated')).toHaveTextContent('NO')

      // Simulate receiving real-time status update from socket
      act(() => {
        if (eventCallback) {
          eventCallback({
            bookingId: 'booking-123',
            status: 'CONFIRMED',
            note: 'Payment captured and booking confirmed',
          })
        }
      })

      await waitFor(() => {
        expect(screen.getByTestId('hook-status')).toHaveTextContent('CONFIRMED')
        expect(screen.getByTestId('hook-updated')).toHaveTextContent('YES')
      })
    })
  })

  // 3. Price Update Banner on Confirmation Step
  describe('Price Update Banner on Confirmation Step', () => {
    it('shows price update banner on quote:updated event and blocks Confirm button until acknowledged', async () => {
      let quoteUpdateCallback = null
      const mockSocket = {
        on: vi.fn((event, cb) => {
          if (event === 'quote:updated') {
            quoteUpdateCallback = cb
          }
        }),
        off: vi.fn(),
        emit: vi.fn(),
        connected: true,
      }

      renderWithProviders(
        <Confirmation
          name="Jane"
          startLocation="Delhi"
          endLocation="Agra"
          startDate="2026-06-01"
          endDate="2026-06-03"
          adults={1}
          children={0}
          infants={0}
          assistanceNeeded={false}
          quote={{ total: 2000, currency: 'INR', breakdown: [] }}
          onCancel={vi.fn()}
          onConfirm={vi.fn()}
        />,
        { socketValue: { socket: mockSocket } }
      )

      const confirmBtn = screen.getByRole('button', { name: /^Confirm$/i })
      expect(confirmBtn).toBeEnabled()
      expect(screen.queryByTestId('price-update-banner')).not.toBeInTheDocument()

      // Simulate quote:updated event from server
      act(() => {
        if (quoteUpdateCallback) {
          quoteUpdateCallback({
            oldTotal: 2000,
            newTotal: 2500,
          })
        }
      })

      await waitFor(() => {
        expect(screen.getByTestId('price-update-banner')).toBeInTheDocument()
      })
      expect(
        screen.getByText(/Price updated from ₹2000.00 to ₹2500.00/i)
      ).toBeInTheDocument()

      // Confirm button is now disabled until acknowledged
      expect(confirmBtn).toBeDisabled()

      // Click Acknowledge
      const ackBtn = screen.getByRole('button', { name: /Acknowledge/i })
      fireEvent.click(ackBtn)

      // Banner dismisses and Confirm button is re-enabled
      await waitFor(() => {
        expect(screen.queryByTestId('price-update-banner')).not.toBeInTheDocument()
      })
      expect(confirmBtn).toBeEnabled()
    })
  })

  // 4. Admin Dashboard Page
  describe('Admin Dashboard Page', () => {
    it('renders counters, bookings table, filters, and allows Confirm/Reject status actions', async () => {
      const mockBookings = [
        {
          id: 'b-pending-1',
          reference: 'TT-2026-PEND01',
          name: 'Charlie Brown',
          startLocation: 'Goa',
          endLocation: 'Mumbai',
          startDate: '2026-08-01',
          endDate: '2026-08-05',
          adults: 2,
          children: 0,
          infants: 0,
          priceTotal: 4500,
          currency: 'INR',
          status: 'PENDING',
          createdAt: '2026-08-01T10:00:00Z',
        },
      ]

      vi.spyOn(adminApi, 'fetchAdminBookings').mockResolvedValue({
        bookings: mockBookings,
        stats: {
          total: 10,
          pending: 3,
          confirmed: 6,
          cancelled: 1,
        },
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      })

      vi.spyOn(adminApi, 'updateAdminBookingStatus').mockResolvedValue({
        booking: { ...mockBookings[0], status: 'CONFIRMED' },
      })

      renderWithProviders(<Admin />)

      await waitFor(() => {
        expect(screen.getByTestId('stat-total')).toHaveTextContent('10')
        expect(screen.getByTestId('stat-pending')).toHaveTextContent('3')
        expect(screen.getByTestId('stat-confirmed')).toHaveTextContent('6')
        expect(screen.getByTestId('stat-cancelled')).toHaveTextContent('1')
      })

      expect(screen.getByTestId('admin-bookings-table')).toBeInTheDocument()
      expect(screen.getByText('TT-2026-PEND01')).toBeInTheDocument()
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument()

      // Confirm button is present for pending booking
      const confirmBtn = screen.getByTestId('btn-confirm-b-pending-1')
      expect(confirmBtn).toBeInTheDocument()

      fireEvent.click(confirmBtn)

      await waitFor(() => {
        expect(adminApi.updateAdminBookingStatus).toHaveBeenCalledWith(
          'b-pending-1',
          expect.objectContaining({ status: 'CONFIRMED' })
        )
      })
    })
  })
})
