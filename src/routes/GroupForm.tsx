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
import { parseImageValue } from '../lib/descriptorImages'

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export default function GroupForm() {
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
        const ex = c.groups.find((x) => x.id === elemId)
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

  const charactersIndex = useMemo(() => (content ? content.characters.map((c) => c.name).filter(Boolean) : []), [content])
  const groupsIndex = useMemo(() => (content ? content.groups.map((g) => g.name).filter(Boolean) : []), [content])
  const locationsIndex = useMemo(() => (content ? content.locations.map((p) => p.name).filter(Boolean) : []), [content])
  const languagesIndex = useMemo(() => (content ? content.languages.map((l) => l.name).filter(Boolean) : []), [content])
  const speciesIndex = useMemo(() => (content ? content.species.map((s) => s.name).filter(Boolean) : []), [content])
  const itemsIndex = useMemo(() => (content ? content.items.map((i) => i.name).filter(Boolean) : []), [content])

  const availableImages = useMemo(() => {
    const imagesDescriptor = descriptors.find((d) => d.key === 'images')
    return imagesDescriptor ? parseImageValue(imagesDescriptor.value) : []
  }, [descriptors])

  const mapSuggestionsForKey = (key: DescriptorKey): string[] => {
    switch (key) {
      // Locations
      case 'headquarter':
      case 'territory':
        return locationsIndex
      // Characters
      case 'founder':
      case 'members':
      case 'followers':
        return charactersIndex
      // Characters + Groups
      case 'allies':
      case 'enemies':
        return [...charactersIndex, ...groupsIndex]
      // Languages
      case 'language':
        return languagesIndex
      // Species
      case 'speciesMembers':
        return speciesIndex
      // Items
      case 'associatedTrademarkItem':
        return itemsIndex
      default:
        return suggestions
    }
  }

  async function onSave() {
    if (!storyId || !content || !name.trim()) return
    setSaving(true)
    try {
      const el: NamedElement = { id: elemId ?? genId(), name: name.trim(), shortDescription: shortDesc.trim(), longDescription: longDesc, avatarUrl, descriptors }
      const next: StoryContent = {
        ...content,
        groups: content.groups.some((x) => x.id === el.id) ? content.groups.map((x) => (x.id === el.id ? el : x)) : [el, ...content.groups],
      }
      await saveContent(storyId, next)
      navigate(`/stories/${storyId}/groups`)
    } finally {
      setSaving(false)
    }
  }

  if (!storyId) return null
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <TabNav active="groups" storyId={storyId} />
      {elemId ? null : <h1 style={{ color: 'var(--color-text)', margin: 0 }}>Add group</h1>}
      <Card>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Avatar name={name} url={avatarUrl} size={56} editable onChange={setAvatarUrl} availableImages={availableImages} />
            <div style={{ flex: 1, display: 'grid', gap: 8 }}>
              <TextField label="Name" value={name} onChange={(e) => setName(e.currentTarget.value)} />
              <MentionArea label="Short description" value={shortDesc} onChange={(v) => setShortDesc(v)} suggestions={suggestions} maxChars={160} />
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)', marginBottom: 6 }}>Long description</div>
                <MentionArea value={longDesc} onChange={setLongDesc} suggestions={suggestions} />
              </div>
            </div>
          </div>
          <div style={{ color: 'var(--color-text)', fontWeight: 600, marginTop: 8 }}>Attributes</div>
          <AttributePicker
            categories={getGroupCategories()}
            chosenKeys={descriptors.map((d) => d.key)}
            onAdd={(key) => setDescriptors((prev) => (prev.some((d) => d.key === key) ? prev : [...prev, { id: genId(), key, value: '' }]))}
          />

          {getGroupCategories().map((cat) => {
            const items = descriptors.filter((d) => cat.items.some((i) => i.key === d.key))
            if (items.length === 0) return null
            return (
              <Disclosure key={cat.title} title={cat.title} defaultOpen>
                <div style={{ display: 'grid', gap: 8 }}>
                  {items.map((d) => {
                    const label = cat.items.find((i) => i.key === d.key)?.label ?? String(d.key)
                    const s = mapSuggestionsForKey(d.key)
                    if (d.key === 'images') {
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
                      )
                    }
                    return (
                      <MentionArea
                        key={d.id}
                        label={label}
                        value={d.value}
                        onChange={(v) => setDescriptors((prev) => prev.map((x) => (x.id === d.id ? { ...x, value: v } : x)))}
                        suggestions={s}
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

function getGroupCategories(): { title: string; items: { key: DescriptorKey; label: string }[] }[] {
  return [
    { title: 'Group', items: [
      { key: 'officialName', label: 'Official name' },
      { key: 'alternateNames', label: 'Alternate names' },
    ]},
    { title: 'Resources', items: [
      { key: 'headquarter', label: 'Headquarter' },
      { key: 'territory', label: 'Territory' },
      { key: 'sourcesOfIncome', label: 'Sources of income' },
      { key: 'coreBusiness', label: 'Core business' },
      { key: 'associatedTrademarkItem', label: 'Associated trademark item' },
      { key: 'uniquePossessions', label: 'Unique possessions' },
      { key: 'treasures', label: 'Treasures' },
      { key: 'technologyAndScience', label: 'Technology and science' },
      { key: 'cash', label: 'Cash' },
      { key: 'transport', label: 'Transport' },
      { key: 'militaryStrength', label: 'Military strength' },
    ]},
    { title: 'Culture', items: [
      { key: 'flagOrSymbol', label: 'Flag or symbol' },
      { key: 'slogan', label: 'Slogan' },
      { key: 'aiImagePrompt', label: 'AI Image Prompt' },
      { key: 'governmentSystem', label: 'Government system' },
      { key: 'socialHierarchy', label: 'Social hierarchy' },
      { key: 'culture', label: 'Culture' },
      { key: 'language', label: 'Language' },
      { key: 'religion', label: 'Religion' },
      { key: 'god', label: 'God' },
      { key: 'artAndMusic', label: 'Art & music' },
      { key: 'generalEthics', label: 'General ethics' },
      { key: 'ethicalControversies', label: 'Ethical controversies' },
      { key: 'genderRaceEquality', label: 'Gender/race equality' },
      { key: 'philosophy', label: 'Philosophy' },
      { key: 'viewsOnLife', label: 'Views on life' },
      { key: 'viewsOnDeath', label: 'Views on death' },
      { key: 'traditions', label: 'Traditions' },
      { key: 'rules', label: 'Rules' },
      { key: 'punishments', label: 'Punishments' },
      { key: 'longTermGoals', label: 'Long term goals' },
      { key: 'shortTermGoals', label: 'Short term goals' },
      { key: 'cuisine', label: 'Cuisine' },
      { key: 'legendsAndMyths', label: 'Legends and myths' },
    ]},
    { title: 'History', items: [
      { key: 'origin', label: 'Origin' },
      { key: 'foundingDate', label: 'Founding date' },
      { key: 'founder', label: 'Founder' },
      { key: 'foundingHistory', label: 'Founding history' },
      { key: 'majorHistoricalEvents', label: 'Major historical events' },
      { key: 'biggestAchievement', label: 'Biggest achievement' },
      { key: 'otherAchievements', label: 'Other achievements' },
      { key: 'biggestFailure', label: 'Biggest failure' },
      { key: 'otherFailures', label: 'Other failures' },
      { key: 'allies', label: 'Allies' },
      { key: 'enemies', label: 'Enemies' },
      { key: 'dissolutionDate', label: 'Dissolution date' },
      { key: 'dissolutionHistory', label: 'Dissolution history' },
    ]},
    { title: 'Media', items: [
      { key: 'images', label: 'Images' },
    ]},
    { title: 'Members', items: [
      { key: 'members', label: 'Members' },
      { key: 'speciesMembers', label: 'Species' },
      { key: 'organizationalChart', label: 'Organizational chart' },
      { key: 'highestRank', label: 'Highest rank' },
      { key: 'secondHighestRank', label: '2nd highest rank' },
      { key: 'thirdHighestRank', label: '3rd highest rank' },
      { key: 'firstMediumRank', label: '1st medium rank' },
      { key: 'secondMediumRank', label: '2nd medium rank' },
      { key: 'thirdMediumRank', label: '3rd medium rank' },
      { key: 'thirdLowestRank', label: '3rd lowest rank' },
      { key: 'secondLowestRank', label: '2nd lowest rank' },
      { key: 'lowestRank', label: 'Lowest rank' },
      { key: 'familyTree', label: 'Family tree' },
      { key: 'followers', label: 'Followers' },
    ]},
  ]
}

// (helper moved into component)
