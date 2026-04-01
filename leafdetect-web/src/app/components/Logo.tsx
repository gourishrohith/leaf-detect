import { Leaf } from 'lucide-react'
import { clsx } from 'clsx'

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={clsx('inline-flex items-center gap-2 select-none', className)}>
      <div className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--ld-border))] bg-[rgb(var(--ld-panel))] shadow-[var(--ld-shadow-soft)]">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[rgb(var(--ld-green-2))] via-[rgb(var(--ld-green))] to-[rgb(var(--ld-green-3))]">
          <Leaf className="h-4 w-4 text-black/85" />
        </div>
      </div>
      {withText ? (
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">LeafDetect</div>
          <div className="text-xs text-[rgb(var(--ld-muted))]">Scan. Diagnose. Treat.</div>
        </div>
      ) : null}
    </div>
  )
}

