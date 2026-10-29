import { createRoute, lazyRouteComponent, redirect } from '@tanstack/react-router'
import { ensureSession } from '@/features/auth/api'
import { rootRoute } from './root'

// Componente carregado sob demanda: não pesa no bundle inicial (home/detalhe).
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
  component: lazyRouteComponent(() => import('./checkout.page'), 'CheckoutPage'),
})
