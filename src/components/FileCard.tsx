import { useState } from 'react'
import { Copy, Trash2, Download, Check, FileText, Film, Music, Archive, File, Image, Share2 } from 'lucide-react'
import ShareModal from './ShareModal'

export interface FileItem {
  key: string
  size: number
  uploaded: string
  url: string
  contentType?: string
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function getTypeInfo(contentType?: string): { label: string; cls: string; Icon: React.FC<{ size?: number }> } {
  const ct = contentType || ''
  if (ct.startsWith('image/'))  return { label: 'Image',   cls: 'type-image',  Icon: Image }
  if (ct.startsWith('video/'))  return { label: 'Video',   cls: 'type-video',  Icon: Film }
  if (ct.startsWith('audio/'))  return { label: 'Audio',   cls: 'type-audio',  Icon: Music }
  if (ct.includes('pdf') || ct.includes('document') || ct.includes('text'))
                                return { label: 'Doc',     cls: 'type-doc',    Icon: FileText }
  if (ct.includes('zip') || ct.includes('tar') || ct.includes('gz') || ct.includes('rar'))
                                return { label: 'Archive', cls: 'type-zip',    Icon: Archive }
  return                               { label: 'File',    cls: 'type-other',  Icon: File }
}

interface Props {
  file: FileItem
  onDelete: (key: string) => void
}

export default function FileCard({ file, onDelete }: Props) {
  const [copied, setCopied]           = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showShare, setShowShare]     = useState(false)

  const { label, cls, Icon } = getTypeInfo(file.contentType)
  const isImage = file.contentType?.startsWith('image/')
  const publicUrl = `${window.location.origin}${file.url}`

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(file.key)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  const displayName = file.key.replace(/^\d+-/, '')

  return (
    <div className="file-card">
      {isImage ? (
        <img
          className="file-preview"
          src={file.url}
          alt={displayName}
          loading="lazy"
        />
      ) : (
        <div className="file-icon-box">
          <Icon size={40} color={cls.includes('image') ? 'var(--cyan)' : cls.includes('video') ? 'var(--purple)' : cls.includes('audio') ? 'var(--pink)' : cls.includes('doc') ? 'var(--green)' : cls.includes('zip') ? '#ffa500' : 'var(--text-dim)'} />
        </div>
      )}

      <div className="file-card-body">
        <p className="file-name" title={displayName}>{displayName}</p>
        <div className="file-meta">
          <span className={`file-type-badge ${cls}`}>{label}</span>
          <span className="file-meta-sep">·</span>
          <span>{formatSize(file.size)}</span>
          <span className="file-meta-sep">·</span>
          <span>{timeAgo(file.uploaded)}</span>
        </div>
        <div className="file-card-actions">
          <button className="btn btn-copy" onClick={handleCopy}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
          <button className="btn btn-share" onClick={() => setShowShare(true)} title="Create share link">
            <Share2 size={13} />
          </button>
          <a className="btn btn-download" href={file.url} download target="_blank" rel="noreferrer">
            <Download size={13} />
          </a>
          <button className="btn btn-delete" onClick={handleDelete} title={confirmDelete ? 'Click again to confirm' : 'Delete'}>
            <Trash2 size={13} />
            {confirmDelete && <span style={{ fontSize: '0.68rem' }}>Sure?</span>}
          </button>
        </div>
      </div>
      {showShare && <ShareModal file={file} onClose={() => setShowShare(false)} />}
    </div>
  )
}
