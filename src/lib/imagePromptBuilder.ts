import type { Character, NamedElement, Descriptor, DescriptorKey, StoryContent } from '../types'

type ElementWithDescriptors = Pick<Character, 'name' | 'shortDescription' | 'descriptors'> | Pick<NamedElement, 'name' | 'shortDescription' | 'descriptors'>

type ElementType = 'character' | 'species' | 'location' | 'group' | 'auto'

type PromptOptions = {
  style?: 'portrait' | 'fantasy-art' | 'realistic-photo' | 'anime' | 'oil-painting' | 'digital-art'
  quality?: 'standard' | 'high' | 'ultra'
  customSuffix?: string
  elementType?: ElementType
  storyContent?: StoryContent  // Add story content for linked element lookups
}

/**
 * Builds an AI image generation prompt from element attributes
 * Supports linked elements - e.g., character species will pull in species descriptors
 */
export function buildImagePrompt(
  element: ElementWithDescriptors,
  options: PromptOptions = {}
): string {
  const { style = 'portrait', quality = 'high', customSuffix, elementType = 'auto', storyContent } = options

  const descriptors = element.descriptors ?? []
  const parts: string[] = []

  // Check if there's already a saved AI prompt
  const existingPrompt = getDescriptorValue(descriptors, 'aiImagePrompt')
  if (existingPrompt?.trim()) {
    return existingPrompt.trim()
  }

  // Auto-detect element type based on descriptors
  const detectedType = elementType === 'auto' ? detectElementType(descriptors) : elementType

  // Resolve linked elements and merge descriptors
  const enrichedDescriptors = resolveLinkedDescriptors(descriptors, detectedType, storyContent)

  // Style prefix
  const stylePrefix = getStylePrefix(style, detectedType)
  if (stylePrefix) {
    parts.push(stylePrefix)
  }

  // Element name
  if (element.name) {
    parts.push(element.name)
  }

  // Build prompt based on element type
  if (detectedType === 'character') {
    buildCharacterPrompt(enrichedDescriptors, parts)
  } else if (detectedType === 'species') {
    buildSpeciesPrompt(enrichedDescriptors, parts)
  } else if (detectedType === 'location') {
    buildLocationPrompt(enrichedDescriptors, parts)
  } else if (detectedType === 'group') {
    buildGroupPrompt(enrichedDescriptors, parts)
  }

  // Short description
  if (element.shortDescription) {
    parts.push(element.shortDescription)
  }

  // Quality suffix
  const qualitySuffix = getQualitySuffix(quality, style)
  if (qualitySuffix) {
    parts.push(qualitySuffix)
  }

  // Custom suffix
  if (customSuffix) {
    parts.push(customSuffix)
  }

  return parts.join('. ').replace(/\.\s*\./g, '.').trim()
}

/**
 * Detects element type based on descriptors
 */
function detectElementType(descriptors: Descriptor[]): ElementType {
  // Check for character-specific descriptors
  if (descriptors.some((d) => ['age', 'gender', 'species'].includes(d.key))) {
    return 'character'
  }

  // Check for location-specific descriptors
  if (descriptors.some((d) => ['climate', 'biome', 'architecturalStyle', 'population'].includes(d.key))) {
    return 'location'
  }

  // Check for group-specific descriptors
  if (descriptors.some((d) => ['flagOrSymbol', 'slogan', 'members'].includes(d.key))) {
    return 'group'
  }

  // Default to character (most common)
  return 'character'
}

/**
 * Resolves linked elements and merges their descriptors
 * For example, if a character has species="Dragon", look up Dragon and merge its descriptors
 */
function resolveLinkedDescriptors(
  descriptors: Descriptor[],
  elementType: ElementType,
  storyContent?: StoryContent
): Descriptor[] {
  if (!storyContent) {
    return descriptors
  }

  const merged = [...descriptors]
  const existingKeys = new Set(descriptors.map((d) => d.key))

  // For characters, resolve species link
  if (elementType === 'character') {
    const speciesName = getDescriptorValue(descriptors, 'species')
    if (speciesName) {
      const speciesElement = storyContent.species.find(
        (s) => s.name.toLowerCase() === speciesName.toLowerCase()
      )
      if (speciesElement?.descriptors) {
        // Merge species descriptors that don't exist in character
        for (const speciesDesc of speciesElement.descriptors) {
          // Only add appearance-related descriptors from species
          const isAppearanceKey = [
            'bodyType', 'height', 'skinTone', 'eyeColor', 'hairColor',
            'distinguishingFeature', 'hairstyle', 'weight', 'ethnicity'
          ].includes(speciesDesc.key)

          if (isAppearanceKey && !existingKeys.has(speciesDesc.key) && speciesDesc.value) {
            merged.push({ ...speciesDesc })
          }
        }
      }
    }

    // Resolve birthplace link
    const birthplace = getDescriptorValue(descriptors, 'birthplace')
    if (birthplace) {
      const locationElement = storyContent.locations.find(
        (l) => l.name.toLowerCase() === birthplace.toLowerCase()
      )
      if (locationElement?.descriptors) {
        // Add context from birthplace if available
        const architecturalStyle = getDescriptorValue(locationElement.descriptors || [], 'architecturalStyle')

        if (architecturalStyle && !existingKeys.has('clothingStyle')) {
          // Infer clothing style from birthplace architecture
          const clothingHint = `${architecturalStyle} influenced attire`
          merged.push({ id: 'inferred-clothing', key: 'clothingStyle', value: clothingHint })
        }
      }
    }
  }

  return merged
}

/**
 * Builds prompt for character elements
 */
function buildCharacterPrompt(descriptors: Descriptor[], parts: string[]): void {
  // Profile info (species, age, gender)
  const profileParts: string[] = []
  const species = getDescriptorValue(descriptors, 'species')
  const age = getDescriptorValue(descriptors, 'age')
  const gender = getDescriptorValue(descriptors, 'gender')

  if (age) profileParts.push(`${age}-year-old`)
  if (gender) profileParts.push(gender.toLowerCase())
  if (species) profileParts.push(species.toLowerCase())

  if (profileParts.length > 0) {
    parts.push(`a ${profileParts.join(' ')}`)
  }

  // Physical appearance
  const appearanceParts: string[] = []

  const bodyType = getDescriptorValue(descriptors, 'bodyType')
  if (bodyType) appearanceParts.push(`${bodyType.toLowerCase()} build`)

  const height = getDescriptorValue(descriptors, 'height')
  if (height) appearanceParts.push(height.toLowerCase())

  const skinTone = getDescriptorValue(descriptors, 'skinTone')
  if (skinTone) appearanceParts.push(`${skinTone.toLowerCase()} skin`)

  const hairColor = getDescriptorValue(descriptors, 'hairColor')
  const hairstyle = getDescriptorValue(descriptors, 'hairstyle')
  if (hairColor && hairstyle) {
    appearanceParts.push(`${hairColor.toLowerCase()} ${hairstyle.toLowerCase()} hair`)
  } else if (hairColor) {
    appearanceParts.push(`${hairColor.toLowerCase()} hair`)
  } else if (hairstyle) {
    appearanceParts.push(`${hairstyle.toLowerCase()} hair`)
  }

  const eyeColor = getDescriptorValue(descriptors, 'eyeColor')
  if (eyeColor) appearanceParts.push(`${eyeColor.toLowerCase()} eyes`)

  const ethnicity = getDescriptorValue(descriptors, 'ethnicity')
  if (ethnicity) appearanceParts.push(`${ethnicity.toLowerCase()} features`)

  if (appearanceParts.length > 0) {
    parts.push(appearanceParts.join(', '))
  }

  // Notable features
  const notableFeatures: string[] = []

  const distinguishing = getDescriptorValue(descriptors, 'distinguishingFeature')
  if (distinguishing) notableFeatures.push(distinguishing)

  const tattoos = getDescriptorValue(descriptors, 'tattoos')
  if (tattoos) notableFeatures.push(`tattoos: ${tattoos}`)

  const scars = getDescriptorValue(descriptors, 'scars')
  if (scars) notableFeatures.push(`scars: ${scars}`)

  const facialFeatures = getDescriptorValue(descriptors, 'otherFacialFeatures')
  if (facialFeatures) notableFeatures.push(facialFeatures)

  if (notableFeatures.length > 0) {
    parts.push(`Notable features: ${notableFeatures.join(', ')}`)
  }

  // Clothing and accessories
  const styleParts: string[] = []

  const clothingStyle = getDescriptorValue(descriptors, 'clothingStyle')
  if (clothingStyle) styleParts.push(`wearing ${clothingStyle.toLowerCase()}`)

  const accessories = getDescriptorValue(descriptors, 'accessories')
  if (accessories) styleParts.push(`with ${accessories.toLowerCase()}`)

  if (styleParts.length > 0) {
    parts.push(styleParts.join(' '))
  }
}

/**
 * Builds prompt for species elements
 */
function buildSpeciesPrompt(descriptors: Descriptor[], parts: string[]): void {
  // Physical traits
  const traits: string[] = []

  const bodyType = getDescriptorValue(descriptors, 'bodyType')
  if (bodyType) traits.push(`${bodyType.toLowerCase()} physique`)

  const height = getDescriptorValue(descriptors, 'height')
  if (height) traits.push(height.toLowerCase())

  const skinTone = getDescriptorValue(descriptors, 'skinTone')
  if (skinTone) traits.push(`${skinTone.toLowerCase()} skin`)

  const distinguishing = getDescriptorValue(descriptors, 'distinguishingFeature')
  if (distinguishing) traits.push(distinguishing.toLowerCase())

  if (traits.length > 0) {
    parts.push(traits.join(', '))
  }

  // Add context
  parts.push('typical specimen of the species')
}

/**
 * Builds prompt for location elements
 */
function buildLocationPrompt(descriptors: Descriptor[], parts: string[]): void {
  // Scene type based on architectural style or biome
  const archStyle = getDescriptorValue(descriptors, 'architecturalStyle')
  const biome = getDescriptorValue(descriptors, 'biome')
  const climate = getDescriptorValue(descriptors, 'climate')

  const sceneParts: string[] = []

  if (archStyle) sceneParts.push(`${archStyle.toLowerCase()} architecture`)
  if (biome) sceneParts.push(`${biome.toLowerCase()} biome`)
  if (climate) sceneParts.push(`${climate.toLowerCase()} climate`)

  // Landmarks and features
  const landmarks = getDescriptorValue(descriptors, 'landmarks')
  if (landmarks) sceneParts.push(landmarks.toLowerCase())

  const bodiesOfWater = getDescriptorValue(descriptors, 'bodiesOfWater')
  if (bodiesOfWater) sceneParts.push(bodiesOfWater.toLowerCase())

  const feeling = getDescriptorValue(descriptors, 'feeling')
  if (feeling) sceneParts.push(`${feeling.toLowerCase()} atmosphere`)

  if (sceneParts.length > 0) {
    parts.push(sceneParts.join(', '))
  } else {
    parts.push('landscape view')
  }
}

/**
 * Builds prompt for group elements
 */
function buildGroupPrompt(descriptors: Descriptor[], parts: string[]): void {
  // Symbol and visual identity
  const symbol = getDescriptorValue(descriptors, 'flagOrSymbol')
  if (symbol) {
    parts.push(`emblem featuring ${symbol.toLowerCase()}`)
  } else {
    parts.push('group emblem or banner')
  }

  // Cultural elements
  const culture = getDescriptorValue(descriptors, 'culture')
  if (culture) parts.push(`${culture.toLowerCase()} style`)

  const slogan = getDescriptorValue(descriptors, 'slogan')
  if (slogan) parts.push(`with motto: "${slogan}"`)
}

/**
 * Gets a descriptor value by key
 */
function getDescriptorValue(
  descriptors: Descriptor[],
  key: DescriptorKey
): string | null {
  const descriptor = descriptors.find((d) => d.key === key)
  if (!descriptor?.value) return null
  const trimmed = descriptor.value.trim()
  return trimmed || null
}

/**
 * Gets the style prefix for the prompt
 */
function getStylePrefix(style: PromptOptions['style'], elementType: ElementType): string {
  const isLocation = elementType === 'location'
  const isGroup = elementType === 'group'

  switch (style) {
    case 'portrait':
      if (isLocation) return 'Landscape view of'
      if (isGroup) return 'Emblem of'
      return 'Portrait of'
    case 'fantasy-art':
      if (isLocation) return 'Fantasy art landscape of'
      if (isGroup) return 'Fantasy art emblem of'
      return 'Fantasy art portrait of'
    case 'realistic-photo':
      if (isLocation) return 'Professional photograph of'
      if (isGroup) return 'Detailed emblem of'
      return 'Professional photograph of'
    case 'anime':
      if (isLocation) return 'Anime-style landscape of'
      if (isGroup) return 'Anime-style emblem of'
      return 'Anime-style illustration of'
    case 'oil-painting':
      if (isLocation) return 'Oil painting landscape of'
      if (isGroup) return 'Oil painting emblem of'
      return 'Oil painting portrait of'
    case 'digital-art':
      if (isLocation) return 'Digital art landscape of'
      if (isGroup) return 'Digital art emblem of'
      return 'Digital art portrait of'
    default:
      if (isLocation) return 'View of'
      if (isGroup) return 'Emblem of'
      return 'Portrait of'
  }
}

/**
 * Gets the quality suffix for the prompt
 */
function getQualitySuffix(
  quality: PromptOptions['quality'],
  style: PromptOptions['style']
): string {
  const baseTerms: string[] = []

  switch (quality) {
    case 'ultra':
      baseTerms.push('masterpiece', '8k', 'highly detailed', 'professional quality')
      break
    case 'high':
      baseTerms.push('high quality', 'detailed')
      break
    case 'standard':
      baseTerms.push('good quality')
      break
  }

  // Add style-specific terms
  if (style === 'realistic-photo') {
    baseTerms.push('studio lighting', 'sharp focus')
  } else if (style === 'fantasy-art') {
    baseTerms.push('epic', 'dramatic lighting')
  } else if (style === 'anime') {
    baseTerms.push('clean lines', 'vibrant colors')
  }

  return baseTerms.join(', ')
}

/**
 * Validates that a prompt is appropriate for image generation
 */
export function validatePrompt(prompt: string): {
  valid: boolean
  error?: string
} {
  const trimmed = prompt.trim()

  if (!trimmed) {
    return { valid: false, error: 'Prompt cannot be empty' }
  }

  if (trimmed.length < 10) {
    return { valid: false, error: 'Prompt is too short (minimum 10 characters)' }
  }

  if (trimmed.length > 2000) {
    return { valid: false, error: 'Prompt is too long (maximum 2000 characters)' }
  }

  return { valid: true }
}
