import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { apiLogin } from '../api/client'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Logo } from '../components/Logo'
import { useAuth, type AuthUser } from '../state/auth'

export function Login() {
  const nav = useNavigate()
  const loc = useLocation() as { state?: { from?: string } }
  const { setSession } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await apiLogin({ email, password })
      setSession(data.token, data.user)
      nav(loc.state?.from ?? '/scan')
    } catch (err) {
      // Dev-friendly fallback: allow UI to be explored without backend
      const msg = err instanceof Error ? err.message : 'Login failed'
      if (msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('fetch')) {
        const demoUser: AuthUser = {
          id: crypto.randomUUID(),
          name: email.split('@')[0] || 'Demo User',
          email,
          purpose: 'home_crop_grower',
          wantsChemicals: false,
        }
        setSession('demo-token', demoUser)
        nav('/scan')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="ld-accent-panel ld-pop-card rounded-3xl bg-[rgb(var(--ld-panel))] p-6 shadow-[var(--ld-shadow)] sm:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <div className="text-sm text-[rgb(var(--ld-muted))]">Sign in</div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button className="w-full" disabled={loading} type="submit">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>

          <div className="text-center text-sm text-[rgb(var(--ld-muted))]">
            Don’t have an account?{' '}
            <Link to="/signup" className="font-medium text-[rgb(var(--ld-text))] hover:underline">
              Create one
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

