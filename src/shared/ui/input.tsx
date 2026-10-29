import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

export function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted/70 transition-colors focus-visible:border-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger',
        className,
      )}
      {...props}
    />
  )
}
