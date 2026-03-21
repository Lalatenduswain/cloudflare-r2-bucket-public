import { LogOut } from 'lucide-react'

interface Props {
  onLogout: () => void
}

export default function Header({ onLogout }: Props) {
  return (
    <header className="header">
      <div className="logo">
        <div className="logo-icon">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="22,4 38,13 38,31 22,40 6,31 6,13" stroke="#00d4ff" strokeWidth="1.5" fill="rgba(0,212,255,0.06)" />
            <polygon points="22,10 32,16 32,28 22,34 12,28 12,16" stroke="#7b2fff" strokeWidth="1" fill="rgba(123,47,255,0.06)" />
            <circle cx="22" cy="22" r="4" fill="#00d4ff" />
            <circle cx="22" cy="22" r="4" fill="#00d4ff" style={{ filter: 'blur(4px)', opacity: 0.6 }} />
          </svg>
        </div>
        <div className="logo-text">
          <h1>R2 File Vault</h1>
          <p>Cloudflare R2 · Edge File Storage</p>
        </div>
      </div>
      <div className="header-right">
        <div className="header-badge">
          <span className="header-badge-dot" />
          Live on Edge
        </div>
        <button className="btn-logout" onClick={onLogout} title="Lock vault">
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </header>
  )
}
