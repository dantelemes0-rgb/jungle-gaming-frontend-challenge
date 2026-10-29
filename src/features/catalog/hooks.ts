import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { CatalogSearch } from '@/shared/api/contracts'
import { queryKeys } from '@/shared/api/query-keys'
import { fetchCatalog, fetchFacets, fetchNft } from './api'

export function useCatalog(search: CatalogSearch) {
  return useQuery({
    queryKey: queryKeys.catalog(search),
    queryFn: ({ signal }) => fetchCatalog(search, signal),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}

export function useNft(id: string) {
  return useQuery({
    queryKey: queryKeys.nft(id),
    queryFn: ({ signal }) => fetchNft(id, signal),
    staleTime: 30_000,
  })
}

export function useFacets() {
  return useQuery({
    queryKey: ['facets'],
    queryFn: ({ signal }) => fetchFacets(signal),
    staleTime: 5 * 60_000,
  })
}
