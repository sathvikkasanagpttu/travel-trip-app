import { useState, useEffect, useMemo } from 'react'
import Header from '../../components/Header'
import { fetchAdminBookings, updateAdminBookingStatus } from '../../api/admin'
import { useSocket } from '../../context/SocketContext'
import { useToast } from '../../context/ToastContext'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import './index.css'

const Admin = () => {
  const { socket } = useSocket()
  const { showToast } = useToast()

  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [newRowIds, setNewRowIds] = useState(new Set())

  // Initial fetch
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setLoading(true)
      try {
        const data = await fetchAdminBookings({
          status: statusFilter,
          search: search.trim() || undefined,
        })
        if (isMounted) {
          setBookings(data.bookings || [])
          if (data.stats) {
            setStats(data.stats)
          }
        }
      } catch (err) {
        if (isMounted) {
          showToast(
            err.response?.data?.error?.message || 'Failed to load admin bookings',
            'error'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [statusFilter, search, showToast])

  // Real-time socket listeners for live feed
  useEffect(() => {
    if (!socket) return

    // New booking created
    const handleNewBooking = (newBooking) => {
      if (!newBooking) return

      setBookings((prev) => {
        // Prevent duplicate entries
        if (prev.some((b) => b.id === newBooking.id)) {
          return prev
        }
        return [newBooking, ...prev]
      })

      // Mark row as new for animation
      setNewRowIds((prev) => new Set(prev).add(newBooking.id))
      setTimeout(() => {
        setNewRowIds((prev) => {
          const next = new Set(prev)
          next.delete(newBooking.id)
          return next
        })
      }, 3000)

      // Update counters
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        pending: newBooking.status === 'PENDING' ? prev.pending + 1 : prev.pending,
        confirmed: newBooking.status === 'CONFIRMED' ? prev.confirmed + 1 : prev.confirmed,
      }))

      showToast(`⚡ New booking received: ${newBooking.reference}`, 'info')
    }

    // Booking status updated
    const handleStatusUpdate = (event) => {
      if (!event || !event.bookingId) return

      setBookings((prev) =>
        prev.map((b) => (b.id === event.bookingId ? { ...b, status: event.status } : b))
      )

      showToast(`Booking #${event.bookingId.slice(0, 8)} updated to ${event.status}`, 'info')
    }

    socket.on('admin:new-booking', handleNewBooking)
    socket.on('booking:status', handleStatusUpdate)

    return () => {
      socket.off('admin:new-booking', handleNewBooking)
      socket.off('booking:status', handleStatusUpdate)
    }
  }, [socket, showToast])

  // Handle status actions: Confirm or Reject
  const handleUpdateStatus = async (id, status) => {
    try {
      const note = status === 'CONFIRMED' ? 'Approved by admin' : 'Rejected by admin'
      await updateAdminBookingStatus(id, { status, note })

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      )
      setStats((prev) => {
        const next = { ...prev }
        if (status === 'CONFIRMED') {
          next.pending = Math.max(0, next.pending - 1)
          next.confirmed += 1
        } else if (status === 'CANCELLED') {
          next.pending = Math.max(0, next.pending - 1)
          next.cancelled += 1
        }
        return next
      })

      showToast(`Booking ${status.toLowerCase()} successfully`, 'success')
    } catch (err) {
      showToast(
        err.response?.data?.error?.message || `Failed to update booking status to ${status}`,
        'error'
      )
    }
  }

  // CSV Export
  const handleExportCsv = () => {
    if (!bookings || bookings.length === 0) {
      showToast('No bookings available to export', 'info')
      return
    }

    const headers = [
      'Reference',
      'Traveler Name',
      'Start Location',
      'End Location',
      'Start Date',
      'End Date',
      'Adults',
      'Children',
      'Infants',
      'Total Price',
      'Currency',
      'Status',
      'Created At',
    ]

    const rows = bookings.map((b) => [
      b.reference,
      `"${b.name || ''}"`,
      `"${b.startLocation || ''}"`,
      `"${b.endLocation || ''}"`,
      b.startDate || '',
      b.endDate || '',
      b.adults || 1,
      b.children || 0,
      b.infants || 0,
      b.priceTotal || 0,
      b.currency || 'INR',
      b.status || 'CONFIRMED',
      b.createdAt || '',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `bookings-export-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast('Bookings exported to CSV successfully', 'success')
  }

  // Daily Chart Aggregation Data
  const chartData = useMemo(() => {
    const countsByDate = {}

    bookings.forEach((b) => {
      const dateKey = (b.createdAt || b.startDate || '').slice(0, 10)
      if (dateKey) {
        countsByDate[dateKey] = (countsByDate[dateKey] || 0) + 1
      }
    })

    const sortedDates = Object.keys(countsByDate).sort()
    return sortedDates.map((date) => ({
      date: date.slice(5), // 'MM-DD'
      bookings: countsByDate[date],
    }))
  }, [bookings])

  return (
    <div className="admin-page">
      <Header />
      <main className="admin-main">
        <div className="admin-container">
          {/* Header & CSV Export */}
          <div className="admin-header-row">
            <div>
              <h1 className="admin-title">Admin Dashboard</h1>
              <p className="admin-subtitle">
                Live monitoring, real-time booking updates, and control center
              </p>
            </div>
            <div className="admin-actions-bar">
              <button
                type="button"
                className="csv-export-btn"
                onClick={handleExportCsv}
                data-testid="csv-export-btn"
              >
                <span>📥</span> Export CSV
              </button>
            </div>
          </div>

          {/* Stats Counters */}
          <div className="stats-grid">
            <div className="stat-card stat-total" data-testid="stat-total">
              <span className="stat-label">Total Bookings</span>
              <span className="stat-count">{stats.total}</span>
            </div>
            <div className="stat-card stat-pending" data-testid="stat-pending">
              <span className="stat-label">Pending</span>
              <span className="stat-count">{stats.pending}</span>
            </div>
            <div className="stat-card stat-confirmed" data-testid="stat-confirmed">
              <span className="stat-label">Confirmed</span>
              <span className="stat-count">{stats.confirmed}</span>
            </div>
            <div className="stat-card stat-cancelled" data-testid="stat-cancelled">
              <span className="stat-label">Cancelled</span>
              <span className="stat-count">{stats.cancelled}</span>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="chart-card" data-testid="admin-chart-card">
            <h2 className="chart-title">Bookings per Day</h2>
            <div className="chart-wrapper">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" allowDecimals={false} fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: 6,
                        color: '#ffffff',
                      }}
                    />
                    <Bar dataKey="bookings" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="table-empty-row">No booking activity recorded yet</div>
              )}
            </div>
          </div>

          {/* Live Feed Table */}
          <div className="table-card">
            <div className="table-toolbar">
              <div className="filter-tabs">
                {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
                    onClick={() => setStatusFilter(status)}
                    data-testid={`filter-${status.toLowerCase()}`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <input
                type="text"
                className="search-input"
                placeholder="Search reference or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="admin-search-input"
              />
            </div>

            <div className="bookings-table-wrapper">
              <table className="bookings-table" data-testid="admin-bookings-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Traveler</th>
                    <th>Route</th>
                    <th>Dates</th>
                    <th>Guests</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="table-empty-row">
                        Loading bookings...
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="table-empty-row">
                        No bookings found matching filter
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => {
                      const isNew = newRowIds.has(b.id)
                      const isPending = b.status === 'PENDING'
                      const currencySymbol = b.currency === 'INR' ? '₹' : b.currency

                      return (
                        <tr
                          key={b.id}
                          className={isNew ? 'table-row-new' : ''}
                          data-testid={`admin-booking-row-${b.id}`}
                        >
                          <td>
                            <span className="booking-ref-code">{b.reference}</span>
                          </td>
                          <td>
                            <div className="traveler-name">{b.name}</div>
                            {b.user?.email && (
                              <div className="traveler-email">{b.user.email}</div>
                            )}
                          </td>
                          <td>
                            <span className="route-text">
                              {b.startLocation} &rarr; {b.endLocation}
                            </span>
                          </td>
                          <td>
                            {b.startDate} &mdash; {b.endDate}
                          </td>
                          <td>
                            {b.adults}A
                            {b.children > 0 && `, ${b.children}C`}
                            {b.infants > 0 && `, ${b.infants}I`}
                          </td>
                          <td>
                            <strong>
                              {currencySymbol}
                              {Number(b.priceTotal || 0).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </strong>
                          </td>
                          <td>
                            <span
                              className={`status-pill status-${(b.status || 'pending').toLowerCase()}`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              {isPending ? (
                                <>
                                  <button
                                    type="button"
                                    className="action-confirm-btn"
                                    onClick={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                                    data-testid={`btn-confirm-${b.id}`}
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    className="action-reject-btn"
                                    onClick={() => handleUpdateStatus(b.id, 'CANCELLED')}
                                    data-testid={`btn-reject-${b.id}`}
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: 13 }}>&mdash;</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Admin
