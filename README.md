# R2 File Vault

A self-hosted, full-stack personal file storage and sharing web app built entirely on the **Cloudflare edge stack** — zero hosting cost, global CDN, R2 object storage, serverless API.

![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-F38020?style=flat&logo=cloudflare&logoColor=white)
![React](https://img.shields.io/badge/React%2018-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat)

---

## Features

- Drag-and-drop file upload with real-time progress bars
- File browser with image previews, type badges, size, and upload time
- One-click public URL copy
- Two-click delete confirmation (prevents accidents)
- Server-side identity verification gate (answers stored in env vars, never in code)
- Logout button — re-locks the vault instantly
- Password-protected share links (SHA-256 hashed server-side)
- Auto-expiring share links — 1 hour / 24 hours / 7 days / 30 days / never
- File proxy with correct `Content-Type`, `Cache-Control: immutable`, and Range request support for video/audio streaming

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Hosting | Cloudflare Pages (free tier) |
| Backend API | Cloudflare Pages Functions |
| Storage | Cloudflare R2 (free tier: 10 GB/month) |

---

## Project Structure

```
cloudflare-r2-bucket-public/
├── functions/                        # Cloudflare Pages Functions (serverless API)
│   ├── api/
│   │   ├── auth.ts                   # POST /api/auth       — verify identity (reads env vars)
│   │   ├── upload.ts                 # POST /api/upload     — store file in R2
│   │   ├── files.ts                  # GET  /api/files      — list bucket objects
│   │   ├── share.ts                  # POST /api/share      — create share link metadata
│   │   └── delete/
│   │       └── [[key]].ts            # DELETE /api/delete/:key
│   ├── files/
│   │   └── [[key]].ts                # GET /files/:key      — proxy R2 to browser
│   └── s/
│       └── [[shareId]].ts            # GET/POST /s/:shareId — share link handler
├── src/
│   ├── App.tsx                       # Root component, state, upload logic
│   ├── index.css                     # Global styles (dark cyber theme)
│   ├── main.tsx                      # React entry point
│   └── components/
│       ├── AuthGate.tsx              # Identity verification overlay
│       ├── Background.tsx            # Animated CSS background
│       ├── DropZone.tsx              # Drag-and-drop + file input
│       ├── FileCard.tsx              # File card (preview, copy, share, delete)
│       ├── Header.tsx                # Logo + logout button
│       ├── ShareModal.tsx            # Share link creation modal
│       └── Toast.tsx                 # Slide-in notifications
├── public/
│   └── favicon.svg
├── index.html
├── wrangler.toml
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | v18 or higher | [nodejs.org](https://nodejs.org/) |
| npm | v9 or higher | Included with Node.js |
| Git | Any recent version | [git-scm.com](https://git-scm.com/) |
| Cloudflare account | Free tier is enough | [cloudflare.com](https://cloudflare.com/) |

---

## Step 1 — Install Wrangler CLI

Wrangler is Cloudflare's official CLI for managing Workers, Pages, and R2.

```bash
npm install -g wrangler
```

Verify the installation:

```bash
wrangler --version
# ⛅️ wrangler 4.x.x
```

To update Wrangler at any time:

```bash
npm update -g wrangler
```

---

## Step 2 — Authenticate Wrangler with Cloudflare

```bash
wrangler login
```

This opens a browser window. Log in to your Cloudflare account and click **Allow**. Wrangler stores the OAuth token locally — you only need to do this once per machine.

Verify authentication:

```bash
wrangler whoami
# ⛅️ Getting User settings...
# 👋 You are logged in with an OAuth Token, associated with the email: you@example.com
```

---

## Step 3 — Clone the Repository

```bash
git clone https://github.com/Lalatenduswain/cloudflare-r2-bucket-public.git
cd cloudflare-r2-bucket-public
npm install
```

---

## Step 4 — Create the R2 Bucket

R2 is Cloudflare's S3-compatible object storage. The free tier includes **10 GB storage** and **10 million read operations** per month.

**Enable R2 on your Cloudflare account (one-time):**

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com/)
2. Click **R2 Object Storage** in the left sidebar
3. Click **Enable R2** if prompted (a payment method is required for verification — you will not be charged within free tier limits)

**Create your bucket:**

```bash
wrangler r2 bucket create my-r2-vault
```

Replace `my-r2-vault` with your preferred bucket name (lowercase letters, numbers, and hyphens only).

Verify it was created:

```bash
wrangler r2 bucket list
```

---

## Step 5 — Configure wrangler.toml

Open `wrangler.toml` and replace `YOUR_BUCKET_NAME` with your bucket name:

```toml
name = "r2-file-vault"
compatibility_date = "2024-09-23"
pages_build_output_dir = "dist"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "my-r2-vault"   # <-- your bucket name here
```

> Do not change the `binding` value (`BUCKET`) — the Functions code references this name directly.

---

## Step 6 — Configure the Auth Gate

The identity verification gate validates answers against **Cloudflare Pages environment variables**. The correct answers are never stored in the codebase.

### 6a — Customise the question labels

Open `src/components/AuthGate.tsx` and update the question text to match your chosen answers:

```ts
// src/components/AuthGate.tsx  (lines 8-9)
const QUESTION_1 = 'What is your favourite colour?'    // <-- customise
const QUESTION_2 = 'What city were you born in?'       // <-- customise
```

### 6b — Set answers for local development

Create a `.dev.vars` file in the project root. This file is listed in `.gitignore` and will never be committed:

```ini
# .dev.vars — local only, never commit this file
AUTH_ANSWER_1=blue
AUTH_ANSWER_2=london
```

> `AUTH_ANSWER_1` is checked case-sensitively. `AUTH_ANSWER_2` is case-insensitive.

### 6c — Set answers for production

1. Deploy once first (Step 8) so the Pages project is created in Cloudflare
2. Go to **Cloudflare Dashboard → Pages → r2-file-vault → Settings → Environment variables**
3. Add the following variables under **Production**:

| Variable | Value |
|---|---|
| `AUTH_ANSWER_1` | your answer 1 |
| `AUTH_ANSWER_2` | your answer 2 |

4. Click **Save and deploy**

---

## Step 7 — Local Development

```bash
npm run dev
```

Wrangler emulates the full Cloudflare Pages environment locally — including the R2 binding and all Functions. The dev server starts at:

```
http://localhost:8788
```

> Files uploaded locally are stored in `.wrangler/state/` and are separate from your production R2 bucket. This is expected behaviour.

---

## Step 8 — Deploy to Cloudflare Pages

```bash
npm run deploy
```

This runs `vite build` to compile the React frontend, then `wrangler pages deploy` to upload the build output and Functions bundle to Cloudflare.

On the **first deploy**, Wrangler automatically creates the Pages project. The output shows your deployment URL:

```
✨ Deployment complete! Take a peek over at https://abc123.r2-file-vault.pages.dev
```

Every subsequent deploy updates the production deployment instantly across Cloudflare's global edge network.

---

## Step 9 — Add a Custom Domain (Optional)

1. Go to **Cloudflare Dashboard → Pages → r2-file-vault → Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain — e.g. `r2.yourdomain.com`
4. If your domain's DNS is managed by Cloudflare, the CNAME record is added automatically. Otherwise, add the CNAME manually at your DNS provider.

---

## Step 10 — Update index.html Meta Tags (Optional)

Replace the placeholder values in `index.html` for SEO and social sharing:

```html
<title>R2 File Vault — Secure Cloud File Storage</title>
<meta name="author" content="Your Name" />
<link rel="canonical" href="https://your-domain.com/" />
<meta property="og:url" content="https://your-domain.com/" />
<meta name="twitter:site" content="@yourhandle" />
<meta name="twitter:creator" content="@yourhandle" />
```

After editing, redeploy:

```bash
npm run deploy
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `AUTH_ANSWER_1` | Yes | Answer to security question 1 (case-sensitive) |
| `AUTH_ANSWER_2` | Yes | Answer to security question 2 (case-insensitive) |

Set via **Cloudflare Dashboard → Pages → Settings → Environment variables** for production, or `.dev.vars` for local development.

---

## Constraints & Limits

| Limit | Detail |
|---|---|
| Max upload size | 100 MB per file (Cloudflare Pages Functions hard limit) |
| R2 free tier | 10 GB storage · 10M Class B reads · 1M Class A writes per month |
| File listing | Up to 1 000 objects (R2 `list()` default — add pagination for large vaults) |
| Share link storage | Stored as R2 JSON objects — no external database required |

For files larger than 100 MB, implement presigned URLs so the browser uploads directly to R2, bypassing the Function size limit.

---

## Commands Reference

| Command | Description |
|---|---|
| `npm install` | Install project dependencies |
| `npm run dev` | Start local dev server (Wrangler + Vite HMR) |
| `npm run build` | Build frontend for production |
| `npm run deploy` | Build + deploy to Cloudflare Pages |
| `wrangler login` | Authenticate Wrangler with your Cloudflare account |
| `wrangler logout` | Log out of Cloudflare |
| `wrangler whoami` | Show authenticated account details |
| `wrangler r2 bucket create <name>` | Create a new R2 bucket |
| `wrangler r2 bucket list` | List all R2 buckets in your account |
| `wrangler r2 bucket delete <name>` | Delete an R2 bucket |
| `wrangler pages project list` | List all Cloudflare Pages projects |
| `npm update -g wrangler` | Update Wrangler to the latest version |

---

## Troubleshooting

**Auth returns 503 — "env vars not set"**
`AUTH_ANSWER_1` or `AUTH_ANSWER_2` is missing. Add them in `.dev.vars` (local) or Cloudflare Dashboard → Environment variables (production), then redeploy.

**Uploaded files don't appear after deploying**
Local dev uses a simulated R2 at `.wrangler/state/`. Only production deploys write to your real R2 bucket.

**`Must have admin rights` when deleting a repo**
Run `gh auth refresh -h github.com -s delete_repo` to grant the GitHub CLI the required scope.

**Wrangler warns about uncommitted changes**
This is informational only and does not affect the deployment. Suppress it with:
```bash
wrangler pages deploy dist --project-name=r2-file-vault --commit-dirty=true
```

**Error 1101 — Worker threw exception**
Usually a transient error during deployment propagation. Wait 30 seconds and refresh. If it persists, check **Cloudflare Dashboard → Pages → r2-file-vault → Deployments → View details → Logs**.

---

## License

MIT — fork it, self-host it, make it yours.
