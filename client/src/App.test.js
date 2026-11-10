import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('Travel Trip Application', () => {
  it('renders initial stepper and Your Details page by default', () => {
    render(<App />)

    // Check all 5 step display texts in Stepper
    expect(screen.getByText('Your Details')).toBeInTheDocument()
    expect(screen.getByText('Date Selection')).toBeInTheDocument()
    expect(screen.getByText('Guests')).toBeInTheDocument()
    expect(screen.getByText('Travel Assistance')).toBeInTheDocument()
    expect(screen.getByText('Confirmation')).toBeInTheDocument()

    // Form inputs on Page 1
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Start Location/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/End Location/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()

    // No completed icons yet
    expect(screen.queryByAltText('Your Details')).not.toBeInTheDocument()
  })

  it('validates Page 1 (Your Details) and shows all errors simultaneously', () => {
    render(<App />)

    const nextBtn = screen.getByRole('button', { name: 'Next' })
    fireEvent.click(nextBtn)

    expect(screen.getByText('Enter your name')).toBeInTheDocument()
    expect(screen.getByText('Enter your start location')).toBeInTheDocument()
    expect(screen.getByText('Enter your end location')).toBeInTheDocument()

    // Fill Name only, others should still have errors
    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'Alex' },
    })
    fireEvent.click(nextBtn)
    expect(screen.queryByText('Enter your name')).not.toBeInTheDocument()
    expect(screen.getByText('Enter your start location')).toBeInTheDocument()
    expect(screen.getByText('Enter your end location')).toBeInTheDocument()
  })

  it('allows completing Page 1 and marks Step 1 completed in Stepper', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText(/Start Location/i), {
      target: { value: 'New York' },
    })
    fireEvent.change(screen.getByLabelText(/End Location/i), {
      target: { value: 'Paris' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Now on Date Selection page
    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument()

    // Completed icon for Step 1
    const completedStep1Img = screen.getByAltText('Your Details')
    expect(completedStep1Img).toBeInTheDocument()
    expect(completedStep1Img).toHaveAttribute(
      'src',
      'https://assets.ccbp.in/frontend/react-js/travel-trip-steps-successfully-completed-img.png'
    )
  })

  it('validates Page 2 (Date Selection): empty dates and end date < start date', () => {
    render(<App />)

    // Complete Step 1
    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText(/Start Location/i), {
      target: { value: 'New York' },
    })
    fireEvent.change(screen.getByLabelText(/End Location/i), {
      target: { value: 'Paris' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 2 empty submission
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Select start date')).toBeInTheDocument()
    expect(screen.getByText('Select end date')).toBeInTheDocument()

    // Fill only start date
    fireEvent.change(screen.getByLabelText(/Start Date/i), {
      target: { value: '2026-12-10' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByText('Select start date')).not.toBeInTheDocument()
    expect(screen.getByText('Select end date')).toBeInTheDocument()

    // Invalid date range (end date < start date)
    fireEvent.change(screen.getByLabelText(/End Date/i), {
      target: { value: '2026-12-05' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(
      screen.getByText('The end date cannot be less than the start date')
    ).toBeInTheDocument()

    // Valid date range (same date allowed)
    fireEvent.change(screen.getByLabelText(/End Date/i), {
      target: { value: '2026-12-10' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Adults')).toBeInTheDocument()
  })

  it('persists Page 1 values when clicking Previous from Page 2', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText(/Start Location/i), {
      target: { value: 'New York' },
    })
    fireEvent.change(screen.getByLabelText(/End Location/i), {
      target: { value: 'Paris' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Click Previous
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))

    expect(screen.getByLabelText(/Name/i)).toHaveValue('John Doe')
    expect(screen.getByLabelText(/Start Location/i)).toHaveValue('New York')
    expect(screen.getByLabelText(/End Location/i)).toHaveValue('Paris')
  })

  it('handles Page 3 (Guests) defaults, increments, decrements, and lower limits', () => {
    render(<App />)

    // Step 1
    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'Alice' },
    })
    fireEvent.change(screen.getByLabelText(/Start Location/i), {
      target: { value: 'London' },
    })
    fireEvent.change(screen.getByLabelText(/End Location/i), {
      target: { value: 'Tokyo' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 2
    fireEvent.change(screen.getByLabelText(/Start Date/i), {
      target: { value: '2026-11-15' },
    })
    fireEvent.change(screen.getByLabelText(/End Date/i), {
      target: { value: '2026-11-20' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Now on Guests page
    expect(screen.getByText('Adults')).toBeInTheDocument()
    expect(screen.getByText('Children')).toBeInTheDocument()
    expect(screen.getByText('Infants')).toBeInTheDocument()

    const decAdults = screen.getByLabelText('Decrease adults')
    const incAdults = screen.getByLabelText('Increase adults')
    const decChildren = screen.getByLabelText('Decrease children')
    const incChildren = screen.getByLabelText('Increase children')
    const decInfants = screen.getByLabelText('Decrease infants')
    const incInfants = screen.getByLabelText('Increase infants')

    // Adults defaults to 1 and cannot go below 1
    expect(decAdults).toBeDisabled()
    fireEvent.click(decAdults)
    expect(screen.getByTestId('adults-count')).toHaveTextContent('1')

    // Children defaults to 0 and cannot go below 0
    expect(decChildren).toBeDisabled()

    // Infants defaults to 0 and cannot go below 0
    expect(decInfants).toBeDisabled()

    // Increment values
    fireEvent.click(incAdults) // adults = 2
    fireEvent.click(incAdults) // adults = 3
    fireEvent.click(incChildren) // children = 1
    fireEvent.click(incInfants) // infants = 1

    expect(screen.getByTestId('adults-count')).toHaveTextContent('3')
    expect(screen.getByTestId('children-count')).toHaveTextContent('1')
    expect(screen.getByTestId('infants-count')).toHaveTextContent('1')

    // Decrement test
    fireEvent.click(decAdults) // adults = 2
    expect(screen.getByTestId('adults-count')).toHaveTextContent('2')

    // Both steps 1 & 2 completed in Stepper
    expect(screen.getByAltText('Your Details')).toBeInTheDocument()
    expect(screen.getByAltText('Date Selection')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Now on Travel Assistance
    expect(screen.getByLabelText('Travel Assistance Needed')).toBeInTheDocument()
  })

  it('handles Page 4 (Travel Assistance) checkbox and dropdown', () => {
    render(<App />)

    // Complete steps 1 to 3
    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'Bob' },
    })
    fireEvent.change(screen.getByLabelText(/Start Location/i), {
      target: { value: 'Berlin' },
    })
    fireEvent.change(screen.getByLabelText(/End Location/i), {
      target: { value: 'Rome' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    fireEvent.change(screen.getByLabelText(/Start Date/i), {
      target: { value: '2026-11-15' },
    })
    fireEvent.change(screen.getByLabelText(/End Date/i), {
      target: { value: '2026-11-20' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    const checkbox = screen.getByLabelText('Travel Assistance Needed')
    expect(checkbox).not.toBeChecked()
    expect(
      screen.queryByLabelText('Travel Assistance')
    ).not.toBeInTheDocument()

    // Check the box -> dropdown appears
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
    const select = screen.getByLabelText('Travel Assistance')
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('Wheelchair')

    // Change option
    fireEvent.change(select, { target: { value: 'Medical Support' } })
    expect(select).toHaveValue('Medical Support')

    // Previous and Next persistence check
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByText('Adults')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByLabelText('Travel Assistance Needed')).toBeChecked()
    expect(screen.getByLabelText('Travel Assistance')).toHaveValue(
      'Medical Support'
    )
  })

  it('displays full summary on Confirmation, resets state on Cancel', () => {
    render(<App />)

    // Fill all steps
    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'Sarah Connor' },
    })
    fireEvent.change(screen.getByLabelText(/Start Location/i), {
      target: { value: 'Los Angeles' },
    })
    fireEvent.change(screen.getByLabelText(/End Location/i), {
      target: { value: 'San Francisco' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    fireEvent.change(screen.getByLabelText(/Start Date/i), {
      target: { value: '2026-12-01' },
    })
    fireEvent.change(screen.getByLabelText(/End Date/i), {
      target: { value: '2026-12-10' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Keep assistance unchecked
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Now on Confirmation page
    expect(screen.getByText('Sarah Connor')).toBeInTheDocument()
    expect(screen.getByText('Los Angeles')).toBeInTheDocument()
    expect(screen.getByText('San Francisco')).toBeInTheDocument()
    expect(screen.getByText('2026-12-01')).toBeInTheDocument()
    expect(screen.getByText('2026-12-10')).toBeInTheDocument()
    expect(screen.getByText('Not needed')).toBeInTheDocument()

    // Test Cancel button resets all state
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    // Should be back on Your Details with empty inputs
    expect(screen.getByLabelText(/Name/i)).toHaveValue('')
    expect(screen.getByLabelText(/Start Location/i)).toHaveValue('')
    expect(screen.getByLabelText(/End Location/i)).toHaveValue('')
    expect(screen.queryByAltText('Your Details')).not.toBeInTheDocument()
  })

  it('completes the entire flow and renders Confirmed screen, then Book New Trip resets all', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'Sarah Connor' },
    })
    fireEvent.change(screen.getByLabelText(/Start Location/i), {
      target: { value: 'Los Angeles' },
    })
    fireEvent.change(screen.getByLabelText(/End Location/i), {
      target: { value: 'San Francisco' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    fireEvent.change(screen.getByLabelText(/Start Date/i), {
      target: { value: '2026-12-01' },
    })
    fireEvent.change(screen.getByLabelText(/End Date/i), {
      target: { value: '2026-12-10' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Increment guests
    fireEvent.click(screen.getByLabelText('Increase adults'))
    fireEvent.click(screen.getByLabelText('Increase children'))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Select assistance
    fireEvent.click(screen.getByLabelText('Travel Assistance Needed'))
    fireEvent.change(screen.getByLabelText('Travel Assistance'), {
      target: { value: 'Senior Citizen Support' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Check confirmation screen
    expect(screen.getByText('Senior Citizen Support')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()

    // Check all previous steps are marked completed in Stepper
    expect(screen.getByAltText('Your Details')).toBeInTheDocument()
    expect(screen.getByAltText('Date Selection')).toBeInTheDocument()
    expect(screen.getByAltText('Guests')).toBeInTheDocument()
    expect(screen.getByAltText('Travel Assistance')).toBeInTheDocument()

    // Click Confirm
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    // Confirmed Screen checks
    const successImg = screen.getByAltText('success')
    expect(successImg).toBeInTheDocument()
    expect(successImg).toHaveAttribute(
      'src',
      'https://assets.ccbp.in/frontend/react-js/travel-trip-steps-successfully-completed-img.png'
    )
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
    const bookNewTripBtn = screen.getByRole('button', {
      name: 'Book New Trip',
    })
    expect(bookNewTripBtn).toBeInTheDocument()

    // Click Book New Trip
    fireEvent.click(bookNewTripBtn)

    // Back to Your Details
    expect(screen.getByLabelText(/Name/i)).toHaveValue('')
    expect(screen.getByLabelText(/Start Location/i)).toHaveValue('')
    expect(screen.getByLabelText(/End Location/i)).toHaveValue('')
  })
})
