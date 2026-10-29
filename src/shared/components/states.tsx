import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-border px-6 py-16 text-center',
        className,
      )}
    >
      <div className="grid size-12 place-items-center rounded-full bg-surface-2 text-text-muted">
        {icon ?? <Inbox className="size-6" aria-hidden="true" />}
      </div>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-text-muted">{description}</p>
      {action}
    </div>
  )
}

export function ErrorState({
  title = 'Algo deu errado',
  description = 'Não foi possível carregar os dados agora.',
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 px-6 py-16 text-center',
        className,
      )}
    >
      <div className="grid size-12 place-items-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-text-muted">{description}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Tentar novamente
        </Button>
      ) : null}
    </div>
  )
}

export function NftGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface"
        >
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <div className="flex items-end justify-between pt-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
