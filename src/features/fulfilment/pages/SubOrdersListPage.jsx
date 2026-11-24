import { useState } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getErrorMessage } from '../../../shared/api/client'
import { fetchSubOrders } from '../api'
import { ListFilters, PageHeader, Pager, StatusPill, TableShell, branchLabel, formatDate, td, th, useListParams } from '../components/ui'

export function SubOrdersListPage() {
  const list = useListParams()
  const [showInvoiced, setShowInvoiced] = useState(false)
  const query = useQuery({
    queryKey: ['admin-sub-orders', list.params, showInvoiced],
    queryFn: () => fetchSubOrders({ ...list.params, include_invoiced: showInvoiced ? 1 : '' }),
    placeholderData: keepPreviousData,
  })
  const rows = query.data?.data ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sub-orders"
        description="One sub-order per branch, created when an order is approved. Make challans from here."
      />
      <ListFilters branch={list.branch} onBranch={list.setBranch} q={list.q} onQ={list.setQ}>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" checked={showInvoiced} onChange={(e) => setShowInvoiced(e.target.checked)} />
          Show fully invoiced
        </label>
      </ListFilters>
      <TableShell
        loading={query.isLoading}
        error={query.isError ? getErrorMessage(query.error) : null}
        empty={rows.length === 0 ? 'No sub-orders.' : null}
        head={
          <>
            <th className={th}>Sub-order</th>
            <th className={th}>Order</th>
            <th className={th}>Branch</th>
            <th className={th}>Customer</th>
            <th className={th}>Qty</th>
            <th className={th}>Status</th>
            <th className={th}>Created</th>
          </>
        }
      >
        {rows.map((s) => (
          <tr key={s.id} className="hover:bg-surface-muted">
            <td className={td}>
              <Link to={`/fulfilment/sub-orders/${s.id}`} className="font-medium text-brand hover:underline">
                {s.number}
              </Link>
            </td>
            <td className={td}>
              <Link to={`/orders/${encodeURIComponent(s.order_number)}`} className="hover:text-brand">
                {s.order_number}
              </Link>
            </td>
            <td className={td}>{branchLabel(s.branch)}</td>
            <td className={td}>
              {s.customer}
              <div className="text-xs text-ink-muted">{s.city}</div>
            </td>
            <td className={td}>
              {s.qty}
              <div className="text-xs text-ink-muted">
                {s.qty_pending} pending · {s.qty_challaned} challaned
                {s.qty_cancelled ? ` · ${s.qty_cancelled} cancelled` : ''}
              </div>
            </td>
            <td className={td}>
              <StatusPill status={s.status} />
            </td>
            <td className={`${td} whitespace-nowrap text-ink-muted`}>{formatDate(s.created_at)}</td>
          </tr>
        ))}
      </TableShell>
      <Pager meta={query.data?.meta} page={list.page} onPage={list.setPage} />
    </div>
  )
}
