import { useParams } from 'react-router-dom'

export default function Items() {
  const { id } = useParams()
  return <div style={{ color: 'var(--color-text)' }}>Items for story {id} (coming soon)</div>
}

