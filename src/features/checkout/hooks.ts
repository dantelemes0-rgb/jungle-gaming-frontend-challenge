import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Order, Quote } from '@/shared/api/contracts'
import { ApiError } from '@/shared/api/errors'
import { http, postJson } from '@/shared/api/http'
import { queryKeys } from '@/shared/api/query-keys'
import { getOrCreateIdempotencyKey } from '@/shared/lib/idempotency'
import { useCart } from '@/features/cart/hooks'

export interface CheckoutInput {
  quote: Quote
  walletId: string
  network: 'ethereum' | 'polygon' | 'base'
  payer: { name: string; email: string }
}

export function useQuote() {
  const { data: cart } = useCart()
  const hasItems = Boolean(cart && cart.items.length > 0)

  return useQuery({
    queryKey: queryKeys.quote,
    queryFn: () => postJson<Quote>('/quote', { couponCode: cart?.couponCode ?? undefined }),
    enabled: hasItems,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: false,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ quote, walletId, network, payer }: CheckoutInput) => {
      const { data } = await http.post<Order>(
        '/orders',
        {
          quoteId: quote.id,
          quoteHash: quote.hash,
          quoteExpiresAt: quote.expiresAt,
          walletId,
          network,
          payer,
        },
        { headers: { 'Idempotency-Key': getOrCreateIdempotencyKey() } },
      )
      return data
    },
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.order(order.id), order)
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error: ApiError) => {
      if (error.code === 'QUOTE_CHANGED') {
        const data = error.data as { quote?: Quote } | undefined
        if (data?.quote) queryClient.setQueryData(queryKeys.quote, data.quote)
        toast.warning('Os valores mudaram.', {
          description: 'Revisamos a cotação. Confirme novamente para continuar.',
        })
        return
      }
      if (error.status === 0) {
        toast.error('Não foi possível confirmar o pedido.', {
          description:
            'A resposta não chegou. Tente novamente: a mesma tentativa será reaproveitada.',
        })
        return
      }
      toast.error(error.details?.[0]?.message ?? error.message)
    },
  })
}
