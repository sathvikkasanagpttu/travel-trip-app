import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import '../Trips/index.css'

const Admin = () => {
  return (
    <div className="trips-page">
      <Header />
      <main className="trips-main">
        <div className="trips-container">
          <div className="trips-card empty-trips-card">
            <h2 className="empty-title">Admin Dashboard</h2>
            <p className="empty-desc">Real-time bookings feed, status change actions, and analytics charts coming in Phase 4.</p>
            <Link to="/book" className="primary-btn">
              Go to Booking Wizard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Admin
