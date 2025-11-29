import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'
import { MentionArea } from '../components/MentionArea'
import { TabNav } from '../components/TabNav'
import { useStories } from '../state/StoriesProvider'
import { Avatar } from '../components/Avatar'
import type { Descriptor, DescriptorKey, NamedElement, StoryContent } from '../types'
import { Disclosure } from '../components/Disclosure'
import { AttributePicker } from '../components/AttributePicker'
import { ImagesField } from '../components/ImagesField'

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export default function SpeciesForm() {
  const { id: storyId, elemId } = useParams()
  const navigate = useNavigate()
  const { loadContent, saveContent } = useStories()
  const [content, setContent] = useState<StoryContent | null>(null)
  const [name, setName] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [longDesc, setLongDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [descriptors, setDescriptors] = useState<Descriptor[]>([])

  useEffect(() => {
    if (!storyId) return
    loadContent(storyId).then((c) => {
      setContent(c)
      if (elemId) {
        const ex = c.species.find((x) => x.id === elemId)
        if (ex) {
          setName(ex.name)
          setShortDesc(ex.shortDescription ?? '')
          setLongDesc(ex.longDescription ?? '')
          setAvatarUrl(ex.avatarUrl)
          setDescriptors(ex.descriptors ?? [])
        }
      }
    })
  }, [storyId, elemId, loadContent])

  const suggestions = useMemo(() => {
    if (!content) return [] as string[]
    const idx: string[] = []
    for (const c of content.characters) if (c.name) idx.push(c.name)
    for (const s of content.species) if (s.name) idx.push(s.name)
    for (const p of content.locations) if (p.name) idx.push(p.name)
    for (const i of content.items) if (i.name) idx.push(i.name)
    for (const g of content.groups) if (g.name) idx.push(g.name)
    for (const l of content.languages) if (l.name) idx.push(l.name)
    for (const pl of content.plotLines) if (pl.title) idx.push(pl.title)
    return idx
  }, [content])

  const addDescriptor = (key: DescriptorKey) => {
    setDescriptors((prev) => (prev.some((d) => d.key === key) ? prev : [...prev, { id: genId(), key, value: '' }]))
  }

  const updateDescriptor = (id: string, value: string) => {
    setDescriptors((prev) => prev.map((d) => (d.id === id ? { ...d, value } : d)))
  }

  async function onSave() {
    if (!storyId || !content || !name.trim()) return
    setSaving(true)
    try {
      const el: NamedElement = {
        id: elemId ?? genId(),
        name: name.trim(),
        shortDescription: shortDesc.trim(),
        longDescription: longDesc,
        avatarUrl,
        descriptors,
      }
      const next: StoryContent = {
        ...content,
        species: content.species.some((x) => x.id === el.id) ? content.species.map((x) => (x.id === el.id ? el : x)) : [el, ...content.species],
      }
      await saveContent(storyId, next)
      navigate(`/stories/${storyId}/species`)
    } finally {
      setSaving(false)
    }
  }

  if (!storyId) return null
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <TabNav active="species" storyId={storyId} />
      {elemId ? null : <h1 style={{ color: 'var(--color-text)', margin: 0 }}>Add species</h1>}
      <Card>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Avatar name={name} url={avatarUrl} size={56} editable onChange={setAvatarUrl} />
            <div style={{ flex: 1, display: 'grid', gap: 8 }}>
              <TextField label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} />
              <MentionArea label="Short description" value={shortDesc} onChange={(v) => setShortDesc(v)} suggestions={suggestions} maxChars={160} />
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)', marginBottom: 6 }}>Long description</div>
            <MentionArea value={longDesc} onChange={setLongDesc} suggestions={suggestions} />
          </div>
          <div style={{ color: 'var(--color-text)', fontWeight: 600, marginTop: 8 }}>Attributes</div>
          <AttributePicker categories={getSpeciesCategories()} chosenKeys={descriptors.map((d) => d.key)} onAdd={addDescriptor} />

          {getSpeciesCategories().map((cat) => {
            const items = descriptors.filter((d) => cat.items.some((i) => i.key === d.key))
            if (items.length === 0) return null
            return (
              <Disclosure key={cat.title} title={cat.title} defaultOpen>
                <div style={{ display: 'grid', gap: 8 }}>
                  {items.map((d) => {
                    const label = cat.items.find((i) => i.key === d.key)?.label ?? String(d.key)
                    if (d.key === 'images') {
                      return (
                        <ImagesField
                          key={d.id}
                          label={label}
                          value={d.value}
                          onChange={(next) => updateDescriptor(d.id, next)}
                          mainImageUrl={avatarUrl}
                        />
                      )
                    }
                    return (
                      <MentionArea
                        key={d.id}
                        label={label}
                        value={d.value}
                        onChange={(v) => updateDescriptor(d.id, v)}
                        suggestions={suggestions}
                        minHeight={40}
                      />
                    )
                  })}
                </div>
              </Disclosure>
            )
          })}

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

function getSpeciesCategories(): { title: string; items: { key: DescriptorKey; label: string }[] }[] {
  return [
    {
      title: 'Media',
      items: [{ key: 'images', label: 'Images' }],
    },
  ]
}
