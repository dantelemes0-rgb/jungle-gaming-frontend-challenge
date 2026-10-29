import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CatalogSearch, Category, Rarity, SortOption } from '@/shared/api/contracts'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'
import { useFacets } from './hooks'

const ALL = 'all'

const CATEGORIES: Array<{ value: Category; label: string }> = [
  { value: 'art', label: 'Arte' },
  { value: 'collectible', label: 'Colecionável' },
  { value: 'photography', label: 'Fotografia' },
  { value: 'music', label: 'Música' },
  { value: 'virtual-world', label: 'Mundo virtual' },
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
    const timer = window.setTimeout(() => {
      if ((search.q ?? '') === query) return
      onChange({ q: query || undefined, page: 1 })
    }, 350)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Label htmlFor="search">Buscar</Label>
        <div className="relative mt-1.5">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <Input
            id="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, coleção ou criador"
            className="pl-9"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
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
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="filter-category">Categoria</Label>
          <Select
            value={search.category ?? ALL}
            onValueChange={(value) =>
              onChange({
                category: value === ALL ? undefined : (value as Category),
                page: 1,
              })
            }
          >
            <SelectTrigger id="filter-category" className="mt-1.5">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as categorias</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
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
                status:
                  value === ALL ? undefined : (value as 'available' | 'sold_out'),
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

        <fieldset>
          <legend className="text-sm font-medium">Preço (ETH)</legend>
          <div className="mt-1.5 flex items-center gap-2">
            <label htmlFor="min-price" className="sr-only">
              Preço mínimo em ETH
            </label>
            <Input
              id="min-price"
              inputMode="decimal"
              placeholder={facets ? `mín. ${facets.minPriceEth}` : 'mín.'}
              defaultValue={search.minPrice ?? ''}
              onBlur={(event) =>
                onChange({ minPrice: event.target.value || undefined, page: 1 })
              }
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
              placeholder={facets ? `máx. ${facets.maxPriceEth}` : 'máx.'}
              defaultValue={search.maxPrice ?? ''}
              onBlur={(event) =>
                onChange({ maxPrice: event.target.value || undefined, page: 1 })
              }
            />
          </div>
        </fieldset>
      </div>

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
}: FilterProps & { total: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <p className="text-sm text-text-muted" aria-live="polite">
          {total} {total === 1 ? 'resultado' : 'resultados'}
        </p>
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
