import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { HiOutlineSearch } from 'react-icons/hi'
import { fetchSeoTargets } from '../api/api'
import { formatDateTime } from '../../users/utils'
import { getErrorMessage } from '../../../shared/api/client'
import { Alert } from '../../../shared/components/Alert'

const TABS = [
  { value: 'pages', label: 'Pages' },
  { value: 'products', label: 'Products' },
  { value: 'categories', label: 'Categories' },
]

/** @param {string | null} value */
function parseTab(value) {
  return value === 'products' || value === 'categories' ? value : 'pages'
}

/** @param {string | null} value */
function parsePage(value) {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

function Pill({ tone, children }) {
  const tones = {
    success: 'border-success/30 bg-success/10 text-success',
    muted: 'border-border bg-surface-muted text-ink-muted',
    warn: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-red-200 bg-red-50 text-red-700',
  }
  return (
    <span className={['inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', tones[tone]].join(' ')}>
      {children}
    </span>
  )
}

export function SeoListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const type = parseTab(searchParams.get('type'))
  const q = searchParams.get('q') ?? ''
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
    queryKey: ['admin-seo-targets', { type, q, page }],
    queryFn: () => fetchSeoTargets({ type, q, page }),
    placeholderData: keepPreviousData,
  })

  const rows = query.data?.data ?? []
  const meta = query.data?.meta

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">SEO</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Titles, descriptions, content, FAQ and schema for storefront pages, products and categories.
          Empty fields fall back to sensible defaults.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2" role="tablist" aria-label="Target type">
          {TABS.map((tab) => {
            const active = type === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSearch('')
                  updateParams({ type: tab.value === 'pages' ? null : tab.value, q: null, page: null })
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

        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Search</span>
          <HiOutlineSearch
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              type === 'products' ? 'Search name, slug, part no or id' : 'Search name or path'
            }
            maxLength={100}
            className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </label>
      </div>

      {query.isError ? <Alert tone="error">{getErrorMessage(query.error)}</Alert> : null}

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Name</th>
                <th scope="col" className="px-4 py-3">Path</th>
                <th scope="col" className="px-4 py-3">SEO</th>
                <th scope="col" className="px-4 py-3">Robots</th>
                <th scope="col" className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.isPending ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                    {q ? 'Nothing matches this search.' : 'No targets.'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const href = `/seo/${row.type}/${encodeURIComponent(row.key)}`
                  return (
                    <tr
                      key={`${row.type}:${row.key}`}
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
                          {row.kind}
                          {row.public ? '' : ' · hidden on storefront'}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-muted">{row.path}</td>
                      <td className="px-4 py-3">
                        {row.has_meta ? <Pill tone="success">Customised</Pill> : <Pill tone="muted">Defaults</Pill>}
                        {row.seo_title ? (
                          <p className="mt-1 max-w-xs truncate text-xs text-ink-muted" title={row.seo_title}>
                            {row.seo_title}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {row.robots === 'noindex' ? <Pill tone="warn">noindex</Pill> : <Pill tone="muted">index</Pill>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                        {row.meta_updated_at ? formatDateTime(row.meta_updated_at) : '—'}
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
