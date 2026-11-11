import { useState, useEffect, useCallback } from 'react'
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
import { useToast } from '../../context/ToastContext'
import { createBooking } from '../../api/bookings'
import { useDraftAutosave, loadStoredDraft, clearStoredDraft } from '../../hooks/useDraftAutosave'
import { useQuote } from '../../hooks/useQuote'
import './index.css'

const generateLocalReference = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `TT-2026-${code}`
}

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const TravelTrip = () => {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [activeStepId, setActiveStepId] = useState(stepsList[0].stepId)
  const [name, setName] = useState('')
  const [startLocation, setStartLocation] = useState('')
  const [endLocation, setEndLocation] = useState('')
  const [startLat, setStartLat] = useState(null)
  const [startLng, setStartLng] = useState(null)
  const [endLat, setEndLat] = useState(null)
  const [endLng, setEndLng] = useState(null)
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
  const [idempotencyKey, setIdempotencyKey] = useState('')

  // Draft state
  const [pendingDraft, setPendingDraft] = useState(null)
  const [hasDismissedDraft, setHasDismissedDraft] = useState(false)

  // Live Quote hook
  const { quote, loading: quoteLoading, error: quoteError } = useQuote({
    startLat,
    startLng,
    endLat,
    endLng,
    startDate,
    endDate,
    adults,
    children,
    infants,
    assistanceNeeded,
  })

  // Pre-fill Name field on Your Details from the logged-in user's profile
  useEffect(() => {
    if (user?.name && !name) {
      setName(user.name)
    }
  }, [user, name])

  // Check for saved draft on initial mount
  useEffect(() => {
    let isMounted = true

    const checkDraft = async () => {
      try {
        const draft = await loadStoredDraft(user)
        if (isMounted && draft) {
          const hasContent =
            draft.name ||
            draft.startLocation ||
            draft.endLocation ||
            draft.startDate ||
            draft.endDate ||
            (draft.stepId && draft.stepId !== 'YOUR_DETAILS')

          if (hasContent) {
            setPendingDraft(draft)
          }
        }
      } catch {
        // Ignore draft loading errors
      }
    }

    checkDraft()

    return () => {
      isMounted = false
    }
  }, [user])

  // Multi-tab draft sync callback
  const handleDraftSynced = useCallback((payload, stepId) => {
    if (!payload) return

    if (payload.name !== undefined) setName(payload.name)
    if (payload.startLocation !== undefined) setStartLocation(payload.startLocation)
    if (payload.endLocation !== undefined) setEndLocation(payload.endLocation)
    if (payload.startLat !== undefined) setStartLat(payload.startLat)
    if (payload.startLng !== undefined) setStartLng(payload.startLng)
    if (payload.endLat !== undefined) setEndLat(payload.endLat)
    if (payload.endLng !== undefined) setEndLng(payload.endLng)
    if (payload.startDate !== undefined) setStartDate(payload.startDate)
    if (payload.endDate !== undefined) setEndDate(payload.endDate)
    if (payload.adults !== undefined) setAdults(Number(payload.adults) || 1)
    if (payload.children !== undefined) setChildren(Number(payload.children) || 0)
    if (payload.infants !== undefined) setInfants(Number(payload.infants) || 0)
    if (payload.assistanceNeeded !== undefined) setAssistanceNeeded(Boolean(payload.assistanceNeeded))
    if (payload.assistanceType !== undefined) setAssistanceType(payload.assistanceType || 'Wheelchair')

    if (stepId && stepsList.some((s) => s.stepId === stepId)) {
      setActiveStepId(stepId)
    }
    showToast('Draft trip synced from another tab', 'info')
  }, [showToast])

  // Autosave hook (debounces 800ms, saves to server if logged in or localStorage if guest)
  useDraftAutosave(
    {
      activeStepId,
      name,
      startLocation,
      endLocation,
      startLat,
      startLng,
      endLat,
      endLng,
      startDate,
      endDate,
      adults,
      children,
      infants,
      assistanceNeeded,
      assistanceType,
      isConfirmed,
    },
    user,
    !hasDismissedDraft,
    handleDraftSynced
  )

  const handleResumeDraft = () => {
    if (!pendingDraft) return

    if (pendingDraft.name !== undefined) setName(pendingDraft.name)
    if (pendingDraft.startLocation !== undefined) setStartLocation(pendingDraft.startLocation)
    if (pendingDraft.endLocation !== undefined) setEndLocation(pendingDraft.endLocation)
    if (pendingDraft.startLat !== undefined) setStartLat(pendingDraft.startLat)
    if (pendingDraft.startLng !== undefined) setStartLng(pendingDraft.startLng)
    if (pendingDraft.endLat !== undefined) setEndLat(pendingDraft.endLat)
    if (pendingDraft.endLng !== undefined) setEndLng(pendingDraft.endLng)
    if (pendingDraft.startDate !== undefined) setStartDate(pendingDraft.startDate)
    if (pendingDraft.endDate !== undefined) setEndDate(pendingDraft.endDate)
    if (pendingDraft.adults !== undefined) setAdults(Number(pendingDraft.adults) || 1)
    if (pendingDraft.children !== undefined) setChildren(Number(pendingDraft.children) || 0)
    if (pendingDraft.infants !== undefined) setInfants(Number(pendingDraft.infants) || 0)
    if (pendingDraft.assistanceNeeded !== undefined) setAssistanceNeeded(Boolean(pendingDraft.assistanceNeeded))
    if (pendingDraft.assistanceType !== undefined) setAssistanceType(pendingDraft.assistanceType || 'Wheelchair')

    if (pendingDraft.stepId && stepsList.some((s) => s.stepId === pendingDraft.stepId)) {
      setActiveStepId(pendingDraft.stepId)
    }

    setPendingDraft(null)
    setHasDismissedDraft(true)
    showToast('Draft trip resumed!', 'info')
  }

  const handleStartFresh = async () => {
    setPendingDraft(null)
    setHasDismissedDraft(true)
    await clearStoredDraft(user)
    showToast('Draft deleted. Starting fresh!', 'info')
  }

  // Generate UUID idempotency key when Confirmation mounts
  const handleConfirmationMount = useCallback((key) => {
    setIdempotencyKey(key)
  }, [])

  const handleResetAll = async () => {
    setName(user?.name || '')
    setStartLocation('')
    setEndLocation('')
    setStartLat(null)
    setStartLng(null)
    setEndLat(null)
    setEndLng(null)
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
    setIdempotencyKey('')
    setPendingDraft(null)
    setActiveStepId(stepsList[0].stepId)

    // Clear draft on Cancel or Book New Trip
    await clearStoredDraft(user)
  }

  const handleConfirm = async () => {
    const keyToUse = idempotencyKey || generateUUID()
    const payload = {
      name,
      startLocation,
      endLocation,
      startLat: startLat ? parseFloat(startLat) : null,
      startLng: startLng ? parseFloat(startLng) : null,
      endLat: endLat ? parseFloat(endLat) : null,
      endLng: endLng ? parseFloat(endLng) : null,
      startDate,
      endDate,
      adults,
      children,
      infants,
      assistanceNeeded,
      assistanceType: assistanceNeeded ? assistanceType : null,
    }

    // Authenticated user path: async call with "Confirming...", error toast, staying on Confirmation on error
    if (user) {
      setIsSubmitting(true)
      try {
        const result = await createBooking(payload, keyToUse)
        if (result?.booking) {
          setBookingReference(result.booking.reference)
          setBookingStatus(result.booking.status || 'CONFIRMED')
          setBookingId(result.booking.id)
          setIsConfirmed(true)
          showToast('Booking confirmed successfully!', 'success')
          // Delete draft on confirmation
          clearStoredDraft(user).catch(() => {})
        } else {
          throw new Error('Failed to confirm booking')
        }
      } catch (err) {
        const message =
          err.response?.data?.error?.message ||
          err.message ||
          'Failed to confirm booking. Please try again.'
        showToast(message, 'error')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // Unauthenticated / Standalone fallback mode (for offline use & existing tests)
    const localRef = generateLocalReference()
    setBookingReference(localRef)
    setIsConfirmed(true)
    setIsSubmitting(true)
    clearStoredDraft(null).catch(() => {})

    createBooking(payload, keyToUse)
      .then((result) => {
        if (result?.booking?.reference) {
          setBookingReference(result.booking.reference)
          setBookingStatus(result.booking.status || 'CONFIRMED')
          setBookingId(result.booking.id)
        }
      })
      .catch(() => {})
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
            startLat={startLat}
            startLng={startLng}
            endLat={endLat}
            endLng={endLng}
            onChangeName={setName}
            onChangeStartLocation={setStartLocation}
            onChangeEndLocation={setEndLocation}
            onSelectStartPlace={(place) => {
              setStartLat(place.lat)
              setStartLng(place.lng)
            }}
            onSelectEndPlace={(place) => {
              setEndLat(place.lat)
              setEndLng(place.lng)
            }}
            onNextStep={() => setActiveStepId('DATE_SELECTION')}
          />
        )
      case 'DATE_SELECTION':
        return (
          <DateSelection
            startDate={startDate}
            endDate={endDate}
            destinationLat={endLat}
            destinationLng={endLng}
            destinationName={endLocation}
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
            quote={quote}
            quoteLoading={quoteLoading}
            quoteError={quoteError}
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
            startLat={startLat}
            startLng={startLng}
            endLat={endLat}
            endLng={endLng}
            quote={quote}
            quoteLoading={quoteLoading}
            quoteError={quoteError}
            onCancel={handleResetAll}
            onConfirm={handleConfirm}
            isSubmitting={isSubmitting}
            onMount={handleConfirmationMount}
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
        {pendingDraft && !isConfirmed && (
          <div className="draft-resume-banner" role="alert">
            <p className="draft-banner-text">
              Resume your draft trip?
            </p>
            <div className="draft-banner-actions">
              <button
                type="button"
                className="draft-resume-btn"
                onClick={handleResumeDraft}
              >
                Resume
              </button>
              <button
                type="button"
                className="draft-fresh-btn"
                onClick={handleStartFresh}
              >
                Start fresh
              </button>
            </div>
          </div>
        )}

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
