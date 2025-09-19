import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { useStories } from '../state/StoriesProvider'

export default function Dashboard() {
  const { stories } = useStories()
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, color: 'var(--color-text)' }}>Your Stories</h1>
        <Link to="/stories/new"><Button>Create New Story</Button></Link>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {stories.length === 0 ? (
          <Card>
            <div style={{ color: 'var(--color-text-muted)' }}>No stories yet. Click "Create New Story" to begin.</div>
          </Card>
        ) : (
          stories.map((s) => (
            <Link key={s.id} to={`/stories/${s.id}`} style={{ textDecoration: 'none' }}>
              <Card>
                <div style={{ color: 'var(--color-text)', fontWeight: 600 }}>{s.name}</div>
                <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>{s.shortDescription}</div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

