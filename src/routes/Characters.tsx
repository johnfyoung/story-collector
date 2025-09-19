import { useParams } from 'react-router-dom'

export default function Characters() {
  const { id } = useParams()
  return <div style={{ color: 'var(--color-text)' }}>Characters for story {id} (coming soon)</div>
}

