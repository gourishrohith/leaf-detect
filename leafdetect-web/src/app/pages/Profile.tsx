import { motion } from 'framer-motion'
import { Mail, User as UserIcon } from 'lucide-react'
import { Select } from '../components/Select'
import { useAuth, type UserPurpose } from '../state/auth'

const PURPOSES: Array<{ value: UserPurpose; label: string }> = [
  { value: 'farmer', label: 'Farmer' },
  { value: 'home_crop_grower', label: 'Home crop grower' },
  { value: 'gardener', label: 'Gardener' },
  { value: 'student', label: 'Student' },
  { value: 'researcher', label: 'Researcher' },
  { value: 'other', label: 'Other' },
]

export function Profile() {
  const { user, updateUser } = useAuth()
  if (!user) return null

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="ld-accent-panel ld-pop-card rounded-3xl bg-[rgb(var(--ld-panel))] p-6 shadow-[var(--ld-shadow)] sm:p-8"
      >
        <div className="text-xl font-semibold tracking-tight">Profile</div>
        <div className="mt-1 text-sm text-[rgb(var(--ld-muted))]">
          Your details personalize language and remedies across the app.
        </div>

        <div className="mt-6 grid gap-4">
          <div className="ld-pop-card rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <UserIcon className="h-4 w-4 opacity-80" /> Name
            </div>
            <div className="mt-1 text-sm">{user.name}</div>
          </div>

          <div className="ld-pop-card rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Mail className="h-4 w-4 opacity-80" /> Email
            </div>
            <div className="mt-1 text-sm">{user.email}</div>
          </div>

          <Select
            label="Purpose"
            value={user.purpose}
            onChange={(e) => updateUser({ purpose: e.target.value as UserPurpose })}
            hint="This influences how results and remedies are presented."
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
              checked={user.wantsChemicals}
              onChange={(e) => updateUser({ wantsChemicals: e.target.checked })}
              className="mt-1 h-4 w-4 accent-[rgb(var(--ld-green))]"
            />
            <div>
              <div className="text-sm font-semibold">Allow chemical / high-end remedies</div>
              <div className="mt-1 text-xs text-[rgb(var(--ld-muted))]">
                Turn this on if you want farmer-grade options alongside safer home remedies.
              </div>
            </div>
          </label>
        </div>
      </motion.section>

      <section className="ld-pop-card rounded-3xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-panel))] p-6 shadow-[var(--ld-shadow-soft)] sm:p-8">
        <div className="text-xl font-semibold tracking-tight">How your profile is used</div>
        <ul className="mt-4 space-y-3 text-sm text-[rgb(var(--ld-muted))]">
          <li className="ld-pop-card rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-4">
            <div className="font-semibold text-[rgb(var(--ld-text))]">Remedies</div>
            <div className="mt-1">
              Home remedies are prioritized for non-farm use; chemical recommendations appear if you enable them.
            </div>
          </li>
          <li className="ld-pop-card rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-4">
            <div className="font-semibold text-[rgb(var(--ld-text))]">Prevention</div>
            <div className="mt-1">
              Prevention tips adapt to your use-case (small garden vs field-scale handling).
            </div>
          </li>
          <li className="ld-pop-card rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-4">
            <div className="font-semibold text-[rgb(var(--ld-text))]">Language</div>
            <div className="mt-1">
              Results stay simple and readable, with extra detail for farmers/researchers when useful.
            </div>
          </li>
        </ul>
      </section>
    </div>
  )
}

