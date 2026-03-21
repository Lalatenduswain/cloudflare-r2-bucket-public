interface Env {
  BUCKET: R2Bucket
}

/** Replace any character that isn't alphanumeric, dot, hyphen, or underscore with '_' */
function safeKey(filename: string): string {
  return filename
    .normalize('NFD')                    // decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')     // strip accent marks
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')  // replace anything unsafe with _
    .replace(/_+/g, '_')                 // collapse repeated underscores
    .replace(/^_|_$/g, '')              // trim leading/trailing underscores
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    const safe = safeKey(file.name)
    const key = `${Date.now()}-${safe}`

    await env.BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
      },
      customMetadata: {
        originalName: file.name,   // preserve for Content-Disposition
        uploadedAt: new Date().toISOString(),
      },
    })

    return Response.json({
      success: true,
      key,
      url: `/files/${key}`,   // key is already URL-safe — no encoding needed
      size: file.size,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
