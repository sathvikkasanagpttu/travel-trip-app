import { useParams, Link } from 'react-router-dom'
import Header from '../../components/Header'
import '../Trips/index.css'

const TripDetail = () => {
  const { id } = useParams()

  return (
    <div className="trips-page">
      <Header />
      <main className="trips-main">
        <div className="trips-container">
          <div className="trips-card empty-trips-card">
            <h2 className="empty-title">Trip Details: {id}</h2>
            <p className="empty-desc">Full trip detail page with timeline and route map coming in Phase 2 & 3.</p>
            <Link to="/trips" className="primary-btn">
              Back to My Trips
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default TripDetail
