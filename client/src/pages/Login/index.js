import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Header from '../../components/Header'
import './index.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/book'

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!email.trim()) {
      newErrors.email = 'Enter your email'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Enter your password'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    setErrors({})

    const result = await login(email, password)
    setSubmitting(false)

    if (result.success) {
      showToast(`Welcome back, ${result.user.name}!`, 'success')
      navigate(from, { replace: true })
    } else {
      setErrors({ form: result.error || 'Invalid credentials' })
      showToast(result.error || 'Login failed', 'error')
    }
  }

  return (
    <div className="auth-page">
      <Header />
      <main className="auth-main">
        <div className="auth-card">
          <h2 className="auth-heading">Welcome Back</h2>
          <p className="auth-subheading">Log in to manage and view your trips</p>

          {errors.form && (
            <div className="auth-error-banner" role="alert">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
                }}
                disabled={submitting}
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="login-password" className="form-label">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
                }}
                disabled={submitting}
              />
              {errors.password && <p className="error-message">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="primary-btn auth-submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">
              Sign Up
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Login
