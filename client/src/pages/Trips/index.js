import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Header from '../../components/Header'
import { getBookings } from '../../api/bookings'
import './index.css'

const Trips = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get('tab') || 'upcoming'
  const searchParam = searchParams.get('search') || ''
  const pageParam = parseInt(searchParams.get('page') || '1', 10)

  const [activeTab, setActiveTab] = useState(tabParam)
  const [searchTerm, setSearchTerm] = useState(searchParam)
  const [currentPage, setCurrentPage] = useState(pageParam)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Sync state when URL params change
  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'upcoming')
    setSearchTerm(searchParams.get('search') || '')
    setCurrentPage(parseInt(searchParams.get('page') || '1', 10))
  }, [searchParams])

  // Fetch bookings from backend
  useEffect(() => {
    let isMounted = true

    const fetchTrips = async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch bookings for the user (can fetch up to 100 for client tabs/filtering)
        const response = await getBookings({
          limit: 100,
          search: searchTerm.trim() || undefined,
        })
        if (isMounted) {
          setBookings(response.bookings || [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.error?.message || 'Failed to load bookings')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTrips()

    return () => {
      isMounted = false
    }
  }, [searchTerm])

  // Update URL params
  const updateParams = (newTab, newSearch, newPage) => {
    const params = {}
    if (newTab && newTab !== 'upcoming') params.tab = newTab
    if (newSearch) params.search = newSearch
    if (newPage && newPage > 1) params.page = String(newPage)
    setSearchParams(params)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
    updateParams(tab, searchTerm, 1)
  }

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchTerm(val)
    setCurrentPage(1)
    updateParams(activeTab, val, 1)
  }

  // Filter bookings according to active tab
  const today = new Date().toISOString().split('T')[0]

  const filteredBookings = bookings.filter((trip) => {
    const isCancelled = trip.status === 'CANCELLED'
    const isPast = trip.endDate ? trip.endDate < today : false

    if (activeTab === 'cancelled') {
      return isCancelled
    }
    if (activeTab === 'past') {
      return !isCancelled && isPast
    }
    // upcoming: not cancelled and not past
    return !isCancelled && !isPast
  })

  // Pagination (10 per page)
  const pageSize = 10
  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1
  const displayedBookings = filteredBookings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)
    updateParams(activeTab, searchTerm, newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="trips-page">
      <Header />
      <main className="trips-main">
        <div className="trips-container">
          <div className="trips-header">
            <div>
              <h2 className="trips-title">My Bookings</h2>
              <p className="trips-subtitle">Track, view, and manage all your trips in one place</p>
            </div>
            <Link to="/book" className="primary-btn new-trip-link">
              + Book New Trip
            </Link>
          </div>

          {/* Search Bar & Tab Navigation */}
          <div className="trips-controls-bar">
            <div className="trips-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'upcoming'}
                className={`tab-btn ${activeTab === 'upcoming' ? 'active-tab' : ''}`}
                onClick={() => handleTabChange('upcoming')}
              >
                Upcoming
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'past'}
                className={`tab-btn ${activeTab === 'past' ? 'active-tab' : ''}`}
                onClick={() => handleTabChange('past')}
              >
                Past
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'cancelled'}
                className={`tab-btn ${activeTab === 'cancelled' ? 'active-tab' : ''}`}
                onClick={() => handleTabChange('cancelled')}
              >
                Cancelled
              </button>
            </div>

            <div className="trips-search-box">
              <input
                type="search"
                className="trips-search-input"
                placeholder="Search reference or location..."
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Search bookings"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="trips-error-banner" role="alert">
              {error}
            </div>
          )}

          {/* Content: Loading Skeleton or Bookings List or Empty State */}
          {loading ? (
            <div className="trips-skeleton-list" data-testid="trips-skeleton">
              {[1, 2, 3].map((n) => (
                <div key={n} className="trip-skeleton-card">
                  <div className="skeleton-line skeleton-title" />
                  <div className="skeleton-line skeleton-sub" />
                  <div className="skeleton-line skeleton-meta" />
                </div>
              ))}
            </div>
          ) : displayedBookings.length > 0 ? (
            <div className="trips-list" data-testid="trips-list">
              {displayedBookings.map((trip) => (
                <div key={trip.id} className="trip-card">
                  <div className="trip-card-header">
                    <div>
                      <span className="trip-ref-badge">{trip.reference}</span>
                      <h3 className="trip-route">
                        {trip.startLocation} <span className="route-arrow">&rarr;</span> {trip.endLocation}
                      </h3>
                    </div>
                    <span className={`status-pill status-${(trip.status || 'pending').toLowerCase()}`}>
                      {trip.status}
                    </span>
                  </div>

                  <div className="trip-card-body">
                    <div className="trip-info-item">
                      <span className="info-label">Dates</span>
                      <span className="info-val">
                        {trip.startDate} &mdash; {trip.endDate}
                      </span>
                    </div>

                    <div className="trip-info-item">
                      <span className="info-label">Guests</span>
                      <span className="info-val">
                        {trip.adults} Adult{trip.adults > 1 ? 's' : ''}
                        {trip.children > 0 ? `, ${trip.children} Child${trip.children > 1 ? 'ren' : ''}` : ''}
                        {trip.infants > 0 ? `, ${trip.infants} Infant${trip.infants > 1 ? 's' : ''}` : ''}
                      </span>
                    </div>

                    <div className="trip-info-item">
                      <span className="info-label">Price</span>
                      <span className="info-val price-val">
                        ₹{Number(trip.priceTotal || 0).toLocaleString('en-IN')} {trip.currency || 'INR'}
                      </span>
                    </div>
                  </div>

                  <div className="trip-card-footer">
                    <Link to={`/trips/${trip.id}`} className="secondary-btn view-details-link">
                      View Details
                    </Link>
                    <a
                      href={`/api/v1/bookings/${trip.id}/itinerary.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="download-pdf-link"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="trips-pagination" aria-label="Pagination">
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="trips-card empty-trips-card" data-testid="trips-empty-state">
              <h3 className="empty-title">
                {searchTerm
                  ? 'No matching trips found'
                  : activeTab === 'upcoming'
                  ? 'No upcoming trips'
                  : activeTab === 'past'
                  ? 'No past trips'
                  : 'No cancelled trips'}
              </h3>
              <p className="empty-desc">
                {searchTerm
                  ? `We couldn't find any trips matching "${searchTerm}". Try a different keyword.`
                  : activeTab === 'upcoming'
                  ? "You don't have any upcoming travel scheduled. Book your next adventure now!"
                  : activeTab === 'past'
                  ? "You haven't completed any trips yet."
                  : 'You have no cancelled bookings.'}
              </p>
              <Link to="/book" className="primary-btn">
                Book a Trip Now
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Trips
