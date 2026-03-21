import { useRef, useState, useCallback } from 'react'
import { UploadCloud, CheckCircle, XCircle } from 'lucide-react'

export interface UploadProgress {
  id: string
  name: string
  progress: number
  status: 'uploading' | 'success' | 'error'
}

interface Props {
  onUpload: (files: FileList) => void
  uploads: UploadProgress[]
}

export default function DropZone({ onUpload, uploads }: Props) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) onUpload(e.dataTransfer.files)
  }, [onUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragging(false), [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onUpload(e.target.files)
      e.target.value = ''
    }
  }, [onUpload])

  return (
    <div className={`dropzone-wrapper ${dragging ? 'active' : ''}`}>
      <div className="dropzone-border" />
      {/* Hidden input — triggered programmatically only, never directly clicked */}
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <div
        className={`dropzone ${dragging ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      >
        <UploadCloud className="dropzone-icon" />
        <p className="dropzone-title">
          {dragging ? 'Release to upload' : 'Drop files anywhere'}
        </p>
        <p className="dropzone-sub">
          or <span>click to browse</span> · any file type supported
        </p>
        <div className="dropzone-hint">
          {['Images', 'Videos', 'Docs', 'Archives', 'Any file'].map(t => (
            <span key={t} className="dropzone-hint-badge">{t}</span>
          ))}
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="uploads-list">
          {uploads.map(u => (
            <div key={u.id} className={`upload-item ${u.status}`}>
              <div className="upload-item-header">
                <span className="upload-item-name">{u.name}</span>
                {u.status === 'success' && <CheckCircle size={15} color="var(--green)" />}
                {u.status === 'error'   && <XCircle size={15} color="var(--pink)" />}
                {u.status === 'uploading' && (
                  <span className="upload-item-pct">{u.progress}%</span>
                )}
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${u.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
