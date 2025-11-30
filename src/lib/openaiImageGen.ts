const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
const OPENAI_IMAGE_MODEL = import.meta.env.VITE_OPENAI_IMAGE_MODEL as
  | string
  | undefined

type ImageSize = '1024x1024' | '1792x1024' | '1024x1792'
type ImageQuality = 'standard' | 'hd'
type ImageModel = 'dall-e-2' | 'dall-e-3'

export type GenerateImageOptions = {
  prompt: string
  size?: ImageSize
  quality?: ImageQuality
  model?: ImageModel
}

type OpenAIImageResponse = {
  created: number
  data: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
}

/**
 * Checks if OpenAI image generation is configured
 */
export function isOpenAIConfigured(): boolean {
  return Boolean(OPENAI_API_KEY)
}

/**
 * Generates an image using OpenAI's image generation API
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<{ url: string; revisedPrompt?: string }> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API key is not configured')
  }

  const {
    prompt,
    size = '1024x1024',
    quality = 'standard',
    model = (OPENAI_IMAGE_MODEL as ImageModel) || 'dall-e-3',
  } = options

  if (!prompt?.trim()) {
    throw new Error('Prompt is required')
  }

  const requestBody: Record<string, unknown> = {
    model,
    prompt: prompt.trim(),
    n: 1,
    size,
  }

  // DALL-E 3 supports quality parameter
  if (model === 'dall-e-3') {
    requestBody.quality = quality
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      let errorMessage = 'Failed to generate image'

      try {
        const errorData = JSON.parse(errorText) as {
          error?: { message?: string; code?: string }
        }
        if (errorData.error?.message) {
          errorMessage = errorData.error.message
        }
      } catch {
        if (errorText) {
          errorMessage = `${errorMessage}: ${errorText.substring(0, 200)}`
        }
      }

      throw new Error(errorMessage)
    }

    const data = (await response.json()) as OpenAIImageResponse

    if (!data.data || data.data.length === 0) {
      throw new Error('No image returned from OpenAI')
    }

    const imageData = data.data[0]

    if (!imageData.url) {
      throw new Error('Image URL not found in response')
    }

    return {
      url: imageData.url,
      revisedPrompt: imageData.revised_prompt,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unknown error occurred while generating image')
  }
}

/**
 * Gets the default model based on environment configuration
 */
export function getDefaultModel(): ImageModel {
  return (OPENAI_IMAGE_MODEL as ImageModel) || 'dall-e-3'
}

/**
 * Gets available sizes for a given model
 */
export function getAvailableSizes(model: ImageModel): ImageSize[] {
  if (model === 'dall-e-2') {
    return ['1024x1024']
  }
  // DALL-E 3 supports multiple sizes
  return ['1024x1024', '1792x1024', '1024x1792']
}

/**
 * Estimates the cost of generating an image
 */
export function estimateCost(
  model: ImageModel,
  quality: ImageQuality,
  size: ImageSize
): number {
  if (model === 'dall-e-2') {
    // DALL-E 2 pricing
    return 0.016 // $0.016 per 1024x1024 image
  }

  // DALL-E 3 pricing
  if (quality === 'hd') {
    if (size === '1024x1024') return 0.08
    return 0.12 // 1792x1024 or 1024x1792
  }

  // Standard quality
  if (size === '1024x1024') return 0.04
  return 0.08 // 1792x1024 or 1024x1792
}
