import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'
import { MentionArea } from '../components/MentionArea'
import { TabNav } from '../components/TabNav'
import { useStories } from '../state/StoriesProvider'
import { Avatar } from '../components/Avatar'
import type { Descriptor, DescriptorKey, NamedElement, StoryContent, ElementConnection } from '../types'
import { Disclosure } from '../components/Disclosure'
import { AttributePicker } from '../components/AttributePicker'
import { ImagesField } from '../components/ImagesField'
import { parseImageValue } from '../lib/descriptorImages'
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

export default function SpeciesForm() {
  const { id: storyId, elemId } = useParams()
  const navigate = useNavigate()
  const { loadContent, saveContent, get: getStory } = useStories()
  const [content, setContent] = useState<StoryContent | null>(null)
  const [name, setName] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [longDesc, setLongDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [descriptors, setDescriptors] = useState<Descriptor[]>([])
  const [shortDescConnections, setShortDescConnections] = useState<ElementConnection[]>([])
  const [longDescConnections, setLongDescConnections] = useState<ElementConnection[]>([])

  useEffect(() => {
    if (!storyId) return
    loadContent(storyId).then((c) => {
      const elements = getAllMentionableElements(c)
      setContent(c)
      if (elemId) {
        const ex = c.species.find((x) => x.id === elemId)
        if (ex) {
          setName(ex.name)
          setAvatarUrl(ex.avatarUrl)

          const resolvedShort = resolveConnectionsInText(ex.shortDescription ?? '', ex.connections ?? [], elements)
          setShortDesc(resolvedShort)
          setShortDescConnections(extractConnectionsFromText(resolvedShort, elements))

          const resolvedLong = resolveConnectionsInText(ex.longDescription ?? '', ex.connections ?? [], elements)
          setLongDesc(resolvedLong)
          setLongDescConnections(extractConnectionsFromText(resolvedLong, elements))

          const resolvedDescriptors = (ex.descriptors ?? []).map((d) => {
            const baseConnections = d.connections ?? ex.connections ?? []
            const resolvedValue = resolveConnectionsInText(d.value ?? '', baseConnections, elements)
            const connections = baseConnections.length > 0
              ? updateConnectionNames(baseConnections, elements)
              : extractConnectionsFromText(resolvedValue, elements)
            return { ...d, value: resolvedValue, connections }
          })
          setDescriptors(resolvedDescriptors)
        }
      }
    })
  }, [storyId, elemId, loadContent])

  const mentionableElements = useMemo<MentionableElement[]>(() => {
    if (!content) return []
    return getAllMentionableElements(content)
  }, [content])

  const availableImages = useMemo(() => {
    const imagesDescriptor = descriptors.find((d) => d.key === 'images')
    return imagesDescriptor ? parseImageValue(imagesDescriptor.value) : []
  }, [descriptors])

  const addDescriptor = (key: DescriptorKey) => {
    setDescriptors((prev) => (prev.some((d) => d.key === key) ? prev : [...prev, { id: genId(), key, value: '' }]))
  }

  const updateDescriptor = (id: string, value: string, connections?: ElementConnection[]) => {
    setDescriptors((prev) => prev.map((d) => (d.id === id ? { ...d, value, connections } : d)))
  }

  async function onSave() {
    if (!storyId || !content || !name.trim()) return
    setSaving(true)
    try {
      const allDescriptorConnections = descriptors.flatMap(d => d.connections || [])
      const connections = mergeConnections(shortDescConnections, longDescConnections, allDescriptorConnections)

      const el: NamedElement = {
        id: elemId ?? genId(),
        name: name.trim(),
        shortDescription: shortDesc.trim(),
        longDescription: longDesc,
        avatarUrl,
        descriptors,
        lastEdited: Date.now(),
        connections,
      }
      const next: StoryContent = {
        ...content,
        species: content.species.some((x) => x.id === el.id) ? content.species.map((x) => (x.id === el.id ? el : x)) : [el, ...content.species],
      }
      await saveContent(storyId, next)

      // Track recent edit
      const story = getStory(storyId)
      if (story) {
        addRecentEdit({
          type: 'species',
          elementId: el.id,
          elementName: el.name,
          storyId: storyId,
          storyName: story.name,
          editUrl: `/stories/${storyId}/species/${el.id}/edit`
        })
      }

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
            <Avatar name={name} url={avatarUrl} size={56} editable onChange={setAvatarUrl} availableImages={availableImages} />
            <div style={{ flex: 1, display: 'grid', gap: 8 }}>
              <TextField label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} />
              <MentionArea label="Short description" value={shortDesc} onChange={(v, conn) => { setShortDesc(v); setShortDescConnections(conn); }} mentionableElements={mentionableElements} maxChars={160} />
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)', marginBottom: 6 }}>Long description</div>
            <MentionArea value={longDesc} onChange={(v, conn) => { setLongDesc(v); setLongDescConnections(conn); }} mentionableElements={mentionableElements} />
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
                          character={{ name, shortDescription: shortDesc, descriptors }}
                          storyContent={content || undefined}
                          onPromptSave={(prompt) => {
                            const aiPromptDescriptor = descriptors.find((d) => d.key === 'aiImagePrompt')
                            if (aiPromptDescriptor) {
                              updateDescriptor(aiPromptDescriptor.id, prompt)
                            } else {
                              setDescriptors([...descriptors, { id: genId(), key: 'aiImagePrompt', value: prompt }])
                            }
                          }}
                        />
                      )
                    }
                    return (
                      <MentionArea
                        key={d.id}
                        label={label}
                        value={d.value}
                        onChange={(v, conn) => updateDescriptor(d.id, v, conn)}
                        mentionableElements={mentionableElements}
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
      title: 'Appearance',
      items: [
        { key: 'bodyType', label: 'Body Type' },
        { key: 'height', label: 'Height' },
        { key: 'skinTone', label: 'Skin Tone' },
        { key: 'distinguishingFeature', label: 'Distinguishing Features' },
        { key: 'aiImagePrompt', label: 'AI Image Prompt' },
      ],
    },
    {
      title: 'Media',
      items: [{ key: 'images', label: 'Images' }],
    },
  ]
}
