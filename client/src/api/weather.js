import apiClient from './axios'

export const fetchWeather = async ({ lat, lng, start, end }) => {
  if (!lat || !lng) {
    return { available: false, forecast: [] }
  }

  const response = await apiClient.get('/weather', {
    params: { lat, lng, start, end },
  })
  return response.data
}
