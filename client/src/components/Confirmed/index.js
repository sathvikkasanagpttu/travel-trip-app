import { Link, useLocation } from 'react-router-dom'
import { SUCCESS_IMG_URL } from '../../constants'
import './index.css'

const Confirmed = ({
  onBookNewTrip,
  bookingReference,
  bookingStatus = 'CONFIRMED',
  bookingId,
}) => {
  let hasRouter = false
  try {
    useLocation()
    hasRouter = true
  } catch {
    hasRouter = false
  }

  const handleDownloadPdf = () => {
    if (bookingId || bookingReference) {
      const id = bookingId || bookingReference
      window.open(`/api/v1/bookings/${id}/itinerary.pdf`, '_blank')
    } else {
      window.print()
    }
  }

  return (
    <div className="confirmed-container">
      <img
        src={SUCCESS_IMG_URL}
        alt="success"
        className="confirmed-success-img"
      />
      <h1 className="confirmed-heading">Awesome!</h1>
      <h2 className="confirmed-subheading">Confirmed</h2>
      <p className="confirmed-message">Your trip has been booked successfully</p>

      {bookingReference && (
        <div className="booking-ref-card">
          <span className="ref-label">Booking Reference:</span>
          <span className="ref-value" data-testid="booking-reference">
            {bookingReference}
          </span>
          <span className={`status-pill status-${bookingStatus.toLowerCase()}`}>
            {bookingStatus}
          </span>
        </div>
      )}

      <div className="confirmed-actions">
        <button
          type="button"
          className="primary-btn book-new-trip-btn"
          onClick={onBookNewTrip}
        >
          Book New Trip
        </button>

        {hasRouter && (
          <Link to="/trips" className="secondary-btn view-trips-btn">
            View My Trips
          </Link>
        )}

        <button
          type="button"
          className="secondary-btn download-pdf-btn"
          onClick={handleDownloadPdf}
        >
          Download itinerary (PDF)
        </button>
      </div>
    </div>
  )
}

export default Confirmed
