import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ld-accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--ld-bg))] disabled:opacity-60 disabled:cursor-not-allowed'
  const sizes = size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4 text-sm'
  const variants =
    variant === 'primary'
      ? 'text-slate-950 bg-gradient-to-br from-[rgb(var(--ld-green-2))] to-[rgb(var(--ld-green))] shadow-[var(--ld-shadow-soft)] hover:brightness-[1.02]'
      : variant === 'secondary'
        ? 'bg-[rgb(var(--ld-panel))] text-[rgb(var(--ld-text))] border border-[rgb(var(--ld-border))] hover:shadow-[var(--ld-shadow-soft)]'
        : 'bg-transparent text-[rgb(var(--ld-text))] hover:bg-black/5'

  return <button className={clsx(base, sizes, variants, className)} {...props} />
}

