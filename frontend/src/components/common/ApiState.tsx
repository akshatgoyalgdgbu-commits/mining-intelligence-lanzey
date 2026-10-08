/**
 * ApiState — renders Loading / Error / Empty states consistently.
 * 56.28 — every important feature must have these states.
 */

import { Loader2, AlertCircle, Database, RefreshCw } from 'lucide-react'

interface ApiStateProps {
  loading?:  boolean
  error?:    string | null
  empty?:    boolean
  emptyMsg?: string
  onRetry?:  () => void
  children:  React.ReactNode
}

export function ApiState({ loading, error, empty, emptyMsg, onRetry, children }: ApiStateProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="text-coal-green animate-spin" />
          <span className="text-coal-muted text-sm">Loading data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertCircle size={20} className="text-red-400" />
        </div>
        <p className="text-red-400 text-sm font-medium">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 text-xs text-coal-muted hover:text-white transition-colors"
          >
            <RefreshCw size={12} /> Retry
          </button>
        )}
      </div>
    )
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-full bg-coal-surface border border-coal-border flex items-center justify-center">
          <Database size={20} className="text-coal-muted" />
        </div>
        <p className="text-coal-muted text-sm">{emptyMsg || 'No data available.'}</p>
      </div>
    )
  }

  return <>{children}</>
}
