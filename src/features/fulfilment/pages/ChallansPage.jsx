import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '../../../shared/api/client'
import { Alert } from '../../../shared/components/Alert'
import { formatMoney } from '../../orders/utils'
import { createInvoice, fetchChallans, previewInvoice } from '../api'
import {
  Btn,
  Card,
  ListFilters,
  PageHeader,
  Pager,
  Pill,
  StatusPill,
  TableShell,
  branchLabel,
  formatDate,
  td,
  th,
  useListParams,
} from '../components/ui'

const select = 'rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink'

export function ChallansPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const list = useListParams()
  const [invoiced, setInvoiced] = useState('no')
  const [picked, setPicked] = useState(/** @type {Map<number, any>} */ (new Map()))
  const query = useQuery({
    queryKey: ['admin-challans', list.params, invoiced],
    queryFn: () => fetchChallans({ ...list.params, invoiced }),
    placeholderData: keepPreviousData,
  })
  const rows = query.data?.data ?? []
  const anchor = picked.size ? [...picked.values()][0] : null
  const ids = [...picked.keys()]

  const preview = useQuery({
    queryKey: ['admin-invoice-preview', ids],
    queryFn: () => previewInvoice(ids),
    enabled: ids.length > 0,
    retry: false,
  })
  const save = useMutation({
    mutationFn: () => createInvoice(ids),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['admin-challans'] })
      queryClient.invalidateQueries({ queryKey: ['admin-sub-orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] })
      navigate(`/fulfilment/invoices/${invoice.id}`)
    },
  })

  /** Only same-branch, same-address challans can share an invoice. */
  const canPick = (c) => !c.invoice_id && (!anchor || (anchor.branch === c.branch && anchor.address_key === c.address_key))
  const toggle = (c) => {
    const next = new Map(picked)
    if (next.has(c.id)) next.delete(c.id)
    else next.set(c.id, c)
    setPicked(next)
    save.reset()
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Challans"
        description="Pick challans for the same branch and delivery address, preview, then make one invoice."
      />
      <ListFilters branch={list.branch} onBranch={list.setBranch} q={list.q} onQ={list.setQ}>
        <select aria-label="Invoiced" value={invoiced} onChange={(e) => setInvoiced(e.target.value)} className={select}>
          <option value="no">Not invoiced</option>
          <option value="yes">Invoiced</option>
          <option value="">All</option>
        </select>
      </ListFilters>

      <TableShell
        loading={query.isLoading}
        error={query.isError ? getErrorMessage(query.error) : null}
        empty={rows.length === 0 ? 'No challans.' : null}
        head={
          <>
            <th className={th}>
              <span className="sr-only">Pick</span>
            </th>
            <th className={th}>Challan</th>
            <th className={th}>Order</th>
            <th className={th}>Branch</th>
            <th className={th}>Customer</th>
            <th className={th}>Qty</th>
            <th className={th}>Amount</th>
            <th className={th}>B2B</th>
            <th className={th}>Invoice</th>
            <th className={th}>Created</th>
          </>
        }
      >
        {rows.map((c) => (
          <tr key={c.id} className={picked.has(c.id) ? 'bg-brand/5' : 'hover:bg-surface-muted'}>
            <td className={td}>
              {c.invoice_id ? null : (
                <input
                  type="checkbox"
                  aria-label={`Pick ${c.number}`}
                  checked={picked.has(c.id)}
                  disabled={!picked.has(c.id) && !canPick(c)}
                  title={!picked.has(c.id) && !canPick(c) ? 'Different branch or address' : undefined}
                  onChange={() => toggle(c)}
                />
              )}
            </td>
            <td className={td}>
              <Link to={`/fulfilment/challans/${c.id}`} className="font-medium text-brand hover:underline">
                {c.number}
              </Link>
              <div className="text-xs text-ink-muted">{c.sub_order_number}</div>
            </td>
            <td className={td}>{c.order_number}</td>
            <td className={td}>{branchLabel(c.branch)}</td>
            <td className={td}>
              {c.customer}
              <div className="text-xs text-ink-muted">{c.city}</div>
            </td>
            <td className={td}>{c.qty}</td>
            <td className={td}>{formatMoney(c.amount)}</td>
            <td className={td}>
              <StatusPill status={c.b2b_status} pendingLabel="Queued" />
            </td>
            <td className={td}>
              {c.invoice_id ? (
                <Link to={`/fulfilment/invoices/${c.invoice_id}`} className="text-brand hover:underline">
                  {c.invoice_number}
                </Link>
              ) : (
                <Pill>Not invoiced</Pill>
              )}
            </td>
            <td className={`${td} whitespace-nowrap text-ink-muted`}>{formatDate(c.created_at)}</td>
          </tr>
        ))}
      </TableShell>
      <Pager meta={query.data?.meta} page={list.page} onPage={list.setPage} />

      {ids.length > 0 ? (
        <Card
          title={`Invoice preview · ${ids.length} challan${ids.length > 1 ? 's' : ''}`}
          action={
            <div className="flex gap-2">
              <Btn variant="outline" onClick={() => setPicked(new Map())}>
                Clear
              </Btn>
              <Btn disabled={!preview.data || save.isPending} onClick={() => save.mutate()}>
                {save.isPending ? 'Saving…' : 'Create invoice'}
              </Btn>
            </div>
          }
        >
          {save.error ? <Alert tone="error">{getErrorMessage(save.error)}</Alert> : null}
          {preview.isLoading ? <p className="text-sm text-ink-muted">Working out GST…</p> : null}
          {preview.isError ? <Alert tone="error">{getErrorMessage(preview.error)}</Alert> : null}
          {preview.data ? <InvoiceLines data={preview.data} /> : null}
        </Card>
      ) : null}
    </div>
  )
}

/** Shared by the preview and the saved invoice. Prices already include GST. */
export function InvoiceLines({ data }) {
  const intra = Boolean(data.intra_state)
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr>
              <th className={th}>Item</th>
              <th className={th}>HSN</th>
              <th className={th}>Qty</th>
              <th className={th}>Price (incl. GST)</th>
              <th className={th}>GST %</th>
              <th className={th}>Taxable</th>
              {intra ? <th className={th}>CGST</th> : null}
              {intra ? <th className={th}>SGST</th> : <th className={th}>IGST</th>}
              <th className={th}>Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data.lines ?? data.items).map((l, idx) => (
              <tr key={l.challan_item_id ?? idx}>
                <td className={td}>
                  {l.title}
                  <div className="text-xs text-ink-muted">{l.part_no}</div>
                </td>
                <td className={td}>{l.hsn || '—'}</td>
                <td className={td}>{l.qty}</td>
                <td className={td}>{formatMoney(l.unit_price)}</td>
                <td className={td}>{Number(l.gst_rate)}%</td>
                <td className={td}>{formatMoney(l.taxable)}</td>
                {intra ? <td className={td}>{formatMoney(l.cgst)}</td> : null}
                {intra ? <td className={td}>{formatMoney(l.sgst)}</td> : <td className={td}>{formatMoney(l.igst)}</td>}
                <td className={td}>{formatMoney(l.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="ml-auto grid max-w-xs grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <dt className="text-ink-muted">Taxable value</dt>
        <dd className="text-right">{formatMoney(data.taxable_total)}</dd>
        {intra ? (
          <>
            <dt className="text-ink-muted">CGST</dt>
            <dd className="text-right">{formatMoney(data.cgst_total)}</dd>
            <dt className="text-ink-muted">SGST</dt>
            <dd className="text-right">{formatMoney(data.sgst_total)}</dd>
          </>
        ) : (
          <>
            <dt className="text-ink-muted">IGST</dt>
            <dd className="text-right">{formatMoney(data.igst_total)}</dd>
          </>
        )}
        {Number(data.round_off) ? (
          <>
            <dt className="text-ink-muted">Round off</dt>
            <dd className="text-right">{formatMoney(data.round_off)}</dd>
          </>
        ) : null}
        <dt className="font-semibold text-ink">Total</dt>
        <dd className="text-right font-semibold">{formatMoney(data.grand_total)}</dd>
      </dl>
    </div>
  )
}
