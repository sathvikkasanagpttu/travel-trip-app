import apiClient from './axios'

export const signup = async ({ name, email, password }) => {
  const response = await apiClient.post('/auth/signup', { name, email, password })
  return response.data
}

export const login = async ({ email, password }) => {
  const response = await apiClient.post('/auth/login', { email, password })
  return response.data
}

export const logout = async () => {
  const response = await apiClient.post('/auth/logout')
  return response.data
}

export const getMe = async () => {
  const response = await apiClient.get('/auth/me')
  return response.data
}
