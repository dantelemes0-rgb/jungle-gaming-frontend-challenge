import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { postJson } from '@/shared/api/http'
import { ApiError } from '@/shared/api/errors'
import { clearToken, getToken, setToken } from '@/shared/api/http'
import { queryKeys } from '@/shared/api/query-keys'
import { disconnectRealtime } from '@/realtime/socket'
import { resetIdempotencyKey } from '@/shared/lib/idempotency'
import {
  fetchSession,
  loginRequest,
  logoutRequest,
  registerRequest,
  type SessionInfo,
} from './api'

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: fetchSession,
    staleTime: 5 * 60_000,
    retry: false,
    enabled: Boolean(getToken()),
  })
}

export function useCurrentUser() {
  return useSession().data?.user ?? null
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const session = await loginRequest(email, password)
      setToken(session.token)
      // Merge do carrinho de visitante antes de qualquer navegação.
      await postJson('/cart/merge', { items: [] }).catch(() => undefined)
      return session
    },
    onSuccess: async (session) => {
      const info: SessionInfo = { user: session.user, expiresAt: session.expiresAt }
      queryClient.setQueryData(queryKeys.session, info)
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      await queryClient.invalidateQueries({ queryKey: ['favorites'] })
      toast.success(`Bem-vindo, ${session.user.name.split(' ')[0]}.`)
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; email: string; password: string }) => {
      const session = await registerRequest(payload.name, payload.email, payload.password)
      setToken(session.token)
      await postJson('/cart/merge', { items: [] }).catch(() => undefined)
      return session
    },
    onSuccess: async (session) => {
      queryClient.setQueryData<SessionInfo>(queryKeys.session, {
        user: session.user,
        expiresAt: session.expiresAt,
      })
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Conta criada. Bem-vindo à GreenMint.')
    },
    onError: (error: ApiError) => {
      toast.error(error.message)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: logoutRequest,
    onSettled: async () => {
      clearToken()
      resetIdempotencyKey()
      disconnectRealtime()
      queryClient.clear()
      toast.success('Sessão encerrada.')
      await navigate({ to: '/', search: { q: '', sort: 'relevance', page: 1 } })
    },
  })
}
