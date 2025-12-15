const RECENT_EDITS_KEY = 'recentEdits:v1'
const MAX_RECENT_EDITS = 20

export type RecentEditType = 'character' | 'location' | 'species' | 'group' | 'language' | 'item' | 'plotLine'

export type RecentEdit = {
  id: string
  type: RecentEditType
  elementId: string
  elementName: string
  storyId: string
  storyName: string
  timestamp: number
  editUrl: string
}

export function addRecentEdit(edit: Omit<RecentEdit, 'id' | 'timestamp'>) {
  try {
    const existing = getRecentEdits()

    // Create new edit with timestamp
    const newEdit: RecentEdit = {
      ...edit,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now()
    }

    // Remove duplicates (same element in same story)
    const filtered = existing.filter(
      e => !(e.elementId === edit.elementId && e.storyId === edit.storyId)
    )

    // Add new edit at the beginning and limit to MAX_RECENT_EDITS
    const updated = [newEdit, ...filtered].slice(0, MAX_RECENT_EDITS)

    localStorage.setItem(RECENT_EDITS_KEY, JSON.stringify(updated))
  } catch (error) {
    // Silently fail if localStorage is unavailable
    console.error('Failed to save recent edit:', error)
  }
}

export function getRecentEdits(limit?: number): RecentEdit[] {
  try {
    const raw = localStorage.getItem(RECENT_EDITS_KEY)
    if (!raw) return []

    const edits = JSON.parse(raw) as RecentEdit[]
    return limit ? edits.slice(0, limit) : edits
  } catch (error) {
    console.error('Failed to load recent edits:', error)
    return []
  }
}

export function clearRecentEdits() {
  try {
    localStorage.removeItem(RECENT_EDITS_KEY)
  } catch (error) {
    console.error('Failed to clear recent edits:', error)
  }
}

// Get a user-friendly label for the edit type
export function getEditTypeLabel(type: RecentEditType): string {
  const labels: Record<RecentEditType, string> = {
    character: 'Character',
    location: 'Location',
    species: 'Species',
    group: 'Group',
    language: 'Language',
    item: 'Item',
    plotLine: 'Plot Line'
  }
  return labels[type] || type
}
