import { CheckCircle, AlertCircle, Info } from 'lucide-react'

export interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
}

export default function Toast({ toast }: { toast: ToastState }) {
  const Icon = toast.type === 'success' ? CheckCircle : toast.type === 'error' ? AlertCircle : Info
  return (
    <div className={`toast ${toast.type}`}>
      <Icon size={16} />
      {toast.message}
    </div>
  )
}
