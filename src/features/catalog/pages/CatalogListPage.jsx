import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { HiOutlineSearch } from 'react-icons/hi'
import { fetchCatalogList } from '../api/api'
import { Pill, VisibilityPill } from '../components/CatalogBadges'
import { getErrorMessage } from '../../../shared/api/client'
import { Alert } from '../../../shared/components/Alert'

const TABS = [
  { value: 'products', label: 'Products' },
  { value: 'categories', label: 'Categories' },
  { value: 'groups', label: 'Groups' },
]

/** @param {string | null} value @returns {'groups' | 'categories' | 'products'} */
function parseTab(value) {
  return value === 'groups' || value === 'categories' ? value : 'products'
}

/** @param {string | null} value */
function parsePage(value) {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

/** @param {unknown} v */
function money(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : String(v)
}

const selectClass =
  'rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand'

export function CatalogListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const entity = parseTab(searchParams.get('type'))
  const q = searchParams.get('q') ?? ''
  const filter = searchParams.get('filter') ?? ''
  const level = searchParams.get('level') ?? ''
  const page = parsePage(searchParams.get('page'))
  const [search, setSearch] = useState(q)

  /** @param {Record<string, string | null>} changes */
  function updateParams(changes) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === '') next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace: true },
    )
  }

  useEffect(() => {
    setSearch((prev) => (prev.trim() === q ? prev : q))
  }, [q])

  useEffect(() => {
    const trimmed = search.trim()
    if (trimmed === q) return undefined
    const id = setTimeout(() => updateParams({ q: trimmed || null, page: null }), 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const query = useQuery({
    queryKey: ['admin-catalog-list', { entity, q, filter, level, page }],
    queryFn: () => fetchCatalogList(entity, { q, filter, level: entity === 'categories' ? level : '', page }),
    placeholderData: keepPreviousData,
  })

  const rows = query.data?.data ?? []
  const meta = query.data?.meta
  const colCount = entity === 'products' ? 6 : 5

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Catalog</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Products and categories come from B2B. Overrides are stored separately and win on the storefront; reset a
          field to fall back to the B2B value. Part numbers, ids and slugs are locked.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2" role="tablist" aria-label="Catalog type">
          {TABS.map((tab) => {
            const active = entity === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSearch('')
                  updateParams({ type: tab.value === 'products' ? null : tab.value, q: null, page: null, level: null })
                }}
                className={[
                  'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-brand bg-brand text-ink-inverse'
                    : 'border-border bg-surface text-ink-muted hover:border-brand hover:text-brand',
                ].join(' ')}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {entity === 'categories' ? (
            <label>
              <span className="sr-only">Level</span>
              <select
                className={selectClass}
                value={level}
                onChange={(e) => updateParams({ level: e.target.value || null, page: null })}
              >
                <option value="">All levels</option>
                <option value="top">Top-level</option>
                <option value="sub">Subcategories</option>
              </select>
            </label>
          ) : null}
          <label>
            <span className="sr-only">Filter</span>
            <select
              className={selectClass}
              value={filter}
              onChange={(e) => updateParams({ filter: e.target.value || null, page: null })}
            >
              <option value="">All</option>
              <option value="overridden">Has overrides</option>
              <option value="hidden">Hidden by admin</option>
            </select>
          </label>
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Search</span>
            <HiOutlineSearch
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={entity === 'products' ? 'Search name, slug, part no or id' : 'Search name, slug or id'}
              maxLength={100}
              className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </label>
        </div>
      </div>

      {query.isError ? <Alert tone="error">{getErrorMessage(query.error)}</Alert> : null}

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Name</th>
                {entity === 'products' ? (
                  <>
                    <th scope="col" className="px-4 py-3">Part no</th>
                    <th scope="col" className="px-4 py-3">Price</th>
                    <th scope="col" className="px-4 py-3">Stock</th>
                  </>
                ) : entity === 'categories' ? (
                  <>
                    <th scope="col" className="px-4 py-3">Parent / group</th>
                    <th scope="col" className="px-4 py-3">Sort</th>
                  </>
                ) : (
                  <>
                    <th scope="col" className="px-4 py-3">Categories</th>
                    <th scope="col" className="px-4 py-3">Sort</th>
                  </>
                )}
                <th scope="col" className="px-4 py-3">Storefront</th>
                <th scope="col" className="px-4 py-3">Overrides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.isPending ? (
                <tr>
                  <td colSpan={colCount + 1} className="px-4 py-10 text-center text-ink-muted">Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={colCount + 1} className="px-4 py-10 text-center text-ink-muted">
                    {q || filter ? 'Nothing matches.' : 'No items.'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const href = `/catalog/${entity}/${row.id}`
                  const overrides = row.overridden_fields?.length ?? 0
                  return (
                    <tr
                      key={row.id}
                      onClick={() => navigate(href)}
                      className="cursor-pointer transition-colors hover:bg-brand/5"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={href}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-ink hover:text-brand hover:underline"
                        >
                          {row.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          #{row.id}
                          {row.b2b_name && row.b2b_name !== row.name ? ` · B2B: ${row.b2b_name}` : ''}
                        </p>
                      </td>
                      {entity === 'products' ? (
                        <>
                          <td className="px-4 py-3 font-mono text-xs text-ink-muted">{row.part_no ?? '—'}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {money(row.unit_price)}
                            {row.b2b_unit_price !== row.unit_price ? (
                              <p className="text-xs text-ink-muted line-through">{money(row.b2b_unit_price)}</p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            {row.current_stock ?? '—'}
                            {row.b2b_current_stock !== row.current_stock ? (
                              <span className="text-xs text-ink-muted"> / B2B {row.b2b_current_stock}</span>
                            ) : null}
                          </td>
                        </>
                      ) : entity === 'categories' ? (
                        <>
                          <td className="px-4 py-3 text-ink-muted">
                            {row.parent ? `↳ ${row.parent.name}` : 'Top-level'}
                            <p className="text-xs">{row.group?.name ?? ''}</p>
                          </td>
                          <td className="px-4 py-3 text-ink-muted">{row.sort_order ?? '—'}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-ink-muted">{row.categories_count}</td>
                          <td className="px-4 py-3 text-ink-muted">{row.sort_order ?? '—'}</td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <VisibilityPill row={row} />
                      </td>
                      <td className="px-4 py-3">
                        {overrides > 0 ? (
                          <Pill tone="info" title={row.overridden_fields.join(', ')}>
                            {overrides} field{overrides === 1 ? '' : 's'}
                          </Pill>
                        ) : row.variants_overridden ? null : (
                          <span className="text-xs text-ink-muted">—</span>
                        )}
                        {row.variants_overridden ? (
                          <span className="ml-1">
                            <Pill tone="info">Variant</Pill>
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.total > 0 ? (
          <div className="flex flex-col gap-2 border-t border-border px-4 py-3 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing <span className="font-medium text-ink">{meta.from}</span>–
              <span className="font-medium text-ink">{meta.to}</span> of{' '}
              <span className="font-medium text-ink">{meta.total}</span>
              {query.isFetching && !query.isPending ? ' · Updating…' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={meta.current_page <= 1}
                onClick={() =>
                  updateParams({ page: meta.current_page - 1 > 1 ? String(meta.current_page - 1) : null })
                }
                className="rounded-md border border-border bg-surface px-3 py-1.5 font-medium text-ink transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {meta.current_page} of {meta.last_page}
              </span>
              <button
                type="button"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => updateParams({ page: String(meta.current_page + 1) })}
                className="rounded-md border border-border bg-surface px-3 py-1.5 font-medium text-ink transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
