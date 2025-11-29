import type { Character, Descriptor, DescriptorKey } from '../types'

type PromptOptions = {
  style?: 'portrait' | 'fantasy-art' | 'realistic-photo' | 'anime' | 'oil-painting' | 'digital-art'
  quality?: 'standard' | 'high' | 'ultra'
  customSuffix?: string
}

/**
 * Builds an AI image generation prompt from character attributes
 */
export function buildImagePrompt(
  character: Pick<Character, 'name' | 'shortDescription' | 'descriptors'>,
  options: PromptOptions = {}
): string {
  const { style = 'portrait', quality = 'high', customSuffix } = options

  const descriptors = character.descriptors ?? []
  const parts: string[] = []

  // Check if there's already a saved AI prompt
  const existingPrompt = getDescriptorValue(descriptors, 'aiImagePrompt')
  if (existingPrompt?.trim()) {
    return existingPrompt.trim()
  }

  // Style prefix
  const stylePrefix = getStylePrefix(style)
  if (stylePrefix) {
    parts.push(stylePrefix)
  }

  // Character name
  if (character.name) {
    parts.push(character.name)
  }

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

  // Short description
  if (character.shortDescription) {
    parts.push(character.shortDescription)
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
function getStylePrefix(style: PromptOptions['style']): string {
  switch (style) {
    case 'portrait':
      return 'Portrait of'
    case 'fantasy-art':
      return 'Fantasy art portrait of'
    case 'realistic-photo':
      return 'Professional photograph of'
    case 'anime':
      return 'Anime-style illustration of'
    case 'oil-painting':
      return 'Oil painting portrait of'
    case 'digital-art':
      return 'Digital art portrait of'
    default:
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
