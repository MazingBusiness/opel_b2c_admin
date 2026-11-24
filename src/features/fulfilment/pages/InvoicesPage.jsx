import { Link } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getErrorMessage } from '../../../shared/api/client'
import { formatMoney } from '../../orders/utils'
import { fetchInvoices } from '../api'
import { ListFilters, PageHeader, Pager, TableShell, branchLabel, formatDate, td, th, useListParams } from '../components/ui'

export function InvoicesPage() {
  const list = useListParams()
  const query = useQuery({
    queryKey: ['admin-invoices', list.params],
    queryFn: () => fetchInvoices(list.params),
    placeholderData: keepPreviousData,
  })
  const rows = query.data?.data ?? []

  return (
    <div className="space-y-4">
      <PageHeader
        title="Invoices"
        description={
          <>
            Made from challans on the <Link to="/fulfilment/challans" className="text-brand hover:underline">Challans</Link> page.
            Numbering runs per branch per financial year.
          </>
        }
      />
      <ListFilters branch={list.branch} onBranch={list.setBranch} q={list.q} onQ={list.setQ} />
      <TableShell
        loading={query.isLoading}
        error={query.isError ? getErrorMessage(query.error) : null}
        empty={rows.length === 0 ? 'No invoices yet.' : null}
        head={
          <>
            <th className={th}>Invoice</th>
            <th className={th}>Branch</th>
            <th className={th}>Customer</th>
            <th className={th}>Challans</th>
            <th className={th}>Total</th>
            <th className={th}>Created</th>
          </>
        }
      >
        {rows.map((i) => (
          <tr key={i.id} className="hover:bg-surface-muted">
            <td className={td}>
              <Link to={`/fulfilment/invoices/${i.id}`} className="font-medium text-brand hover:underline">
                {i.number}
              </Link>
            </td>
            <td className={td}>{branchLabel(i.branch)}</td>
            <td className={td}>
              {i.customer}
              <div className="text-xs text-ink-muted">{i.city}</div>
            </td>
            <td className={td}>{i.challans_count}</td>
            <td className={td}>{formatMoney(i.grand_total)}</td>
            <td className={`${td} whitespace-nowrap text-ink-muted`}>{formatDate(i.created_at)}</td>
          </tr>
        ))}
      </TableShell>
      <Pager meta={query.data?.meta} page={list.page} onPage={list.setPage} />
    </div>
  )
}
