import { useParams } from 'react-router-dom'

export default function Places() {
  const { id } = useParams()
  return <div style={{ color: 'var(--color-text)' }}>Places for story {id} (coming soon)</div>
}

