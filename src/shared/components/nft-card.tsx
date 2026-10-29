import { Link, useNavigate } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useState } from 'react'
import type { Nft } from '@/shared/api/contracts'
import { cn } from '@/shared/lib/cn'
import { formatEthWithSymbol } from '@/shared/lib/money'
import { useCurrentUser } from '@/features/auth/hooks'
import { useFavorites, useToggleFavorite } from '@/features/favorites/hooks'

export function NftCard({ nft, priority = false }: { nft: Nft; priority?: boolean }) {
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { data: favorites } = useFavorites()
  const toggleFavorite = useToggleFavorite()
  const [imageLoaded, setImageLoaded] = useState(false)
  const isFavorite = favorites?.nftIds.includes(nft.id) ?? false
  const soldOut = nft.editionsAvailable === 0

  const handleFavorite = () => {
    if (!user) {
      void navigate({
        to: '/login',
        search: { redirect: `/nft/${nft.id}` },
      })
      return
    }
    toggleFavorite.mutate({ nftId: nft.id, favorite: !isFavorite })
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[var(--radius-image)] border border-border bg-surface transition-colors hover:border-border-strong">
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="block size-full"
          aria-label={`Ver detalhes de ${nft.name}`}
        >
          <img
            src={nft.imageUrl}
            alt={`Arte de ${nft.name}`}
            width={640}
            height={640}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={() => setImageLoaded(true)}
            className={cn(
              'size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]',
              imageLoaded ? 'opacity-100' : 'opacity-0',
            )}
          />
          {!imageLoaded ? <div className="shimmer absolute inset-0" aria-hidden="true" /> : null}
        </Link>

        <button
          type="button"
          onClick={handleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
          className={cn(
            'absolute top-3 right-3 grid size-9 place-items-center rounded-full border backdrop-blur transition-colors',
            isFavorite
              ? 'border-accent/50 bg-accent/20 text-accent'
              : 'border-white/15 bg-black/40 text-white/80 hover:text-white',
          )}
        >
          <Heart className={cn('size-4', isFavorite && 'fill-current')} aria-hidden="true" />
        </button>

        {soldOut ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
            Esgotado
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="block truncate text-base text-text hover:text-accent"
          >
            {nft.name}
          </Link>
          <p className="truncate text-xs text-text-muted">{nft.collection.name}</p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="text-[11px] tracking-wide text-text-muted uppercase">Preço</p>
            <p className="text-lg font-bold text-accent">
              {formatEthWithSymbol(nft.priceEth)}
            </p>
          </div>
          <p className="text-right text-[11px] text-text-muted">
            {nft.editionsAvailable} de {nft.editionsTotal}
            <br />
            disponíveis
          </p>
        </div>
      </div>
    </article>
  )
}
