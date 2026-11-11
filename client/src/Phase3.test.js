import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { haversineDistanceKm } from './utils/geo'
import AutocompleteInput from './components/AutocompleteInput'
import PriceBreakdown from './components/PriceBreakdown'
import WeatherStrip from './components/WeatherStrip'
import RouteMap from './components/RouteMap'
import * as placesApi from './api/places'
import * as weatherApi from './api/weather'

describe('Phase 3 Client Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Haversine distance utility
  describe('Haversine Distance calculation', () => {
    it('computes distance between London and Paris accurately', () => {
      // London (51.5074, -0.1278) -> Paris (48.8566, 2.3522)
      const distance = haversineDistanceKm(51.5074, -0.1278, 48.8566, 2.3522)
      expect(distance).toBeGreaterThan(340)
      expect(distance).toBeLessThan(350)
    })

    it('returns 0 for missing or same coordinates', () => {
      expect(haversineDistanceKm(null, null, 10, 20)).toBe(0)
      expect(haversineDistanceKm(12.34, 56.78, 12.34, 56.78)).toBe(0)
    })
  })

  // 2. AutocompleteInput component & keyboard navigation
  describe('AutocompleteInput component', () => {
    it('renders normal input with accessibility combobox roles and allows free typing', () => {
      const handleChange = vi.fn()
      render(
        <AutocompleteInput
          id="testLocation"
          label="Test Location"
          placeholder="Enter location"
          value="Tokyo"
          onChange={handleChange}
        />
      )

      const input = screen.getByLabelText(/Test Location/i)
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('role', 'combobox')
      expect(input).toHaveAttribute('aria-autocomplete', 'list')

      fireEvent.change(input, { target: { value: 'Kyoto' } })
      expect(handleChange).toHaveBeenCalledWith('Kyoto')
    })

    it('shows suggestions on search and supports keyboard navigation (Down, Up, Enter, Escape)', async () => {
      const mockPlaces = [
        { label: 'Paris, France', lat: 48.8566, lng: 2.3522 },
        { label: 'Paris, TX, USA', lat: 33.6609, lng: -95.5555 },
      ]

      vi.spyOn(placesApi, 'searchPlaces').mockResolvedValue({
        places: mockPlaces,
      })

      const handleChange = vi.fn()
      const handleSelectPlace = vi.fn()

      const { rerender } = render(
        <AutocompleteInput
          id="startLocation"
          label="Start Location"
          placeholder="Enter start location"
          value=""
          onChange={handleChange}
          onSelectPlace={handleSelectPlace}
        />
      )

      const input = screen.getByLabelText(/Start Location/i)

      // Simulate typing "Paris"
      rerender(
        <AutocompleteInput
          id="startLocation"
          label="Start Location"
          placeholder="Enter start location"
          value="Paris"
          onChange={handleChange}
          onSelectPlace={handleSelectPlace}
        />
      )

      // Wait for debounced search to populate dropdown
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(2)
      expect(options[0]).toHaveTextContent('Paris, France')

      // Keyboard ArrowDown navigates to first option
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      expect(options[0]).toHaveClass('option-active')

      // Keyboard ArrowDown navigates to second option
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      expect(options[1]).toHaveClass('option-active')

      // Keyboard ArrowUp navigates back to first option
      fireEvent.keyDown(input, { key: 'ArrowUp' })
      expect(options[0]).toHaveClass('option-active')

      // Keyboard Enter selects the active option
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(handleChange).toHaveBeenCalledWith('Paris, France')
      expect(handleSelectPlace).toHaveBeenCalledWith(mockPlaces[0])

      // Escape closes suggestions
      fireEvent.keyDown(input, { key: 'Escape' })
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })

  // 3. PriceBreakdown component
  describe('PriceBreakdown component', () => {
    it('renders loading skeleton when loading', () => {
      render(<PriceBreakdown quote={null} loading={true} error={null} />)
      expect(screen.getByTestId('price-breakdown-skeleton')).toBeInTheDocument()
      expect(screen.getByText(/Calculating.../i)).toBeInTheDocument()
    })

    it('renders breakdown items and total price formatted in INR', () => {
      const mockQuote = {
        currency: 'INR',
        total: 4435.6,
        breakdown: [
          { label: 'Distance Fare (343.56 km)', amount: 3435.6 },
          { label: 'Stay Fare (2 nights)', amount: 1000 },
        ],
      }

      render(<PriceBreakdown quote={mockQuote} loading={false} error={null} />)
      expect(screen.getByTestId('price-breakdown')).toBeInTheDocument()
      expect(screen.getByText('Distance Fare (343.56 km)')).toBeInTheDocument()
      expect(screen.getByText('Stay Fare (2 nights)')).toBeInTheDocument()
      expect(screen.getByText('Total Estimated')).toBeInTheDocument()
      expect(screen.getByText(/₹4,435.60/)).toBeInTheDocument()
    })
  })

  // 4. WeatherStrip component
  describe('WeatherStrip component', () => {
    it('renders friendly message when forecast is unavailable or out-of-range', async () => {
      vi.spyOn(weatherApi, 'fetchWeather').mockResolvedValue({
        available: false,
        message: 'Weather forecast is only available for dates within the next 16 days.',
        forecast: [],
      })

      render(
        <WeatherStrip
          lat={48.8566}
          lng={2.3522}
          start="2026-10-01"
          end="2026-10-05"
          destinationName="Paris"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('weather-unavailable')).toBeInTheDocument()
      })
      expect(
        screen.getByText(/Weather forecast is only available for dates within the next 16 days./i)
      ).toBeInTheDocument()
    })

    it('renders daily forecast strip with weather icon, description, and temperatures', async () => {
      vi.spyOn(weatherApi, 'fetchWeather').mockResolvedValue({
        available: true,
        forecast: [
          {
            date: '2026-06-01',
            tempMax: 25.4,
            tempMin: 15.1,
            description: 'Clear sky',
            icon: '☀️',
          },
          {
            date: '2026-06-02',
            tempMax: 21.0,
            tempMin: 13.5,
            description: 'Rain',
            icon: '🌧️',
          },
        ],
      })

      render(
        <WeatherStrip
          lat={48.8566}
          lng={2.3522}
          start="2026-06-01"
          end="2026-06-02"
          destinationName="Paris"
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('weather-forecast-list')).toBeInTheDocument()
      })

      expect(screen.getByText('Clear sky')).toBeInTheDocument()
      expect(screen.getByText('Rain')).toBeInTheDocument()
      expect(screen.getByText('☀️')).toBeInTheDocument()
      expect(screen.getByText('🌧️')).toBeInTheDocument()
    })
  })

  // 5. RouteMap jsdom guard
  describe('RouteMap component', () => {
    it('renders nothing in jsdom test environment to protect against SVG/canvas crashes', () => {
      const { container } = render(
        <RouteMap
          startLat={51.5074}
          startLng={-0.1278}
          endLat={48.8566}
          endLng={2.3522}
        />
      )
      expect(container.firstChild).toBeNull()
    })
  })
})
