import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { SearchBox } from '../components/SearchBox'
import { Avatar } from '../components/Avatar'
import { useStories } from '../state/StoriesProvider'
import { TabNav } from '../components/TabNav'
import type { NamedElement, StoryContent } from '../types'

type SortBy = 'alphabetical' | 'lastUpdated' | 'none'

export default function Items() {
  const { id: storyId } = useParams()
  const navigate = useNavigate()
  const { loadContent } = useStories()
  const [content, setContent] = useState<StoryContent | null>(null)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('lastUpdated')

  useEffect(() => {
    if (!storyId) return
    loadContent(storyId).then(setContent)
  }, [storyId, loadContent])

  const filtered = useMemo(() => {
    if (!content) return [] as NamedElement[]
    const q = query.toLowerCase()
    let results = content.items.filter(
      (el) =>
        el.name.toLowerCase().includes(q) ||
        (el.shortDescription ?? '').toLowerCase().includes(q)
    )

    if (sortBy === 'alphabetical') {
      results = results.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'lastUpdated') {
      results = results.sort((a, b) => (b.lastEdited ?? 0) - (a.lastEdited ?? 0))
    }

    return results
  }, [content, query, sortBy])

  function startAdd() {}

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {storyId ? <TabNav active="items" storyId={storyId} /> : null}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, color: 'var(--color-text)' }}>Items</h1>
        {storyId ? (
          <a href={`/stories/${storyId}/items/new`} style={{ textDecoration: 'none' }}>
            <Button onClick={startAdd}>Add item</Button>
          </a>
        ) : null}
      </div>
      {!content ? (
        <div style={{ color: 'var(--color-text)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <SearchBox
                value={query}
                onChange={setQuery}
                suggestions={content.items.map((e) => e.name)}
                placeholder="Search items…"
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant={sortBy === 'alphabetical' ? 'primary' : 'ghost'}
                onClick={() => setSortBy(sortBy === 'alphabetical' ? 'none' : 'alphabetical')}
              >
                A-Z
              </Button>
              <Button
                variant={sortBy === 'lastUpdated' ? 'primary' : 'ghost'}
                onClick={() => setSortBy(sortBy === 'lastUpdated' ? 'none' : 'lastUpdated')}
              >
                Recently Updated
              </Button>
            </div>
          </div>
          {filtered.length === 0 ? (
            <Card>
              <div style={{ color: 'var(--color-text-muted)' }}>No items match.</div>
            </Card>
          ) : (
            filtered.map((el) => (
              <Card
                key={el.id}
                onClick={() => storyId && navigate(`/stories/${storyId}/items/${el.id}/edit`)}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Avatar name={el.name} url={el.avatarUrl} size={120} editable={false} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ color: 'var(--color-text)', fontWeight: 600 }}>{el.name}</div>
                      {el.shortDescription ? (
                        <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                          {el.shortDescription}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {storyId ? (
                    <a
                      href={`/stories/${storyId}/items/${el.id}/edit`}
                      style={{ textDecoration: 'none' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost">Edit</Button>
                    </a>
                  ) : null}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
