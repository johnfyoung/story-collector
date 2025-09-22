import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Story } from '../types'
import { useAuth } from '../auth/AuthProvider'
import { StoriesRemote, isRemoteConfigured } from '../lib/storiesService'
import { emptyStoryContent, type StoryContent, type Character, type Descriptor } from '../types'

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
      return raw ? (JSON.parse(raw) as Story[]) : []
    } catch {
      return []
    }
  })
  const remoteEnabled = isRemoteConfigured() && !!user
  const remoteRef = useRef<StoriesRemote | null>(null)
  const unsubDocsRef = useRef<null | (() => void)>(null)
  const unsubFilesRef = useRef<null | (() => void)>(null)
  const fileIdsRef = useRef<Record<string, string>>({})
  const localContentKey = (sid: string) => `${STORAGE_KEY}:content:${sid}`

  function normalizeContent(raw: any): StoryContent {
    const asArray = (x: any) => (Array.isArray(x) ? x : [])
    const chars = asArray(raw?.characters).map((c: any) => {
      const descs = asArray(c?.descriptors).map((d: any) => ({
        id: String(d?.id ?? genId()),
        key: d?.key ?? 'notes',
        value: String(d?.value ?? ''),
      })) as Descriptor[]
      return {
        id: String(c?.id ?? genId()),
        name: String(c?.name ?? ''),
        longName: c?.longName ? String(c.longName) : undefined,
        shortDescription: c?.shortDescription ? String(c.shortDescription) : undefined,
        longDescription: c?.longDescription ? String(c.longDescription) : undefined,
        descriptors: descs,
        avatarUrl: c?.avatarUrl ? String(c.avatarUrl) : undefined,
      } as Character
    })
    const norm: StoryContent = {
      characters: chars,
      species: asArray(raw?.species).map((s: any) => ({ id: String(s?.id ?? genId()), name: String(s?.name ?? ''), shortDescription: s?.shortDescription ? String(s.shortDescription) : undefined, longDescription: s?.longDescription ? String(s.longDescription) : undefined, avatarUrl: s?.avatarUrl ? String(s.avatarUrl) : undefined })),
      locations: asArray(raw?.locations ?? raw?.places).map((p: any) => ({
        id: String(p?.id ?? genId()),
        name: String(p?.name ?? ''),
        shortDescription: p?.shortDescription ? String(p.shortDescription) : undefined,
        longDescription: p?.longDescription ? String(p.longDescription) : undefined,
        avatarUrl: p?.avatarUrl ? String(p.avatarUrl) : undefined,
        descriptors: asArray(p?.descriptors).map((d: any) => ({ id: String(d?.id ?? genId()), key: d?.key ?? 'notes', value: String(d?.value ?? '') })),
      })),
      groups: asArray(raw?.groups).map((g: any) => ({
        id: String(g?.id ?? genId()),
        name: String(g?.name ?? ''),
        shortDescription: g?.shortDescription ? String(g.shortDescription) : undefined,
        longDescription: g?.longDescription ? String(g.longDescription) : undefined,
        avatarUrl: g?.avatarUrl ? String(g.avatarUrl) : undefined,
        descriptors: asArray(g?.descriptors).map((d: any) => ({ id: String(d?.id ?? genId()), key: d?.key ?? 'notes', value: String(d?.value ?? '') })),
      })),
      languages: asArray(raw?.languages).map((l: any) => ({ id: String(l?.id ?? genId()), name: String(l?.name ?? ''), shortDescription: l?.shortDescription ? String(l.shortDescription) : undefined, longDescription: l?.longDescription ? String(l.longDescription) : undefined, avatarUrl: l?.avatarUrl ? String(l.avatarUrl) : undefined })),
      items: asArray(raw?.items).map((i: any) => ({ id: String(i?.id ?? genId()), name: String(i?.name ?? ''), shortDescription: i?.shortDescription ? String(i.shortDescription) : undefined, longDescription: i?.longDescription ? String(i.longDescription) : undefined, avatarUrl: i?.avatarUrl ? String(i.avatarUrl) : undefined })),
      plotPoints: asArray(raw?.plotPoints).map((pp: any) => ({ id: String(pp?.id ?? genId()), title: String(pp?.title ?? pp?.name ?? ''), description: pp?.description ? String(pp.description) : undefined })),
    }
    return norm
  }

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
        setStories(stories)
      })
      .catch(() => {})
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
      setStories((prev) => {
        if (type === 'create') return [doc, ...prev.filter((p) => p.id !== doc.id)]
        if (type === 'update') return prev.map((p) => (p.id === doc.id ? doc : p))
        if (type === 'delete') return prev.filter((p) => p.id !== doc.id)
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
  }, [remoteEnabled])

  const api = useMemo<StoriesContextValue>(() => ({
    stories,
    create: async (s) => {
      if (remoteEnabled && remoteRef.current) {
        // Optimistic local add
        const temp: Story = { id: genId(), ...s }
        setStories((prev) => [temp, ...prev])
        try {
          const { story, fileId } = await remoteRef.current.createWithFile(s, emptyStoryContent)
          fileIdsRef.current[story.id] = fileId
          setStories((prev) => [story, ...prev.filter((p) => p.id !== temp.id)])
          return story
        } catch (e) {
          setStories((prev) => prev.filter((p) => p.id !== temp.id))
          throw e
        }
      }
      const story: Story = { id: genId(), ...s }
      setStories((prev) => [story, ...prev])
      return story
    },
    update: (id, update) => {
      setStories((prev) => prev.map((s) => (s.id === id ? { ...s, ...update } : s)))
      if (remoteEnabled && remoteRef.current) {
        remoteRef.current.update(id, update).catch(() => {
          // In a more robust impl, refetch or revert on error
        })
      }
    },
    remove: async (id: string) => {
      // optimistic remove
      delete fileIdsRef.current[id]
      try { localStorage.removeItem(localContentKey(id)) } catch {}
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
          try { localStorage.setItem(localKey, JSON.stringify(data)) } catch {}
          return data
        } catch {
          // fall back to local cache
        }
      }
      try {
        const raw = localStorage.getItem(localKey)
        if (raw) return normalizeContent(JSON.parse(raw))
      } catch {}
      return emptyStoryContent
    },
    saveContent: async (id, content) => {
      const localKey = localContentKey(id)
      // Save local cache
      try { localStorage.setItem(localKey, JSON.stringify(content)) } catch {}
      if (remoteEnabled && remoteRef.current) {
        const currentFileId = fileIdsRef.current[id]
        try {
          const newFileId = await remoteRef.current.saveJson(id, content, currentFileId)
          fileIdsRef.current[id] = newFileId
        } catch (e) {
          // keep local cache; surface error to caller
          throw e
        }
      }
    },
  }), [stories, remoteEnabled])

  return <StoriesContext.Provider value={api}>{children}</StoriesContext.Provider>
}

export function useStories() {
  const ctx = useContext(StoriesContext)
  if (!ctx) throw new Error('useStories must be used within StoriesProvider')
  return ctx
}
