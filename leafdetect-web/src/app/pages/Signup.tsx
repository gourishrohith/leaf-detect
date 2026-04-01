import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { apiSignup } from '../api/client'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Select } from '../components/Select'
import { Logo } from '../components/Logo'
import { useAuth, type AuthUser, type UserPurpose } from '../state/auth'

const PURPOSES: Array<{ value: UserPurpose; label: string }> = [
  { value: 'farmer', label: 'Farmer' },
  { value: 'home_crop_grower', label: 'Home crop grower' },
  { value: 'gardener', label: 'Gardener' },
  { value: 'student', label: 'Student' },
  { value: 'researcher', label: 'Researcher' },
  { value: 'other', label: 'Other' },
]

export function Signup() {
  const nav = useNavigate()
  const { setSession } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [purpose, setPurpose] = useState<UserPurpose>('home_crop_grower')
  const [wantsChemicals, setWantsChemicals] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await apiSignup({ name, email, password, purpose, wantsChemicals })
      setSession(data.token, data.user)
      nav('/scan')
    } catch (err) {
      // Dev-friendly fallback: allow UI to be explored without backend
      const msg = err instanceof Error ? err.message : 'Signup failed'
      if (msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('fetch')) {
        const demoUser: AuthUser = {
          id: crypto.randomUUID(),
          name: name || 'Demo User',
          email,
          purpose,
          wantsChemicals,
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
          <div className="text-sm text-[rgb(var(--ld-muted))]">Create account</div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
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
            placeholder="Create a password"
            required
          />

          <Select
            label="Purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as UserPurpose)}
            hint="This helps LeafDetect tailor remedies and language."
          >
            {PURPOSES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>

          <label className="ld-pop-card flex items-start gap-3 rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-4">
            <input
              type="checkbox"
              checked={wantsChemicals}
              onChange={(e) => setWantsChemicals(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[rgb(var(--ld-green))]"
            />
            <div>
              <div className="text-sm font-semibold">Allow chemical / high-end remedies</div>
              <div className="mt-1 text-xs text-[rgb(var(--ld-muted))]">
                Recommended for farmers. Home remedies are still included when possible.
              </div>
            </div>
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button className="w-full" disabled={loading} type="submit">
            {loading ? 'Creating…' : 'Create account'}
          </Button>

          <div className="text-center text-sm text-[rgb(var(--ld-muted))]">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[rgb(var(--ld-text))] hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

