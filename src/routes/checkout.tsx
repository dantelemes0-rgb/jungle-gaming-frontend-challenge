import { zodResolver } from '@hookform/resolvers/zod'
import { createRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Network } from '@/shared/api/contracts'
import { checkoutPayerSchema, type CheckoutPayer } from '@/shared/api/contracts'
import { ApiError } from '@/shared/api/errors'
import { cn } from '@/shared/lib/cn'
import { formatDateTime } from '@/shared/lib/format'
import { formatEthWithSymbol } from '@/shared/lib/money'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Separator } from '@/shared/ui/separator'
import { Skeleton } from '@/shared/ui/skeleton'
import { EmptyState } from '@/shared/components/states'
import { useCurrentUser } from '@/features/auth/hooks'
import { ensureSession } from '@/features/auth/api'
import { useCart } from '@/features/cart/hooks'
import { useCreateOrder, useQuote } from '@/features/checkout/hooks'
import { useWallets } from '@/features/wallets/hooks'
import { rootRoute } from './root'

export const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  beforeLoad: async ({ context, location }) => {
    try {
      await ensureSession(context.queryClient)
    } catch {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: CheckoutPage,
})

const NETWORKS: Array<{ value: Network; label: string; fee: string }> = [
  { value: 'ethereum', label: 'Ethereum', fee: '0,0025 ETH' },
  { value: 'polygon', label: 'Polygon', fee: '0,0025 ETH' },
  { value: 'base', label: 'Base', fee: '0,0025 ETH' },
]

function CheckoutPage() {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const cart = useCart()
  const quote = useQuote()
  const wallets = useWallets()
  const createOrder = useCreateOrder()
  const [step, setStep] = useState<1 | 2>(1)
  const [walletId, setWalletId] = useState('')
  const [network, setNetwork] = useState<Network>('ethereum')
  const [confirmedReview, setConfirmedReview] = useState(false)

  const form = useForm<CheckoutPayer>({
    resolver: zodResolver(checkoutPayerSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  })

  useEffect(() => {
    if (user) {
      form.reset({ name: user.name, email: user.email })
    }
  }, [user, form])

  useEffect(() => {
    if (walletId) return
    const primary = wallets.data?.find((wallet) => wallet.isPrimary) ?? wallets.data?.[0]
    if (primary) {
      setWalletId(primary.id)
      setNetwork(primary.network)
    }
  }, [wallets.data, walletId])

  if (cart.isLoading) {
    return (
      <div className="container-page grid gap-6 py-12 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (!cart.data || cart.data.items.length === 0) {
    return (
      <div className="container-page py-20">
        <EmptyState
          title="Carrinho vazio"
          description="Adicione ao menos uma edição para iniciar o checkout."
          action={
            <Button asChild>
              <Link to="/">Explorar catálogo</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const quoteChanged = quote.data && cart.data && quote.data.version !== cart.data.version
  const quoteExpired = quote.data
    ? new Date(quote.data.expiresAt).getTime() <= Date.now()
    : false

  const submitOrder = () => {
    if (!quote.data || !walletId) return
    createOrder.mutate(
      {
        quote: quote.data,
        walletId,
        network,
        payer: form.getValues(),
      },
      {
        onSuccess: (order) => {
          void navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
        },
      },
    )
  }

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold">Finalizar compra</h1>
      <p className="mt-2 text-sm text-text-muted">
        Revise os dados, escolha a carteira e confirme. A cotação é revalidada no envio.
      </p>

      <ol className="mt-6 flex items-center gap-3 text-sm" aria-label="Etapas do checkout">
        {[
          { id: 1, label: 'Dados e carteira' },
          { id: 2, label: 'Revisão' },
        ].map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <span
              className={cn(
                'grid size-6 place-items-center rounded-full text-xs font-semibold',
                step >= item.id
                  ? 'bg-accent text-accent-contrast'
                  : 'bg-surface-2 text-text-muted',
              )}
              aria-hidden="true"
            >
              {item.id}
            </span>
            <span className={step >= item.id ? 'text-text' : 'text-text-muted'}>
              {item.label}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {quote.isError ? (
            <Alert tone="danger">
              Não foi possível gerar a cotação.{' '}
              <button
                type="button"
                className="underline"
                onClick={() => void quote.refetch()}
              >
                Tentar novamente
              </button>
            </Alert>
          ) : null}

          {quoteChanged || quoteExpired ? (
            <Alert tone="warning">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4" aria-hidden="true" />
                <span>
                  A cotação mudou ou expirou. Atualize os valores antes de confirmar.
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => void quote.refetch()}
                  >
                    Atualizar cotação
                  </button>
                </span>
              </div>
            </Alert>
          ) : null}

          {step === 1 ? (
            <Card>
              <CardHeader>
                <CardTitle>Dados do colecionador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="payer-name">Nome do titular</Label>
                    <Input
                      id="payer-name"
                      className="mt-1.5"
                      aria-invalid={Boolean(form.formState.errors.name)}
                      aria-describedby={form.formState.errors.name ? 'payer-name-error' : undefined}
                      {...form.register('name')}
                    />
                    {form.formState.errors.name ? (
                      <p id="payer-name-error" className="mt-1 text-xs text-danger">
                        {form.formState.errors.name.message}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <Label htmlFor="payer-email">E-mail</Label>
                    <Input
                      id="payer-email"
                      type="email"
                      className="mt-1.5"
                      aria-invalid={Boolean(form.formState.errors.email)}
                      aria-describedby={
                        form.formState.errors.email ? 'payer-email-error' : undefined
                      }
                      {...form.register('email')}
                    />
                    {form.formState.errors.email ? (
                      <p id="payer-email-error" className="mt-1 text-xs text-danger">
                        {form.formState.errors.email.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="wallet">Carteira</Label>
                  {wallets.isLoading ? (
                    <Skeleton className="mt-1.5 h-11 w-full" />
                  ) : wallets.data && wallets.data.length > 0 ? (
                    <Select value={walletId} onValueChange={setWalletId}>
                      <SelectTrigger id="wallet" className="mt-1.5">
                        <SelectValue placeholder="Selecione a carteira" />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets.data.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.label} · {wallet.network}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Alert tone="warning" className="mt-1.5">
                      Nenhuma carteira cadastrada.{' '}
                      <Link to="/account/wallets" className="underline">
                        Cadastrar carteira
                      </Link>
                    </Alert>
                  )}
                </div>

                <fieldset>
                  <legend className="text-sm font-medium">Rede de pagamento</legend>
                  <RadioGroup
                    value={network}
                    onValueChange={(value) => setNetwork(value as Network)}
                    className="mt-2 sm:grid-cols-3"
                  >
                    {NETWORKS.map((item) => (
                      <label
                        key={item.value}
                        htmlFor={`network-${item.value}`}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border p-3 text-sm',
                          network === item.value
                            ? 'border-accent bg-accent/5'
                            : 'border-border hover:border-border-strong',
                        )}
                      >
                        <RadioGroupItem value={item.value} id={`network-${item.value}`} />
                        <span>
                          {item.label}
                          <span className="block text-xs text-text-muted">
                            taxa {item.fee}
                          </span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </fieldset>

                <Button
                  type="button"
                  onClick={async () => {
                    const valid = await form.trigger()
                    if (!valid) return
                    setStep(2)
                  }}
                >
                  Revisar pedido
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Revisão do pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-text-muted">Titular</dt>
                    <dd>{form.getValues('name')}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">E-mail</dt>
                    <dd>{form.getValues('email')}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Carteira</dt>
                    <dd>
                      {wallets.data?.find((wallet) => wallet.id === walletId)?.label ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Rede</dt>
                    <dd className="capitalize">{network}</dd>
                  </div>
                </dl>

                <Separator />

                <div>
                  <p className="mb-2 text-sm font-medium">Itens</p>
                  <ul className="space-y-2 text-sm">
                    {quote.data?.items.map((item) => (
                      <li key={item.nftId} className="flex justify-between gap-3">
                        <span className="text-text-muted">
                          {item.qty}× {item.name}
                        </span>
                        <span>{formatEthWithSymbol(item.lineTotalEth)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={confirmedReview}
                    onChange={(event) => setConfirmedReview(event.target.checked)}
                    className="mt-1 size-4 accent-[var(--color-accent)]"
                  />
                  <span>
                    Revisei os itens, a carteira e a rede. Entendo que os valores são
                    simulados e que o pedido só será confirmado após a resposta da
                    simulação.
                  </span>
                </label>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                    disabled={createOrder.isPending}
                  >
                    <ArrowLeft aria-hidden="true" />
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={submitOrder}
                    disabled={
                      createOrder.isPending ||
                      !confirmedReview ||
                      !quote.data ||
                      Boolean(quoteChanged) ||
                      quoteExpired
                    }
                  >
                    {createOrder.isPending ? (
                      <Loader2 className="animate-spin" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 aria-hidden="true" />
                    )}
                    {createOrder.isPending ? 'Enviando…' : 'Confirmar e pagar'}
                  </Button>
                </div>

                {createOrder.isError ? (
                  <Alert tone="danger">
                    {createOrder.error instanceof ApiError
                      ? createOrder.error.message
                      : 'Falha ao enviar o pedido.'}
                    {createOrder.error instanceof ApiError && createOrder.error.status === 0 ? (
                      <span className="mt-1 block text-xs">
                        A tentativa foi preservada: reenviar não cria outra compra.
                      </span>
                    ) : null}
                  </Alert>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>

        <aside>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {quote.isLoading || !quote.data ? (
                <div className="space-y-2" aria-busy="true">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Subtotal</span>
                    <span>{formatEthWithSymbol(quote.data.subtotalEth)}</span>
                  </div>
                  {quote.data.couponCode ? (
                    <div className="flex justify-between text-success">
                      <span>Desconto ({quote.data.couponCode})</span>
                      <span>− {formatEthWithSymbol(quote.data.discountEth)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-text-muted">Taxa de rede</span>
                    <span>{formatEthWithSymbol(quote.data.networkFeeEth)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>{formatEthWithSymbol(quote.data.totalEth)}</span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Cotação válida até {formatDateTime(quote.data.expiresAt)}. Versão{' '}
                    {quote.data.version}.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
