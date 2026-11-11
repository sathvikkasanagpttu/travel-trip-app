import apiClient from './axios'

export const fetchQuote = async (payload) => {
  const response = await apiClient.post('/quote', payload)
  return response.data
}
