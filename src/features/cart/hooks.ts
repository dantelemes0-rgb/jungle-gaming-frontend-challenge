import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { Cart } from '@/shared/api/contracts'
import { ApiError } from '@/shared/api/errors'
import { queryKeys } from '@/shared/api/query-keys'
import { useCurrentUser } from '@/features/auth/hooks'
import { useCartUi } from './cart-ui'
import {
  addCartItem,
  applyCoupon,
  fetchCart,
  removeCartItem,
  removeCoupon,
  updateCartItem,
} from './api'

export function useCart() {
  const user = useCurrentUser()
  return useQuery({
    queryKey: queryKeys.cart(user?.id ?? null),
    queryFn: ({ signal }) => fetchCart(signal),
    staleTime: 15_000,
  })
}

export function useCartCount(): number {
  const { data } = useCart()
  return data?.items.reduce((total, item) => total + item.qty, 0) ?? 0
}

function useInvalidateCart() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
    void queryClient.invalidateQueries({ queryKey: ['quote'] })
  }
}

export function useAddToCart() {
  const invalidate = useInvalidateCart()
  const { open } = useCartUi()

  return useMutation({
    mutationFn: ({ nftId, qty }: { nftId: string; qty: number }) => addCartItem(nftId, qty),
    onSuccess: (cart: Cart) => {
      invalidate()
      open()
      toast.success('Adicionado ao carrinho.', {
        description: `${cart.items.length} ${cart.items.length === 1 ? 'item' : 'itens'} no carrinho.`,
      })
    },
    onError: (error: ApiError) => {
      toast.error(error.details?.[0]?.message ?? error.message)
    },
  })
}

export function useUpdateQuantity() {
  const queryClient = useQueryClient()
  const user = useCurrentUser()
  const key = queryKeys.cart(user?.id ?? null)
  const invalidate = useInvalidateCart()

  return useMutation({
    mutationFn: ({ nftId, qty }: { nftId: string; qty: number }) =>
      updateCartItem(nftId, qty),
    onMutate: async ({ nftId, qty }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Cart>(key)
      queryClient.setQueryData<Cart>(key, (current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.nftId === nftId ? { ...item, qty } : item,
              ),
            }
          : current,
      )
      return { previous }
    },
    onError: (error: ApiError, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error(error.details?.[0]?.message ?? error.message)
    },
    onSettled: invalidate,
  })
}

export function useRemoveCartItem() {
  const invalidate = useInvalidateCart()
  return useMutation({
    mutationFn: (nftId: string) => removeCartItem(nftId),
    onSuccess: () => {
      invalidate()
      toast.success('Item removido do carrinho.')
    },
    onError: (error: ApiError) => toast.error(error.details?.[0]?.message ?? error.message),
  })
}

export function useApplyCoupon() {
  const invalidate = useInvalidateCart()
  return useMutation({
    mutationFn: (code: string) => applyCoupon(code),
    onSuccess: () => {
      invalidate()
      toast.success('Cupom aplicado.')
    },
    onError: (error: ApiError) => toast.error(error.details?.[0]?.message ?? error.message),
  })
}

export function useRemoveCoupon() {
  const invalidate = useInvalidateCart()
  return useMutation({
    mutationFn: removeCoupon,
    onSuccess: () => {
      invalidate()
      toast.success('Cupom removido.')
    },
    onError: (error: ApiError) => toast.error(error.details?.[0]?.message ?? error.message),
  })
}
