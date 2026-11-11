import { useState, useEffect } from 'react'
import RouteMap from '../RouteMap'
import PriceBreakdown from '../PriceBreakdown'
import { useSocket } from '../../context/SocketContext'
import './index.css'

const Confirmation = ({
  name,
  startLocation,
  endLocation,
  startDate,
  endDate,
  adults,
  children,
  infants,
  assistanceNeeded,
  assistanceType,
  startLat,
  startLng,
  endLat,
  endLng,
  quote,
  quoteLoading,
  quoteError,
  onCancel,
  onConfirm,
  isSubmitting = false,
  onMount,
}) => {
  const { socket } = useSocket()
  const [priceUpdateNotice, setPriceUpdateNotice] = useState(null)
  const [isAcknowledged, setIsAcknowledged] = useState(false)

  useEffect(() => {
    if (onMount) {
      const key =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0
              const v = c === 'x' ? r : (r & 0x3) | 0x8
              return v.toString(16)
            })
      onMount(key)
    }
  }, [onMount])

  // Listen for real-time quote rate changes from socket
  useEffect(() => {
    if (!socket) return

    const handleQuoteUpdated = (data) => {
      if (data && (data.newTotal !== undefined || data.newRates !== undefined)) {
        const oldVal =
          data.oldTotal !== undefined
            ? `₹${Number(data.oldTotal).toFixed(2)}`
            : quote?.total
            ? `₹${Number(quote.total).toFixed(2)}`
            : 'previous price'

        const newVal =
          data.newTotal !== undefined
            ? `₹${Number(data.newTotal).toFixed(2)}`
            : quote?.total
            ? `₹${(Number(quote.total) * 1.1).toFixed(2)}`
            : 'updated price'

        setPriceUpdateNotice({ oldVal, newVal })
        setIsAcknowledged(false)
      }
    }

    socket.on('quote:updated', handleQuoteUpdated)

    return () => {
      socket.off('quote:updated', handleQuoteUpdated)
    }
  }, [socket, quote])

  return (
    <div className="step-card">
      <div className="summary-card">
        <ul className="summary-list">
          <li className="summary-item">
            <p className="summary-label">Name</p>
            <p className="summary-value">{name}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">Start Location</p>
            <p className="summary-value">{startLocation}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">End Location</p>
            <p className="summary-value">{endLocation}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">Start Date</p>
            <p className="summary-value">{startDate}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">End Date</p>
            <p className="summary-value">{endDate}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">Adults</p>
            <p className="summary-value">{adults}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">Children</p>
            <p className="summary-value">{children}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">Infants</p>
            <p className="summary-value">{infants}</p>
          </li>
          <li className="summary-item">
            <p className="summary-label">Travel Assistance</p>
            <p className="summary-value">
              {assistanceNeeded ? (
                assistanceType
              ) : (
                <>
                  <span>Not needed</span>
                  <span
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                  >
                    No
                  </span>
                </>
              )}
            </p>
          </li>
        </ul>
      </div>

      {startLat && startLng && endLat && endLng && (
        <RouteMap
          startLat={startLat}
          startLng={startLng}
          endLat={endLat}
          endLng={endLng}
          startLabel={startLocation || 'Start'}
          endLabel={endLocation || 'Destination'}
        />
      )}

      <PriceBreakdown quote={quote} loading={quoteLoading} error={quoteError} />

      {priceUpdateNotice && !isAcknowledged && (
        <div className="price-updated-banner" role="alert" data-testid="price-update-banner">
          <span className="price-banner-text">
            Price updated from {priceUpdateNotice.oldVal} to {priceUpdateNotice.newVal}
          </span>
          <button
            type="button"
            className="acknowledge-btn"
            onClick={() => setIsAcknowledged(true)}
          >
            Acknowledge
          </button>
        </div>
      )}

      <div className="form-actions dual-actions">
        <button
          type="button"
          className="secondary-btn"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="primary-btn"
          onClick={onConfirm}
          disabled={isSubmitting || (Boolean(priceUpdateNotice) && !isAcknowledged)}
        >
          {isSubmitting && <span className="btn-spinner" aria-hidden="true" />}
          {isSubmitting ? 'Confirming...' : 'Confirm'}
        </button>
      </div>
    </div>
  )
}

export default Confirmation
