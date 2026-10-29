import { HttpResponse, delay } from 'msw'
import type { ZodType } from 'zod'
import { hashString } from '@/shared/lib/prng'
import { ensureDb, sessionUser } from '../db/store'
import type { DbUser } from '../db/schema'
import { scenarioFromRequest } from '../scenarios'

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: Array<{ field?: string; message: string }>,
): Response {
  return HttpResponse.json({ error: { code, message, details } }, { status })
}

export function validationError(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>
}): Response {
  return apiError(
    422,
    'VALIDATION_ERROR',
    'Verifique os campos destacados.',
    error.issues.map((issue) => ({
      field: issue.path.map(String).join('.'),
      message: issue.message,
    })),
  )
}

export async function bootstrap(): Promise<void> {
  await ensureDb()
}

export async function simulateLatency(request: Request): Promise<void> {
  const scenario = scenarioFromRequest(request)
  if (scenario === 'slow') {
    await delay(2500)
    return
  }
  if (scenario === 'variable-latency') {
    await delay(150 + Math.floor(Math.random() * 1650))
    return
  }
  const base = 120 + (hashString(request.url) % 160)
  await delay(base)
}

export function networkFailure(request: Request): Response | null {
  if (scenarioFromRequest(request) === 'offline') {
    return HttpResponse.error()
  }
  return null
}

export function readUser(request: Request): DbUser | null {
  if (scenarioFromRequest(request) === 'session-expired') return null
  return sessionUser(request)
}

export function unauthorized(): Response {
  return apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
}

export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ data: T } | { response: Response }> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return { response: apiError(400, 'BAD_REQUEST', 'Corpo da requisição inválido.') }
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { response: validationError(parsed.error) }
  }
  return { data: parsed.data }
}

export function param(
  params: Record<string, string | readonly string[] | undefined>,
  key: string,
): string {
  const value = params[key]
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return ''
}
