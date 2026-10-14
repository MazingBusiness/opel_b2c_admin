import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HiOutlinePlus, HiOutlineX } from 'react-icons/hi'
import { fetchSeoTargets } from '../api/api'
import { inputClass } from './SeoFields'

const MAX_RELATED = 12

/**
 * @typedef {{ id: number, name: string, thumbnail_img: string | null, published?: boolean }} PickedProduct
 * @param {{ value: PickedProduct[], onChange: (v: PickedProduct[]) => void, excludeId?: number | null, error?: string }} props
 */
export function RelatedProductsPicker({ value, onChange, excludeId = null, error }) {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(id)
  }, [search])

  const results = useQuery({
    queryKey: ['admin-seo-related-search', debounced],
    queryFn: () => fetchSeoTargets({ type: 'products', q: debounced, per_page: 8 }),
    enabled: debounced.length >= 2,
  })

  const selectedIds = new Set(value.map((p) => p.id))
  const options = (results.data?.data ?? [])
    .map((row) => ({ id: Number(row.key), name: row.name, thumbnail_img: row.thumbnail_img ?? null, published: row.public }))
    .filter((p) => !selectedIds.has(p.id) && p.id !== excludeId)

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="text-sm text-ink-muted">None selected.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {value.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2">
              {p.thumbnail_img ? (
                <img src={p.thumbnail_img} alt="" className="h-8 w-8 rounded border border-border object-cover" />
              ) : (
                <div className="h-8 w-8 rounded border border-border bg-surface-muted" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-ink">
                {p.name} <span className="text-xs text-ink-muted">#{p.id}</span>
                {p.published === false ? <span className="ml-2 text-xs text-amber-700">hidden</span> : null}
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x.id !== p.id))}
                aria-label={`Remove ${p.name}`}
                className="text-ink-muted hover:text-red-700"
              >
                <HiOutlineX className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {value.length < MAX_RELATED ? (
        <div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products to add (name, part no, id)"
            aria-label="Search related products"
            className={[inputClass, 'border-border'].join(' ')}
          />
          {debounced.length >= 2 ? (
            <ul className="mt-2 max-h-64 divide-y divide-border overflow-auto rounded-md border border-border">
              {results.isPending ? (
                <li className="px-3 py-2 text-sm text-ink-muted">Searching…</li>
              ) : options.length === 0 ? (
                <li className="px-3 py-2 text-sm text-ink-muted">No matches.</li>
              ) : (
                options.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange([...value, p])
                        setSearch('')
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-brand/5"
                    >
                      <HiOutlinePlus className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">
                        {p.name} <span className="text-xs text-ink-muted">#{p.id}</span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-ink-muted">Maximum {MAX_RELATED} related products.</p>
      )}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
