import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Nft } from '@/shared/api/contracts'
import { http } from '@/shared/api/http'
import { queryKeys } from '@/shared/api/query-keys'
import { useCurrentUser } from '@/features/auth/hooks'

export interface FavoritesResponse {
  nftIds: string[]
  items: Nft[]
}

export function useFavorites() {
  const user = useCurrentUser()
  return useQuery({
    queryKey: queryKeys.favorites(user?.id ?? null),
    queryFn: async ({ signal }) => {
      const { data } = await http.get<FavoritesResponse>('/favorites', { signal })
      return data
    },
    enabled: Boolean(user),
    staleTime: 30_000,
  })
}

/** Atualização otimista com rollback: requisito explícito do desafio. */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const user = useCurrentUser()
  const key = queryKeys.favorites(user?.id ?? null)

  return useMutation({
    mutationFn: async ({ nftId, favorite }: { nftId: string; favorite: boolean }) => {
      if (favorite) await http.put(`/favorites/${nftId}`)
      else await http.delete(`/favorites/${nftId}`)
      return { nftId, favorite }
    },
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      queryClient.setQueryData<FavoritesResponse>(key, (current) => {
        if (!current) return { nftIds: favorite ? [nftId] : [], items: [] }
        return {
          ...current,
          nftIds: favorite
            ? Array.from(new Set([...current.nftIds, nftId]))
            : current.nftIds.filter((id) => id !== nftId),
        }
      })
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error('Não foi possível atualizar o favorito.', {
        description: error instanceof Error ? error.message : undefined,
      })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
