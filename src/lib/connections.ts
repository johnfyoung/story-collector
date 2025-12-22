import type { ElementConnection, StoryContent } from '../types'

/**
 * Represents a story element that can be referenced in @mentions
 */
export type MentionableElement = {
  id: string
  name: string
  type: 'character' | 'location' | 'species' | 'group' | 'item' | 'language' | 'plotLine'
}

/**
 * Extract all mentionable elements from story content
 */
export function getAllMentionableElements(content: StoryContent): MentionableElement[] {
  const elements: MentionableElement[] = []

  for (const char of content.characters) {
    if (char.name) elements.push({ id: char.id, name: char.name, type: 'character' })
  }
  for (const spec of content.species) {
    if (spec.name) elements.push({ id: spec.id, name: spec.name, type: 'species' })
  }
  for (const loc of content.locations) {
    if (loc.name) elements.push({ id: loc.id, name: loc.name, type: 'location' })
  }
  for (const group of content.groups) {
    if (group.name) elements.push({ id: group.id, name: group.name, type: 'group' })
  }
  for (const item of content.items) {
    if (item.name) elements.push({ id: item.id, name: item.name, type: 'item' })
  }
  for (const lang of content.languages) {
    if (lang.name) elements.push({ id: lang.id, name: lang.name, type: 'language' })
  }
  for (const plot of content.plotLines) {
    if (plot.title) elements.push({ id: plot.id, name: plot.title, type: 'plotLine' })
  }

  return elements
}

/**
 * Extract connections from text containing @mentions
 * Returns array of ElementConnection objects for any recognized @mentions
 */
export function extractConnectionsFromText(
  text: string,
  availableElements: MentionableElement[]
): ElementConnection[] {
  const connections: ElementConnection[] = []
  const seen = new Set<string>()
  const sorted = availableElements
    .map(el => ({ ...el, nameLower: el.name.trim().toLowerCase() }))
    .filter(el => el.nameLower.length > 0)
    .sort((a, b) => b.nameLower.length - a.nameLower.length) // longest match first

  let idx = 0
  while (idx < text.length) {
    const atPos = text.indexOf('@', idx)
    if (atPos === -1) break
    const start = atPos + 1
    let matched: typeof sorted[number] | null = null
    let matchLength = 0

    for (const el of sorted) {
      const { nameLower } = el
      if (text.slice(start, start + nameLower.length).toLowerCase() === nameLower) {
        const boundary = start + nameLower.length
        const boundaryChar = boundary < text.length ? text[boundary] : ''
        if (!boundaryChar || /[\s.,;:!?()[\]{}"']/u.test(boundaryChar)) {
          matched = el
          matchLength = nameLower.length
          break // longest-first guarantees first match is best
        }
      }
    }

    if (matched && !seen.has(matched.id)) {
      connections.push({
        id: matched.id,
        name: matched.name,
        type: matched.type,
      })
      seen.add(matched.id)
      idx = start + matchLength
    } else {
      idx = start
    }
  }

  return connections
}

/**
 * Resolve connections to get current names by looking up element IDs
 * Updates @mention text with current names if they've changed
 */
export function resolveConnectionsInText(
  text: string,
  connections: ElementConnection[],
  currentElements: MentionableElement[]
): string {
  if (!connections || connections.length === 0) return text

  let resolvedText = text

  for (const conn of connections) {
    // Find current element by ID
    const currentElement = currentElements.find(el => el.id === conn.id)

    if (currentElement && currentElement.name !== conn.name) {
      // Name has changed - update the @mention in text
      const oldMentionPattern = new RegExp(`@${escapeRegex(conn.name)}\\b`, 'g')
      resolvedText = resolvedText.replace(oldMentionPattern, `@${currentElement.name}`)
    }
  }

  return resolvedText
}

/**
 * Update connection names based on current element data
 * Returns updated connections array with current names
 */
export function updateConnectionNames(
  connections: ElementConnection[],
  currentElements: MentionableElement[]
): ElementConnection[] {
  if (!connections) return []

  return connections.map(conn => {
    const currentElement = currentElements.find(el => el.id === conn.id)
    if (currentElement && currentElement.name !== conn.name) {
      return { ...conn, name: currentElement.name }
    }
    return conn
  })
}

/**
 * Helper to escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Merge connections from multiple sources (e.g., shortDescription, longDescription, descriptors)
 * Removes duplicates based on element ID
 */
export function mergeConnections(...connectionArrays: (ElementConnection[] | undefined)[]): ElementConnection[] {
  const merged: ElementConnection[] = []
  const seen = new Set<string>()

  for (const connections of connectionArrays) {
    if (!connections) continue
    for (const conn of connections) {
      if (!seen.has(conn.id)) {
        merged.push(conn)
        seen.add(conn.id)
      }
    }
  }

  return merged
}
