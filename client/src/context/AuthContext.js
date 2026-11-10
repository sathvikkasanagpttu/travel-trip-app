import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch current user on initial mount
  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        const data = await authApi.getMe()
        if (isMounted && data?.user) {
          setUser(data.user)
        }
      } catch {
        // Not authenticated or server offline - silent fallback
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (email, password) => {
    setError(null)
    try {
      const data = await authApi.login({ email, password })
      if (data?.user) {
        setUser(data.user)
        return { success: true, user: data.user }
      }
      return { success: false, error: 'Login failed' }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Login failed'
      setError(msg)
      return { success: false, error: msg }
    }
  }, [])

  const signup = useCallback(async (name, email, password) => {
    setError(null)
    try {
      const data = await authApi.signup({ name, email, password })
      if (data?.user) {
        setUser(data.user)
        return { success: true, user: data.user }
      }
      return { success: false, error: 'Signup failed' }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Signup failed'
      setError(msg)
      return { success: false, error: msg }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    // Graceful fallback for components or tests rendered without provider
    return {
      user: null,
      loading: false,
      error: null,
      login: async () => ({ success: false }),
      signup: async () => ({ success: false }),
      logout: async () => {},
    }
  }
  return context
}
