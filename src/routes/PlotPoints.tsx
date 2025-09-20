import { useParams } from 'react-router-dom'
import { TabNav } from '../components/TabNav'

export default function PlotPoints() {
  const { id } = useParams()
  return (
    <div>
      {id ? <TabNav active="plot-points" storyId={id} /> : null}
      <div style={{ color: 'var(--color-text)' }}>Plot points for story {id} (coming soon)</div>
    </div>
  )
}
