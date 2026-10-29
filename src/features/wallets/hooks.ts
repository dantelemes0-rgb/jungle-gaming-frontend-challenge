import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Wallet, WalletPayload } from '@/shared/api/contracts'
import { ApiError } from '@/shared/api/errors'
import { http } from '@/shared/api/http'
import { queryKeys } from '@/shared/api/query-keys'
import { useCurrentUser } from '@/features/auth/hooks'

export function useWallets() {
  const user = useCurrentUser()
  return useQuery({
    queryKey: queryKeys.wallets(user?.id ?? null),
    queryFn: async ({ signal }) => {
      const { data } = await http.get<{ items: Wallet[] }>('/wallets', { signal })
      return data.items
    },
    enabled: Boolean(user),
  })
}

export function useCreateWallet() {
  const queryClient = useQueryClient()
  const user = useCurrentUser()
  return useMutation({
    mutationFn: async (payload: WalletPayload) => {
      const { data } = await http.post<Wallet>('/wallets', payload)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallets(user?.id ?? null) })
      toast.success('Carteira cadastrada.')
    },
    onError: (error: ApiError) => toast.error(error.details?.[0]?.message ?? error.message),
  })
}

export function useUpdateWallet() {
  const queryClient = useQueryClient()
  const user = useCurrentUser()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<WalletPayload> & { id: string }) => {
      const { data } = await http.patch<Wallet>(`/wallets/${id}`, payload)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallets(user?.id ?? null) })
      toast.success('Carteira atualizada.')
    },
    onError: (error: ApiError) => toast.error(error.details?.[0]?.message ?? error.message),
  })
}
