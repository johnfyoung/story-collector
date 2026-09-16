import { Functions, ExecutionMethod } from 'appwrite'
import { client } from './appwrite'

const FUNCTION_ID = import.meta.env.VITE_APPWRITE_IMAGE_FUNCTION_ID as string | undefined
const OPENAI_IMAGE_MODEL = import.meta.env.VITE_OPENAI_IMAGE_MODEL as string | undefined

export const IMAGE_MODELS = [
  'gpt-image-2.5-flare',
  'gpt-image-2.5-sunburst',
  'gpt-image-2.5-flare-2026-09-08',
  'gpt-image-2.5-sunburst-2026-09-08',
] as const
export const IMAGE_QUALITIES = ['low', 'medium', 'high', 'xhigh', 'max'] as const
export const IMAGE_SIZES = ['1024x1024', '1536x1024', '1024x1536'] as const

export type ImageModel = (typeof IMAGE_MODELS)[number]
export type ImageQuality = (typeof IMAGE_QUALITIES)[number]
export type ImageSize = (typeof IMAGE_SIZES)[number]

export type GenerateImageOptions = {
  prompt: string
  size?: ImageSize
  quality?: ImageQuality
  model?: ImageModel
  referenceImageUrl?: string
}

export function isOpenAIConfigured(): boolean {
  return Boolean(FUNCTION_ID)
}

export async function generateImage(
  options: GenerateImageOptions
): Promise<{ url: string; revisedPrompt?: string }> {
  if (!isOpenAIConfigured()) {
    throw new Error('Image generation function is not configured (VITE_APPWRITE_IMAGE_FUNCTION_ID missing)')
  }

  const model = options.model ?? getDefaultModel()
  const {
    prompt,
    size = '1024x1024',
    quality = 'medium',
    referenceImageUrl,
  } = options

  if (!prompt?.trim()) {
    throw new Error('Prompt is required')
  }

  const functions = new Functions(client)
  const execution = await functions.createExecution(
    FUNCTION_ID!,
    JSON.stringify({ prompt: prompt.trim(), model, size, quality, referenceImageUrl }),
    false,
    '/',
    ExecutionMethod.POST,
    { 'Content-Type': 'application/json' }
  )

  if (execution.responseStatusCode >= 400) {
    let message = 'Image generation failed'
    try {
      const body = JSON.parse(execution.responseBody) as { error?: string }
      if (body.error) message = body.error
    } catch { /* ignore */ }
    throw new Error(message)
  }

  const data = JSON.parse(execution.responseBody) as {
    url?: string
    b64_json?: string
    revisedPrompt?: string
    error?: string
  }

  if (data.error) throw new Error(data.error)

  let imageUrl: string
  if (data.url) {
    imageUrl = data.url
  } else if (data.b64_json) {
    imageUrl = `data:image/png;base64,${data.b64_json}`
  } else {
    throw new Error('No image URL or data in response')
  }

  return { url: imageUrl, revisedPrompt: data.revisedPrompt }
}

export function getDefaultModel(): ImageModel {
  const configured = OPENAI_IMAGE_MODEL as ImageModel | undefined
  return configured && IMAGE_MODELS.includes(configured) ? configured : 'gpt-image-2.5-flare'
}
