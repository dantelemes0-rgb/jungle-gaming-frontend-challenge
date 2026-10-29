import { createRoute, Link } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'
import { CartSummary } from '@/features/cart/cart-summary'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { rootRoute } from './root'

export const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
})

function CartPage() {
  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold">Carrinho</h1>
      <p className="mt-2 text-sm text-text-muted">
        Ajuste quantidades, aplique um cupom e confira o resumo antes de finalizar.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Itens do carrinho</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CartSummary />
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Como funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-text-muted">
              <p>
                Os valores em ETH trafegam como texto decimal e são somados com precisão
                (sem arredondamento de ponto flutuante).
              </p>
              <p>
                A taxa de rede e o total final aparecem na cotação do checkout, que é
                revalidada antes de confirmar o pedido.
              </p>
              <p className="flex items-center gap-2 text-xs">
                <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
                Compra simulada, sem blockchain real.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cupons de demonstração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <code className="rounded bg-surface-2 px-1.5 py-0.5">GREEN10</code> — 10% de
                desconto.
              </p>
              <p>
                <code className="rounded bg-surface-2 px-1.5 py-0.5">EXPIRED10</code> —
                cupom expirado.
              </p>
              <Link to="/" className="inline-block pt-2 text-sm text-accent hover:underline">
                Continuar explorando
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
