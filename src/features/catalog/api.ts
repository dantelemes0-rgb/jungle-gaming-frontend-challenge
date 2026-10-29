import type { CatalogResponse, Nft, CatalogSearch } from '@/shared/api/contracts'
import { getJson } from '@/shared/api/http'

export const PER_PAGE = 12

export function normalizeSearch(search: CatalogSearch): Required<
  Pick<CatalogSearch, 'sort' | 'page'>
> &
  CatalogSearch {
  return { ...search, sort: search.sort ?? 'relevance', page: search.page ?? 1 }
}

function toParams(search: CatalogSearch): URLSearchParams {
  const normalized = normalizeSearch(search)
  const params = new URLSearchParams()
  params.set('page', String(normalized.page))
  params.set('perPage', String(PER_PAGE))
  params.set('sort', normalized.sort)
  if (normalized.q) params.set('q', normalized.q)
  if (normalized.collection) params.set('collection', normalized.collection)
  if (normalized.category) params.set('category', normalized.category)
  if (normalized.rarity) params.set('rarity', normalized.rarity)
  if (normalized.status) params.set('status', normalized.status)
  if (normalized.minPrice) params.set('minPrice', normalized.minPrice)
  if (normalized.maxPrice) params.set('maxPrice', normalized.maxPrice)
  return params
}

export async function fetchCatalog(
  search: CatalogSearch,
  signal?: AbortSignal,
): Promise<CatalogResponse> {
  return getJson<CatalogResponse>(`/nfts?${toParams(search).toString()}`, signal)
}

export async function fetchNft(id: string, signal?: AbortSignal): Promise<Nft> {
  return getJson<Nft>(`/nfts/${id}`, signal)
}

export interface Facets {
  collections: Array<{ id: string; name: string }>
  minPriceEth: string
  maxPriceEth: string
}

export async function fetchFacets(signal?: AbortSignal): Promise<Facets> {
  return getJson<Facets>('/nfts/facets', signal)
}
