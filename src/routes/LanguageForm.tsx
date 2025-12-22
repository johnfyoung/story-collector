import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'
import { MentionArea } from '../components/MentionArea'
import { TabNav } from '../components/TabNav'
import { useStories } from '../state/StoriesProvider'
import { Avatar } from '../components/Avatar'
import type { ElementConnection, NamedElement, StoryContent } from '../types'
import { addRecentEdit } from '../lib/recentEdits'
import {
  extractConnectionsFromText,
  getAllMentionableElements,
  mergeConnections,
  resolveConnectionsInText,
  updateConnectionNames,
  type MentionableElement,
} from '../lib/connections'

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export default function LanguageForm() {
  const { id: storyId, elemId } = useParams()
  const navigate = useNavigate()
  const { loadContent, saveContent, get: getStory } = useStories()
  const [content, setContent] = useState<StoryContent | null>(null)
  const [name, setName] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [longDesc, setLongDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [shortDescConnections, setShortDescConnections] = useState<ElementConnection[]>([])
  const [longDescConnections, setLongDescConnections] = useState<ElementConnection[]>([])

  useEffect(() => {
    if (!storyId) return
    loadContent(storyId).then((c) => {
      const elements = getAllMentionableElements(c)
      setContent(c)
      if (elemId) {
        const ex = c.languages.find((x) => x.id === elemId)
        if (ex) {
          setName(ex.name)
          setAvatarUrl(ex.avatarUrl)
          const resolvedShort = resolveConnectionsInText(ex.shortDescription ?? '', ex.connections ?? [], elements)
          setShortDesc(resolvedShort)
          setShortDescConnections(extractConnectionsFromText(resolvedShort, elements))

          const resolvedLong = resolveConnectionsInText(ex.longDescription ?? '', ex.connections ?? [], elements)
          setLongDesc(resolvedLong)
          setLongDescConnections(extractConnectionsFromText(resolvedLong, elements))
        }
      }
    })
  }, [storyId, elemId, loadContent])

  const mentionableElements = useMemo<MentionableElement[]>(() => {
    if (!content) return []
    return getAllMentionableElements(content)
  }, [content])

  async function onSave() {
    if (!storyId || !content || !name.trim()) return
    setSaving(true)
    try {
      const connections = mergeConnections(
        updateConnectionNames(shortDescConnections, mentionableElements),
        updateConnectionNames(longDescConnections, mentionableElements),
      )
      const el: NamedElement = {
        id: elemId ?? genId(),
        name: name.trim(),
        shortDescription: shortDesc.trim(),
        longDescription: longDesc,
        avatarUrl,
        lastEdited: Date.now(),
        connections,
      }
      const next: StoryContent = {
        ...content,
        languages: content.languages.some((x) => x.id === el.id) ? content.languages.map((x) => (x.id === el.id ? el : x)) : [el, ...content.languages],
      }
      await saveContent(storyId, next)

      // Track recent edit
      const story = getStory(storyId)
      if (story) {
        addRecentEdit({
          type: 'language',
          elementId: el.id,
          elementName: el.name,
          storyId: storyId,
          storyName: story.name,
          editUrl: `/stories/${storyId}/languages/${el.id}/edit`
        })
      }

      navigate(`/stories/${storyId}/languages`)
    } finally {
      setSaving(false)
    }
  }

  if (!storyId) return null
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <TabNav active="languages" storyId={storyId} />
      {elemId ? null : <h1 style={{ color: 'var(--color-text)', margin: 0 }}>Add language</h1>}
      <Card>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Avatar name={name} url={avatarUrl} size={56} editable onChange={setAvatarUrl} availableImages={[]} />
            <div style={{ flex: 1, display: 'grid', gap: 8 }}>
              <TextField label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} />
              <MentionArea
                label="Short description"
                value={shortDesc}
                onChange={(v, conn) => {
                  setShortDesc(v)
                  setShortDescConnections(conn)
                }}
                mentionableElements={mentionableElements}
                maxChars={160}
              />
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)', marginBottom: 6 }}>Long description</div>
            <MentionArea
              value={longDesc}
              onChange={(v, conn) => {
                setLongDesc(v)
                setLongDescConnections(conn)
              }}
              mentionableElements={mentionableElements}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
