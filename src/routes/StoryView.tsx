import { Link, useNavigate, useParams } from 'react-router-dom'
import { IconButton } from '../components/IconButton'
import { Card } from '../components/Card'
import { useStories } from '../state/StoriesProvider'
import type { CSSProperties } from 'react'

export default function StoryView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { get, remove } = useStories()
  const story = id ? get(id) : undefined

  if (!story) {
    return <div style={{ color: 'var(--color-text)' }}>Story not found.</div>
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, color: 'var(--color-text)' }}>{story.name}</h1>
        <IconButton aria-label="Edit story" onClick={() => navigate(`/stories/${story.id}/edit`)} title="Edit">
          ✏️
        </IconButton>
        <button
          onClick={async () => {
            if (!id) return
            const ok = confirm('Delete this story? This cannot be undone.')
            if (!ok) return
            try {
              await remove(id)
              navigate('/')
            } catch (error) {
              console.error('Failed to delete story', error)
              alert('Failed to delete story')
            }
          }}
          style={{
            marginLeft: 8,
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            color: 'crimson',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>
      <div style={{ color: 'var(--color-text-muted)' }}>{story.shortDescription}</div>
      <Card>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Link to={`/stories/${story.id}/characters`} style={linkStyle}>Characters</Link>
          <Link to={`/stories/${story.id}/groups`} style={linkStyle}>Groups</Link>
          <Link to={`/stories/${story.id}/locations`} style={linkStyle}>Locations</Link>
          <Link to={`/stories/${story.id}/species`} style={linkStyle}>Species</Link>
          <Link to={`/stories/${story.id}/items`} style={linkStyle}>Items</Link>
          <Link to={`/stories/${story.id}/languages`} style={linkStyle}>Languages</Link>
          <Link to={`/stories/${story.id}/plot-points`} style={linkStyle}>Plot points</Link>
        </nav>
      </Card>
    </div>
  )
}

const linkStyle: CSSProperties = {
  padding: '8px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  textDecoration: 'none',
  color: 'var(--color-text)',
  background: 'var(--color-surface)',
}
