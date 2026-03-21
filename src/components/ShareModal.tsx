import { useState } from 'react'
import { Share2, X, Copy, Check, Clock, Lock } from 'lucide-react'
import type { FileItem } from './FileCard'

interface Props {
  file: FileItem
  onClose: () => void
}

const EXPIRY_OPTIONS = [
  { label: '1 hour',   value: 3600 },
  { label: '24 hours', value: 86400 },
  { label: '7 days',   value: 604800 },
  { label: '30 days',  value: 2592000 },
  { label: 'Never',    value: 0 },
]

export default function ShareModal({ file, onClose }: Props) {
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword]       = useState('')
  const [expiresIn, setExpiresIn]     = useState(86400)
  const [creating, setCreating]       = useState(false)
  const [shareUrl, setShareUrl]       = useState<string | null>(null)
  const [copied, setCopied]           = useState(false)
  const [error, setError]             = useState('')

  const handleCreate = async () => {
    if (usePassword && !password.trim()) {
      setError('Enter a password or disable password protection')
      return
    }
    setError('')
    setCreating(true)
    try {
      const body: Record<string, string | number> = { key: file.key }
      if (usePassword && password) body.password = password
      if (expiresIn > 0) body.expiresIn = expiresIn

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { shareId?: string; error?: string }
      if (!data.shareId) throw new Error(data.error || 'Failed')
      setShareUrl(`${window.location.origin}/s/${data.shareId}`)
    } catch {
      setError('Failed to create share link')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const expiryLabel = EXPIRY_OPTIONS.find(o => o.value === expiresIn)?.label

  return (
    <div className="auth-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="auth-card share-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={15} />
        </button>

        <div className="auth-icon">
          <Share2 size={28} color="var(--cyan)" style={{ filter: 'drop-shadow(0 0 12px var(--cyan))' }} />
        </div>
        <h2 className="auth-title">Create Share Link</h2>
        <p className="auth-sub">{file.key.replace(/^\d+-/, '')}</p>

        {!shareUrl ? (
          <>
            <div className="auth-fields" style={{ width: '100%' }}>
              {/* Expiry */}
              <div className="auth-field">
                <label><Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />Link Expires</label>
                <select
                  className="share-select"
                  value={expiresIn}
                  onChange={e => setExpiresIn(Number(e.target.value))}
                >
                  {EXPIRY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Password toggle */}
              <div className="share-toggle-row">
                <span className="share-toggle-label">
                  <Lock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />
                  Password Protect
                </span>
                <button
                  className={`share-toggle ${usePassword ? 'on' : ''}`}
                  onClick={() => { setUsePassword(p => !p); setPassword(''); setError('') }}
                  type="button"
                  aria-pressed={usePassword}
                >
                  <span className="share-toggle-thumb" />
                </button>
              </div>

              {usePassword && (
                <div className="auth-field">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Set a password for this link"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="auth-btn" onClick={handleCreate} disabled={creating} style={{ opacity: creating ? 0.7 : 1 }}>
              {creating
                ? 'Creating…'
                : <><Share2 size={15} /> Generate Link</>
              }
            </button>
          </>
        ) : (
          <>
            <div className="share-result">
              <p className="share-result-label">Share URL ready</p>
              <div className="share-url-box">
                <span className="share-url-text">{shareUrl}</span>
                <button className="share-copy-btn" onClick={handleCopy} title={copied ? 'Copied!' : 'Copy URL'}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <div className="share-meta-badges">
                {usePassword && (
                  <span className="share-badge share-badge-lock">
                    <Lock size={10} /> Password protected
                  </span>
                )}
                {expiresIn > 0 && (
                  <span className="share-badge share-badge-clock">
                    <Clock size={10} /> Expires in {expiryLabel}
                  </span>
                )}
                {!usePassword && expiresIn === 0 && (
                  <span className="share-badge share-badge-open">
                    Public · Never expires
                  </span>
                )}
              </div>
            </div>
            <button className="auth-btn" onClick={onClose}>Done</button>
          </>
        )}
      </div>
    </div>
  )
}
