import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'flex min-h-24 w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted/70 transition-colors focus-visible:border-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger',
        className,
      )}
      {...props}
    />
  )
}
