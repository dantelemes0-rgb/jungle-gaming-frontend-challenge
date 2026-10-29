import type { EthAmount } from '@/shared/lib/money'
import { apiErrorSchema } from './contracts'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: Array<{ field?: string; message: string }>
  readonly data?: unknown

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Array<{ field?: string; message: string }>,
    data?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.data = data
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (isAxiosLike(error)) {
    const response = error.response
    if (!response) {
      return new ApiError(0, 'NETWORK_ERROR', 'Não foi possível conectar. Verifique sua rede.')
    }
    const parsed = apiErrorSchema.safeParse(response.data)
    if (parsed.success) {
      const { code, message, details } = parsed.data.error
      return new ApiError(response.status, code, message, details, response.data)
    }
    return new ApiError(
      response.status,
      'UNKNOWN_ERROR',
      'Algo deu errado. Tente novamente.',
      undefined,
      response.data,
    )
  }

  if (error instanceof Error) return new ApiError(0, 'UNKNOWN_ERROR', error.message)
  return new ApiError(0, 'UNKNOWN_ERROR', 'Erro inesperado.')
}

interface AxiosLike {
  isAxiosError?: boolean
  response?: { status: number; data: unknown }
}

function isAxiosLike(error: unknown): error is AxiosLike {
  if (typeof error !== 'object' || error === null) return false
  const candidate = error as AxiosLike
  return candidate.isAxiosError === true || 'response' in candidate
}

export type { EthAmount }
