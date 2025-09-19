import { useParams } from 'react-router-dom'

export default function PlotPoints() {
  const { id } = useParams()
  return <div style={{ color: 'var(--color-text)' }}>Plot points for story {id} (coming soon)</div>
}

