import apiClient from './axios'

export const createBooking = async (bookingData, idempotencyKey) => {
  const headers = {}
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  const response = await apiClient.post('/bookings', bookingData, { headers })
  return response.data
}

export const getBookings = async (params = {}) => {
  const response = await apiClient.get('/bookings', { params })
  return response.data
}

export const getBookingById = async (id) => {
  const response = await apiClient.get(`/bookings/${id}`)
  return response.data
}
