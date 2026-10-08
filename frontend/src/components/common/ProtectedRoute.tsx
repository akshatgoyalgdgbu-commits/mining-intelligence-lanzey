/**
 * ProtectedRoute — redirects unauthenticated users to /login.
 * Optionally restricts to specific roles.
 * Shows loading skeleton while auth state resolves.
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth }               from '@/context/AuthContext'
import type { Role }             from '@/services/api'

interface ProtectedRouteProps {
  children:    React.ReactNode
  roles?:      Role[]    // if provided, only these roles may access
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-coal-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-coal-green border-t-transparent rounded-full animate-spin" />
          <span className="text-coal-muted text-sm">Verifying session...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (roles && user && !roles.includes(user.role as Role)) {
    return (
      <div className="min-h-screen bg-coal-bg flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">⊗</span>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Access Denied</h2>
          <p className="text-coal-muted text-sm">
            Your role ({user.role}) does not have access to this section.
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 btn-ghost text-sm"
          >
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
