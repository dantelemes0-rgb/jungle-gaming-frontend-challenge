import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { redirectSearchSchema } from '@/shared/lib/redirect'
import { rootRoute } from './root'

// Componente carregado sob demanda: não pesa no bundle inicial (home/detalhe).
export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search) => redirectSearchSchema.parse(search),
  component: lazyRouteComponent(() => import('./login.page'), 'LoginPage'),
})
