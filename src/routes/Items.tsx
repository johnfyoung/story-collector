import { useParams } from 'react-router-dom'
import { TabNav } from '../components/TabNav'

export default function Items() {
  const { id } = useParams()
  return (
    <div>
      {id ? <TabNav active="items" storyId={id} /> : null}
      <div style={{ color: 'var(--color-text)' }}>Items for story {id} (coming soon)</div>
    </div>
  )
}
