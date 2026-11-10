import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import './index.css'

const Trips = () => {
  return (
    <div className="trips-page">
      <Header />
      <main className="trips-main">
        <div className="trips-container">
          <div className="trips-header">
            <div>
              <h2 className="trips-title">My Bookings</h2>
              <p className="trips-subtitle">View and manage your upcoming and past trips</p>
            </div>
            <Link to="/book" className="primary-btn new-trip-link">
              + Book New Trip
            </Link>
          </div>

          <div className="trips-card empty-trips-card">
            <p className="empty-title">Dashboard coming in Phase 2</p>
            <p className="empty-desc">Your bookings are securely saved in the database. In Phase 2, full search, status timeline, PDF itinerary downloads, and cancellation will be available here.</p>
            <Link to="/book" className="primary-btn">
              Go to Booking Wizard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Trips
