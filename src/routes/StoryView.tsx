import { Link, useNavigate, useParams } from 'react-router-dom'
import { IconButton } from '../components/IconButton'
import { Card } from '../components/Card'
import { useStories } from '../state/StoriesProvider'
import type { CSSProperties } from 'react'

export default function StoryView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { get } = useStories()
  const story = id ? get(id) : undefined

  if (!story) {
    return <div style={{ color: 'var(--color-text)' }}>Story not found.</div>
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h1 style={{ margin: 0, color: 'var(--color-text)' }}>{story.name}</h1>
        <IconButton aria-label="Edit story" onClick={() => navigate(`/stories/${story.id}/edit`)} title="Edit">
          ✏️
        </IconButton>
      </div>
      <div style={{ color: 'var(--color-text-muted)' }}>{story.shortDescription}</div>
      <Card>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Link to={`/stories/${story.id}/characters`} style={linkStyle}>
            Characters
          </Link>
          <Link to={`/stories/${story.id}/places`} style={linkStyle}>
            Places
          </Link>
          <Link to={`/stories/${story.id}/items`} style={linkStyle}>
            Items
          </Link>
          <Link to={`/stories/${story.id}/plot-points`} style={linkStyle}>
            Plot points
          </Link>
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
