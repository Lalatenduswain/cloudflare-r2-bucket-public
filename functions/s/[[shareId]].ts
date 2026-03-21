interface Env {
  BUCKET: R2Bucket
}

interface ShareMeta {
  key: string
  passwordHash: string | null
  expiresAt: string | null
}

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

const BASE_STYLE = `
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{
    font-family:'Inter',system-ui,sans-serif;
    background:#02020a;
    color:#e2e8f0;
    min-height:100vh;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:24px;
    background:
      radial-gradient(ellipse 70% 60% at 15% 25%,rgba(0,212,255,.07) 0%,transparent 60%),
      radial-gradient(ellipse 60% 70% at 85% 70%,rgba(123,47,255,.08) 0%,transparent 60%),
      #02020a;
  }
  .card{
    background:rgba(8,8,24,.65);
    border:1px solid rgba(0,212,255,.2);
    border-radius:24px;
    padding:48px 40px;
    max-width:420px;
    width:100%;
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:20px;
    box-shadow:0 0 60px rgba(0,212,255,.08),0 24px 80px rgba(0,0,0,.5);
    backdrop-filter:blur(20px);
  }
  .icon{
    width:64px;height:64px;border-radius:50%;
    background:rgba(0,212,255,.06);
    border:1px solid rgba(0,212,255,.2);
    display:flex;align-items:center;justify-content:center;
  }
  h1{
    font-size:1.3rem;font-weight:700;letter-spacing:-.02em;
    background:linear-gradient(135deg,#00d4ff,#7b2fff);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
    background-clip:text;
    text-align:center;
  }
  p{font-size:.85rem;color:#64748b;text-align:center;margin-top:-8px;}
  label{
    font-size:.78rem;color:#00d4ff;letter-spacing:.06em;
    text-transform:uppercase;font-weight:600;align-self:flex-start;
  }
  .form{width:100%;display:flex;flex-direction:column;gap:14px;}
  input{
    background:rgba(255,255,255,.03);
    border:1px solid rgba(0,212,255,.12);
    border-radius:10px;padding:12px 16px;
    color:#e2e8f0;font-size:.95rem;outline:none;
    width:100%;transition:border-color .2s,box-shadow .2s;
  }
  input:focus{border-color:#00d4ff;box-shadow:0 0 0 3px rgba(0,212,255,.08);}
  input::placeholder{color:#64748b;}
  button{
    display:flex;align-items:center;justify-content:center;gap:8px;
    padding:13px 32px;border-radius:12px;
    background:linear-gradient(135deg,rgba(0,212,255,.15),rgba(123,47,255,.15));
    border:1px solid rgba(0,212,255,.3);
    color:#00d4ff;font-size:.9rem;font-weight:600;cursor:pointer;
    transition:all .2s;width:100%;
  }
  button:hover{
    background:linear-gradient(135deg,rgba(0,212,255,.25),rgba(123,47,255,.25));
    box-shadow:0 0 24px rgba(0,212,255,.2);transform:translateY(-1px);
  }
  .err{font-size:.82rem;color:#ff2d78;text-align:center;}
  .brand{font-size:.72rem;color:#64748b;margin-top:4px;letter-spacing:.06em;}
  .brand a{color:#00d4ff;text-decoration:none;}
</style>
`

function passwordPage(shareId: string, error?: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Protected File — R2 File Vault</title>
  ${BASE_STYLE}
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    </div>
    <h1>Password Protected</h1>
    <p>Enter the password to access this file</p>
    <form class="form" method="POST" action="/s/${shareId}">
      <label for="pw">Password</label>
      <input id="pw" type="password" name="password" placeholder="Enter password" autofocus required />
      ${error ? `<p class="err">${error}</p>` : ''}
      <button type="submit">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Unlock File
      </button>
    </form>
    <p class="brand">Powered by <a href="/">R2 File Vault</a></p>
  </div>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function expiredPage(): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Link Expired — R2 File Vault</title>
  ${BASE_STYLE}
</head>
<body>
  <div class="card" style="border-color:rgba(255,45,120,.2)">
    <div class="icon" style="border-color:rgba(255,45,120,.3);background:rgba(255,45,120,.06)">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff2d78" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    </div>
    <h1 style="background:linear-gradient(135deg,#ff2d78,#7b2fff)">Link Expired</h1>
    <p>This share link has expired and is no longer valid.</p>
    <p class="brand">Powered by <a href="/">R2 File Vault</a></p>
  </div>
</body>
</html>`

  return new Response(html, {
    status: 410,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url)
    const origin = url.origin
    const shareId = url.pathname.slice('/s/'.length)

    if (!shareId) return new Response('Not found', { status: 404 })

    const metaObj = await env.BUCKET.get(`shares/${shareId}.json`)
    if (!metaObj) {
      return new Response('Share link not found', { status: 404 })
    }

    const meta: ShareMeta = await metaObj.json()

    // Check expiry
    if (meta.expiresAt && new Date(meta.expiresAt) < new Date()) {
      return expiredPage()
    }

    // No password — redirect directly to file (must be absolute URL in Workers)
    if (!meta.passwordHash) {
      return Response.redirect(`${origin}/files/${meta.key}`, 302)
    }

    // POST — verify password
    if (request.method === 'POST') {
      const form = await request.formData()
      const pw = (form.get('password') as string) || ''
      const hash = await sha256hex(pw)
      if (hash === meta.passwordHash) {
        return Response.redirect(`${origin}/files/${meta.key}`, 302)
      }
      return passwordPage(shareId, 'Incorrect password. Try again.')
    }

    // GET — show password form
    return passwordPage(shareId)
  } catch (err) {
    console.error('Share handler error:', err)
    return new Response('An error occurred', { status: 500 })
  }
}
