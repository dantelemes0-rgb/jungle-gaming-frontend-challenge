import { Minus, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface QuantityStepperProps {
  value: number
  max: number
  min?: number
  onChange: (value: number) => void
  disabled?: boolean
  label?: string
  size?: 'sm' | 'md'
}

export function QuantityStepper({
  value,
  max,
  min = 1,
  onChange,
  disabled = false,
  label = 'Quantidade',
  size = 'md',
}: QuantityStepperProps) {
  const decrement = () => onChange(Math.max(min, value - 1))
  const increment = () => onChange(Math.min(max, value + 1))

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-[var(--radius-control)] border border-border bg-surface',
        size === 'sm' ? 'h-9' : 'h-11',
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || value <= min}
        aria-label={`Diminuir ${label.toLowerCase()}`}
        className="grid place-items-center px-3 text-text-muted transition-colors hover:text-text disabled:opacity-40"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span
        className={cn('min-w-8 text-center text-sm font-medium tabular-nums')}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={disabled || value >= max}
        aria-label={`Aumentar ${label.toLowerCase()}`}
        className="grid place-items-center px-3 text-text-muted transition-colors hover:text-text disabled:opacity-40"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
