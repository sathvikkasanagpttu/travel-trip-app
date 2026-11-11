import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '../../components/Header'
import { getBookingById, cancelBooking } from '../../api/bookings'
import { useToast } from '../../context/ToastContext'
import { useBookingStatus } from '../../hooks/useBookingStatus'
import './index.css'

const TripDetail = () => {
  const { id } = useParams()
  const { showToast } = useToast()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const { status: liveStatus, isUpdated } = useBookingStatus(booking?.id, booking?.status)

  // Keep booking status in sync with real-time socket events
  useEffect(() => {
    if (liveStatus && booking && booking.status !== liveStatus) {
      setBooking((prev) => (prev ? { ...prev, status: liveStatus } : prev))
    }
  }, [liveStatus, booking])

  useEffect(() => {
    let isMounted = true

    const fetchBooking = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getBookingById(id)
        if (isMounted) {
          setBooking(data.booking)
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.error?.message ||
              'Booking not found or access denied'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (id) {
      fetchBooking()
    }

    return () => {
      isMounted = false
    }
  }, [id])

  const handleConfirmCancel = async () => {
    setCancelling(true)
    try {
      const response = await cancelBooking(id)
      if (response?.booking) {
        setBooking(response.booking)
        showToast('Booking cancelled successfully', 'info')
        setShowCancelModal(false)
      }
    } catch (err) {
      showToast(
        err.response?.data?.error?.message || 'Failed to cancel booking',
        'error'
      )
    } finally {
      setCancelling(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const canCancel =
    booking &&
    booking.status !== 'CANCELLED' &&
    booking.startDate &&
    booking.startDate > today

  return (
    <div className="trip-detail-page">
      <Header />
      <main className="detail-main">
        <div className="detail-container">
          <div className="detail-nav-bar">
            <Link to="/trips" className="back-link">
              &larr; Back to My Trips
            </Link>
          </div>

          {loading ? (
            <div className="detail-card skeleton-card">
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line skeleton-sub" />
              <div className="skeleton-line skeleton-meta" />
              <div className="skeleton-line skeleton-meta" />
            </div>
          ) : error || !booking ? (
            <div className="detail-card empty-detail-card">
              <h2 className="empty-title">Trip Not Found</h2>
              <p className="empty-desc">{error || 'We could not locate this booking.'}</p>
              <Link to="/trips" className="primary-btn">
                Return to My Trips
              </Link>
            </div>
          ) : (
            <div className="detail-card">
              {/* Header */}
              <div className="detail-header">
                <div>
                  <span className="detail-ref-badge">{booking.reference}</span>
                  <h1 className="detail-route-title">
                    {booking.startLocation} &rarr; {booking.endLocation}
                  </h1>
                  <p className="detail-dates-subtitle">
                    {booking.startDate} &mdash; {booking.endDate}
                  </p>
                </div>
                <div className="detail-header-actions">
                  <span
                    className={`status-pill status-${(liveStatus || booking.status || 'pending').toLowerCase()} ${isUpdated ? 'status-pill-updated' : ''}`}
                    data-testid="trip-detail-status-badge"
                  >
                    {liveStatus || booking.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="detail-toolbar">
                <a
                  href={`/api/v1/bookings/${booking.id}/itinerary.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="primary-btn pdf-btn"
                >
                  Download itinerary (PDF)
                </a>

                {canCancel && (
                  <button
                    type="button"
                    className="cancel-booking-btn"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>

              {/* Summary Grid */}
              <div className="summary-section">
                <h2 className="section-title">Trip Summary</h2>
                <div className="summary-grid">
                  <div className="summary-grid-item">
                    <span className="grid-label">Lead Traveler</span>
                    <span className="grid-value">{booking.name}</span>
                  </div>

                  <div className="summary-grid-item">
                    <span className="grid-label">Start Location</span>
                    <span className="grid-value">{booking.startLocation}</span>
                  </div>

                  <div className="summary-grid-item">
                    <span className="grid-label">End Location</span>
                    <span className="grid-value">{booking.endLocation}</span>
                  </div>

                  <div className="summary-grid-item">
                    <span className="grid-label">Dates</span>
                    <span className="grid-value">
                      {booking.startDate} to {booking.endDate}
                    </span>
                  </div>

                  <div className="summary-grid-item">
                    <span className="grid-label">Guests</span>
                    <span className="grid-value">
                      {booking.adults} Adult{booking.adults > 1 ? 's' : ''}
                      {booking.children > 0 ? `, ${booking.children} Child${booking.children > 1 ? 'ren' : ''}` : ''}
                      {booking.infants > 0 ? `, ${booking.infants} Infant${booking.infants > 1 ? 's' : ''}` : ''}
                    </span>
                  </div>

                  <div className="summary-grid-item">
                    <span className="grid-label">Travel Assistance</span>
                    <span className="grid-value">
                      {booking.assistanceNeeded
                        ? `${booking.assistanceType || 'Wheelchair'}${
                            booking.assistanceNotes ? ` (${booking.assistanceNotes})` : ''
                          }`
                        : 'Not needed'}
                    </span>
                  </div>

                  <div className="summary-grid-item">
                    <span className="grid-label">Total Amount</span>
                    <span className="grid-value total-price-val">
                      ₹{Number(booking.priceTotal || 0).toLocaleString('en-IN')} {booking.currency || 'INR'}
                    </span>
                  </div>

                  <div className="summary-grid-item">
                    <span className="grid-label">Booked At</span>
                    <span className="grid-value">
                      {new Date(booking.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="timeline-section">
                <h2 className="section-title">Status Timeline</h2>
                {booking.statusEvents && booking.statusEvents.length > 0 ? (
                  <ol className="timeline-list">
                    {booking.statusEvents.map((event, index) => (
                      <li key={event.id || index} className="timeline-item">
                        <div className="timeline-marker" />
                        <div className="timeline-content">
                          <div className="timeline-top">
                            <span className={`status-pill status-${event.status.toLowerCase()}`}>
                              {event.status}
                            </span>
                            <time className="timeline-time">
                              {new Date(event.createdAt).toLocaleString()}
                            </time>
                          </div>
                          {event.note && <p className="timeline-note">{event.note}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="no-timeline-text">No status events recorded.</p>
                )}
              </div>
            </div>
          )}

          {/* Cancellation Confirm Modal */}
          {showCancelModal && (
            <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
              <div className="modal-card">
                <h3 id="modal-title" className="modal-title">
                  Cancel Booking
                </h3>
                <p className="modal-body">
                  Are you sure you want to cancel booking <strong>{booking.reference}</strong>? This action cannot be undone.
                </p>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-secondary-btn"
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelling}
                  >
                    Keep Booking
                  </button>
                  <button
                    type="button"
                    className="modal-danger-btn"
                    onClick={handleConfirmCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default TripDetail
