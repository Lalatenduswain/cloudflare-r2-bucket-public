import { useState, useEffect, useCallback } from 'react'
import Background from './components/Background'
import Header from './components/Header'
import DropZone, { UploadProgress } from './components/DropZone'
import FileCard, { FileItem } from './components/FileCard'
import Toast, { ToastState } from './components/Toast'
import AuthGate from './components/AuthGate'

const SESSION_KEY = 'r2vault_unlocked'

export default function App() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [files, setFiles] = useState<FileItem[]>([])
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [toast, setToast] = useState<ToastState | null>(null)
  const [loading, setLoading] = useState(true)

  const handleUnlock = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, '1')
    setUnlocked(true)
  }, [])

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setUnlocked(false)
  }, [])

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files')
      const data = await res.json() as { files: FileItem[] }
      setFiles(data.files || [])
    } catch {
      showToast('Failed to load files', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const handleUpload = useCallback(async (fileList: FileList) => {
    for (const file of Array.from(fileList)) {
      const id = crypto.randomUUID()
      setUploads(prev => [...prev, { id, name: file.name, progress: 0, status: 'uploading' }])

      const formData = new FormData()
      formData.append('file', file)

      await new Promise<void>(resolve => {
        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100)
            setUploads(prev => prev.map(u => u.id === id ? { ...u, progress: pct } : u))
          }
        }

        xhr.onload = () => {
          if (xhr.status === 200) {
            setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'success', progress: 100 } : u))
            showToast(`${file.name} uploaded`, 'success')
            fetchFiles()
          } else {
            setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error' } : u))
            showToast(`Failed to upload ${file.name}`, 'error')
          }
          setTimeout(() => setUploads(prev => prev.filter(u => u.id !== id)), 3000)
          resolve()
        }

        xhr.onerror = () => {
          setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error' } : u))
          showToast(`Upload error: ${file.name}`, 'error')
          setTimeout(() => setUploads(prev => prev.filter(u => u.id !== id)), 3000)
          resolve()
        }

        xhr.open('POST', '/api/upload')
        xhr.send(formData)
      })
    }
  }, [fetchFiles, showToast])

  const handleDelete = useCallback(async (key: string) => {
    try {
      const res = await fetch(`/api/delete/${encodeURIComponent(key)}`, { method: 'DELETE' })
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.key !== key))
        showToast('File deleted', 'info')
      } else {
        showToast('Delete failed', 'error')
      }
    } catch {
      showToast('Delete failed', 'error')
    }
  }, [showToast])

  return (
    <div className="app">
      <Background />
      {!unlocked && <AuthGate onUnlock={handleUnlock} />}
      <div className="content">
        <Header onLogout={handleLogout} />
        <main>
          <DropZone onUpload={handleUpload} uploads={uploads} />

          {files.length > 0 && (
            <section>
              <h2 className="section-title">
                <span className="section-count">{files.length}</span>
                Stored Objects
              </h2>
              <div className="files-grid">
                {files.map((file, i) => (
                  <div key={file.key} style={{ animationDelay: `${i * 0.05}s` }}>
                    <FileCard file={file} onDelete={handleDelete} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {!loading && files.length === 0 && uploads.length === 0 && (
            <div className="empty-state">
              <p>No files yet — drop something above to get started.</p>
            </div>
          )}
        </main>
      </div>
      {toast && <Toast toast={toast} />}
    </div>
  )
}
