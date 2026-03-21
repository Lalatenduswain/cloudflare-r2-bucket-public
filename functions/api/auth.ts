interface Env {
  AUTH_ANSWER_1?: string   // set in Cloudflare Pages → Settings → Environment variables
  AUTH_ANSWER_2?: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const a1 = (env.AUTH_ANSWER_1 || '').trim()
  const a2 = (env.AUTH_ANSWER_2 || '').trim().toLowerCase()

  // If env vars not configured, deny all access
  if (!a1 || !a2) {
    console.error('AUTH_ANSWER_1 / AUTH_ANSWER_2 env vars not set')
    return Response.json({ ok: false }, { status: 503 })
  }

  try {
    const { answer1, answer2 } = await request.json() as { answer1: string; answer2: string }
    const ok = answer1.trim() === a1 && answer2.trim().toLowerCase() === a2
    return Response.json({ ok })
  } catch {
    return Response.json({ ok: false }, { status: 400 })
  }
}
