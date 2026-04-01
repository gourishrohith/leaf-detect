import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Camera, Shield, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { useAuth } from '../state/auth'

const Section = ({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) => (
  <section className="ld-pop-card rounded-3xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-panel))] p-6 shadow-[var(--ld-shadow-soft)] sm:p-8">
    <div className="mb-5">
      <div className="text-xl font-semibold tracking-tight">{title}</div>
      {subtitle ? <div className="mt-1 text-sm text-[rgb(var(--ld-muted))]">{subtitle}</div> : null}
    </div>
    {children}
  </section>
)

export function Dashboard({ initialSection }: { initialSection?: 'about' } = {}) {
  const nav = useNavigate()
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="ld-accent-panel ld-pop-card relative overflow-hidden rounded-3xl bg-[rgb(var(--ld-panel))] p-6 shadow-[var(--ld-shadow)] sm:p-10"
        >
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.28),transparent_65%)] blur-2xl" />
          <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22),transparent_65%)] blur-2xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/60 px-3 py-1 text-xs text-[rgb(var(--ld-muted))]">
              <Sparkles className="h-4 w-4" />
              AI-assisted leaf health, tailored to you
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Catch plant issues early — with clear, actionable guidance.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgb(var(--ld-muted))] sm:text-base">
              Upload or scan a leaf photo. LeafDetect highlights likely causes, suggests cures (home remedies
              or farmer-grade options), and shares prevention tips to keep your crops healthy.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button className="w-full sm:w-auto" onClick={() => nav(user ? '/scan' : '/signup')}>
                {user ? 'Scan a leaf' : 'Create an account'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button className="w-full sm:w-auto" variant="secondary" onClick={() => nav('/profile')}>
                {user ? 'View profile' : 'See profile setup'}
              </Button>
              <Link to="/about" className="text-sm font-medium text-[rgb(var(--ld-muted))] hover:underline">
                Learn how it works
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="ld-pop-card rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Camera className="h-4 w-4 opacity-80" /> Upload or scan
                </div>
                <div className="mt-1 text-xs text-[rgb(var(--ld-muted))]">
                  Drag & drop or take a quick photo.
                </div>
              </div>
              <div className="ld-pop-card rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BadgeCheck className="h-4 w-4 opacity-80" /> Practical answers
                </div>
                <div className="mt-1 text-xs text-[rgb(var(--ld-muted))]">
                  Clear causes, cures, and prevention.
                </div>
              </div>
              <div className="ld-pop-card rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="h-4 w-4 opacity-80" /> Built for safety
                </div>
                <div className="mt-1 text-xs text-[rgb(var(--ld-muted))]">
                  Suggests safer options first.
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <Section
          title={user ? `Welcome, ${user.name}` : 'Your dashboard'}
          subtitle="Quick access to scanning and profile preferences."
        >
          <div className="space-y-4">
            <div className="ld-pop-card rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-4">
              <div className="text-sm font-semibold">Profile</div>
              <div className="mt-1 text-xs text-[rgb(var(--ld-muted))]">
                Set your purpose (farmer, home grower, etc.) to personalize remedies.
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => nav('/profile')}>
                  Open profile
                </Button>
                {!user ? (
                  <Button size="sm" onClick={() => nav('/login')}>
                    Sign in
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="ld-pop-card rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-4">
              <div className="text-sm font-semibold">Scan a leaf</div>
              <div className="mt-1 text-xs text-[rgb(var(--ld-muted))]">
                Upload a clear leaf photo with good lighting.
              </div>
              <div className="mt-3">
                <Button size="sm" onClick={() => nav('/scan')} disabled={!user} title={!user ? 'Sign in to scan' : ''}>
                  Start scan
                </Button>
              </div>
            </div>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Features" subtitle="Simple, fast, and designed for real-life use.">
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              ['Clean results', 'Understand the issue in seconds, not minutes.'],
              ['Two remedy modes', 'Home remedies for everyone; chemical options for farmers.'],
              ['Prevention tips', 'Avoid repeat infections with best practices.'],
              ['Privacy-first', 'Your profile stays on your device in this demo build.'],
            ].map(([t, d]) => (
              <li key={t} className="ld-pop-card rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/40 p-4">
                <div className="text-sm font-semibold">{t}</div>
                <div className="mt-1 text-xs text-[rgb(var(--ld-muted))]">{d}</div>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="About LeafDetect"
          subtitle="A gentle, professional workflow for diagnosing plant leaf issues."
        >
          <div className="text-sm leading-6 text-[rgb(var(--ld-muted))]">
            LeafDetect uses a lightweight AI/ML analysis step to suggest a likely issue based on your leaf image,
            then generates treatment and prevention guidance. It adapts recommendations to your profile purpose.
          </div>
          {initialSection === 'about' ? null : (
            <div className="mt-4">
              <Button variant="secondary" size="sm" onClick={() => nav('/about')}>
                Read more
              </Button>
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

