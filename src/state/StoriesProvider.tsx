/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Story } from '../types'
import { useAuth } from '../auth/AuthProvider'
import { StoriesRemote, isRemoteConfigured } from '../lib/storiesService'
import {
  emptyStoryContent,
  type StoryContent,
  type Character,
  type Descriptor,
  type DescriptorKey,
  type ElementConnection,
} from '../types'
import {
  extractConnectionsFromText,
  getAllMentionableElements,
  mergeConnections,
} from '../lib/connections'
import { parseImageValue, stringifyImageValue } from '../lib/descriptorImages'

type StoriesContextValue = {
  stories: Story[]
  create: (s: Omit<Story, 'id'>) => Promise<Story>
  update: (id: string, update: Partial<Omit<Story, 'id'>>) => void
  remove: (id: string) => Promise<void>
  get: (id: string) => Story | undefined
  loadContent: (id: string) => Promise<StoryContent>
  saveContent: (id: string, content: StoryContent) => Promise<void>
}

const StoriesContext = createContext<StoriesContextValue | undefined>(undefined)

const STORAGE_KEY = 'stories:v1'

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function StoriesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [stories, setStories] = useState<Story[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? (JSON.parse(raw) as Story[]) : []
      // Migrate existing stories to have lastEdited timestamp if missing
      return parsed.map(s => ({
        ...s,
        lastEdited: s.lastEdited ?? Date.now()
      }))
    } catch {
      return []
    }
  })
  const remoteEnabled = isRemoteConfigured() && !!user
  const remoteRef = useRef<StoriesRemote | null>(null)
  const unsubDocsRef = useRef<null | (() => void)>(null)
  const unsubFilesRef = useRef<null | (() => void)>(null)
  const fileIdsRef = useRef<Record<string, string>>({})
  const localContentKey = useCallback((sid: string) => `${STORAGE_KEY}:content:${sid}`, [])

  const normalizeConnection = useCallback((raw: any): ElementConnection | null => {
    if (!raw) return null
    const id = raw.id ?? raw.elementId
    const name = raw.name ?? raw.elementName
    const type = raw.type
    if (!id || !name || !type) return null
    return {
      id: String(id),
      name: String(name),
      type: String(type) as ElementConnection['type'],
    }
  }, [])

  const asConnections = useCallback((raw: any): ElementConnection[] => {
    if (!Array.isArray(raw)) return []
    return raw
      .map(normalizeConnection)
      .filter((c): c is ElementConnection => !!c)
  }, [normalizeConnection])

  const normalizeDescriptor = useCallback((raw: any): Descriptor => {
    const key = (raw?.key ?? 'notes') as DescriptorKey
    const id = String(raw?.id ?? genId())
    const rawValue = raw?.value
    let value = ''
    if (key === 'images') {
      value = stringifyImageValue(parseImageValue(rawValue))
    } else if (typeof rawValue === 'string') {
      value = rawValue
    } else if (rawValue != null) {
      value = String(rawValue)
    }
    const connections = asConnections(raw?.connections)
    return connections.length > 0 ? { id, key, value, connections } : { id, key, value }
  }, [asConnections])

  const backfillConnections = useCallback((content: StoryContent): StoryContent => {
    const mentionables = getAllMentionableElements(content)

    const ensureDescriptorConnections = (descriptor: Descriptor) => {
      if (descriptor.connections && descriptor.connections.length > 0) return descriptor
      const conn = extractConnectionsFromText(descriptor.value ?? '', mentionables)
      return conn.length > 0 ? { ...descriptor, connections: conn } : descriptor
    }

    const ensureNamedConnections = <T extends { shortDescription?: string; longDescription?: string; descriptors?: Descriptor[]; connections?: ElementConnection[] }>(el: T) => {
      const descriptors = (el.descriptors || []).map(ensureDescriptorConnections)
      if (el.connections && el.connections.length > 0) return { ...el, descriptors }
      const connections = mergeConnections(
        extractConnectionsFromText(el.shortDescription ?? '', mentionables),
        extractConnectionsFromText(el.longDescription ?? '', mentionables),
        ...descriptors.map((d) => d.connections || []),
      )
      return connections.length > 0 ? { ...el, descriptors, connections } : { ...el, descriptors }
    }

    const characters = content.characters.map((c) => ensureNamedConnections(c))
    const species = content.species.map((s) => ensureNamedConnections(s))
    const locations = content.locations.map((l) => ensureNamedConnections(l))
    const groups = content.groups.map((g) => ensureNamedConnections(g))
    const languages = content.languages.map((l) => ensureNamedConnections(l))
    const items = content.items.map((i) => ensureNamedConnections(i))

    const plotLines = content.plotLines.map((pl) => {
      const chapters = (pl.chapters || []).map((ch) => {
        const plotPoints = (ch.plotPoints || []).map((pp) => {
          if (pp.connections && pp.connections.length > 0) return pp
          const conn = mergeConnections(
            extractConnectionsFromText(pp.aiPrompt ?? '', mentionables),
            extractConnectionsFromText(pp.storyElements ?? '', mentionables),
          )
          return conn.length > 0 ? { ...pp, connections: conn } : pp
        })
        if (ch.connections && ch.connections.length > 0) return { ...ch, plotPoints }
        const conn = mergeConnections(
          extractConnectionsFromText(ch.description ?? '', mentionables),
          ...plotPoints.map((pp) => pp.connections || []),
        )
        return conn.length > 0 ? { ...ch, plotPoints, connections: conn } : { ...ch, plotPoints }
      })
      if (pl.connections && pl.connections.length > 0) return { ...pl, chapters }
      const conn = mergeConnections(
        extractConnectionsFromText(pl.description ?? '', mentionables),
        ...chapters.map((ch) => ch.connections || []),
        ...chapters.flatMap((ch) => ch.plotPoints.map((pp) => pp.connections || [])),
      )
      return conn.length > 0 ? { ...pl, chapters, connections: conn } : { ...pl, chapters }
    })

    return {
      ...content,
      characters,
      species,
      locations,
      groups,
      languages,
      items,
      plotLines,
    }
  }, [])

  const normalizeContent = useCallback((raw: any): StoryContent => {
    const asArray = (x: any) => (Array.isArray(x) ? x : [])
    // Base timestamp for elements without lastEdited (1 year ago)
    const baseTimestamp = Date.now() - (365 * 24 * 60 * 60 * 1000)

    const chars = asArray(raw?.characters).map((c: any, index: number) => {
      const descs = asArray(c?.descriptors).map(normalizeDescriptor) as Descriptor[]
      const connections = asConnections(c?.connections)
      return {
        id: String(c?.id ?? genId()),
        name: String(c?.name ?? ''),
        longName: c?.longName ? String(c.longName) : undefined,
        shortDescription: c?.shortDescription ? String(c.shortDescription) : undefined,
        longDescription: c?.longDescription ? String(c.longDescription) : undefined,
        descriptors: descs,
        avatarUrl: c?.avatarUrl ? String(c.avatarUrl) : undefined,
        lastEdited: typeof c?.lastEdited === 'number' ? c.lastEdited : baseTimestamp + index,
        connections: connections.length > 0 ? connections : undefined,
      } as Character
    })
    const norm: StoryContent = {
      characters: chars,
      species: asArray(raw?.species).map((s: any, index: number) => ({
        id: String(s?.id ?? genId()),
        name: String(s?.name ?? ''),
        shortDescription: s?.shortDescription ? String(s.shortDescription) : undefined,
        longDescription: s?.longDescription ? String(s.longDescription) : undefined,
        avatarUrl: s?.avatarUrl ? String(s.avatarUrl) : undefined,
        descriptors: asArray(s?.descriptors).map(normalizeDescriptor),
        lastEdited: typeof s?.lastEdited === 'number' ? s.lastEdited : baseTimestamp + index,
        connections: (() => {
          const conn = asConnections(s?.connections)
          return conn.length > 0 ? conn : undefined
        })(),
      })),
      locations: asArray(raw?.locations ?? raw?.places).map((p: any, index: number) => ({
        id: String(p?.id ?? genId()),
        name: String(p?.name ?? ''),
        shortDescription: p?.shortDescription ? String(p.shortDescription) : undefined,
        longDescription: p?.longDescription ? String(p.longDescription) : undefined,
        avatarUrl: p?.avatarUrl ? String(p.avatarUrl) : undefined,
        descriptors: asArray(p?.descriptors).map(normalizeDescriptor),
        lastEdited: typeof p?.lastEdited === 'number' ? p.lastEdited : baseTimestamp + index,
        connections: (() => {
          const conn = asConnections(p?.connections)
          return conn.length > 0 ? conn : undefined
        })(),
      })),
      groups: asArray(raw?.groups).map((g: any, index: number) => ({
        id: String(g?.id ?? genId()),
        name: String(g?.name ?? ''),
        shortDescription: g?.shortDescription ? String(g.shortDescription) : undefined,
        longDescription: g?.longDescription ? String(g.longDescription) : undefined,
        avatarUrl: g?.avatarUrl ? String(g.avatarUrl) : undefined,
        descriptors: asArray(g?.descriptors).map(normalizeDescriptor),
        lastEdited: typeof g?.lastEdited === 'number' ? g.lastEdited : baseTimestamp + index,
        connections: (() => {
          const conn = asConnections(g?.connections)
          return conn.length > 0 ? conn : undefined
        })(),
      })),
      languages: asArray(raw?.languages).map((l: any, index: number) => ({
        id: String(l?.id ?? genId()),
        name: String(l?.name ?? ''),
        shortDescription: l?.shortDescription ? String(l.shortDescription) : undefined,
        longDescription: l?.longDescription ? String(l.longDescription) : undefined,
        avatarUrl: l?.avatarUrl ? String(l.avatarUrl) : undefined,
        lastEdited: typeof l?.lastEdited === 'number' ? l.lastEdited : baseTimestamp + index,
        connections: (() => {
          const conn = asConnections(l?.connections)
          return conn.length > 0 ? conn : undefined
        })(),
      })),
      items: asArray(raw?.items).map((i: any, index: number) => ({
        id: String(i?.id ?? genId()),
        name: String(i?.name ?? ''),
        shortDescription: i?.shortDescription ? String(i.shortDescription) : undefined,
        longDescription: i?.longDescription ? String(i.longDescription) : undefined,
        avatarUrl: i?.avatarUrl ? String(i.avatarUrl) : undefined,
        lastEdited: typeof i?.lastEdited === 'number' ? i.lastEdited : baseTimestamp + index,
        connections: (() => {
          const conn = asConnections(i?.connections)
          return conn.length > 0 ? conn : undefined
        })(),
      })),
      plotLines: asArray(raw?.plotLines ?? raw?.plotPoints).map((pl: any, index: number) => ({
        id: String(pl?.id ?? genId()),
        title: String(pl?.title ?? ''),
        description: pl?.description ? String(pl.description) : undefined,
        lastEdited: typeof pl?.lastEdited === 'number' ? pl.lastEdited : baseTimestamp + index,
        connections: (() => {
          const conn = asConnections(pl?.connections)
          return conn.length > 0 ? conn : undefined
        })(),
        chapters: asArray(pl?.chapters).map((ch: any) => ({
          id: String(ch?.id ?? genId()),
          title: String(ch?.title ?? ''),
          description: ch?.description ? String(ch.description) : undefined,
          order: typeof ch?.order === 'number' ? ch.order : 0,
          connections: (() => {
            const conn = asConnections(ch?.connections)
            return conn.length > 0 ? conn : undefined
          })(),
          plotPoints: asArray(ch?.plotPoints).map((pp: any) => ({
            id: String(pp?.id ?? genId()),
            title: String(pp?.title ?? ''),
            aiPrompt: pp?.aiPrompt ? String(pp.aiPrompt) : undefined,
            storyElements: pp?.storyElements ? String(pp.storyElements) : undefined,
            order: typeof pp?.order === 'number' ? pp.order : 0,
            connections: (() => {
              const conn = asConnections(pp?.connections)
              return conn.length > 0 ? conn : undefined
            })(),
          })),
        })),
      })),
    }
    return backfillConnections(norm)
  }, [asConnections, normalizeDescriptor, backfillConnections])

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stories))
    } catch {
      // ignore
    }
  }, [stories])

  // Wire remote when authenticated and configured
  useEffect(() => {
    if (!remoteEnabled) {
      if (unsubDocsRef.current) unsubDocsRef.current()
      if (unsubFilesRef.current) unsubFilesRef.current()
      unsubDocsRef.current = null
      unsubFilesRef.current = null
      remoteRef.current = null
      return
    }
    if (!user) return
    const remote = new StoriesRemote(user.$id)
    remoteRef.current = remote
    let cancelled = false
    remote
      .listWithFiles()
      .then(({ stories, files }) => {
        if (cancelled) return
        fileIdsRef.current = files
        // Ensure all stories have lastEdited timestamp
        const migratedStories = stories.map(s => ({
          ...s,
          lastEdited: s.lastEdited ?? Date.now()
        }))
        setStories(migratedStories)
      })
      .catch(() => {
        // ignore initial sync failure; will use local cache
      })
    const unsubDocs = remote.subscribeDocs((type, doc, raw) => {
      if (type === 'delete') {
        delete fileIdsRef.current[doc.id]
        try {
          localStorage.removeItem(localContentKey(doc.id))
        } catch {
          // ignore local cache cleanup failure
        }
      } else {
        const fileId = String((raw as any)?.jsonFileId ?? '')
        if (fileId) {
          fileIdsRef.current[doc.id] = fileId
        }
      }
      // Ensure doc has lastEdited timestamp
      const migratedDoc = { ...doc, lastEdited: doc.lastEdited ?? Date.now() }
      setStories((prev) => {
        if (type === 'create') return [migratedDoc, ...prev.filter((p) => p.id !== migratedDoc.id)]
        if (type === 'update') return prev.map((p) => (p.id === migratedDoc.id ? migratedDoc : p))
        if (type === 'delete') return prev.filter((p) => p.id !== migratedDoc.id)
        return prev
      })
    })
    unsubDocsRef.current = unsubDocs
    const unsubFiles = remote.subscribeFiles(() => {
      // For now, content changes are handled in content pages.
      // This subscription ensures we can react when needed.
    })
    unsubFilesRef.current = unsubFiles
    return () => {
      cancelled = true
      if (unsubDocsRef.current) unsubDocsRef.current()
      if (unsubFilesRef.current) unsubFilesRef.current()
      unsubDocsRef.current = null
      unsubFilesRef.current = null
    }
  }, [remoteEnabled, user, localContentKey])

  const api = useMemo<StoriesContextValue>(() => ({
    stories,
    create: async (s) => {
      if (remoteEnabled && remoteRef.current) {
        // Optimistic local add
        const temp: Story = { id: genId(), ...s, lastEdited: Date.now() }
        setStories((prev) => [temp, ...prev])
        try {
          const { story, fileId } = await remoteRef.current.createWithFile({ ...s, lastEdited: Date.now() }, emptyStoryContent)
          fileIdsRef.current[story.id] = fileId
          setStories((prev) => [story, ...prev.filter((p) => p.id !== temp.id)])
          return story
        } catch (e) {
          setStories((prev) => prev.filter((p) => p.id !== temp.id))
          throw e
        }
      }
      const story: Story = { id: genId(), ...s, lastEdited: Date.now() }
      setStories((prev) => [story, ...prev])
      return story
    },
    update: (id, update) => {
      const updateWithTimestamp = { ...update, lastEdited: Date.now() }
      setStories((prev) => prev.map((s) => (s.id === id ? { ...s, ...updateWithTimestamp } : s)))
      if (remoteEnabled && remoteRef.current) {
        remoteRef.current.update(id, updateWithTimestamp).catch(() => {
          // In a more robust impl, refetch or revert on error
        })
      }
    },
    remove: async (id: string) => {
      // optimistic remove
      delete fileIdsRef.current[id]
      try { localStorage.removeItem(localContentKey(id)) } catch { /* ignore local cache cleanup errors */ }
      setStories((prev) => prev.filter((s) => s.id !== id))
      if (remoteEnabled && remoteRef.current) {
        try {
          await remoteRef.current.deleteStory(id)
        } catch (e) {
          // If delete failed, refetch list to reconcile
          try {
            const { stories } = await remoteRef.current.listWithFiles()
            setStories(stories)
          } catch {
            // give up silently
          }
          throw e
        }
      }
    },
    get: (id) => stories.find((s) => s.id === id),
    loadContent: async (id) => {
      const localKey = localContentKey(id)
      // Try remote first if available
      const fileId = fileIdsRef.current[id]
      if (remoteEnabled && remoteRef.current && fileId) {
        try {
          const data = normalizeContent(await remoteRef.current.readJson(fileId))
          // cache locally
          try { localStorage.setItem(localKey, JSON.stringify(data)) } catch { /* ignore cache write */ }
          return data
        } catch {
          // fall back to local cache
        }
      }
      try {
        const raw = localStorage.getItem(localKey)
        if (raw) return normalizeContent(JSON.parse(raw))
      } catch {
        // ignore parse errors and fall back to empty content
      }
      return emptyStoryContent
    },
    saveContent: async (id, content) => {
      const localKey = localContentKey(id)
      // Save local cache
      try { localStorage.setItem(localKey, JSON.stringify(content)) } catch { /* ignore cache write */ }
      // Update lastEdited timestamp for the story
      setStories((prev) => prev.map((s) => (s.id === id ? { ...s, lastEdited: Date.now() } : s)))
      if (remoteEnabled && remoteRef.current) {
        const currentFileId = fileIdsRef.current[id]
        const newFileId = await remoteRef.current.saveJson(id, content, currentFileId)
        fileIdsRef.current[id] = newFileId
        // Also update the metadata with the new timestamp
        await remoteRef.current.update(id, { lastEdited: Date.now() }).catch(() => {
          // ignore metadata update failure
        })
      }
    },
  }), [stories, remoteEnabled, normalizeContent, localContentKey])

  return <StoriesContext.Provider value={api}>{children}</StoriesContext.Provider>
}

export function useStories() {
  const ctx = useContext(StoriesContext)
  if (!ctx) throw new Error('useStories must be used within StoriesProvider')
  return ctx
}
