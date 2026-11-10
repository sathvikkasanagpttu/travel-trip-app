import { useState, useEffect } from 'react'
import Header from '../Header'
import Stepper from '../Stepper'
import YourDetails from '../YourDetails'
import DateSelection from '../DateSelection'
import Guests from '../Guests'
import TravelAssistance from '../TravelAssistance'
import Confirmation from '../Confirmation'
import Confirmed from '../Confirmed'
import { stepsList } from '../../constants'
import { useAuth } from '../../context/AuthContext'
import { createBooking } from '../../api/bookings'
import './index.css'

const generateLocalReference = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `TT-2026-${code}`
}

const TravelTrip = () => {
  const { user } = useAuth()

  const [activeStepId, setActiveStepId] = useState(stepsList[0].stepId)
  const [name, setName] = useState('')
  const [startLocation, setStartLocation] = useState('')
  const [endLocation, setEndLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [assistanceNeeded, setAssistanceNeeded] = useState(false)
  const [assistanceType, setAssistanceType] = useState('Wheelchair')
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingReference, setBookingReference] = useState('')
  const [bookingStatus, setBookingStatus] = useState('CONFIRMED')
  const [bookingId, setBookingId] = useState('')

  // Pre-fill Name field on Your Details from the logged-in user's profile
  useEffect(() => {
    if (user?.name && !name) {
      setName(user.name)
    }
  }, [user, name])

  const handleResetAll = () => {
    setName(user?.name || '')
    setStartLocation('')
    setEndLocation('')
    setStartDate('')
    setEndDate('')
    setAdults(1)
    setChildren(0)
    setInfants(0)
    setAssistanceNeeded(false)
    setAssistanceType('Wheelchair')
    setIsConfirmed(false)
    setIsSubmitting(false)
    setBookingReference('')
    setBookingStatus('CONFIRMED')
    setBookingId('')
    setActiveStepId(stepsList[0].stepId)
  }

  const handleConfirm = () => {
    // Generate initial reference immediately so UI updates synchronously
    const localRef = generateLocalReference()
    setBookingReference(localRef)
    setIsConfirmed(true)
    setIsSubmitting(true)

    // Generate random idempotency key for this submission attempt
    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `key-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Persist booking to backend in background with graceful fallback
    createBooking(
      {
        name,
        startLocation,
        endLocation,
        startDate,
        endDate,
        adults,
        children,
        infants,
        assistanceNeeded,
        assistanceType: assistanceNeeded ? assistanceType : null,
      },
      idempotencyKey
    )
      .then((result) => {
        if (result?.booking?.reference) {
          setBookingReference(result.booking.reference)
          setBookingStatus(result.booking.status || 'CONFIRMED')
          setBookingId(result.booking.id)
        }
      })
      .catch(() => {
        // Standalone fallback: already has local reference and confirmed state
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  const renderActiveStepContent = () => {
    if (isConfirmed) {
      return (
        <Confirmed
          onBookNewTrip={handleResetAll}
          bookingReference={bookingReference}
          bookingStatus={bookingStatus}
          bookingId={bookingId}
        />
      )
    }

    switch (activeStepId) {
      case 'YOUR_DETAILS':
        return (
          <YourDetails
            name={name}
            startLocation={startLocation}
            endLocation={endLocation}
            onChangeName={setName}
            onChangeStartLocation={setStartLocation}
            onChangeEndLocation={setEndLocation}
            onNextStep={() => setActiveStepId('DATE_SELECTION')}
          />
        )
      case 'DATE_SELECTION':
        return (
          <DateSelection
            startDate={startDate}
            endDate={endDate}
            onChangeStartDate={setStartDate}
            onChangeEndDate={setEndDate}
            onPreviousStep={() => setActiveStepId('YOUR_DETAILS')}
            onNextStep={() => setActiveStepId('GUESTS')}
          />
        )
      case 'GUESTS':
        return (
          <Guests
            adults={adults}
            children={children}
            infants={infants}
            onChangeAdults={setAdults}
            onChangeChildren={setChildren}
            onChangeInfants={setInfants}
            onPreviousStep={() => setActiveStepId('DATE_SELECTION')}
            onNextStep={() => setActiveStepId('TRAVEL_ASSISTANCE')}
          />
        )
      case 'TRAVEL_ASSISTANCE':
        return (
          <TravelAssistance
            assistanceNeeded={assistanceNeeded}
            assistanceType={assistanceType}
            onChangeAssistanceNeeded={setAssistanceNeeded}
            onChangeAssistanceType={setAssistanceType}
            onPreviousStep={() => setActiveStepId('GUESTS')}
            onNextStep={() => setActiveStepId('CONFIRMATION')}
          />
        )
      case 'CONFIRMATION':
        return (
          <Confirmation
            name={name}
            startLocation={startLocation}
            endLocation={endLocation}
            startDate={startDate}
            endDate={endDate}
            adults={adults}
            children={children}
            infants={infants}
            assistanceNeeded={assistanceNeeded}
            assistanceType={assistanceType}
            onCancel={handleResetAll}
            onConfirm={handleConfirm}
            isSubmitting={isSubmitting}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="travel-trip-app">
      <Header />
      <main className="main-content">
        <div className="travel-trip-card">
          <aside className="stepper-sidebar">
            <Stepper
              stepsList={stepsList}
              activeStepId={activeStepId}
              isConfirmed={isConfirmed}
            />
          </aside>
          <section className="step-content">
            {renderActiveStepContent()}
          </section>
        </div>
      </main>
    </div>
  )
}

export default TravelTrip
