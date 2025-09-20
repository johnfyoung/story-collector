import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'
import { SearchBox } from '../components/SearchBox'
import { useStories } from '../state/StoriesProvider'
import { TabNav } from '../components/TabNav'
import { Avatar } from '../components/Avatar'
import type { StoryContent } from '../types'

export default function Species() {
  const { id: storyId } = useParams()
  const navigate = useNavigate()
  const { loadContent, saveContent } = useStories()
  const [content, setContent] = useState<StoryContent | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!storyId) return
    loadContent(storyId).then(setContent)
  }, [storyId, loadContent])

  const filtered = useMemo(() => {
    if (!content) return [] as StoryContent['species']
    const q = query.toLowerCase()
    return content.species.filter((el) => el.name.toLowerCase().includes(q) || (el.shortDescription ?? '').toLowerCase().includes(q))
  }, [content, query])

  async function remove(id: string) {
    if (!storyId || !content) return
    const ok = confirm('Delete this species?')
    if (!ok) return
    const next: StoryContent = { ...content, species: content.species.filter((x) => x.id !== id) }
    await saveContent(storyId, next)
    setContent(next)
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {storyId ? <TabNav active="species" storyId={storyId} /> : null}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, color: 'var(--color-text)' }}>Species</h1>
        {storyId ? (
          <a href={`/stories/${storyId}/species/new`} style={{ textDecoration: 'none' }}>
            <Button>Add species</Button>
          </a>
        ) : null}
      </div>
      {content ? (
        <SearchBox value={query} onChange={setQuery} suggestions={content.species.map((e) => e.name)} placeholder="Search species…" />
      ) : null}
      {!content ? (
        <div style={{ color: 'var(--color-text)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.length === 0 ? (
            <Card>
              <div style={{ color: 'var(--color-text-muted)' }}>No species match.</div>
            </Card>
          ) : (
            filtered.map((el) => (
              <Card key={el.id} onClick={() => storyId && navigate(`/stories/${storyId}/species/${el.id}/edit`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={el.name} url={el.avatarUrl} size={40} editable={false} onChange={() => {}} />
                    <div>
                      <div style={{ color: 'var(--color-text)', fontWeight: 600 }}>{el.name}</div>
                      {el.shortDescription ? (
                        <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>{el.shortDescription}</div>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {storyId ? (
                      <a href={`/stories/${storyId}/species/${el.id}/edit`} style={{ textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost">Edit</Button>
                      </a>
                    ) : null}
                    <Button variant="ghost" onClick={(e) => { e.stopPropagation(); remove(el.id) }}>
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
