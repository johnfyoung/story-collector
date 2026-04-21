export default async ({ req, res, log, error }) => {
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

  const { prompt, model = 'gpt-image-1', size = '1024x1024', quality = 'medium', referenceImageUrl } = body ?? {}

  if (!prompt?.trim()) {
    return res.json({ error: 'prompt is required' }, 400)
  }

  try {
    let response

    if (referenceImageUrl) {
      // Fetch the reference image and forward as multipart
      const imgResponse = await fetch(referenceImageUrl)
      if (!imgResponse.ok) {
        return res.json({ error: 'Failed to fetch reference image' }, 400)
      }
      const imgBlob = await imgResponse.blob()

      const form = new FormData()
      form.append('model', model)
      form.append('prompt', prompt.trim())
      form.append('n', '1')
      form.append('size', size)
      form.append('image', imgBlob, 'reference.png')
      if (model === 'gpt-image-1') form.append('quality', quality)

      response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      })
    } else {
      const requestBody = { model, prompt: prompt.trim(), n: 1, size }
      if (model === 'dall-e-3' || model === 'gpt-image-1') requestBody.quality = quality

      response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
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
