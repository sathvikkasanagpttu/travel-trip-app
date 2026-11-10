import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import TravelTrip from './components/TravelTrip'
import * as bookingsApi from './api/bookings'

const renderWithProviders = (ui, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Phase 1 New Features', () => {
  it('renders Login page with validation', async () => {
    renderWithProviders(<Login />, { route: '/login' })

    expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()

    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }))
    expect(screen.getByText('Enter your email')).toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
  })

  it('renders Signup page with validation', async () => {
    renderWithProviders(<Signup />, { route: '/signup' })

    expect(screen.getByRole('heading', { name: 'Create an Account' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()

    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))
    expect(screen.getByText('Enter your name')).toBeInTheDocument()
    expect(screen.getByText('Enter your email')).toBeInTheDocument()
    expect(screen.getByText('Enter a password')).toBeInTheDocument()
  })

  it('persists booking to API on confirm and displays server reference', async () => {
    const mockBooking = {
      id: 'book-123',
      reference: 'TT-2026-TEST99',
      status: 'CONFIRMED',
    }

    vi.spyOn(bookingsApi, 'createBooking').mockResolvedValueOnce({
      success: true,
      booking: mockBooking,
    })

    renderWithProviders(<TravelTrip />, { route: '/book' })

    // Step 1: Your Details
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Alex Morgan' } })
    fireEvent.change(screen.getByLabelText(/Start Location/i), { target: { value: 'London' } })
    fireEvent.change(screen.getByLabelText(/End Location/i), { target: { value: 'Paris' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 2: Date Selection
    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2026-12-01' } })
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: '2026-12-05' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 3: Guests
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 4: Travel Assistance
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 5: Confirmation
    expect(screen.getByText('Alex Morgan')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    // Confirmed screen
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Book New Trip' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('booking-reference')).toHaveTextContent('TT-2026-TEST99')
    })
  })
})
