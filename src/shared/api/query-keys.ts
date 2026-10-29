import type { CatalogSearch } from './contracts'

export const queryKeys = {
  session: ['session'] as const,
  catalog: (search: CatalogSearch) => ['nfts', search] as const,
  nft: (id: string) => ['nft', id] as const,
  favorites: (userId: string | null) => ['favorites', userId ?? 'guest'] as const,
  cart: (userId: string | null) => ['cart', userId ?? 'guest'] as const,
  quote: ['quote'] as const,
  order: (id: string) => ['order', id] as const,
  orders: (userId: string | null) => ['orders', userId ?? 'guest'] as const,
  profile: (userId: string | null) => ['profile', userId ?? 'guest'] as const,
  wallets: (userId: string | null) => ['wallets', userId ?? 'guest'] as const,
}
