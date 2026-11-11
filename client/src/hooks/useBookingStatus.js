import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../context/SocketContext'
import { useToast } from '../context/ToastContext'

export const useBookingStatus = (bookingId, initialStatus = 'CONFIRMED') => {
  const { socket } = useSocket()
  const { showToast } = useToast()

  const [status, setStatus] = useState(initialStatus)
  const [statusNote, setStatusNote] = useState('')
  const [isUpdated, setIsUpdated] = useState(false)
  const animTimerRef = useRef(null)

  // Sync if initialStatus changes
  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus)
    }
  }, [initialStatus])

  useEffect(() => {
    if (!socket || !bookingId) return

    // Join room for this specific booking
    socket.emit('join:booking', bookingId)

    const handleStatusEvent = (event) => {
      if (!event || event.bookingId !== bookingId) return

      setStatus(event.status)
      setStatusNote(event.note || '')
      setIsUpdated(true)

      const message =
        event.status === 'CONFIRMED'
          ? `🎉 Great news! Booking #${bookingId.slice(0, 8)} is now CONFIRMED!`
          : `Booking #${bookingId.slice(0, 8)} status updated to ${event.status}`
      showToast(message, event.status === 'CONFIRMED' ? 'success' : 'info')

      if (animTimerRef.current) {
        clearTimeout(animTimerRef.current)
      }
      animTimerRef.current = setTimeout(() => {
        setIsUpdated(false)
      }, 3000)
    }

    socket.on('booking:status', handleStatusEvent)

    return () => {
      socket.emit('leave:booking', bookingId)
      socket.off('booking:status', handleStatusEvent)
      if (animTimerRef.current) {
        clearTimeout(animTimerRef.current)
      }
    }
  }, [socket, bookingId, showToast])

  return { status, isUpdated, statusNote }
}
