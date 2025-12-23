import type {
  AuthorStyle,
  Character,
  Descriptor,
  ElementConnection,
  NamedElement,
  PlotLine,
  StoryContent,
} from '../types'
import { mergeConnections } from './connections'

type ResolvedElement = {
  id: string
  name: string
  type: ElementConnection['type']
  shortDescription?: string
  longDescription?: string
  description?: string
  descriptors?: Descriptor[]
  connections?: ElementConnection[]
}

type BuildChapterPromptInput = {
  chapterTitle?: string
  chapterDescription: string
  chapterConnections: ElementConnection[]
  plotPointPrompts: string[]
  storyContent: StoryContent
  authorStyle?: AuthorStyle
}

const SECTION_LABELS: Record<ElementConnection['type'], string> = {
  character: 'Characters',
  location: 'Locations',
  species: 'Species',
  group: 'Groups',
  item: 'Items',
  language: 'Languages',
  plotLine: 'Plot Lines',
}

const MAX_DESCRIPTOR_COUNT = 12

export function buildChapterStoryPrompt({
  chapterTitle,
  chapterDescription,
  chapterConnections,
  plotPointPrompts,
  storyContent,
  authorStyle,
}: BuildChapterPromptInput): string {
  const primaryElements = resolveConnections(chapterConnections, storyContent)
  const primaryIds = new Set(primaryElements.map((el) => el.id))

  const secondaryConnections = mergeConnections(
    ...primaryElements.map((el) => el.connections ?? []),
  ).filter((conn) => !primaryIds.has(conn.id))

  const secondaryElements = resolveConnections(secondaryConnections, storyContent)

  const parts: string[] = []
  parts.push('Write a story chapter based on the following plot line chapter.')

  if (chapterTitle?.trim()) {
    parts.push(`Chapter title: ${chapterTitle.trim()}`)
  }

  if (plotPointPrompts.length > 0) {
    parts.push('Plot point prompts:')
    for (const prompt of plotPointPrompts) {
      parts.push(`- ${prompt}`)
    }
  } else if (chapterDescription.trim()) {
    parts.push(`Chapter description: ${chapterDescription.trim()}`)
  } else {
    parts.push('Plot point prompts: (none provided)')
  }

  const authorStyleBlock = formatAuthorStyle(authorStyle)
  if (authorStyleBlock.length > 0) {
    parts.push('')
    parts.push('Author style instructions (apply to the whole chapter):')
    parts.push(...authorStyleBlock)
  }

  if (primaryElements.length > 0) {
    parts.push('')
    parts.push('Primary story elements:')
    parts.push(...formatElementsByType(primaryElements))
  } else {
    parts.push('')
    parts.push(
      'Primary story elements: (none yet — add @mentions in the chapter description)',
    )
  }

  if (secondaryElements.length > 0) {
    parts.push('')
    parts.push('Related story elements (linked from the above):')
    parts.push(...formatElementsByType(secondaryElements))
  }

  parts.push('')
  parts.push(
    'Write the chapter using the elements above, keeping tone and details consistent.',
  )

  return parts.join('\n').trim()
}

function resolveConnections(
  connections: ElementConnection[],
  storyContent: StoryContent,
): ResolvedElement[] {
  const resolved: ResolvedElement[] = []
  const seen = new Set<string>()

  for (const conn of connections) {
    if (seen.has(conn.id)) continue
    const element = getElementByConnection(conn, storyContent)
    if (!element) continue
    resolved.push(element)
    seen.add(conn.id)
  }

  return resolved
}

function getElementByConnection(
  connection: ElementConnection,
  storyContent: StoryContent,
): ResolvedElement | null {
  switch (connection.type) {
    case 'character': {
      const element = storyContent.characters.find((c) => c.id === connection.id)
      return element ? toResolvedElement(connection.type, element) : null
    }
    case 'location': {
      const element = storyContent.locations.find((c) => c.id === connection.id)
      return element ? toResolvedElement(connection.type, element) : null
    }
    case 'species': {
      const element = storyContent.species.find((c) => c.id === connection.id)
      return element ? toResolvedElement(connection.type, element) : null
    }
    case 'group': {
      const element = storyContent.groups.find((c) => c.id === connection.id)
      return element ? toResolvedElement(connection.type, element) : null
    }
    case 'item': {
      const element = storyContent.items.find((c) => c.id === connection.id)
      return element ? toResolvedElement(connection.type, element) : null
    }
    case 'language': {
      const element = storyContent.languages.find((c) => c.id === connection.id)
      return element ? toResolvedElement(connection.type, element) : null
    }
    case 'plotLine': {
      const element = storyContent.plotLines.find((c) => c.id === connection.id)
      return element ? toResolvedPlotLine(connection.type, element) : null
    }
    default:
      return null
  }
}

function toResolvedElement(
  type: ElementConnection['type'],
  element: Character | NamedElement,
): ResolvedElement {
  return {
    id: element.id,
    name: element.name,
    type,
    shortDescription: element.shortDescription,
    longDescription: element.longDescription,
    descriptors: element.descriptors,
    connections: element.connections,
  }
}

function toResolvedPlotLine(
  type: ElementConnection['type'],
  element: PlotLine,
): ResolvedElement {
  return {
    id: element.id,
    name: element.title,
    type,
    description: element.description,
    connections: element.connections,
  }
}

function formatElementsByType(elements: ResolvedElement[]): string[] {
  const sections = new Map<ElementConnection['type'], ResolvedElement[]>()

  for (const element of elements) {
    const group = sections.get(element.type) ?? []
    group.push(element)
    sections.set(element.type, group)
  }

  const lines: string[] = []
  const orderedTypes: ElementConnection['type'][] = [
    'character',
    'location',
    'species',
    'group',
    'item',
    'language',
    'plotLine',
  ]

  for (const type of orderedTypes) {
    const group = sections.get(type)
    if (!group || group.length === 0) continue
    lines.push(`${SECTION_LABELS[type]}:`)
    for (const element of group) {
      lines.push(...formatElementLines(element))
    }
  }

  return lines
}

function formatElementLines(element: ResolvedElement): string[] {
  const lines: string[] = []
  const summary =
    element.shortDescription?.trim() ||
    element.longDescription?.trim() ||
    element.description?.trim()
  if (summary) {
    lines.push(`- ${element.name} — ${summary}`)
  } else {
    lines.push(`- ${element.name}`)
  }

  const descriptorText = formatDescriptors(element.descriptors)
  if (descriptorText) {
    lines.push(`  Details: ${descriptorText}`)
  }

  return lines
}

function formatDescriptors(descriptors?: Descriptor[]): string | null {
  if (!descriptors || descriptors.length === 0) return null
  const filtered = descriptors
    .map((desc) => ({
      key: formatDescriptorKey(desc.key),
      value: desc.value?.trim(),
    }))
    .filter((desc) => desc.value)
    .slice(0, MAX_DESCRIPTOR_COUNT)

  if (filtered.length === 0) return null
  return filtered.map((desc) => `${desc.key}: ${desc.value}`).join('; ')
}

function formatDescriptorKey(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function formatAuthorStyle(authorStyle?: AuthorStyle): string[] {
  if (!authorStyle) return []
  const lines: string[] = []
  const voice = authorStyle.voice?.trim()
  const personality = authorStyle.personality?.trim()
  const styleNotes = authorStyle.styleNotes?.trim()

  if (voice) lines.push(`- Narrative voice: ${voice}`)
  if (personality) lines.push(`- Narrator personality/stance: ${personality}`)
  if (styleNotes) lines.push(`- Style notes: ${styleNotes}`)

  const scales = authorStyle.scales
  if (scales) {
    const scaleEntries: Array<[string, number]> = []
    const addScale = (label: string, value?: number) => {
      if (typeof value === 'number' && value > 0) {
        scaleEntries.push([label, value])
      }
    }
    addScale('Formality', scales.formality)
    addScale('Descriptiveness', scales.descriptiveness)
    addScale('Pacing', scales.pacing)
    addScale('Dialogue focus', scales.dialogueFocus)
    addScale('Emotional intensity', scales.emotionalIntensity)
    addScale('Humor', scales.humor)
    addScale('Darkness', scales.darkness)

    if (scaleEntries.length > 0) {
      lines.push('- Style dials (1-10, higher = more of the trait):')
      for (const [label, value] of scaleEntries) {
        lines.push(`  - ${label}: ${value}/10`)
      }
    }
  }

  return lines
}
