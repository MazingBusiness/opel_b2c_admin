import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '../../../shared/api/client'
import { Alert } from '../../../shared/components/Alert'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { formatMoney } from '../../orders/utils'
import { fetchChallan, resolvePush, retryPush } from '../api'
import { Btn, Card, Field, PageHeader, StatusPill, branchLabel, formatDate, td, th } from '../components/ui'

export function ChallanDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const key = ['admin-challan', id]
  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchChallan(id),
    // Pushes run in the background; poll while any is still queued.
    refetchInterval: (q) => (q.state.data?.items.some((i) => ['pending', 'sending'].includes(i.push?.status)) ? 5000 : false),
  })
  const [check, setCheck] = useState(/** @type {any} */ (null))
  const [recordId, setRecordId] = useState('')
  const [note, setNote] = useState('')

  const onSuccess = (challan) => {
    queryClient.setQueryData(key, challan)
    queryClient.invalidateQueries({ queryKey: ['admin-challans'] })
    setCheck(null)
    setRecordId('')
    setNote('')
  }
  const retry = useMutation({ mutationFn: retryPush, onSuccess })
  const resolve = useMutation({ mutationFn: resolvePush, onSuccess })

  if (query.isLoading) return <p className="text-sm text-ink-muted">Loading…</p>
  if (query.isError) return <Alert tone="error">{getErrorMessage(query.error)}</Alert>
  const c = query.data
  const error = retry.error || resolve.error
  const busy = retry.isPending || resolve.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: '/fulfilment/challans', label: 'Challans' }}
        title={c.number}
        description={`${branchLabel(c.branch)} branch · order ${c.order_number}`}
        actions={<StatusPill status={c.b2b_status} pendingLabel="Queued for B2B" />}
      />
      {error ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      {c.b2b_status === 'needs_check' ? (
        <Alert tone="error">
          B2B didn't give a clear answer for a line. Check with the B2B team whether they received it before retrying, so
          stock isn't deducted twice.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Lines" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className={th}>Item</th>
                  <th className={th}>Qty</th>
                  <th className={th}>Price</th>
                  <th className={th}>B2B push</th>
                  <th className={th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {c.items.map((i) => (
                  <tr key={i.id}>
                    <td className={td}>
                      {i.title}
                      <div className="text-xs text-ink-muted">{i.part_no}</div>
                    </td>
                    <td className={td}>{i.qty}</td>
                    <td className={td}>{formatMoney(i.unit_price)}</td>
                    <td className={td}>
                      {i.push ? (
                        <>
                          <StatusPill status={i.push.status} pendingLabel="Queued" />
                          <div className="mt-1 text-xs text-ink-muted">
                            {i.push.b2c_order_record_id ? `B2B record ${i.push.b2c_order_record_id} · ` : ''}
                            {i.push.attempts} attempt{i.push.attempts === 1 ? '' : 's'}
                            {i.push.sent_at ? ` · ${formatDate(i.push.sent_at)}` : ''}
                          </div>
                          {i.push.last_error ? (
                            <div className={`mt-1 max-w-xs break-words text-xs ${i.push.status === 'sent' ? 'text-ink-muted' : 'text-red-700'}`}>
                              {i.push.last_error}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      {i.push?.status === 'failed' ? (
                        <Btn variant="outline" disabled={busy} onClick={() => retry.mutate({ pushId: i.push.id, confirmed: false })}>
                          Retry
                        </Btn>
                      ) : null}
                      {i.push?.status === 'needs_check' ? (
                        <Btn variant="outline" disabled={busy} onClick={() => setCheck(i)}>
                          Resolve…
                        </Btn>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Details">
          <dl className="space-y-3">
            <Field label="Sub-order">
              <Link to={`/fulfilment/sub-orders/${c.sub_order_id}`} className="text-brand hover:underline">
                {c.sub_order_number}
              </Link>
            </Field>
            <Field label="Ship to">
              {c.shipping.name} · {c.shipping.phone}
              <div className="text-ink-muted">
                {c.shipping.line1}
                {c.shipping.line2 ? `, ${c.shipping.line2}` : ''}, {c.shipping.city}, {c.shipping.state}{' '}
                {c.shipping.pincode}
              </div>
            </Field>
            <Field label="Amount">{formatMoney(c.amount)}</Field>
            <Field label="Invoice">
              {c.invoice_id ? (
                <Link to={`/fulfilment/invoices/${c.invoice_id}`} className="text-brand hover:underline">
                  {c.invoice_number}
                </Link>
              ) : (
                <Link to="/fulfilment/challans" className="text-brand hover:underline">
                  Not invoiced yet
                </Link>
              )}
            </Field>
            <Field label="Created">{formatDate(c.created_at)}</Field>
          </dl>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(check)}
        title={`Did B2B receive ${check?.part_no ?? 'this line'}?`}
        confirmLabel="B2B didn't get it, retry"
        tone="danger"
        busy={busy}
        onConfirm={() => retry.mutate({ pushId: check.push.id, confirmed: true })}
        onCancel={() => setCheck(null)}
      >
        <p>Ask the B2B team whether this line reached them.</p>
        <div className="mt-3 space-y-2 rounded-md border border-border p-3">
          <p className="text-xs font-medium text-ink">If they received it, give their record id or a note.</p>
          <input
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            placeholder="B2B record id"
            aria-label="B2B record id"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note, e.g. who confirmed it"
            aria-label="Note"
            maxLength={300}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
          />
          <Btn
            variant="outline"
            disabled={busy || (!recordId.trim() && !note.trim())}
            onClick={() => resolve.mutate({ pushId: check.push.id, recordId, note })}
          >
            They received it, mark sent
          </Btn>
        </div>
      </ConfirmDialog>
    </div>
  )
}
