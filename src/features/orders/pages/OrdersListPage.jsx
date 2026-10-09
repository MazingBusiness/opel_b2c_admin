import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { HiOutlineSearch } from 'react-icons/hi'
import { fetchOrders } from '../api/api'
import { FulfilmentBadge, PaymentMethodBadge, PaymentStatusBadge } from '../components/OrderBadges'
import { formatDateTime, formatMoney, formatPhone } from '../utils'
import { getErrorMessage } from '../../../shared/api/client'
import { Alert } from '../../../shared/components/Alert'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All payments' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
]

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'All methods' },
  { value: 'zoho', label: 'Zoho Pay' },
  { value: 'cod', label: 'COD' },
]

/** @param {string | null} value */
function parsePage(value) {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

export function OrdersListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''
  const paymentStatus = searchParams.get('payment_status') ?? ''
  const paymentMethod = searchParams.get('payment_method') ?? ''
  const userId = searchParams.get('user_id') ?? ''
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
    queryKey: ['admin-orders', { q, status, paymentStatus, paymentMethod, userId, page }],
    queryFn: () =>
      fetchOrders({
        q,
        status: status || undefined,
        payment_status: paymentStatus || undefined,
        payment_method: paymentMethod || undefined,
        user_id: userId || undefined,
        page,
      }),
    placeholderData: keepPreviousData,
  })

  const rows = query.data?.data ?? []
  const meta = query.data?.meta
  const notFoundUser = query.isError && query.error?.response?.status === 404

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Orders</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Storefront orders. Advance fulfilment, mark COD collected, and add payment notes.
        </p>
        {userId ? (
          <p className="mt-2 text-sm text-ink-muted">
            Filtered to shopper #{userId}.{' '}
            <button
              type="button"
              onClick={() => updateParams({ user_id: null, page: null })}
              className="font-medium text-brand hover:underline"
            >
              Clear user filter
            </button>
            {' · '}
            <Link to={`/users/${userId}`} className="font-medium text-brand hover:underline">
              Open user
            </Link>
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm">
        <label className="relative block w-full sm:max-w-md">
          <span className="sr-only">Search orders</span>
          <HiOutlineSearch
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search number, phone, customer email or name"
            maxLength={100}
            className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <select
            aria-label="Filter by fulfilment status"
            value={status}
            onChange={(e) => updateParams({ status: e.target.value || null, page: null })}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by payment status"
            value={paymentStatus}
            onChange={(e) => updateParams({ payment_status: e.target.value || null, page: null })}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          >
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by payment method"
            value={paymentMethod}
            onChange={(e) => updateParams({ payment_method: e.target.value || null, page: null })}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {notFoundUser ? (
        <Alert tone="error">User not found. Clear the user filter or pick another shopper.</Alert>
      ) : query.isError ? (
        <Alert tone="error">{getErrorMessage(query.error)}</Alert>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Order</th>
                <th scope="col" className="px-4 py-3">Customer</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Payment</th>
                <th scope="col" className="px-4 py-3 text-right">Total</th>
                <th scope="col" className="px-4 py-3">Placed</th>
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
                    {q || status || paymentStatus || paymentMethod || userId
                      ? 'No orders match these filters.'
                      : 'No orders yet.'}
                  </td>
                </tr>
              ) : (
                rows.map((order) => (
                  <tr
                    key={order.number}
                    onClick={() => navigate(`/orders/${order.number}`)}
                    className="cursor-pointer transition-colors hover:bg-brand/5"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/orders/${order.number}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-ink hover:text-brand hover:underline"
                      >
                        {order.number}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {order.user ? (
                        <>
                          <Link
                            to={`/users/${order.user.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-ink hover:text-brand hover:underline"
                          >
                            {order.user.name || order.user.email || `User #${order.user.id}`}
                          </Link>
                          <p className="mt-0.5 text-xs text-ink-muted">{formatPhone(order.shipping_phone)}</p>
                        </>
                      ) : (
                        <span className="text-ink-muted">{formatPhone(order.shipping_phone)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <FulfilmentBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <PaymentMethodBadge method={order.payment_method} />
                        <PaymentStatusBadge status={order.payment_status} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink">{formatMoney(order.grand_total)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{formatDateTime(order.placed_at)}</td>
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
