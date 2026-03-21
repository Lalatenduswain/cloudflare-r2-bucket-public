interface Env {
  BUCKET: R2Bucket
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url)
  // Keys are URL-safe (set by upload.ts safeKey()) — just strip the /files/ prefix
  const key = url.pathname.slice('/files/'.length)

  if (!key) {
    return new Response('Not found', { status: 404 })
  }

  const rangeHeader = request.headers.get('Range')
  const object = rangeHeader
    ? await env.BUCKET.get(key, { range: request.headers })
    : await env.BUCKET.get(key)

  if (!object) {
    return new Response('Not found', { status: 404 })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('Accept-Ranges', 'bytes')

  const ct = headers.get('Content-Type') || ''
  const originalName = object.customMetadata?.originalName
  if (originalName && !ct.startsWith('image/') && !ct.startsWith('video/') && !ct.startsWith('audio/') && !ct.startsWith('text/') && !ct.includes('pdf')) {
    headers.set('Content-Disposition', `attachment; filename="${originalName}"`)
  }

  return new Response(object.body, {
    headers,
    status: rangeHeader ? 206 : 200,
  })
}
