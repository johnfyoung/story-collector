import { Link } from 'react-router-dom'
import { useTheme } from '../theme/useTheme'
import { useAuth } from '../auth/AuthProvider'
import './TopNav.css'

export function TopNav() {
  const { theme, toggle } = useTheme()
  const { user, signOut } = useAuth()
  return (
    <header className="top-nav">
      <div className="top-nav__content">
        <Link to="/" className="top-nav__brand">
          Story Collector
        </Link>
        <div className="top-nav__actions">
          <button type="button" onClick={toggle} className="top-nav__theme-toggle">
            Theme: {theme.name}
          </button>
          {user ? (
            <div className="top-nav__user-group">
              <span className="top-nav__user">{user.email}</span>
              <button type="button" onClick={signOut}>
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/login">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  )
}
