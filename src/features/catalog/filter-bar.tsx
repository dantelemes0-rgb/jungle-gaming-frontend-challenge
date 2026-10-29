import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CatalogSearch, Category, Rarity, SortOption } from '@/shared/api/contracts'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'
import { useFacets } from './hooks'

const ALL = 'all'

const CATEGORIES: Array<{ value: Category; label: string }> = [
  { value: 'art', label: 'Arte digital' },
  { value: 'collectible', label: 'Colecionáveis' },
  { value: 'photography', label: 'Fotografia' },
  { value: 'music', label: 'Música' },
  { value: 'virtual-world', label: 'Arte 3D' },
]

const RARITIES: Array<{ value: Rarity; label: string }> = [
  { value: 'common', label: 'Comum' },
  { value: 'rare', label: 'Rara' },
  { value: 'epic', label: 'Épica' },
  { value: 'legendary', label: 'Lendária' },
]

const SORTS: Array<{ value: SortOption; label: string }> = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'recent', label: 'Mais recentes' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'name_asc', label: 'Nome (A–Z)' },
  { value: 'rarity', label: 'Raridade' },
]

interface FilterProps {
  search: CatalogSearch
  onChange: (patch: Partial<CatalogSearch>) => void
  onClear: () => void
}

export function CatalogFilters({ search, onChange, onClear }: FilterProps) {
  const { data: facets } = useFacets()
  const [query, setQuery] = useState(search.q ?? '')
  const [minPrice, setMinPrice] = useState(search.minPrice ?? '')
  const [maxPrice, setMaxPrice] = useState(search.maxPrice ?? '')
  const activeCount = [
    search.q,
    search.collection,
    search.category,
    search.rarity,
    search.status,
    search.minPrice,
    search.maxPrice,
  ].filter(Boolean).length

  useEffect(() => {
    setQuery(search.q ?? '')
  }, [search.q])

  useEffect(() => {
    setMinPrice(search.minPrice ?? '')
    setMaxPrice(search.maxPrice ?? '')
  }, [search.minPrice, search.maxPrice])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if ((search.q ?? '') === query) return
      onChange({ q: query || undefined, page: 1 })
    }, 350)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const categoryCount = (category: Category) =>
    facets?.categories.find((item) => item.id === category)?.count ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Label htmlFor="search" className="sr-only">
          Buscar
        </Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <Input
            id="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, coleção ou criador"
            className="pl-9"
            autoComplete="off"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium tracking-[0.14em] text-text-muted uppercase">
          Coleções
        </p>
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => onChange({ category: undefined, page: 1 })}
              aria-pressed={!search.category}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors',
                !search.category
                  ? 'bg-surface-2 text-text'
                  : 'text-text-muted hover:bg-surface-2 hover:text-text',
              )}
            >
              Todas
              <span className="text-xs text-text-muted">{facets?.total ?? 0}</span>
            </button>
          </li>
          {CATEGORIES.map((category) => {
            const active = search.category === category.value
            return (
              <li key={category.value}>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      category: active ? undefined : category.value,
                      page: 1,
                    })
                  }
                  aria-pressed={active}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors',
                    active
                      ? 'bg-surface-2 text-accent'
                      : 'text-text-muted hover:bg-surface-2 hover:text-text',
                  )}
                >
                  {category.label}
                  <span className="text-xs text-text-muted">{categoryCount(category.value)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium tracking-[0.14em] text-text-muted uppercase">
          Faixa de preço
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="min-price" className="sr-only">
            Preço mínimo em ETH
          </label>
          <Input
            id="min-price"
            inputMode="decimal"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder={facets ? facets.minPriceEth : 'mín.'}
          />
          <span aria-hidden="true" className="text-text-muted">
            —
          </span>
          <label htmlFor="max-price" className="sr-only">
            Preço máximo em ETH
          </label>
          <Input
            id="max-price"
            inputMode="decimal"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder={facets ? facets.maxPriceEth : 'máx.'}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3 w-full"
          onClick={() =>
            onChange({
              minPrice: minPrice || undefined,
              maxPrice: maxPrice || undefined,
              page: 1,
            })
          }
        >
          Aplicar
        </Button>
      </div>

      <details className="rounded-[var(--radius-control)] border border-border bg-surface-2/40 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium text-text">Mais filtros</summary>
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <Label htmlFor="filter-collection">Coleção</Label>
            <Select
              value={search.collection ?? ALL}
              onValueChange={(value) =>
                onChange({ collection: value === ALL ? undefined : value, page: 1 })
              }
            >
              <SelectTrigger id="filter-collection" className="mt-1.5">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas as coleções</SelectItem>
                {(facets?.collections ?? []).map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name} ({collection.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filter-rarity">Raridade</Label>
            <Select
              value={search.rarity ?? ALL}
              onValueChange={(value) =>
                onChange({ rarity: value === ALL ? undefined : (value as Rarity), page: 1 })
              }
            >
              <SelectTrigger id="filter-rarity" className="mt-1.5">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas as raridades</SelectItem>
                {RARITIES.map((rarity) => (
                  <SelectItem key={rarity.value} value={rarity.value}>
                    {rarity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filter-status">Disponibilidade</Label>
            <Select
              value={search.status ?? ALL}
              onValueChange={(value) =>
                onChange({
                  status: value === ALL ? undefined : (value as 'available' | 'sold_out'),
                  page: 1,
                })
              }
            >
              <SelectTrigger id="filter-status" className="mt-1.5">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                <SelectItem value="available">Disponíveis</SelectItem>
                <SelectItem value="sold_out">Esgotados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </details>

      {activeCount > 0 ? (
        <Button variant="ghost" size="sm" onClick={onClear} className="self-start">
          <X aria-hidden="true" />
          Limpar filtros ({activeCount})
        </Button>
      ) : null}
    </div>
  )
}

export function CatalogToolbar({
  search,
  onChange,
  onClear,
  total,
}: FilterProps & { total?: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {typeof total === 'number' ? (
          <p className="text-sm text-text-muted" aria-live="polite">
            {total} {total === 1 ? 'resultado' : 'resultados'}
          </p>
        ) : null}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="sm" className="lg:hidden">
              <SlidersHorizontal aria-hidden="true" />
              Filtros
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="lg:hidden">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto p-6">
              <CatalogFilters search={search} onChange={onChange} onClear={onClear} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="sort" className="text-text-muted">
          Ordenar por
        </Label>
        <Select
          value={search.sort ?? 'relevance'}
          onValueChange={(value) => onChange({ sort: value as SortOption, page: 1 })}
        >
          <SelectTrigger id="sort" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((sort) => (
              <SelectItem key={sort.value} value={sort.value}>
                {sort.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (candidate) =>
      candidate === 1 ||
      candidate === totalPages ||
      Math.abs(candidate - page) <= 1,
  )

  return (
    <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-1">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Anterior
      </Button>
      {pages.map((candidate, index) => {
        const previous = pages[index - 1]
        const gap = previous !== undefined && candidate - previous > 1
        return (
          <span key={candidate} className="flex items-center gap-1">
            {gap ? (
              <span className="px-2 text-text-muted" aria-hidden="true">
                …
              </span>
            ) : null}
            <Button
              variant={candidate === page ? 'primary' : 'ghost'}
              size="sm"
              aria-current={candidate === page ? 'page' : undefined}
              aria-label={`Página ${candidate}`}
              onClick={() => onChange(candidate)}
            >
              {candidate}
            </Button>
          </span>
        )
      })}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        Próxima
      </Button>
    </nav>
  )
}
