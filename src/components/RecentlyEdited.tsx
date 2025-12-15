import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getRecentEdits, getEditTypeLabel } from '../lib/recentEdits'

export function RecentlyEdited() {
  const [recentEdits, setRecentEdits] = useState(() => getRecentEdits(4))

  // Refresh recent edits periodically to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRecentEdits(getRecentEdits(4))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Don't render if no recent edits
  if (recentEdits.length === 0) return null

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'just now'
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px 16px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
    }}>
      <span style={{
        color: 'var(--color-text-muted)',
        fontSize: 'var(--font-sm)',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        Recently Edited:
      </span>
      <div style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        flex: 1,
      }}>
        {recentEdits.map(edit => (
          <Link
            key={edit.id}
            to={edit.editUrl}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text)',
              textDecoration: 'none',
              fontSize: 'var(--font-sm)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-surface)'
              e.currentTarget.style.borderColor = 'var(--color-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-bg)'
              e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            <span style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.9em'
            }}>
              {getEditTypeLabel(edit.type)}:
            </span>
            <span style={{ fontWeight: 500 }}>{edit.elementName}</span>
            <span style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.85em',
            }}>
              {formatRelativeTime(edit.timestamp)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
