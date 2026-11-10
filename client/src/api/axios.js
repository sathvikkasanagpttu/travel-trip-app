import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Response interceptor to handle token refresh if needed
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retried and not the refresh or login endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/signup')
    ) {
      originalRequest._retry = true
      try {
        await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
        return apiClient(originalRequest)
      } catch (refreshErr) {
        // Refresh failed, proceed with rejection
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
