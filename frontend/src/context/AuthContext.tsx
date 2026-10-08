/**
 * AuthContext — provides authentication state and actions to the whole app.
 * Reads JWT + user from localStorage on startup.
 * Exposes: user, token, loading, login, logout, isAuthenticated
 */

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react'
import { authApi, getToken, setToken, clearToken, type LanzeyUser } from '@/services/api'

interface AuthState {
  user:            LanzeyUser | null
  token:           string | null
  loading:         boolean
  isAuthenticated: boolean
  login:           (email: string, password: string) => Promise<LanzeyUser>
  logout:          () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<LanzeyUser | null>(null)
  const [token,   setTokenState] = useState<string | null>(getToken)
  const [loading, setLoading] = useState(true)

  // On mount: verify existing token
  useEffect(() => {
    const stored = getToken()
    if (!stored) { setLoading(false); return }

    authApi.me()
      .then(({ user }) => {
        setUser(user)
        setTokenState(stored)
        localStorage.setItem('lanzey_user', JSON.stringify(user))
      })
      .catch(() => {
        clearToken()
        setUser(null)
        setTokenState(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<LanzeyUser> => {
    const { token: t, user: u } = await authApi.login(email, password)
    setToken(t)
    setTokenState(t)
    setUser(u)
    localStorage.setItem('lanzey_user', JSON.stringify(u))
    return u
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    clearToken()
    setUser(null)
    setTokenState(null)
    window.location.href = '/'
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!user && !!token,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
