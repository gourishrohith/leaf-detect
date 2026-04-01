import type { AuthUser } from '../state/auth'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export type AuthResponse = { token: string; user: AuthUser }

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed (${res.status})`)
  }
  return (await res.json()) as T
}

export async function apiSignup(input: {
  name: string
  email: string
  password: string
  purpose: AuthUser['purpose']
  wantsChemicals: boolean
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return json<AuthResponse>(res)
}

export async function apiLogin(input: { email: string; password: string }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return json<AuthResponse>(res)
}

export type AnalyzeResponse = {
  plantName: string
  plantConfidence?: number
  healthy: boolean
  likelyIssue: string
  confidence: number
  explanation: string
  remedies: { home: string[]; chemical: string[] }
  prevention: string[]
}

export async function apiAnalyze(input: {
  token: string
  image: File
  wantsChemicals: boolean
  purpose: AuthUser['purpose']
}): Promise<AnalyzeResponse> {
  const form = new FormData()
  form.append('image', input.image)
  form.append('wantsChemicals', String(input.wantsChemicals))
  form.append('purpose', input.purpose)

  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: form,
  })
  return json<AnalyzeResponse>(res)
}

