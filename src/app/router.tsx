import { createRouter } from '@tanstack/react-router'
import { queryClient } from './query-client'
import { rootRoute } from '@/routes/root'
import { homeRoute } from '@/routes/home'
import { nftDetailRoute } from '@/routes/nft-detail'
import { cartRoute } from '@/routes/cart'
import { checkoutRoute } from '@/routes/checkout'
import { orderRoute } from '@/routes/order'
import { loginRoute } from '@/routes/login'
import { registerRoute } from '@/routes/register'
import { profileRoute } from '@/routes/profile'
import { walletsRoute } from '@/routes/wallets'

const routeTree = rootRoute.addChildren([
  homeRoute,
  nftDetailRoute,
  cartRoute,
  checkoutRoute,
  orderRoute,
  loginRoute,
  registerRoute,
  profileRoute,
  walletsRoute,
])

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
