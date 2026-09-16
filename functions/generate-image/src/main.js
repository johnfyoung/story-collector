const MODELS = [
  'gpt-image-2.5-flare',
  'gpt-image-2.5-sunburst',
  'gpt-image-2.5-flare-2026-09-08',
  'gpt-image-2.5-sunburst-2026-09-08',
]
const QUALITIES = ['low', 'medium', 'high', 'xhigh', 'max']
const SIZES = ['1024x1024', '1536x1024', '1024x1536']
const MAX_PROMPT_LENGTH = 4000
// Reference images are uploaded through Cloudinary; refuse to fetch anything else
const REFERENCE_IMAGE_HOSTS = ['res.cloudinary.com']

export default async ({ req, res, log, error }) => {
  // Appwrite sets this header only for executions made by a logged-in user
  if (!req.headers['x-appwrite-user-id']) {
    return res.json({ error: 'Authentication required' }, 401)
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.json({ error: 'OpenAI API key not configured' }, 500)
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.json({ error: 'Invalid JSON body' }, 400)
  }

  const {
    prompt,
    model = 'gpt-image-2.5-flare',
    size = '1024x1024',
    quality = 'medium',
    referenceImageUrl,
  } = body ?? {}

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.json({ error: 'prompt is required' }, 400)
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return res.json({ error: `prompt must be at most ${MAX_PROMPT_LENGTH} characters` }, 400)
  }
  if (!MODELS.includes(model)) {
    return res.json({ error: `Unsupported model: ${model}` }, 400)
  }
  if (!QUALITIES.includes(quality)) {
    return res.json({ error: `Unsupported quality: ${quality}` }, 400)
  }
  if (!SIZES.includes(size)) {
    return res.json({ error: `Unsupported size: ${size}` }, 400)
  }

  let referenceUrl
  if (referenceImageUrl) {
    try {
      referenceUrl = new URL(referenceImageUrl)
    } catch {
      return res.json({ error: 'Invalid reference image URL' }, 400)
    }
    if (referenceUrl.protocol !== 'https:' || !REFERENCE_IMAGE_HOSTS.includes(referenceUrl.hostname)) {
      return res.json({ error: 'Reference image must be hosted on Cloudinary' }, 400)
    }
  }

  log(`user=${req.headers['x-appwrite-user-id']} model=${model} quality=${quality} size=${size} reference=${Boolean(referenceUrl)}`)

  try {
    let response

    if (referenceUrl) {
      // Fetch the reference image and forward as multipart
      const imgResponse = await fetch(referenceUrl, { redirect: 'error' })
      if (!imgResponse.ok) {
        return res.json({ error: 'Failed to fetch reference image' }, 400)
      }
      const imgBlob = await imgResponse.blob()

      const form = new FormData()
      form.append('model', model)
      form.append('prompt', prompt.trim())
      form.append('n', '1')
      form.append('size', size)
      form.append('quality', quality)
      form.append('image', imgBlob, 'reference.png')

      response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      })
    } else {
      response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, prompt: prompt.trim(), n: 1, size, quality }),
      })
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      let message = 'OpenAI request failed'
      try {
        const parsed = JSON.parse(text)
        if (parsed.error?.message) message = parsed.error.message
      } catch {
        if (text) message = text.substring(0, 200)
      }
      error(`OpenAI error ${response.status}: ${message}`)
      return res.json({ error: message }, response.status)
    }

    const data = await response.json()
    const imageData = data.data?.[0]

    if (!imageData) {
      return res.json({ error: 'No image returned from OpenAI' }, 500)
    }

    return res.json({
      url: imageData.url ?? null,
      b64_json: imageData.b64_json ?? null,
      revisedPrompt: imageData.revised_prompt ?? null,
    })
  } catch (err) {
    error(err?.message ?? String(err))
    return res.json({ error: 'Unexpected error generating image' }, 500)
  }
}
