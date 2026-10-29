import { createRoute, Link, redirect } from '@tanstack/react-router'
import { CheckCircle2, Clock, Copy, ExternalLink, XCircle } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/shared/api/errors'
import { cn } from '@/shared/lib/cn'
import { formatDateTime } from '@/shared/lib/format'
import { formatEthWithSymbol } from '@/shared/lib/money'
import { resetIdempotencyKey } from '@/shared/lib/idempotency'
import { Alert } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import { Skeleton } from '@/shared/ui/skeleton'
import { EmptyState } from '@/shared/components/states'
import { ensureSession } from '@/features/auth/api'
import { useOrder } from '@/features/orders/hooks'
import { rootRoute } from './root'

export const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId',
  beforeLoad: async ({ context, location }) => {
    try {
      await ensureSession(context.queryClient)
    } catch {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: OrderPage,
})

function OrderPage() {
  const { orderId } = orderRoute.useParams()
  const { data: order, isLoading, isError, error, refetch } = useOrder(orderId)

  useEffect(() => {
    if (order?.status === 'confirmed' || order?.status === 'declined') {
      resetIdempotencyKey()
    }
  }, [order?.status])

  if (isLoading) {
    return (
      <div className="container-page max-w-3xl space-y-4 py-12">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.code === 'ORDER_NOT_FOUND'
    return (
      <div className="container-page py-20">
        {notFound ? (
          <EmptyState
            title="Pedido não encontrado"
            description="Este pedido não existe ou não pertence à sua conta."
            action={
              <Button asChild>
                <Link to="/">Voltar ao catálogo</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="Não foi possível carregar o pedido"
            description="Tente novamente em alguns instantes."
            action={
              <Button variant="secondary" onClick={() => void refetch()}>
                Tentar novamente
              </Button>
            }
          />
        )}
      </div>
    )
  }

  if (!order) return null

  const isPending = order.status === 'pending'

  return (
    <div className="container-page max-w-3xl py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-text-muted">Pedido</p>
          <h1 className="font-display text-3xl font-semibold">#{order.id.slice(-8)}</h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div aria-live="polite" className="mt-6">
        {order.status === 'pending' ? (
          <Alert tone="info">
            <span className="flex items-center gap-2">
              <Clock className="size-4 animate-pulse" aria-hidden="true" />
              Processando pagamento na rede simulada… Esta página atualiza automaticamente.
            </span>
          </Alert>
        ) : null}
        {order.status === 'confirmed' ? (
          <Alert tone="success">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Pagamento confirmado pela simulação. Seu recibo está abaixo.
            </span>
          </Alert>
        ) : null}
        {order.status === 'declined' ? (
          <Alert tone="danger">
            <span className="flex items-center gap-2">
              <XCircle className="size-4" aria-hidden="true" />
              Pagamento recusado. {order.declineReason} Seus itens continuam no carrinho.
            </span>
          </Alert>
        ) : null}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recibo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-muted">Titular</dt>
              <dd>{order.payer.name}</dd>
            </div>
            <div>
              <dt className="text-text-muted">E-mail</dt>
              <dd>{order.payer.email}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Carteira</dt>
              <dd>
                {order.wallet.label} · {order.wallet.network}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Criado em</dt>
              <dd>{formatDateTime(order.createdAt)}</dd>
            </div>
          </dl>

          {order.txHash ? (
            <>
              <Separator />
              <div className="text-sm">
                <p className="text-text-muted">Transação (simulada)</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <code className="max-w-full truncate rounded bg-surface-2 px-2 py-1 font-mono text-xs">
                    {order.txHash}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void navigator.clipboard.writeText(order.txHash ?? '')
                      toast.success('Hash copiado.')
                    }}
                  >
                    <Copy aria-hidden="true" />
                    Copiar
                  </Button>
                  {order.explorerUrl ? (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={order.explorerUrl} target="_blank" rel="noreferrer noopener">
                        <ExternalLink aria-hidden="true" />
                        Explorador
                        <span className="sr-only">(abre em nova aba)</span>
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}

          <Separator />

          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.nftId} className="flex items-center gap-3">
                <img
                  src={item.imageUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="size-14 rounded-lg border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-text-muted">
                    {item.qty} × {formatEthWithSymbol(item.unitPriceEth)}
                  </p>
                </div>
                <p className="text-sm">{formatEthWithSymbol(item.lineTotalEth)}</p>
              </li>
            ))}
          </ul>

          <Separator />

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Subtotal</dt>
              <dd>{formatEthWithSymbol(order.subtotalEth)}</dd>
            </div>
            {order.discountEth !== '0.0000' && order.discountEth !== '0' ? (
              <div className="flex justify-between text-success">
                <dt>Desconto</dt>
                <dd>− {formatEthWithSymbol(order.discountEth)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-text-muted">Taxa de rede</dt>
              <dd>{formatEthWithSymbol(order.networkFeeEth)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatEthWithSymbol(order.totalEth)}</dd>
            </div>
          </dl>

          <p className="text-xs text-text-muted">
            Snapshot do pedido: valores congelados no momento da compra. Alterações
            posteriores no catálogo não modificam este recibo.
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link to="/">Continuar explorando</Link>
        </Button>
        {order.status === 'declined' ? (
          <Button asChild>
            <Link to="/checkout">Tentar novamente</Link>
          </Button>
        ) : null}
        {isPending ? (
          <Button variant="ghost" onClick={() => void refetch()}>
            Verificar agora
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'pending' | 'confirmed' | 'declined' }) {
  const map = {
    pending: { label: 'Pendente', className: 'border-warning/30 bg-warning/10 text-warning' },
    confirmed: { label: 'Confirmado', className: 'border-success/30 bg-success/10 text-success' },
    declined: { label: 'Recusado', className: 'border-danger/30 bg-danger/10 text-danger' },
  } as const
  const item = map[status]
  return (
    <Badge variant="outline" className={cn('h-7 px-3 text-sm', item.className)}>
      {item.label}
    </Badge>
  )
}
