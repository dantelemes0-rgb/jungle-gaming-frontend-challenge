import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  CatalogResponse,
  Nft,
  NftUpdatedEvent,
  OrderUpdatedEvent,
} from '@/shared/api/contracts'
import { clearToken, emitSessionEvent, getToken } from '@/shared/api/http'
import { useSession } from '@/features/auth/hooks'
import { resetIdempotencyKey } from '@/shared/lib/idempotency'
import { connectRealtime, disconnectRealtime } from './socket'
import { VersionGuard } from './version-guard'

export function useRealtime(): void {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const userId = session?.user.id ?? null

  useEffect(() => {
    const token = getToken()
    if (!token) return

    const socket = connectRealtime(token)
    const guard = new VersionGuard()
    let connectedOnce = false

    const handleConnect = () => {
      if (!connectedOnce) {
        connectedOnce = true
        return
      }
      // Reconexão: reconcilia recursos ativos com a fonte REST.
      void queryClient.invalidateQueries({ queryKey: ['nfts'] })
      void queryClient.invalidateQueries({ queryKey: ['nft'] })
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['order'] })
      toast.info('Conexão restabelecida. Dados sincronizados.')
    }

    const handleNftUpdated = (payload: NftUpdatedEvent) => {
      if (!guard.shouldApply('nft', payload.nftId, payload.version, payload.eventId)) return

      queryClient.setQueriesData<CatalogResponse>({ queryKey: ['nfts'] }, (current) => {
        if (!current) return current
        return {
          ...current,
          items: current.items.map((item) =>
            item.id === payload.nftId
              ? {
                  ...item,
                  priceEth: payload.priceEth,
                  editionsAvailable: payload.editionsAvailable,
                  status: payload.status,
                  version: payload.version,
                }
              : item,
          ),
        }
      })

      queryClient.setQueryData<Nft>(['nft', payload.nftId], (current) =>
        current
          ? {
              ...current,
              priceEth: payload.priceEth,
              editionsAvailable: payload.editionsAvailable,
              status: payload.status,
              version: payload.version,
            }
          : current,
      )

      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      // A cotação NÃO é refeita automaticamente: o checkout precisa exigir
      // nova confirmação do usuário com os valores atualizados.

      const cart = queryClient.getQueryData<{ items: Array<{ nftId: string }> }>([
        'cart',
        userId ?? 'guest',
      ])
      if (cart?.items.some((item) => item.nftId === payload.nftId)) {
        toast.info('Um NFT do seu carrinho foi atualizado.', {
          description: 'Confira o novo preço e a disponibilidade antes de finalizar.',
        })
      }
    }

    const handleOrderUpdated = (payload: OrderUpdatedEvent) => {
      // Evento de outro usuário nunca atualiza esta sessão.
      if (payload.userId && userId && payload.userId !== userId) return
      if (!guard.shouldApply('order', payload.orderId, payload.version, payload.eventId)) return

      queryClient.setQueryData(
        ['order', payload.orderId],
        (current: Record<string, unknown> | undefined) =>
          current
            ? {
                ...current,
                status: payload.status,
                version: payload.version,
                txHash: payload.txHash ?? current.txHash,
                declineReason: payload.declineReason ?? current.declineReason,
              }
            : current,
      )

      void queryClient.invalidateQueries({ queryKey: ['orders'] })

      if (payload.status === 'confirmed') {
        void queryClient.invalidateQueries({ queryKey: ['cart'] })
        toast.success('Pagamento confirmado.', { description: 'Seu pedido foi registrado.' })
      }
      if (payload.status === 'declined') {
        toast.error('Pagamento recusado.', {
          description: payload.declineReason ?? 'Tente novamente com outra carteira.',
        })
      }
    }

    const handleSessionExpired = () => {
      clearToken()
      resetIdempotencyKey()
      disconnectRealtime()
      queryClient.clear()
      emitSessionEvent('expired')
      toast.error('Sessão expirada. Entre novamente.')
      const redirect = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.assign(`/login?redirect=${redirect}`)
    }

    socket.on('connect', handleConnect)
    socket.on('nft.updated', handleNftUpdated)
    socket.on('order.updated', handleOrderUpdated)
    socket.on('session.expired', handleSessionExpired)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('nft.updated', handleNftUpdated)
      socket.off('order.updated', handleOrderUpdated)
      socket.off('session.expired', handleSessionExpired)
    }
  }, [queryClient, userId])
}
