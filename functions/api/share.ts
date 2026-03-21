interface Env {
  BUCKET: R2Bucket
}

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { key, password, expiresIn } = await request.json() as {
      key: string
      password?: string
      expiresIn?: number  // seconds; omit or 0 = never
    }

    if (!key) return Response.json({ error: 'key required' }, { status: 400 })

    // Verify the file actually exists in R2
    const exists = await env.BUCKET.head(key)
    if (!exists) return Response.json({ error: 'file not found' }, { status: 404 })

    const shareId = crypto.randomUUID()
    const meta = {
      key,
      passwordHash: password ? await sha256hex(password) : null,
      expiresAt: expiresIn && expiresIn > 0
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : null,
    }

    await env.BUCKET.put(`shares/${shareId}.json`, JSON.stringify(meta), {
      httpMetadata: { contentType: 'application/json' },
    })

    return Response.json({ shareId })
  } catch (err) {
    console.error('Share error:', err)
    return Response.json({ error: 'Share creation failed' }, { status: 500 })
  }
}
