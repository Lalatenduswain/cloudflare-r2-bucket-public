import { useState } from 'react'
import { ShieldCheck, Lock } from 'lucide-react'

// Customise these labels to match your AUTH_ANSWER_1 / AUTH_ANSWER_2 env vars.
// The actual answers are never stored in this file — they live in Cloudflare
// Pages → Settings → Environment variables.
const QUESTION_1 = 'Enter access code 1'
const QUESTION_2 = 'Enter access code 2'

interface Props {
  onUnlock: () => void
}

export default function AuthGate({ onUnlock }: Props) {
  const [answer1, setAnswer1] = useState('')
  const [answer2, setAnswer2] = useState('')
  const [error, setError]     = useState('')
  const [shaking, setShaking] = useState(false)
  const [loading, setLoading] = useState(false)

  const verify = async () => {
    if (!answer1.trim() || !answer2.trim()) {
      setError('Please fill in both fields.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer1, answer2 }),
      })
      const { ok } = await res.json() as { ok: boolean }

      if (ok) {
        onUnlock()
      } else {
        setError('Incorrect answers. Try again.')
        setShaking(true)
        setTimeout(() => setShaking(false), 600)
      }
    } catch {
      setError('Verification failed. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') verify()
  }

  return (
    <div className="auth-overlay">
      <div className={`auth-card ${shaking ? 'shake' : ''}`}>
        <div className="auth-icon">
          <Lock size={32} color="var(--cyan)" style={{ filter: 'drop-shadow(0 0 12px var(--cyan))' }} />
        </div>
        <h2 className="auth-title">Identity Verification</h2>
        <p className="auth-sub">Answer correctly to unlock access</p>

        <div className="auth-fields">
          <div className="auth-field">
            <label>{QUESTION_1}</label>
            <input
              type="password"
              placeholder="Answer 1"
              value={answer1}
              onChange={e => { setAnswer1(e.target.value); setError('') }}
              onKeyDown={handleKey}
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label>{QUESTION_2}</label>
            <input
              type="password"
              placeholder="Answer 2"
              value={answer2}
              onChange={e => { setAnswer2(e.target.value); setError('') }}
              onKeyDown={handleKey}
            />
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-btn" onClick={verify} disabled={loading}>
          <ShieldCheck size={16} />
          {loading ? 'Verifying…' : 'Verify & Unlock'}
        </button>
      </div>
    </div>
  )
}
