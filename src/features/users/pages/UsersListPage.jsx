import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { HiOutlineSearch, HiOutlineSortAscending, HiOutlineSortDescending } from 'react-icons/hi'
import { fetchUsers } from '../api/api'
import { StatusBadge } from '../components/StatusBadge'
import { formatDate, formatPhone } from '../utils'
import { getErrorMessage } from '../../../shared/api/client'
import { Alert } from '../../../shared/components/Alert'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
]

/** @param {string | null} value */
function parseStatus(value) {
  return value === 'active' || value === 'disabled' ? value : 'all'
}

/** @param {string | null} value */
function parsePage(value) {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

export function UsersListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const status = parseStatus(searchParams.get('status'))
  const page = parsePage(searchParams.get('page'))
  const dir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc'

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

  // Keep the input in sync if the URL changes (e.g. back/forward).
  useEffect(() => {
    setSearch((prev) => (prev.trim() === q ? prev : q))
  }, [q])

  // Debounce typing → URL.
  useEffect(() => {
    const trimmed = search.trim()
    if (trimmed === q) return undefined
    const id = setTimeout(() => updateParams({ q: trimmed || null, page: null }), 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const query = useQuery({
    queryKey: ['admin-users', { q, status, page, dir }],
    queryFn: () => fetchUsers({ q, status, page, dir }),
    placeholderData: keepPreviousData,
  })

  const rows = query.data?.data ?? []
  const meta = query.data?.meta

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Users</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Storefront shoppers. View details and activate or deactivate accounts.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Search users</span>
          <HiOutlineSearch
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or phone"
            maxLength={100}
            className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </label>

        <div className="flex items-center gap-2" role="group" aria-label="Filter by status">
          {STATUS_OPTIONS.map((option) => {
            const active = status === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  updateParams({ status: option.value === 'all' ? null : option.value, page: null })
                }
                className={[
                  'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-brand bg-brand text-ink-inverse'
                    : 'border-border bg-surface text-ink-muted hover:border-brand hover:text-brand',
                ].join(' ')}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {query.isError ? <Alert tone="error">{getErrorMessage(query.error)}</Alert> : null}

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Name</th>
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3">Phone</th>
                <th scope="col" className="px-4 py-3 text-right">Orders</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => updateParams({ dir: dir === 'desc' ? 'asc' : null, page: null })}
                    className="inline-flex items-center gap-1 uppercase hover:text-brand"
                    title={dir === 'desc' ? 'Newest first' : 'Oldest first'}
                  >
                    Joined
                    {dir === 'desc' ? (
                      <HiOutlineSortDescending className="h-4 w-4" aria-hidden />
                    ) : (
                      <HiOutlineSortAscending className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.isPending ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                    {q || status !== 'all' ? 'No users match these filters.' : 'No shoppers yet.'}
                  </td>
                </tr>
              ) : (
                rows.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => navigate(`/users/${user.id}`)}
                    className="cursor-pointer transition-colors hover:bg-brand/5"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/users/${user.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-ink hover:text-brand hover:underline"
                      >
                        {user.name || <span className="italic text-ink-muted">No name</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{user.email || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{formatPhone(user.phone)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink">{user.orders_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{formatDate(user.created_at)}</td>
                  </tr>
                ))
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
                onClick={() => updateParams({ page: meta.current_page - 1 > 1 ? String(meta.current_page - 1) : null })}
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
