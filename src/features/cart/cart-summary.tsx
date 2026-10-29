import { Link, useNavigate } from '@tanstack/react-router'
import { Tag, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { formatEthWithSymbol } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Separator } from '@/shared/ui/separator'
import { Skeleton } from '@/shared/ui/skeleton'
import { QuantityStepper } from '@/shared/components/quantity-stepper'
import { useCurrentUser } from '@/features/auth/hooks'
import { useCartUi } from './cart-ui'
import {
  useApplyCoupon,
  useCart,
  useRemoveCartItem,
  useRemoveCoupon,
  useUpdateQuantity,
} from './hooks'

export function CartSummary({
  compact = false,
  onNavigate,
}: {
  compact?: boolean
  onNavigate?: () => void
}) {
  const { data: cart, isLoading, isError, refetch } = useCart()
  const updateQuantity = useUpdateQuantity()
  const removeItem = useRemoveCartItem()
  const applyCoupon = useApplyCoupon()
  const removeCoupon = useRemoveCoupon()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { close } = useCartUi()
  const [code, setCode] = useState('')

  const submitCoupon = (event: FormEvent) => {
    event.preventDefault()
    if (!code.trim()) return
    applyCoupon.mutate(code.trim(), { onSuccess: () => setCode('') })
  }

  const goToCheckout = () => {
    close()
    onNavigate?.()
    void navigate({ to: '/checkout' })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6" aria-busy="true" aria-label="Carregando carrinho">
        {[0, 1].map((item) => (
          <div key={item} className="flex gap-3">
            <Skeleton className="size-20 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        ))}
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div role="alert" className="p-6 text-sm">
        <p className="text-danger">Não foi possível carregar o carrinho.</p>
        <Button variant="secondary" className="mt-3" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="font-display text-lg font-semibold">Seu carrinho está vazio</p>
        <p className="text-sm text-text-muted">
          Explore o catálogo e adicione edições para começar.
        </p>
        <Button asChild variant="secondary">
          <Link to="/" onClick={close}>
            Explorar NFTs
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul className="flex-1 space-y-4 overflow-y-auto p-6">
        {cart.items.map((item) => (
          <li key={item.nftId} className="flex gap-3">
            <img
              src={item.imageUrl}
              alt=""
              width={80}
              height={80}
              className="size-20 shrink-0 rounded-xl border border-border object-cover"
            />
            <div className="min-w-0 flex-1">
              <Link
                to="/nft/$nftId"
                params={{ nftId: item.nftId }}
                onClick={close}
                className="block truncate text-sm font-medium hover:text-accent"
              >
                {item.name}
              </Link>
              <p className="text-xs text-text-muted">
                {formatEthWithSymbol(item.unitPriceEth)} ·{' '}
                {item.editionsAvailable} disponíveis
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <QuantityStepper
                  size="sm"
                  value={item.qty}
                  max={Math.min(10, item.editionsAvailable || 1)}
                  label={`Quantidade de ${item.name}`}
                  disabled={updateQuantity.isPending}
                  onChange={(qty) => updateQuantity.mutate({ nftId: item.nftId, qty })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${item.name} do carrinho`}
                  onClick={() => removeItem.mutate(item.nftId)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-border p-6">
        {cart.couponCode ? (
          <div className="mb-4 flex items-center justify-between rounded-[var(--radius-control)] border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            <span className="flex items-center gap-2">
              <Tag className="size-4" aria-hidden="true" />
              {cart.couponCode}
            </span>
            <button
              type="button"
              onClick={() => removeCoupon.mutate()}
              className="grid size-6 place-items-center rounded hover:bg-accent/20"
              aria-label="Remover cupom"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <form onSubmit={submitCoupon} className="mb-4 flex gap-2">
            <label htmlFor="coupon" className="sr-only">
              Cupom de desconto
            </label>
            <Input
              id="coupon"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Cupom (ex.: GREEN10)"
              autoComplete="off"
              aria-describedby="coupon-help"
              aria-invalid={applyCoupon.isError}
            />
            <Button type="submit" variant="secondary" disabled={applyCoupon.isPending}>
              Aplicar
            </Button>
            <span id="coupon-help" className="sr-only">
              Cupons de demonstração: GREEN10 (válido) e EXPIRED10 (expirado).
            </span>
          </form>
        )}

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">Subtotal</dt>
            <dd>{formatEthWithSymbol(cart.subtotalEth)}</dd>
          </div>
          {cart.couponCode ? (
            <div className="flex justify-between text-success">
              <dt>Desconto</dt>
              <dd>− {formatEthWithSymbol(cart.discountEth)}</dd>
            </div>
          ) : null}
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatEthWithSymbol(cart.totalEth)}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-col gap-2">
          <Button onClick={goToCheckout} disabled={cart.items.length === 0}>
            Finalizar compra
          </Button>
          {!compact ? (
            <Button variant="ghost" asChild>
              <Link to="/" onClick={close}>
                Continuar explorando
              </Link>
            </Button>
          ) : null}
          {!user ? (
            <p className="text-center text-xs text-text-muted">
              Você pode comprar como visitante; o login é necessário no checkout.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
