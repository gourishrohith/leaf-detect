import { clsx } from 'clsx'
import type { SelectHTMLAttributes } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  hint?: string
}

export function Select({ className, label, hint, children, ...props }: Props) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm font-medium">{label}</div> : null}
      <select
        className={clsx(
          'h-11 w-full rounded-xl border bg-[rgb(var(--ld-panel))] px-3 text-sm outline-none',
          'border-[rgb(var(--ld-border))] focus:border-[rgb(var(--ld-accent))] focus:ring-4 focus:ring-[rgba(16,185,129,0.15)]',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {hint ? <div className="mt-1 text-xs text-[rgb(var(--ld-muted))]">{hint}</div> : null}
    </label>
  )
}

