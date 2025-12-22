/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { account, type AppwriteUser } from '../lib/appwrite'

type AuthContextValue = {
  user: AppwriteUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppwriteUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const u = await account.get()
        if (!cancelled) setUser(u)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    await account.createEmailPasswordSession(email, password)
    const u = await account.get()
    setUser(u)
  }, [])

  const signOut = useCallback(async () => {
    await account.deleteSession('current')
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({ user, loading, signIn, signOut }), [user, loading, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
