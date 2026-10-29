import { queryOptions, type QueryClient } from '@tanstack/react-query'
import type { Session, User } from '@/shared/api/contracts'
import { getToken, postJson, getJson } from '@/shared/api/http'
import { queryKeys } from '@/shared/api/query-keys'

export interface SessionInfo {
  user: User
  expiresAt: string
}

export async function loginRequest(email: string, password: string): Promise<Session> {
  return postJson<Session>('/auth/login', { email, password })
}

export async function registerRequest(
  name: string,
  email: string,
  password: string,
): Promise<Session> {
  return postJson<Session>('/auth/register', { name, email, password })
}

export async function logoutRequest(): Promise<void> {
  await postJson('/auth/logout')
}

export async function fetchSession(): Promise<SessionInfo> {
  return getJson<SessionInfo>('/auth/session')
}

export const sessionQueryOptions = queryOptions({
  queryKey: queryKeys.session,
  queryFn: fetchSession,
  staleTime: 5 * 60_000,
  retry: false,
})

export async function ensureSession(queryClient: QueryClient): Promise<SessionInfo> {
  if (!getToken()) throw new Error('NO_SESSION')
  return queryClient.ensureQueryData(sessionQueryOptions)
}
