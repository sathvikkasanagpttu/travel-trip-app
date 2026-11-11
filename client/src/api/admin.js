import apiClient from './axios'

export const fetchAdminBookings = async (params = {}) => {
  const response = await apiClient.get('/admin/bookings', { params })
  return response.data
}

export const updateAdminBookingStatus = async (id, { status, note }) => {
  const response = await apiClient.patch(`/admin/bookings/${id}/status`, { status, note })
  return response.data
}

export const updateQuoteRates = async (rates) => {
  const response = await apiClient.post('/admin/quote-rates', rates)
  return response.data
}
