import axios from 'axios'
import { toApiError } from './errors'
import { waitForMocks } from './mock-gate'

export const TOKEN_KEY = 'jg.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/** Barramento simples para eventos de sessão (401 global, logout). */
type SessionEvent = 'expired' | 'logout'
const listeners = new Set<(event: SessionEvent) => void>()

export function onSessionEvent(listener: (event: SessionEvent) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emitSessionEvent(event: SessionEvent): void {
  listeners.forEach((listener) => listener(event))
}

export const http = axios.create({
  baseURL: '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use(async (config) => {
  await waitForMocks()
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    if (apiError.status === 401 && apiError.code === 'SESSION_EXPIRED') {
      clearToken()
      emitSessionEvent('expired')
    }
    return Promise.reject(apiError)
  },
)

export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const { data } = await http.get<T>(url, { signal })
  return data
}

export async function postJson<T>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const { data } = await http.post<T>(url, body, { signal })
  return data
}

export async function patchJson<T>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const { data } = await http.patch<T>(url, body, { signal })
  return data
}

export async function putJson<T>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const { data } = await http.put<T>(url, body, { signal })
  return data
}

export async function deleteJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const { data } = await http.delete<T>(url, { signal })
  return data
}
