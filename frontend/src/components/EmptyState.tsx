import { AlertCircle } from 'lucide-react'

interface Props {
  title: string
  message: string
  onAction?: () => void
  actionLabel?: string
}

export function EmptyState({ title, message, onAction, actionLabel }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-xl border border-slate-200">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-4">{message}</p>
      {onAction && actionLabel && (
        <button onClick={onAction} className="btn-primary text-xs">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
