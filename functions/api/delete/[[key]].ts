interface Env {
  BUCKET: R2Bucket
}

export const onRequestDelete: PagesFunction<Env> = async ({ env, request }) => {
  try {
    const url = new URL(request.url)
    // pathname = /api/delete/<encoded-key>
    const raw = url.pathname.slice('/api/delete/'.length)
    const key = decodeURIComponent(raw)

    if (!key) {
      return Response.json({ error: 'No key provided' }, { status: 400 })
    }

    await env.BUCKET.delete(key)
    return Response.json({ success: true })
  } catch (err) {
    console.error('Delete error:', err)
    return Response.json({ error: 'Delete failed' }, { status: 500 })
  }
}
