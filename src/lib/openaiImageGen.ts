import { Functions, ExecutionMethod } from 'appwrite'
import { client } from './appwrite'

const FUNCTION_ID = import.meta.env.VITE_APPWRITE_IMAGE_FUNCTION_ID as string | undefined
const OPENAI_IMAGE_MODEL = import.meta.env.VITE_OPENAI_IMAGE_MODEL as string | undefined

type ImageSize = '1024x1024' | '1792x1024' | '1024x1792'
type DalleQuality = 'standard' | 'hd'
type GptImageQuality = 'low' | 'medium' | 'high'
type ImageQuality = DalleQuality | GptImageQuality
type ImageModel = 'dall-e-2' | 'dall-e-3' | 'gpt-image-1'

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

  const model = (options.model ?? OPENAI_IMAGE_MODEL ?? 'gpt-image-1') as ImageModel
  const {
    prompt,
    size = '1024x1024',
    quality = model === 'gpt-image-1' ? 'medium' : 'standard',
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
  return (OPENAI_IMAGE_MODEL as ImageModel) ?? 'gpt-image-1'
}

export function getAvailableQualities(model: ImageModel): ImageQuality[] {
  if (model === 'gpt-image-1') return ['low', 'medium', 'high']
  return ['standard', 'hd']
}

export function getAvailableSizes(model: ImageModel): ImageSize[] {
  if (model === 'dall-e-2') return ['1024x1024']
  return ['1024x1024', '1792x1024', '1024x1792']
}

export function estimateCost(model: ImageModel, quality: ImageQuality, size: ImageSize): number {
  if (model === 'dall-e-2') return 0.016

  if (model === 'gpt-image-1') {
    if (quality === 'high') return size === '1024x1024' ? 0.08 : 0.12
    if (quality === 'medium') return size === '1024x1024' ? 0.04 : 0.08
    return size === '1024x1024' ? 0.02 : 0.04
  }

  // DALL-E 3
  if (quality === 'hd') return size === '1024x1024' ? 0.08 : 0.12
  return size === '1024x1024' ? 0.04 : 0.08
}
