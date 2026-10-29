import { createRoute, Link, useNavigate } from '@tanstack/react-router'
import { Heart, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import type { Nft } from '@/shared/api/contracts'
import { ApiError } from '@/shared/api/errors'
import { cn } from '@/shared/lib/cn'
import { formatDateTime } from '@/shared/lib/format'
import { formatEthWithSymbol } from '@/shared/lib/money'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Separator } from '@/shared/ui/separator'
import { Skeleton } from '@/shared/ui/skeleton'
import { QuantityStepper } from '@/shared/components/quantity-stepper'
import { EmptyState, ErrorState } from '@/shared/components/states'
import { useNft } from '@/features/catalog/hooks'
import { useAddToCart } from '@/features/cart/hooks'
import { useCurrentUser } from '@/features/auth/hooks'
import { useFavorites, useToggleFavorite } from '@/features/favorites/hooks'
import { rootRoute } from './root'

export const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$nftId',
  component: NftDetailPage,
})

const rarityLabel: Record<Nft['rarity'], string> = {
  common: 'Comum',
  rare: 'Rara',
  epic: 'Épica',
  legendary: 'Lendária',
}

const categoryLabel: Record<Nft['category'], string> = {
  art: 'Arte',
  collectible: 'Colecionável',
  photography: 'Fotografia',
  music: 'Música',
  'virtual-world': 'Mundo virtual',
}

function NftDetailPage() {
  const { nftId } = nftDetailRoute.useParams()
  const { data: nft, isLoading, isError, error, refetch } = useNft(nftId)
  const [qty, setQty] = useState(1)
  const [zoom, setZoom] = useState(0)
  const addToCart = useAddToCart()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { data: favorites } = useFavorites()
  const toggleFavorite = useToggleFavorite()

  if (isLoading) {
    return (
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="aspect-square w-full rounded-[var(--radius-card)]" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.code === 'NFT_NOT_FOUND'
    return (
      <div className="container-page py-20">
        {notFound ? (
          <EmptyState
            title="NFT não encontrado"
            description="Este identificador não existe ou a edição foi removida do catálogo."
            action={
              <Button asChild>
                <Link to="/">Explorar catálogo</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState onRetry={() => void refetch()} />
        )}
      </div>
    )
  }

  if (!nft) return null

  const soldOut = nft.editionsAvailable === 0
  const maxQty = Math.min(10, nft.editionsAvailable)
  const isFavorite = favorites?.nftIds.includes(nft.id) ?? false

  const handleFavorite = () => {
    if (!user) {
      void navigate({ to: '/login', search: { redirect: `/nft/${nft.id}` } })
      return
    }
    toggleFavorite.mutate({ nftId: nft.id, favorite: !isFavorite })
  }

  return (
    <div className="container-page py-10">
      <nav aria-label="Você está aqui" className="mb-6 text-sm text-text-muted">
        <Link to="/" className="hover:text-text">
          Explorar
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-text">{nft.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
            <img
              src={nft.imageUrl}
              alt={`Arte de ${nft.name}`}
              width={1200}
              height={1200}
              fetchPriority="high"
              className={cn(
                'aspect-square w-full object-cover transition-transform duration-300',
                zoom === 1 && 'scale-125',
                zoom === 2 && 'scale-150',
              )}
            />
          </div>
          <div className="mt-3 flex gap-3">
            {['Visão geral', 'Detalhe 1', 'Detalhe 2'].map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setZoom(index)}
                aria-pressed={zoom === index}
                aria-label={`Galeria: ${label}`}
                className={cn(
                  'size-20 overflow-hidden rounded-xl border-2 bg-surface transition-colors',
                  zoom === index ? 'border-accent' : 'border-border hover:border-border-strong',
                )}
              >
                <img
                  src={nft.imageUrl}
                  alt=""
                  width={160}
                  height={160}
                  loading="lazy"
                  className={cn(
                    'size-full object-cover',
                    index === 1 && 'scale-150',
                    index === 2 && 'scale-200 object-bottom',
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">{nft.collection.name}</Badge>
            <Badge>{rarityLabel[nft.rarity]}</Badge>
            <Badge>{categoryLabel[nft.category]}</Badge>
            {soldOut ? <Badge variant="danger">Esgotado</Badge> : null}
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">{nft.name}</h1>
          <p className="mt-2 text-sm text-text-muted">
            Criado por <span className="text-text">{nft.creator.name}</span> · Coleção{' '}
            <span className="text-text">{nft.collection.name}</span>
          </p>

          <div className="mt-6 rounded-[var(--radius-card)] border border-border bg-surface p-6">
            <p className="text-xs tracking-wide text-text-muted uppercase">Preço atual</p>
            <p className="font-display text-3xl font-semibold">
              {formatEthWithSymbol(nft.priceEth)}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {nft.editionsAvailable} de {nft.editionsTotal} edições disponíveis
            </p>

            <Separator className="my-5" />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="mb-2 text-sm font-medium">Quantidade</p>
                <QuantityStepper
                  value={qty}
                  max={Math.max(1, maxQty)}
                  onChange={setQty}
                  disabled={soldOut}
                  label="Quantidade deste NFT"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleFavorite}
                  aria-pressed={isFavorite}
                  aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <Heart className={cn(isFavorite && 'fill-current text-accent')} aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  disabled={soldOut || addToCart.isPending}
                  onClick={() => addToCart.mutate({ nftId: nft.id, qty })}
                >
                  {soldOut ? 'Edição esgotada' : 'Adicionar ao carrinho'}
                </Button>
              </div>
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs text-text-muted">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Compra simulada. Nenhum ativo real é transferido.
            </p>
          </div>

          <section className="mt-6" aria-labelledby="descricao">
            <h2 id="descricao" className="font-display text-lg font-semibold">
              Sobre esta edição
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{nft.description}</p>
          </section>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-text-muted">Proprietário</dt>
              <dd>{nft.owner.name}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Atualizado em</dt>
              <dd>{formatDateTime(nft.updatedAt)}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Versão</dt>
              <dd>v{nft.version}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Identificador</dt>
              <dd className="truncate font-mono text-xs">{nft.id}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
