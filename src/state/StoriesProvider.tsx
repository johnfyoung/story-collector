import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Story } from '../types'

type StoriesContextValue = {
  stories: Story[]
  create: (s: Omit<Story, 'id'>) => Story
  update: (id: string, update: Partial<Omit<Story, 'id'>>) => void
  get: (id: string) => Story | undefined
}

const StoriesContext = createContext<StoriesContextValue | undefined>(undefined)

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function StoriesProvider({ children }: { children: ReactNode }) {
  const [stories, setStories] = useState<Story[]>([])

  const api = useMemo<StoriesContextValue>(() => ({
    stories,
    create: (s) => {
      const story: Story = { id: genId(), ...s }
      setStories((prev) => [story, ...prev])
      return story
    },
    update: (id, update) => {
      setStories((prev) => prev.map((s) => (s.id === id ? { ...s, ...update } : s)))
    },
    get: (id) => stories.find((s) => s.id === id),
  }), [stories])

  return <StoriesContext.Provider value={api}>{children}</StoriesContext.Provider>
}

export function useStories() {
  const ctx = useContext(StoriesContext)
  if (!ctx) throw new Error('useStories must be used within StoriesProvider')
  return ctx
}

