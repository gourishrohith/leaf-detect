import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Moon, Sun, LogOut, User, ScanSearch, Info, Home, LogIn } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { applyTheme, getInitialTheme, type Theme } from '../theme/theme'
import { Logo } from '../components/Logo'
import { Button } from '../components/Button'
import { useAuth } from '../state/auth'

function NavItem({
  to,
  label,
  icon,
}: {
  to: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm',
          'border border-transparent hover:border-[rgb(var(--ld-border))] hover:bg-[rgb(var(--ld-panel))]',
          isActive ? 'bg-[rgb(var(--ld-panel))] border-[rgb(var(--ld-border))]' : '',
        ].join(' ')
      }
    >
      <span className="opacity-70 group-hover:opacity-100">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  )
}

function MobileNavItem({
  to,
  label,
  icon,
}: {
  to: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'inline-flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px]',
          isActive ? 'bg-[rgb(var(--ld-panel))] text-[rgb(var(--ld-text))]' : 'text-[rgb(var(--ld-muted))]',
        ].join(' ')
      }
    >
      <span>{icon}</span>
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

export function AppLayout() {
  const navigate = useNavigate()
  const { user, clearSession } = useAuth()
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const t = getInitialTheme()
    setTheme(t)
    applyTheme(t)
  }, [])

  const themeIcon = useMemo(() => {
    return theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
  }, [theme])

  return (
    <div className="ld-bg min-h-dvh">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22),transparent_65%)] blur-2xl" />
        <div className="absolute -top-10 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.18),transparent_60%)] blur-2xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <button onClick={() => navigate('/')} className="text-left">
            <Logo className="[&>div:last-child>div:last-child]:hidden sm:[&>div:last-child>div:last-child]:block" />
          </button>

          <nav className="hidden md:flex items-center gap-1">
            <NavItem to="/" label="Home" icon={<Home className="h-4 w-4" />} />
            <NavItem to="/about" label="About" icon={<Info className="h-4 w-4" />} />
            <NavItem to="/scan" label="Scan" icon={<ScanSearch className="h-4 w-4" />} />
            <NavItem to="/profile" label="Profile" icon={<User className="h-4 w-4" />} />
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const next: Theme = theme === 'dark' ? 'light' : 'dark'
                setTheme(next)
                applyTheme(next)
              }}
              aria-label="Toggle dark mode"
            >
              {themeIcon}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </Button>

            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearSession()
                  navigate('/')
                }}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
                <LogIn className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Sign in</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="relative pb-20 md:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="mx-auto max-w-6xl px-4 py-8"
        >
          <Outlet />
        </motion.div>
      </main>

      <footer className="relative border-t border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-[rgb(var(--ld-muted))] sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} LeafDetect</div>
          <div>Built for fast, practical leaf health guidance.</div>
        </div>
      </footer>

      <nav className="fixed bottom-3 left-1/2 z-30 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 rounded-2xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-bg))]/90 p-1 shadow-[var(--ld-shadow-soft)] backdrop-blur md:hidden">
        <div className="flex items-center gap-1">
          <MobileNavItem to="/" label="Home" icon={<Home className="h-4 w-4" />} />
          <MobileNavItem to="/about" label="About" icon={<Info className="h-4 w-4" />} />
          <MobileNavItem to="/scan" label="Scan" icon={<ScanSearch className="h-4 w-4" />} />
          <MobileNavItem to="/profile" label="Profile" icon={<User className="h-4 w-4" />} />
        </div>
      </nav>
    </div>
  )
}

