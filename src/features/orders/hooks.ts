import { useQuery } from '@tanstack/react-query'
import type { Order } from '@/shared/api/contracts'
import { getJson } from '@/shared/api/http'
import { queryKeys } from '@/shared/api/query-keys'
import { useCurrentUser } from '@/features/auth/hooks'

export async function fetchOrder(id: string, signal?: AbortSignal): Promise<Order> {
  return getJson<Order>(`/orders/${id}`, signal)
}

export async function fetchOrders(signal?: AbortSignal): Promise<Order[]> {
  const data = await getJson<{ items: Order[] }>('/orders', signal)
  return data.items
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: ({ signal }) => fetchOrder(id, signal),
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' ? 1200 : false,
    retry: false,
  })
}

export function useOrders() {
  const user = useCurrentUser()
  return useQuery({
    queryKey: queryKeys.orders(user?.id ?? null),
    queryFn: ({ signal }) => fetchOrders(signal),
    enabled: Boolean(user),
    staleTime: 10_000,
  })
}
