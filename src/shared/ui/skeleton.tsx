import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn('shimmer rounded-[var(--radius-control)]', className)}
      {...props}
    />
  )
}
