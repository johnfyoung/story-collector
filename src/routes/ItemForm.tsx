import { useEffect, useMemo, useRef, useState } from 'react'
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
import { parseImageValue, stringifyImageValue } from '../lib/descriptorImages'
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

export default function ItemForm() {
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
  const [highlightedDescriptorId, setHighlightedDescriptorId] = useState<string | null>(null)
  const descriptorRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [shortDescConnections, setShortDescConnections] = useState<ElementConnection[]>([])
  const [longDescConnections, setLongDescConnections] = useState<ElementConnection[]>([])

  useEffect(() => {
    if (!storyId) return
    loadContent(storyId).then((c) => {
      const elements = getAllMentionableElements(c)
      setContent(c)
      if (elemId) {
        const existing = c.items.find((x) => x.id === elemId)
        if (existing) {
          setName(existing.name)
          setShortDesc(existing.shortDescription ?? '')
          setLongDesc(existing.longDescription ?? '')
          setAvatarUrl(existing.avatarUrl)

          const resolvedShort = resolveConnectionsInText(existing.shortDescription ?? '', existing.connections ?? [], elements)
          setShortDesc(resolvedShort)
          setShortDescConnections(extractConnectionsFromText(resolvedShort, elements))

          const resolvedLong = resolveConnectionsInText(existing.longDescription ?? '', existing.connections ?? [], elements)
          setLongDesc(resolvedLong)
          setLongDescConnections(extractConnectionsFromText(resolvedLong, elements))

          const resolvedDescriptors = (existing.descriptors ?? []).map((d) => {
            const allowed = mapElementsForKey(d.key, elements)
            const lookup = allowed.length > 0 ? allowed : elements
            const baseConnections = d.connections ?? existing.connections ?? []
            const resolvedValue = resolveConnectionsInText(d.value ?? '', baseConnections, lookup)
            const connections = baseConnections.length > 0
              ? updateConnectionNames(baseConnections, lookup)
              : extractConnectionsFromText(resolvedValue, lookup)
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

  const characterElements = useMemo(
    () => mentionableElements.filter((e) => e.type === 'character'),
    [mentionableElements]
  )
  const locationElements = useMemo(
    () => mentionableElements.filter((e) => e.type === 'location'),
    [mentionableElements]
  )
  const groupElements = useMemo(
    () => mentionableElements.filter((e) => e.type === 'group'),
    [mentionableElements]
  )
  const itemElements = useMemo(
    () => mentionableElements.filter((e) => e.type === 'item'),
    [mentionableElements]
  )

  const availableImages = useMemo(() => {
    const imagesDescriptor = descriptors.find((d) => d.key === 'images')
    return imagesDescriptor ? parseImageValue(imagesDescriptor.value) : []
  }, [descriptors])

  const handleAvatarChange = (nextUrl: string) => {
    const previousUrl = avatarUrl
    setAvatarUrl(nextUrl)
    if (!nextUrl) return
    setDescriptors((prev) => {
      const imagesDescriptor = prev.find((d) => d.key === 'images')
      const images = imagesDescriptor ? parseImageValue(imagesDescriptor.value) : []
      const nextImages = [...images]
      if (previousUrl && !nextImages.includes(previousUrl)) {
        nextImages.unshift(previousUrl)
      }
      if (!nextImages.includes(nextUrl)) {
        nextImages.unshift(nextUrl)
      }
      const nextValue = stringifyImageValue(nextImages)
      if (imagesDescriptor) {
        return prev.map((d) =>
          d.id === imagesDescriptor.id ? { ...d, value: nextValue } : d
        )
      }
      return [
        ...prev,
        { id: genId(), key: 'images', value: nextValue },
      ]
    })
  }

  const addDescriptor = (key: DescriptorKey) => {
    let nextHighlightId: string | null = null
    setDescriptors((prev) => {
      const existing = prev.find((d) => d.key === key)
      if (existing) {
        nextHighlightId = existing.id
        return prev
      }
      const id = genId()
      nextHighlightId = id
      return [...prev, { id, key, value: '' }]
    })
    if (nextHighlightId) setHighlightedDescriptorId(nextHighlightId)
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
        items: content.items.some((x) => x.id === el.id)
          ? content.items.map((x) => (x.id === el.id ? el : x))
          : [el, ...content.items],
      }
      await saveContent(storyId, next)

      const story = getStory(storyId)
      if (story) {
        addRecentEdit({
          type: 'item',
          elementId: el.id,
          elementName: el.name,
          storyId: storyId,
          storyName: story.name,
          editUrl: `/stories/${storyId}/items/${el.id}/edit`
        })
      }

      setHighlightedDescriptorId(null)
      navigate(`/stories/${storyId}/items`)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!highlightedDescriptorId) return
    const target = descriptorRefs.current[highlightedDescriptorId]
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightedDescriptorId, descriptors])

  const highlightStyle = {
    outline: '2px solid var(--color-primary)',
    outlineOffset: 2,
    borderRadius: 8,
    background: 'rgba(184, 132, 224, 0.08)',
  }

  if (!storyId) return null
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <TabNav active="items" storyId={storyId} />
      {elemId ? null : <h1 style={{ color: 'var(--color-text)', margin: 0 }}>Add item</h1>}
      <Card>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Avatar name={name} url={avatarUrl} size={250} editable onChange={handleAvatarChange} availableImages={availableImages} />
            <div style={{ flex: 1, display: 'grid', gap: 8 }}>
              <TextField label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} />
              <MentionArea label="Short description" value={shortDesc} onChange={(v, conn) => { setShortDesc(v); setShortDescConnections(conn); }} mentionableElements={mentionableElements} maxChars={160} />
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)', marginBottom: 6 }}>Long description</div>
                <MentionArea value={longDesc} onChange={(v, conn) => { setLongDesc(v); setLongDescConnections(conn); }} mentionableElements={mentionableElements} />
              </div>
            </div>
          </div>
          <div style={{ color: 'var(--color-text)', fontWeight: 600, marginTop: 8 }}>Attributes</div>
          <AttributePicker
            categories={getItemCategories()}
            chosenKeys={descriptors.map((d) => d.key)}
            onAdd={addDescriptor}
          />

          {getItemCategories().map((cat) => {
            const items = descriptors.filter((d) => cat.items.some((i) => i.key === d.key))
            if (items.length === 0) return null
            return (
              <Disclosure key={cat.title} title={cat.title} defaultOpen>
                <div style={{ display: 'grid', gap: 8 }}>
                  {items.map((d) => {
                    const label = cat.items.find((i) => i.key === d.key)?.label ?? String(d.key)
                    const elems = mapElementsForKey(d.key, mentionableElements, {
                      characterElements,
                      locationElements,
                      groupElements,
                      itemElements,
                    })
                    const isHighlighted = highlightedDescriptorId === d.id
                    const wrapperProps = {
                      ref: (el: HTMLDivElement | null) => {
                        descriptorRefs.current[d.id] = el
                      },
                      style: isHighlighted ? highlightStyle : undefined,
                      onFocusCapture: () => {
                        if (highlightedDescriptorId === d.id) {
                          setHighlightedDescriptorId(null)
                        }
                      },
                      onMouseDown: () => {
                        if (highlightedDescriptorId === d.id) {
                          setHighlightedDescriptorId(null)
                        }
                      },
                    }
                    if (d.key === 'images') {
                      return (
                        <div key={d.id} {...wrapperProps}>
                          <ImagesField
                            label={label}
                            value={d.value}
                            onChange={(next) =>
                              setDescriptors((prev) =>
                                prev.map((x) => (x.id === d.id ? { ...x, value: next } : x)),
                              )
                            }
                            mainImageUrl={avatarUrl}
                            character={{ name, shortDescription: shortDesc, descriptors }}
                            storyContent={content || undefined}
                            onPromptSave={(prompt) => {
                              const aiPromptDescriptor = descriptors.find((d) => d.key === 'aiImagePrompt')
                              if (aiPromptDescriptor) {
                                setDescriptors((prev) =>
                                  prev.map((x) => (x.id === aiPromptDescriptor.id ? { ...x, value: prompt } : x))
                                )
                              } else {
                                setDescriptors((prev) => [...prev, { id: genId(), key: 'aiImagePrompt', value: prompt }])
                              }
                            }}
                          />
                        </div>
                      )
                    }
                    return (
                      <div key={d.id} {...wrapperProps}>
                        <MentionArea
                          label={label}
                          value={d.value}
                          onChange={(v, conn) => setDescriptors((prev) => prev.map((x) => (x.id === d.id ? { ...x, value: v, connections: conn } : x)))}
                          mentionableElements={elems}
                          minHeight={40}
                        />
                      </div>
                    )
                  })}
                </div>
              </Disclosure>
            )
          })}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setHighlightedDescriptorId(null)
                navigate(-1)
              }}
            >
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

function mapElementsForKey(
  key: DescriptorKey,
  allElements: MentionableElement[],
  buckets?: {
    characterElements: MentionableElement[]
    locationElements: MentionableElement[]
    groupElements: MentionableElement[]
    itemElements: MentionableElement[]
  }
) {
  if (!buckets) return allElements
  const { characterElements, locationElements, groupElements, itemElements } = buckets
  switch (key) {
    case 'owner':
    case 'notableOwners':
    case 'creator':
      return [...characterElements, ...groupElements]
    case 'currentLocation':
      return locationElements
    case 'partOfCollection':
      return [...groupElements, ...itemElements]
    default:
      return allElements
  }
}

function getItemCategories(): { title: string; items: { key: DescriptorKey; label: string }[] }[] {
  return [
    { title: 'Item', items: [
      { key: 'owner', label: 'Owner' },
      { key: 'currentLocation', label: 'Current location' },
      { key: 'partOfCollection', label: 'Part of collection' },
      { key: 'value', label: 'Value' },
      { key: 'rarity', label: 'Rarity' },
      { key: 'condition', label: 'Condition' },
      { key: 'consumable', label: 'Consumable' },
    ]},
    { title: 'Characteristics', items: [
      { key: 'specialAbilities', label: 'Special abilities' },
      { key: 'properties', label: 'Properties' },
      { key: 'composition', label: 'Composition' },
      { key: 'occurrence', label: 'Occurrence' },
      { key: 'detectionMethods', label: 'Detection methods' },
      { key: 'dimensions', label: 'Dimensions' },
      { key: 'weight', label: 'Weight' },
      { key: 'fuel', label: 'Fuel' },
    ]},
    { title: 'Function & care', items: [
      { key: 'usageInstructions', label: 'Usage instructions' },
      { key: 'purpose', label: 'Purpose' },
      { key: 'maintenance', label: 'Maintenance' },
    ]},
    { title: 'History', items: [
      { key: 'creator', label: 'Creator' },
      { key: 'notableOwners', label: 'Notable owners' },
      { key: 'legendsAndMyths', label: 'Legends & myths' },
      { key: 'production', label: 'Production' },
      { key: 'history', label: 'History' },
      { key: 'origin', label: 'Origin' },
      { key: 'dateOfCreation', label: 'Date of creation' },
    ]},
    { title: 'Armaments', items: [
      { key: 'defense', label: 'Defense' },
      { key: 'attack', label: 'Attack' },
      { key: 'projectiles', label: 'Projectiles' },
      { key: 'range', label: 'Range' },
      { key: 'armaments', label: 'Armaments' },
    ]},
    { title: 'Media', items: [
      { key: 'images', label: 'Images' },
      { key: 'aiImagePrompt', label: 'AI Image Prompt' },
    ]},
  ]
}
