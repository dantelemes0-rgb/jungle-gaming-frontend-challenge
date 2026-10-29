import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SessionInfo } from '@/features/auth/api'
import type { User } from '@/shared/api/contracts'
import { ApiError } from '@/shared/api/errors'
import { http, patchJson } from '@/shared/api/http'
import { queryKeys } from '@/shared/api/query-keys'
import { useCurrentUser } from '@/features/auth/hooks'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; bio?: string }) =>
      patchJson<User>('/me', payload),
    onSuccess: (user) => {
      queryClient.setQueryData<SessionInfo>(queryKeys.session, (current) =>
        current ? { ...current, user } : current,
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.session })
      toast.success('Perfil atualizado.')
    },
    onError: (error: ApiError) => toast.error(error.details?.[0]?.message ?? error.message),
  })
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (avatarUrl: string) => {
      const { data } = await http.put<User>('/me/avatar', { avatarUrl })
      return data
    },
    onSuccess: (user) => {
      queryClient.setQueryData<SessionInfo>(queryKeys.session, (current) =>
        current ? { ...current, user } : current,
      )
      toast.success('Avatar atualizado.')
    },
    onError: (error: ApiError) => toast.error(error.details?.[0]?.message ?? error.message),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      await http.put('/me/password', payload)
    },
    onSuccess: () => toast.success('Senha alterada.'),
    onError: (error: ApiError) => toast.error(error.details?.[0]?.message ?? error.message),
  })
}

export function useProfile() {
  return useCurrentUser()
}
