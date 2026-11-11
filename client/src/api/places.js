import apiClient from './axios'

export const searchPlaces = async (query) => {
  if (!query || query.trim().length < 3) {
    return { places: [] }
  }

  const response = await apiClient.get('/places/search', {
    params: { q: query.trim() },
  })
  return response.data
}
