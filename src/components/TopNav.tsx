import { Link } from 'react-router-dom'
import { useTheme } from '../theme/useTheme'
import { useAuth } from '../auth/AuthProvider'

export function TopNav() {
  const { theme, toggle } = useTheme()
  const { user, signOut } = useAuth()
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        background: 'var(--color-bg)',
        zIndex: 10,
      }}
    >
      <Link to="/" style={{ color: 'var(--color-text)', textDecoration: 'none', fontWeight: 600 }}>
        Story Collector
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={toggle} style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: 'var(--color-text)' }}>
          Theme: {theme.name}
        </button>
        {user ? (
          <>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>{user.email}</span>
            <button onClick={signOut} style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: 'var(--color-text)' }}>
              Sign out
            </button>
          </>
        ) : (
          <Link to="/login" style={{ color: 'var(--color-text)' }}>Sign in</Link>
        )}
      </div>
    </header>
  )
}
