import { clsx } from 'clsx'
import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
}

export function Input({ className, label, hint, error, ...props }: Props) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm font-medium">{label}</div> : null}
      <input
        className={clsx(
          'h-11 w-full rounded-xl border bg-[rgb(var(--ld-panel))] px-3 text-sm outline-none',
          'border-[rgb(var(--ld-border))] focus:border-[rgb(var(--ld-accent))] focus:ring-4 focus:ring-[rgba(16,185,129,0.15)]',
          error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : '',
          className,
        )}
        {...props}
      />
      {error ? (
        <div className="mt-1 text-xs text-red-500">{error}</div>
      ) : hint ? (
        <div className="mt-1 text-xs text-[rgb(var(--ld-muted))]">{hint}</div>
      ) : null}
    </label>
  )
}

