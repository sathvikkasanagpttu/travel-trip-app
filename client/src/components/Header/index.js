import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import './index.css'

const Header = () => {
  const { user, logout } = useAuth()
  const { connectionStatus } = useSocket()

  let hasRouter = false
  try {
    useLocation()
    hasRouter = true
  } catch {
    hasRouter = false
  }

  const navigate = hasRouter ? useNavigate() : () => {}

  const handleLogout = async () => {
    await logout()
    if (hasRouter) {
      navigate('/login')
    }
  }

  const BrandElement = hasRouter ? (
    <Link to="/book" className="header-brand-link">
      <h1 className="header-brand">Travel Trip</h1>
    </Link>
  ) : (
    <div className="header-brand-link">
      <h1 className="header-brand">Travel Trip</h1>
    </div>
  )

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-brand-container">
          {BrandElement}
          <span
            className={`socket-status-dot dot-${connectionStatus}`}
            data-testid="socket-status-dot"
            title={`Real-time: ${connectionStatus}`}
            aria-label={`Real-time: ${connectionStatus}`}
          />
        </div>

        {hasRouter && (
          <nav className="header-nav" aria-label="Main Navigation">
            <Link to="/book" className="nav-link">
              Book Trip
            </Link>

            {user ? (
              <div className="user-nav-group">
                <Link to="/trips" className="nav-link">
                  My Trips
                </Link>
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="nav-link admin-nav-link">
                    Admin
                  </Link>
                )}
                <div className="user-profile-badge">
                  <span className="user-avatar" title={user.email}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                  <span className="user-name">{user.name}</span>
                  <button
                    type="button"
                    className="logout-btn"
                    onClick={handleLogout}
                    aria-label="Log out"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-nav-buttons">
                <Link to="/login" className="login-nav-link">
                  Log In
                </Link>
                <Link to="/signup" className="signup-nav-btn">
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
