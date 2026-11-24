import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '../../../shared/api/client'
import { Alert } from '../../../shared/components/Alert'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { formatMoney } from '../../orders/utils'
import { cancelSubOrderQty, createChallan, fetchSubOrder } from '../api'
import { Btn, Card, Field, PageHeader, StatusPill, branchLabel, formatDate, td, th } from '../components/ui'

const qtyInput = 'w-20 rounded-md border border-border bg-surface px-2 py-1 text-sm text-ink'

export function SubOrderDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const key = ['admin-sub-order', id]
  const query = useQuery({ queryKey: key, queryFn: () => fetchSubOrder(id) })
  const [qty, setQty] = useState(/** @type {Record<number, string>} */ ({}))
  const [cancel, setCancel] = useState(/** @type {Record<number, string>} */ ({}))
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [flash, setFlash] = useState('')

  const onDone = (sub, message) => {
    queryClient.setQueryData(key, sub)
    queryClient.invalidateQueries({ queryKey: ['admin-sub-orders'] })
    queryClient.invalidateQueries({ queryKey: ['admin-challans'] })
    setQty({})
    setCancel({})
    setFlash(message)
  }
  const onError = (error) => {
    if (error?.response?.status === 409) queryClient.invalidateQueries({ queryKey: key })
  }
  const lines = (map) =>
    Object.entries(map)
      .map(([itemId, v]) => ({ sub_order_item_id: Number(itemId), qty: Number(v) || 0 }))
      .filter((l) => l.qty > 0)

  const challanMutation = useMutation({
    mutationFn: () => createChallan({ id, version: query.data.version, lines: lines(qty) }),
    onSuccess: (data) => onDone(data.sub_order, `Challan ${data.challan_number} created and queued for B2B.`),
    onError,
  })
  const cancelMutation = useMutation({
    mutationFn: () => cancelSubOrderQty({ id, version: query.data.version, lines: lines(cancel) }),
    onSuccess: (data) => {
      setConfirmCancel(false)
      onDone(data.sub_order, 'Cancelled. Refund the customer manually.')
    },
    onError: (e) => {
      setConfirmCancel(false)
      onError(e)
    },
  })

  if (query.isLoading) return <p className="text-sm text-ink-muted">Loading…</p>
  if (query.isError) return <Alert tone="error">{getErrorMessage(query.error)}</Alert>
  const s = query.data
  const challanLines = lines(qty)
  const cancelLines = lines(cancel)
  const over = (map) => s.items.some((i) => (Number(map[i.id]) || 0) > i.qty_pending)
  const anyPending = s.items.some((i) => i.qty_pending > 0)
  const shippable = s.order_status === 'processing'
  const error = challanMutation.error || cancelMutation.error
  const cancelValue = s.items.reduce((sum, i) => sum + (Number(cancel[i.id]) || 0) * Number(i.unit_price), 0)

  const fillAll = () => setQty(Object.fromEntries(s.items.map((i) => [i.id, String(i.qty_pending)])))

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: '/fulfilment/sub-orders', label: 'Sub-orders' }}
        title={s.number}
        description={`${branchLabel(s.branch)} branch · order ${s.order_number}`}
        actions={<StatusPill status={s.status} />}
      />
      {flash ? <Alert tone="success">{flash}</Alert> : null}
      {error ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
      {!shippable && anyPending ? (
        <Alert tone="info">The order is {s.order_status}, so new challans can't be made.</Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Lines" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className={th}>Item</th>
                  <th className={th}>Price</th>
                  <th className={th}>Qty</th>
                  <th className={th}>Challaned</th>
                  <th className={th}>Pending</th>
                  {anyPending ? <th className={th}>Challan now</th> : null}
                  {anyPending ? <th className={th}>Cancel</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {s.items.map((i) => (
                  <tr key={i.id}>
                    <td className={td}>
                      {i.title}
                      <div className="text-xs text-ink-muted">{i.part_no}</div>
                    </td>
                    <td className={td}>{formatMoney(i.unit_price)}</td>
                    <td className={td}>
                      {i.qty}
                      {i.qty_cancelled ? <div className="text-xs text-ink-muted">{i.qty_cancelled} cancelled</div> : null}
                    </td>
                    <td className={td}>{i.qty_challaned}</td>
                    <td className={td}>{i.qty_pending}</td>
                    {anyPending ? (
                      <td className={td}>
                        <input
                          type="number"
                          min={0}
                          max={i.qty_pending}
                          disabled={i.qty_pending === 0 || !shippable}
                          aria-label={`Challan qty for ${i.part_no}`}
                          value={qty[i.id] ?? ''}
                          onChange={(e) => setQty({ ...qty, [i.id]: e.target.value })}
                          className={qtyInput}
                        />
                      </td>
                    ) : null}
                    {anyPending ? (
                      <td className={td}>
                        <input
                          type="number"
                          min={0}
                          max={i.qty_pending}
                          disabled={i.qty_pending === 0}
                          aria-label={`Cancel qty for ${i.part_no}`}
                          value={cancel[i.id] ?? ''}
                          onChange={(e) => setCancel({ ...cancel, [i.id]: e.target.value })}
                          className={qtyInput}
                        />
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {anyPending ? (
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              {over(qty) || over(cancel) ? (
                <span className="text-xs text-red-700">A line is over its pending quantity.</span>
              ) : null}
              <Btn variant="outline" onClick={fillAll} disabled={!shippable}>
                Fill all pending
              </Btn>
              <Btn
                variant="danger"
                disabled={cancelLines.length === 0 || over(cancel) || cancelMutation.isPending}
                onClick={() => setConfirmCancel(true)}
              >
                Cancel selected
              </Btn>
              <Btn
                disabled={!shippable || challanLines.length === 0 || over(qty) || challanMutation.isPending}
                onClick={() => {
                  setFlash('')
                  challanMutation.mutate()
                }}
              >
                {challanMutation.isPending ? 'Creating…' : 'Create challan'}
              </Btn>
            </div>
          ) : null}
        </Card>

        <Card title="Ship to">
          <dl className="space-y-3">
            <Field label="Customer">
              {s.shipping.name}
              <div className="text-ink-muted">{s.shipping.phone}</div>
            </Field>
            <Field label="Address">
              {s.shipping.line1}
              {s.shipping.line2 ? <>, {s.shipping.line2}</> : null}
              <div>
                {s.shipping.city}, {s.shipping.state} {s.shipping.pincode}
              </div>
            </Field>
            <Field label="Order">
              <Link to={`/orders/${encodeURIComponent(s.order_number)}`} className="text-brand hover:underline">
                {s.order_number}
              </Link>
            </Field>
          </dl>
        </Card>
      </div>

      <Card title="Challans">
        {s.challans.length === 0 ? (
          <p className="text-sm text-ink-muted">No challans yet.</p>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr>
                <th className={th}>Challan</th>
                <th className={th}>Qty</th>
                <th className={th}>Invoice</th>
                <th className={th}>Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {s.challans.map((c) => (
                <tr key={c.id}>
                  <td className={td}>
                    <Link to={`/fulfilment/challans/${c.id}`} className="font-medium text-brand hover:underline">
                      {c.number}
                    </Link>
                  </td>
                  <td className={td}>{c.qty}</td>
                  <td className={td}>{c.invoice_number ?? <span className="text-ink-muted">Not invoiced</span>}</td>
                  <td className={`${td} text-ink-muted`}>{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel these units?"
        confirmLabel="Cancel units"
        tone="danger"
        busy={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setConfirmCancel(false)}
      >
        {cancelLines.reduce((n, l) => n + l.qty, 0)} unit(s) worth {formatMoney(cancelValue)} will be cancelled. This
        can't be undone, and the refund is manual.
      </ConfirmDialog>
    </div>
  )
}
