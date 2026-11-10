import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Header from '../../components/Header'
import '../Login/index.css'

const Signup = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const { signup } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!name.trim()) {
      newErrors.name = 'Enter your name'
    }

    if (!email.trim()) {
      newErrors.email = 'Enter your email'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Enter a password'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    setErrors({})

    const result = await signup(name, email, password)
    setSubmitting(false)

    if (result.success) {
      showToast(`Account created! Welcome, ${result.user.name}.`, 'success')
      navigate('/book', { replace: true })
    } else {
      setErrors({ form: result.error || 'Signup failed' })
      showToast(result.error || 'Signup failed', 'error')
    }
  }

  return (
    <div className="auth-page">
      <Header />
      <main className="auth-main">
        <div className="auth-card">
          <h2 className="auth-heading">Create an Account</h2>
          <p className="auth-subheading">Sign up to save drafts, track bookings and get live updates</p>

          {errors.form && (
            <div className="auth-error-banner" role="alert">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="signup-name" className="form-label">
                Name
              </label>
              <input
                id="signup-name"
                type="text"
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                placeholder="Your full name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
                }}
                disabled={submitting}
              />
              {errors.name && <p className="error-message">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="signup-email" className="form-label">
                Email
              </label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password" className="form-label">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="At least 6 characters"
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
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Log In
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Signup
