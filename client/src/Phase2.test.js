import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import TravelTrip from './components/TravelTrip'
import Trips from './pages/Trips'
import TripDetail from './pages/TripDetail'
import * as draftsApi from './api/drafts'
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

describe('Phase 2 Features', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  // Part A: Draft Autosave & Resume Tests
  it('displays draft resume banner when draft exists and restores the active step on resume', async () => {
    const mockDraft = {
      stepId: 'GUESTS',
      name: 'Sam Traveler',
      startLocation: 'Hyderabad',
      endLocation: 'Goa',
      startDate: '2026-12-10',
      endDate: '2026-12-15',
      adults: 3,
      children: 1,
      infants: 0,
      assistanceNeeded: true,
      assistanceType: 'Medical Support',
    }

    vi.spyOn(draftsApi, 'getDraft').mockResolvedValueOnce({
      success: true,
      draft: {
        stepId: 'GUESTS',
        payload: mockDraft,
      },
    })

    renderWithProviders(<TravelTrip />, { route: '/book' })

    // Banner should appear
    await waitFor(() => {
      expect(screen.getByText('Resume your draft trip?')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start fresh' })).toBeInTheDocument()

    // Click Resume
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))

    // Banner should disappear
    await waitFor(() => {
      expect(screen.queryByText('Resume your draft trip?')).not.toBeInTheDocument()
    })

    // Active step should now be GUESTS (Step 3)
    expect(screen.getByText('Adults')).toBeInTheDocument()
    expect(screen.getByTestId('adults-count')).toHaveTextContent('3')
    expect(screen.getByTestId('children-count')).toHaveTextContent('1')

    // Steps 1 & 2 should be marked completed in Stepper
    expect(screen.getByAltText('Your Details')).toBeInTheDocument()
    expect(screen.getByAltText('Date Selection')).toBeInTheDocument()

    // Navigating back should show restored values
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByLabelText(/Start Date/i)).toHaveValue('2026-12-10')
    expect(screen.getByLabelText(/End Date/i)).toHaveValue('2026-12-15')

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByLabelText(/Name/i)).toHaveValue('Sam Traveler')
    expect(screen.getByLabelText(/Start Location/i)).toHaveValue('Hyderabad')
    expect(screen.getByLabelText(/End Location/i)).toHaveValue('Goa')
  })

  it('deletes draft when clicking Start fresh on draft banner', async () => {
    localStorage.setItem(
      'travelTripDraft',
      JSON.stringify({
        stepId: 'DATE_SELECTION',
        name: 'Draft Traveler',
        startLocation: 'Delhi',
        endLocation: 'Agra',
      })
    )

    const deleteSpy = vi.spyOn(draftsApi, 'deleteDraft').mockResolvedValueOnce({ success: true })

    renderWithProviders(<TravelTrip />, { route: '/book' })

    await waitFor(() => {
      expect(screen.getByText('Resume your draft trip?')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Start fresh' }))

    await waitFor(() => {
      expect(screen.queryByText('Resume your draft trip?')).not.toBeInTheDocument()
    })

    expect(localStorage.getItem('travelTripDraft')).toBeNull()
    expect(screen.getByLabelText(/Name/i)).toHaveValue('')
  })

  // Part B: My Trips Dashboard Tests
  it('renders My Trips dashboard with tabs, filters, and trip cards', async () => {
    const mockBookings = [
      {
        id: 'b1',
        reference: 'TT-2026-HYDGOA',
        name: 'Jane Traveler',
        startLocation: 'Hyderabad',
        endLocation: 'Goa',
        startDate: '2026-12-01',
        endDate: '2026-12-08',
        adults: 2,
        children: 1,
        infants: 0,
        priceTotal: 15840,
        currency: 'INR',
        status: 'CONFIRMED',
      },
      {
        id: 'b2',
        reference: 'TT-2026-MUMDEL',
        name: 'Jane Traveler',
        startLocation: 'Mumbai',
        endLocation: 'Delhi',
        startDate: '2026-01-01',
        endDate: '2026-01-05',
        adults: 1,
        children: 0,
        infants: 0,
        priceTotal: 5280,
        currency: 'INR',
        status: 'CONFIRMED',
      },
      {
        id: 'b3',
        reference: 'TT-2026-CAN123',
        name: 'Jane Traveler',
        startLocation: 'Bangalore',
        endLocation: 'Kochi',
        startDate: '2026-12-15',
        endDate: '2026-12-20',
        adults: 2,
        children: 0,
        infants: 0,
        priceTotal: 10000,
        currency: 'INR',
        status: 'CANCELLED',
      },
    ]

    vi.spyOn(bookingsApi, 'getBookings').mockResolvedValue({
      bookings: mockBookings,
      pagination: { total: 3, page: 1, limit: 10, totalPages: 1 },
    })

    renderWithProviders(<Trips />, { route: '/trips' })

    // Check header and tabs
    expect(screen.getByText('My Bookings')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Upcoming' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Past' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Cancelled' })).toBeInTheDocument()

    // By default on Upcoming tab, b1 should be shown
    await waitFor(() => {
      expect(screen.getByText('TT-2026-HYDGOA')).toBeInTheDocument()
    })
    expect(screen.getByText(/Hyderabad/)).toBeInTheDocument()
    expect(screen.getByText(/Goa/)).toBeInTheDocument()
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument()

    // Switch to Past tab -> b2 should be shown
    fireEvent.click(screen.getByRole('tab', { name: 'Past' }))
    expect(screen.getByText('TT-2026-MUMDEL')).toBeInTheDocument()

    // Switch to Cancelled tab -> b3 should be shown
    fireEvent.click(screen.getByRole('tab', { name: 'Cancelled' }))
    expect(screen.getByText('TT-2026-CAN123')).toBeInTheDocument()
    expect(screen.getByText('CANCELLED')).toBeInTheDocument()
  })

  // Part C: Trip Detail Page Tests
  it('renders Trip Detail page with full summary, status timeline, and cancel button', async () => {
    const mockTrip = {
      id: 'trip-999',
      reference: 'TT-2026-DET999',
      name: 'Sarah Connor',
      startLocation: 'Chennai',
      endLocation: 'Ooty',
      startDate: '2026-12-20',
      endDate: '2026-12-25',
      adults: 2,
      children: 0,
      infants: 0,
      assistanceNeeded: true,
      assistanceType: 'Wheelchair',
      assistanceNotes: 'Ramp needed',
      priceTotal: 12000,
      currency: 'INR',
      status: 'CONFIRMED',
      createdAt: '2026-11-01T10:00:00.000Z',
      statusEvents: [
        {
          id: 'ev-1',
          status: 'PENDING',
          note: 'Booking initiated',
          createdAt: '2026-11-01T10:00:00.000Z',
        },
        {
          id: 'ev-2',
          status: 'CONFIRMED',
          note: 'Booking successfully confirmed',
          createdAt: '2026-11-01T10:00:05.000Z',
        },
      ],
    }

    vi.spyOn(bookingsApi, 'getBookingById').mockResolvedValueOnce({
      booking: mockTrip,
    })

    const cancelSpy = vi.spyOn(bookingsApi, 'cancelBooking').mockResolvedValueOnce({
      booking: {
        ...mockTrip,
        status: 'CANCELLED',
        statusEvents: [
          ...mockTrip.statusEvents,
          {
            id: 'ev-3',
            status: 'CANCELLED',
            note: 'Booking cancelled by user',
            createdAt: '2026-11-02T10:00:00.000Z',
          },
        ],
      },
    })

    render(
      <MemoryRouter initialEntries={['/trips/trip-999']}>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/trips/:id" element={<TripDetail />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    )

    // Verify summary
    await waitFor(() => {
      expect(screen.getByText('TT-2026-DET999')).toBeInTheDocument()
    })
    expect(screen.getByText('Sarah Connor')).toBeInTheDocument()
    expect(screen.getByText('Chennai → Ooty')).toBeInTheDocument()
    expect(screen.getByText(/Ramp needed/)).toBeInTheDocument()

    // Verify PDF download link
    const pdfBtn = screen.getByRole('link', { name: 'Download itinerary (PDF)' })
    expect(pdfBtn).toHaveAttribute('href', '/api/v1/bookings/trip-999/itinerary.pdf')

    // Verify Status Timeline
    expect(screen.getByText('Status Timeline')).toBeInTheDocument()
    expect(screen.getByText('Booking initiated')).toBeInTheDocument()
    expect(screen.getByText('Booking successfully confirmed')).toBeInTheDocument()

    // Cancel Booking flow
    const cancelBtn = screen.getByRole('button', { name: 'Cancel Booking' })
    fireEvent.click(cancelBtn)

    // Modal dialog appears
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to cancel booking/)).toBeInTheDocument()

    // Confirm cancellation
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Cancellation' }))

    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledWith('trip-999')
    })
  })
})
