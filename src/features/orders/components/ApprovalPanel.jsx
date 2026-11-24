import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '../../../shared/api/client'
import { allocateOrder, cancelUnallocated, fetchAllocation } from '../api/api'

const APPROVAL_LABEL = {
  partial: 'Partially pending',
  approved: 'Approved',
  cancelled: 'Cancelled',
}

/** @param {string} value */
function toQty(value) {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * Stock hint under a branch input. Advisory only: never blocks approval.
 * @param {{ line: import('../api/api').AllocationLine, code: string, qty: number }} props
 */
function StockHint({ line, code, qty }) {
  if (!line.stock) return null
  if (line.stock_status === 'unavailable') {
    return <p className="mt-1 text-[11px] text-ink-muted">Stock unavailable</p>
  }
  const s = line.stock[code]
  const over = s.left !== null && qty > s.left
  return (
    <p className={['mt-1 text-[11px] leading-tight', over ? 'text-amber-700' : 'text-ink-muted'].join(' ')}>
      {line.stock_status === 'not_found' ? '0 / not found' : `Stock ${s.live}`}
      {s.b2c_pending > 0 ? ` · ${s.b2c_pending} pending` : ''}
      {` · left ${s.left}`}
      {over ? ' · over stock' : ''}
    </p>
  )
}

/** @param {{ number: string }} props */
export function ApprovalPanel({ number }) {
  const queryClient = useQueryClient()
  const queryKey = ['admin-order-allocation', number]
  const query = useQuery({ queryKey, queryFn: () => fetchAllocation(number) })
  /** @type {[Record<string, string>, Function]} */
  const [draft, setDraft] = useState({})
  /** @type {[Record<string, string>, Function]} */
  const [cancelDraft, setCancelDraft] = useState({})
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [flash, setFlash] = useState('')

  const a = query.data?.allocation

  function onSaved(data, message) {
    queryClient.setQueryData(queryKey, data)
    queryClient.invalidateQueries({ queryKey: ['admin-order', number] })
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    setDraft({})
    setCancelDraft({})
    setConfirmCancel(false)
    setFlash(message)
  }

  function onFailed(error) {
    setConfirmCancel(false)
    if (error?.response?.status === 409) queryClient.invalidateQueries({ queryKey })
  }

  const allocateMutation = useMutation({
    mutationFn: (/** @type {any[]} */ lines) => allocateOrder(number, a.allocation_version, lines),
    onSuccess: (data) => onSaved(data, 'Sub-orders created.'),
    onError: onFailed,
  })
  const cancelMutation = useMutation({
    mutationFn: (/** @type {any[]} */ lines) => cancelUnallocated(number, a.allocation_version, lines),
    onSuccess: (data) => onSaved(data, 'Unallocated quantity cancelled.'),
    onError: onFailed,
  })

  if (query.isLoading) {
    return <Shell><p className="text-sm text-ink-muted">Loading allocation…</p></Shell>
  }
  if (query.isError || !a) {
    return (
      <Shell>
        <p className="text-sm text-red-700">{getErrorMessage(query.error, 'Could not load allocation.')}</p>
      </Shell>
    )
  }

  const key = (/** @type {number} */ id, /** @type {string} */ code) => `${id}:${code}`
  const qtyOf = (id, code) => toQty(draft[key(id, code)] ?? '')
  const lineSum = (line) => a.branches.reduce((n, b) => n + qtyOf(line.order_item_id, b.code), 0)
  const cancelOf = (line) => toQty(cancelDraft[line.order_item_id] ?? '')

  const openLines = a.lines.filter((l) => l.unallocated > 0)
  const editable = !a.blocked_reason && openLines.length > 0
  const overLines = a.lines.filter((l) => lineSum(l) > l.unallocated || cancelOf(l) > l.unallocated)
  const totalAllocating = a.lines.reduce((n, l) => n + lineSum(l), 0)
  const totalCancelling = a.lines.reduce((n, l) => n + cancelOf(l), 0)
  const busy = allocateMutation.isPending || cancelMutation.isPending

  function fillFromStock() {
    const next = {}
    for (const line of openLines) {
      if (!line.allocatable || !line.stock) continue
      let need = line.unallocated
      const ranked = [...a.branches].sort(
        (x, y) => (line.stock[y.code].left ?? -1) - (line.stock[x.code].left ?? -1),
      )
      for (const b of ranked) {
        const left = Math.max(0, line.stock[b.code].left ?? 0)
        const take = Math.min(need, left)
        if (take > 0) next[key(line.order_item_id, b.code)] = String(take)
        need -= take
      }
    }
    setDraft(next)
    setFlash('')
  }

  function submitAllocate() {
    const lines = a.lines
      .filter((l) => lineSum(l) > 0)
      .map((l) => ({
        order_item_id: l.order_item_id,
        branches: Object.fromEntries(a.branches.map((b) => [b.code, qtyOf(l.order_item_id, b.code)])),
      }))
    allocateMutation.mutate(lines)
  }

  function submitCancel() {
    cancelMutation.mutate(
      a.lines.filter((l) => cancelOf(l) > 0).map((l) => ({ order_item_id: l.order_item_id, qty: cancelOf(l) })),
    )
  }

  const error = allocateMutation.error || cancelMutation.error

  return (
    <Shell status={a.approval_status} blocked={!!a.blocked_reason}>
      {a.blocked_reason ? (
        <p className="mb-3 rounded-md bg-surface-muted px-3 py-2 text-sm text-ink-muted">{a.blocked_reason}</p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-ink-muted">
            <tr className="border-b border-border">
              <th className="py-2 pr-3 font-medium">Item</th>
              <th className="py-2 pr-3 text-right font-medium">Ordered</th>
              <th className="py-2 pr-3 text-right font-medium">Allocated</th>
              <th className="py-2 pr-3 text-right font-medium">Cancelled</th>
              <th className="py-2 pr-3 text-right font-medium">To allocate</th>
              {editable ? a.branches.map((b) => (
                <th key={b.code} className="py-2 pr-3 font-medium">{b.name}</th>
              )) : null}
              {editable ? <th className="py-2 font-medium">Cancel</th> : null}
            </tr>
          </thead>
          <tbody>
            {a.lines.map((line) => {
              const sum = lineSum(line)
              const over = sum > line.unallocated
              const open = editable && line.unallocated > 0 && line.allocatable
              return (
                <tr key={line.order_item_id} className="border-b border-border align-top last:border-0">
                  <td className="py-2 pr-3">
                    <p className="font-medium text-ink">{line.title}</p>
                    {line.part_no ? (
                      <p className="text-xs text-ink-muted">{line.part_no}</p>
                    ) : (
                      <p className="text-xs text-amber-700">No part number (product deleted) — cannot allocate</p>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{line.ordered}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{line.allocated}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{line.cancelled}</td>
                  <td className={['py-2 pr-3 text-right tabular-nums', over ? 'text-red-700' : ''].join(' ')}>
                    {line.unallocated - Math.min(sum, line.unallocated)}
                    {over ? <p className="text-[11px]">over by {sum - line.unallocated}</p> : null}
                  </td>
                  {editable ? a.branches.map((b) => {
                    const k = key(line.order_item_id, b.code)
                    return (
                      <td key={b.code} className="py-2 pr-3">
                        {open ? (
                          <>
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={draft[k] ?? ''}
                              onChange={(e) => { setDraft((d) => ({ ...d, [k]: e.target.value })); setFlash('') }}
                              className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-sm tabular-nums"
                              aria-label={`${line.title} from ${b.name}`}
                            />
                            <StockHint line={line} code={b.code} qty={qtyOf(line.order_item_id, b.code)} />
                          </>
                        ) : <span className="text-ink-muted">—</span>}
                      </td>
                    )
                  }) : null}
                  {editable ? (
                    <td className="py-2">
                      {line.unallocated > 0 ? (
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={cancelDraft[line.order_item_id] ?? ''}
                          onChange={(e) => { setCancelDraft((d) => ({ ...d, [line.order_item_id]: e.target.value })); setFlash('') }}
                          className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-sm tabular-nums"
                          aria-label={`Cancel ${line.title}`}
                        />
                      ) : <span className="text-ink-muted">—</span>}
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editable ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={fillFromStock} disabled={busy}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-ink hover:bg-surface-muted disabled:opacity-50">
            Fill from stock
          </button>
          <button type="button" onClick={submitAllocate}
            disabled={busy || totalAllocating === 0 || overLines.length > 0}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-ink-inverse disabled:opacity-50">
            {allocateMutation.isPending ? 'Approving…' : `Approve & allocate ${totalAllocating || ''}`.trim()}
          </button>
          {totalCancelling > 0 ? (
            confirmCancel ? (
              <span className="flex items-center gap-2 text-sm">
                Cancel {totalCancelling} unit{totalCancelling === 1 ? '' : 's'}? Refund is handled manually.
                <button type="button" onClick={submitCancel} disabled={busy || overLines.length > 0}
                  className="rounded-md bg-red-600 px-3 py-1.5 font-medium text-white disabled:opacity-50">
                  {cancelMutation.isPending ? 'Cancelling…' : 'Yes, cancel'}
                </button>
                <button type="button" onClick={() => setConfirmCancel(false)} className="text-ink-muted underline">
                  Keep
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmCancel(true)} disabled={busy}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50">
                Cancel {totalCancelling} unallocated
              </button>
            )
          ) : null}
          <span className="text-xs text-ink-muted">
            Stock is a guide only. Anything not allocated stays pending.
          </span>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-700">{getErrorMessage(error)}</p> : null}
      {flash ? <p className="mt-3 text-sm text-success">{flash}</p> : null}

      {a.sub_orders.length > 0 ? (
        <div className="mt-6 border-t border-border pt-4">
          <h3 className="mb-2 text-sm font-semibold text-ink">Sub-orders</h3>
          <ul className="space-y-3">
            {a.sub_orders.map((s) => (
              <li key={s.number} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to={`/fulfilment/sub-orders/${s.id}`} className="font-mono text-sm text-brand hover:underline">
                    {s.number}
                  </Link>
                  <span className="text-xs text-ink-muted">
                    {a.branches.find((b) => b.code === s.branch)?.name ?? s.branch}
                    {s.created_at ? ` · ${new Date(s.created_at).toLocaleString('en-IN')}` : ''}
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {s.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between gap-3">
                      <span className="text-ink">{i.title ?? i.part_no} <span className="text-xs text-ink-muted">{i.part_no}</span></span>
                      <span className="tabular-nums text-ink-muted">
                        {i.qty}{i.qty_challaned ? ` · ${i.qty_challaned} on challan` : ''}
                        {i.qty_cancelled ? ` · ${i.qty_cancelled} cancelled` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Shell>
  )
}

/** @param {{ children: any, status?: string | null, blocked?: boolean }} props */
function Shell({ children, status = null, blocked = false }) {
  const label = status ? APPROVAL_LABEL[status] ?? status : blocked ? null : 'Awaiting approval'
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Approval &amp; allocation</h2>
          <p className="text-xs text-ink-muted">Split each line across branches. One sub-order is created per branch.</p>
        </div>
        {label ? (
          <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-ink">{label}</span>
        ) : null}
      </div>
      {children}
    </section>
  )
}
