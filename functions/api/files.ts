interface Env {
  BUCKET: R2Bucket
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const list = await env.BUCKET.list()

    const files = list.objects.filter(obj => !obj.key.startsWith('shares/')).map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded.toISOString(),
      url: `/files/${encodeURIComponent(obj.key)}`,
      contentType: obj.httpMetadata?.contentType,
    }))

    // Newest first
    files.sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime())

    return Response.json({ files }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('List error:', err)
    return Response.json({ error: 'Failed to list files' }, { status: 500 })
  }
}
