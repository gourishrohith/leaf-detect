import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type UserPurpose =
  | 'farmer'
  | 'home_crop_grower'
  | 'student'
  | 'researcher'
  | 'gardener'
  | 'other'

export type AuthUser = {
  id: string
  name: string
  email: string
  purpose: UserPurpose
  wantsChemicals: boolean
}

type AuthState = {
  token: string | null
  user: AuthUser | null
  setSession: (token: string, user: AuthUser) => void
  updateUser: (patch: Partial<AuthUser>) => void
  clearSession: () => void
}

const TOKEN_KEY = 'leafdetect:token'
const USER_KEY = 'leafdetect:user'

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUser = localStorage.getItem(USER_KEY)
    if (savedToken && savedUser) {
      setToken(savedToken)
      try {
        setUser(JSON.parse(savedUser) as AuthUser)
      } catch {
        localStorage.removeItem(USER_KEY)
      }
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      setSession: (t, u) => {
        setToken(t)
        setUser(u)
        localStorage.setItem(TOKEN_KEY, t)
        localStorage.setItem(USER_KEY, JSON.stringify(u))
      },
      updateUser: (patch) => {
        setUser((prev) => {
          if (!prev) return prev
          const next = { ...prev, ...patch }
          localStorage.setItem(USER_KEY, JSON.stringify(next))
          return next
        })
      },
      clearSession: () => {
        setToken(null)
        setUser(null)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      },
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

