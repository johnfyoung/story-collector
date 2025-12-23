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

export default function LocationForm() {
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
        const ex = c.locations.find((x) => x.id === elemId)
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

      const el: NamedElement = { id: elemId ?? genId(), name: name.trim(), shortDescription: shortDesc.trim(), longDescription: longDesc, avatarUrl, descriptors, lastEdited: Date.now(), connections }
      const next: StoryContent = {
        ...content,
        locations: content.locations.some((x) => x.id === el.id) ? content.locations.map((x) => (x.id === el.id ? el : x)) : [el, ...content.locations],
      }
      await saveContent(storyId, next)

      // Track recent edit
      const story = getStory(storyId)
      if (story) {
        addRecentEdit({
          type: 'location',
          elementId: el.id,
          elementName: el.name,
          storyId: storyId,
          storyName: story.name,
          editUrl: `/stories/${storyId}/locations/${el.id}/edit`
        })
      }

      setHighlightedDescriptorId(null)
      navigate(`/stories/${storyId}/locations`)
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
      <TabNav active="locations" storyId={storyId} />
      {elemId ? null : <h1 style={{ color: 'var(--color-text)', margin: 0 }}>Add location</h1>}
      <Card>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Avatar name={name} url={avatarUrl} size={250} editable onChange={handleAvatarChange} availableImages={availableImages} />
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
          <AttributePicker
            categories={getLocationCategories()}
            chosenKeys={descriptors.map((d) => d.key)}
            onAdd={addDescriptor}
          />

          {getLocationCategories().map((cat) => {
            const items = descriptors.filter((d) => cat.items.some((i) => i.key === d.key))
            if (items.length === 0) return null
            return (
              <Disclosure key={cat.title} title={cat.title} defaultOpen>
                <div style={{ display: 'grid', gap: 8 }}>
                  {items.map((d) => {
                    if (d.key === 'images') {
                      const label = cat.items.find((i) => i.key === d.key)?.label ?? String(d.key)
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
                                setDescriptors([...descriptors, { id: genId(), key: 'aiImagePrompt', value: prompt }])
                              }
                            }}
                          />
                        </div>
                      )
                    }
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
                    return (
                      <div key={d.id} {...wrapperProps}>
                        <MentionArea
                          label={cat.items.find((i) => i.key === d.key)?.label ?? String(d.key)}
                          value={d.value}
                          onChange={(v, conn) => setDescriptors((prev) => prev.map((x) => (x.id === d.id ? { ...x, value: v, connections: conn } : x)))}
                          mentionableElements={mentionableElements}
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

function getLocationCategories(): { title: string; items: { key: DescriptorKey; label: string }[] }[] {
  return [
    { title: 'Location', items: [
      { key: 'dimensions', label: 'Dimensions' },
      { key: 'area', label: 'Area' },
      { key: 'condition', label: 'Condition' },
      { key: 'inhabitants', label: 'Inhabitants' },
      { key: 'population', label: 'Population' },
      { key: 'objects', label: 'Objects' },
      { key: 'notableLandmarks', label: 'Notable landmarks' },
      { key: 'militaryStrength', label: 'Military strength' },
    ]},
    { title: 'Biology and Environment', items: [
      { key: 'feeling', label: 'Feeling' },
      { key: 'noise', label: 'Noise' },
      { key: 'smell', label: 'Smell' },
      { key: 'climate', label: 'Climate' },
      { key: 'biome', label: 'Biome' },
      { key: 'nativeSpecies', label: 'Native species' },
      { key: 'sentientRaces', label: 'Sentient races' },
      { key: 'flora', label: 'Flora' },
      { key: 'fauna', label: 'Fauna' },
      { key: 'bodiesOfWater', label: 'Bodies of water' },
      { key: 'landmarks', label: 'Landmarks' },
      { key: 'pollution', label: 'Pollution' },
      { key: 'naturalResources', label: 'Natural resources' },
      { key: 'aiImagePrompt', label: 'AI Image Prompt' },
    ]},
    { title: 'Culture', items: [
      { key: 'languages', label: 'Languages' },
      { key: 'architecturalStyle', label: 'Architectural style' },
      { key: 'artAndMusic', label: 'Art & music' },
      { key: 'typicalDress', label: 'Typical dress' },
      { key: 'foodAndDrink', label: 'Food & drink' },
      { key: 'generalEthics', label: 'General ethics' },
      { key: 'ethicalControversies', label: 'Ethical controversies' },
      { key: 'genderRaceEquality', label: 'Gender/race equality' },
      { key: 'viewsOnLife', label: 'Views on life' },
      { key: 'viewsOnDeath', label: 'Views on death' },
      { key: 'criminality', label: 'Criminality' },
      { key: 'rituals', label: 'Rituals' },
      { key: 'punishments', label: 'Punishments' },
      { key: 'tradePartners', label: 'Trade partners' },
      { key: 'legendsAndMyths', label: 'Legends & myths' },
    ]},
    { title: 'Politics', items: [
      { key: 'governmentSystem', label: 'Government system' },
      { key: 'politicalFigures', label: 'Important political figures' },
      { key: 'politicalParties', label: 'Political parties' },
      { key: 'publicOpinion', label: 'Opinion of the public' },
      { key: 'laws', label: 'Laws' },
      { key: 'lawEnforcements', label: 'Law enforcements' },
      { key: 'opposingForces', label: 'Opposing forces' },
    ]},
    { title: 'Magic & technology', items: [
      { key: 'technologicalLevel', label: 'Technological level' },
      { key: 'uniqueTechnologies', label: 'Unique technologies' },
      { key: 'magic', label: 'Magic' },
      { key: 'medicineAndHealthcare', label: 'Medicine & healthcare' },
    ]},
    { title: 'History', items: [
      { key: 'dateFounded', label: 'Date founded' },
      { key: 'founder', label: 'Founder' },
      { key: 'majorEvents', label: 'Major events' },
    ]},
    { title: 'Religion', items: [
      { key: 'deities', label: 'Deities' },
      { key: 'religiousGroups', label: 'Religious groups' },
      { key: 'religiousLeadersAndProphets', label: 'Religious leaders & prophets' },
      { key: 'religiousValuesCommandments', label: 'Religious values & commandments' },
      { key: 'freedomOfReligion', label: 'Freedom of religion' },
      { key: 'governmentViewOnReligion', label: 'Government view on religion' },
    ]},
    { title: 'Trade & public relations', items: [
      { key: 'currency', label: 'Currency' },
      { key: 'majorImports', label: 'Major imports' },
      { key: 'majorExports', label: 'Major exports' },
      { key: 'war', label: 'War' },
      { key: 'alliances', label: 'Alliances' },
    ]},
    { title: 'Media', items: [
      { key: 'images', label: 'Images' },
    ]},
  ]
}
