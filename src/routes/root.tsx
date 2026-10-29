import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { onSessionEvent } from '@/shared/api/http'
import { resetIdempotencyKey } from '@/shared/lib/idempotency'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/components/states'
import { Footer } from '@/shared/components/footer'
import { Header } from '@/shared/components/header'
import { ScenarioPanel } from '@/shared/components/scenario-panel'
import { CartDrawer } from '@/features/cart/cart-drawer'
import { useRealtime } from '@/realtime/use-realtime'

export interface RouterContext {
  queryClient: QueryClient
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  const { queryClient } = rootRoute.useRouteContext()
  useRealtime()

  useEffect(() => {
    return onSessionEvent((event) => {
      if (event !== 'expired') return
      resetIdempotencyKey()
      queryClient.clear()
      toast.error('Sessão expirada. Entre novamente.')
      const redirect = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.assign(`/login?redirect=${redirect}`)
    })
  }, [queryClient])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-contrast"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <ScenarioPanel />
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="container-page py-24">
      <EmptyState
        title="Página não encontrada"
        description="O endereço informado não existe ou o recurso foi removido."
        action={
          <Button asChild>
            <Link to="/">Voltar para o início</Link>
          </Button>
        }
      />
    </div>
  )
}
