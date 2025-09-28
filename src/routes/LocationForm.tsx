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

export default function LocationForm() {
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
        const ex = c.locations.find((x) => x.id === elemId)
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
    for (const pl of content.plotPoints) if (pl.title) idx.push(pl.title)
    return idx
  }, [content])

  async function onSave() {
    if (!storyId || !content || !name.trim()) return
    setSaving(true)
    try {
      const el: NamedElement = { id: elemId ?? genId(), name: name.trim(), shortDescription: shortDesc.trim(), longDescription: longDesc, avatarUrl, descriptors }
      const next: StoryContent = {
        ...content,
        locations: content.locations.some((x) => x.id === el.id) ? content.locations.map((x) => (x.id === el.id ? el : x)) : [el, ...content.locations],
      }
      await saveContent(storyId, next)
      navigate(`/stories/${storyId}/locations`)
    } finally {
      setSaving(false)
    }
  }

  if (!storyId) return null
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <TabNav active="locations" storyId={storyId} />
      {elemId ? null : <h1 style={{ color: 'var(--color-text)', margin: 0 }}>Add location</h1>}
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
          <AttributePicker
            categories={getLocationCategories()}
            chosenKeys={descriptors.map((d) => d.key)}
            onAdd={(key) => setDescriptors((prev) => (prev.some((d) => d.key === key) ? prev : [...prev, { id: genId(), key, value: '' }]))}
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
                      return (
                        <ImagesField
                          key={d.id}
                          label={label}
                          value={d.value}
                          onChange={(next) =>
                            setDescriptors((prev) =>
                              prev.map((x) => (x.id === d.id ? { ...x, value: next } : x)),
                            )
                          }
                          mainImageUrl={avatarUrl}
                        />
                      )
                    }
                    return (
                      <MentionArea
                        key={d.id}
                        label={cat.items.find((i) => i.key === d.key)?.label ?? String(d.key)}
                        value={d.value}
                        onChange={(v) => setDescriptors((prev) => prev.map((x) => (x.id === d.id ? { ...x, value: v } : x)))}
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

function getLocationCategories(): { title: string; items: { key: DescriptorKey; label: string }[] }[] {
  return [
    { title: 'Location', items: [
      { key: 'dimensions', label: 'Dimensions' },
      { key: 'area', label: 'Area' },
      { key: 'condition', label: 'Condition' },
      { key: 'inhabitants', label: 'Inhabitants' },
      { key: 'population', label: 'Population' },
      { key: 'objects', label: 'Objects' },
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
    ]},
    { title: 'Culture', items: [
      { key: 'languages', label: 'Languages' },
      { key: 'architecturalStyle', label: 'Architectural style' },
      { key: 'artAndMusic', label: 'Art & music' },
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
