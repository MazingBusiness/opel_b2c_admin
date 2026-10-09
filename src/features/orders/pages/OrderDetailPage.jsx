import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import {
  fetchOrder,
  markCodCollected,
  updateOrderFulfilment,
  updatePaymentNotes,
} from '../api/api'
import { FulfilmentBadge, PaymentMethodBadge, PaymentStatusBadge } from '../components/OrderBadges'
import {
  formatDateTime,
  formatMoney,
  formatPhone,
  fulfilmentLabel,
  nextFulfilmentStatus,
} from '../utils'
import { getErrorMessage } from '../../../shared/api/client'
import { Alert } from '../../../shared/components/Alert'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'

function Section({ title, description, action, children }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  )
}

export function OrderDetailPage() {
  const { number = '' } = useParams()
  const queryClient = useQueryClient()
  const [flash, setFlash] = useState('')
  const [confirmFulfilment, setConfirmFulfilment] = useState(false)
  const [confirmCod, setConfirmCod] = useState(false)
  /** null = mirror server value; string = local edit */
  const [notesDraft, setNotesDraft] = useState(/** @type {string | null} */ (null))
  const [notesOrderNumber, setNotesOrderNumber] = useState(number)

  // Adjust draft when the route param changes (render-time sync, no effect).
  if (notesOrderNumber !== number) {
    setNotesOrderNumber(number)
    setNotesDraft(null)
  }

  const query = useQuery({
    queryKey: ['admin-order', number],
    queryFn: () => fetchOrder(number),
    enabled: Boolean(number),
    retry: (count, error) => error?.response?.status !== 404 && count < 1,
  })

  const order = query.data?.order
  const nextStatus = nextFulfilmentStatus(order?.status)
  const canMarkCod =
    order &&
    order.payment_method === 'cod' &&
    (order.payment_status === 'unpaid' || order.payment_status === 'paid')

  const serverNotes = order?.payment_notes ?? ''
  const notesValue = notesDraft === null ? serverNotes : notesDraft
  const notesDirty = notesDraft !== null && notesDraft !== serverNotes

  function cacheOrder(data) {
    queryClient.setQueryData(['admin-order', number], data)
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
  }

  const fulfilmentMutation = useMutation({
    mutationFn: () => updateOrderFulfilment(number, /** @type {'shipped' | 'delivered'} */ (nextStatus)),
    onSuccess: (data) => {
      cacheOrder(data)
      setConfirmFulfilment(false)
      setFlash(`Marked ${fulfilmentLabel(data.order.status).toLowerCase()}.`)
    },
    onError: () => setConfirmFulfilment(false),
  })

  const codMutation = useMutation({
    mutationFn: () => markCodCollected(number),
    onSuccess: (data) => {
      cacheOrder(data)
      setConfirmCod(false)
      setFlash(
        data.order.payment_status === 'paid'
          ? 'COD marked collected (paid).'
          : 'COD collection updated.',
      )
    },
    onError: () => setConfirmCod(false),
  })

  const notesMutation = useMutation({
    mutationFn: () => {
      const trimmed = notesValue.trim()
      return updatePaymentNotes(number, trimmed === '' ? null : trimmed)
    },
    onSuccess: (data) => {
      cacheOrder(data)
      setNotesDraft(null)
      setFlash('Payment notes saved.')
    },
  })

  const notFound = query.isError && query.error?.response?.status === 404
  const actionError =
    fulfilmentMutation.error || codMutation.error || notesMutation.error || null

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-brand"
      >
        <HiOutlineArrowLeft className="h-4 w-4" aria-hidden />
        Back to orders
      </Link>

      {query.isPending ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : notFound ? (
        <Alert tone="error">Order not found.</Alert>
      ) : query.isError ? (
        <Alert tone="error">{getErrorMessage(query.error)}</Alert>
      ) : order ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-ink">{order.number}</h1>
                <FulfilmentBadge status={order.status} />
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                Placed {formatDateTime(order.placed_at)} · {formatMoney(order.grand_total)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <PaymentMethodBadge method={order.payment_method} />
                <PaymentStatusBadge status={order.payment_status} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {nextStatus ? (
                <button
                  type="button"
                  onClick={() => {
                    setFlash('')
                    fulfilmentMutation.reset()
                    setConfirmFulfilment(true)
                  }}
                  className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-ink-inverse transition-colors hover:bg-brand-dark"
                >
                  Mark {fulfilmentLabel(nextStatus).toLowerCase()}
                </button>
              ) : null}
              {canMarkCod && order.payment_status === 'unpaid' ? (
                <button
                  type="button"
                  onClick={() => {
                    setFlash('')
                    codMutation.reset()
                    setConfirmCod(true)
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
                >
                  Mark COD collected
                </button>
              ) : null}
            </div>
          </div>

          {flash ? <Alert tone="success">{flash}</Alert> : null}
          {actionError ? <Alert tone="error">{getErrorMessage(actionError)}</Alert> : null}

          <Section title="Customer" description="Shopper linked to this order.">
            {order.user ? (
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Name">
                  <Link to={`/users/${order.user.id}`} className="font-medium text-brand hover:underline">
                    {order.user.name || 'No name'}
                  </Link>
                </Field>
                <Field label="Email">{order.user.email || '—'}</Field>
                <Field label="Phone">{formatPhone(order.user.phone)}</Field>
                <Field label="User ID">
                  <Link to={`/users/${order.user.id}`} className="text-brand hover:underline">
                    #{order.user.id}
                  </Link>
                </Field>
              </dl>
            ) : (
              <p className="text-sm text-ink-muted">No customer record.</p>
            )}
          </Section>

          <Section title="Shipping address">
            <p className="text-sm text-ink">
              <span className="font-medium">{order.shipping_address.name}</span>
              <br />
              {order.shipping_address.line1}
              {order.shipping_address.line2 ? (
                <>
                  <br />
                  {order.shipping_address.line2}
                </>
              ) : null}
              <br />
              {order.shipping_address.city}, {order.shipping_address.state}{' '}
              {order.shipping_address.pincode}
              <br />
              {formatPhone(order.shipping_address.phone)}
            </p>
          </Section>

          <Section title="Items" description={`${order.items.length} line ${order.items.length === 1 ? 'item' : 'items'}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th scope="col" className="py-2 pr-4">Item</th>
                    <th scope="col" className="py-2 pr-4 text-right">Qty</th>
                    <th scope="col" className="py-2 pr-4 text-right">Unit</th>
                    <th scope="col" className="py-2 text-right">Line</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt=""
                              className="h-10 w-10 rounded border border-border object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded border border-border bg-surface-muted text-xs text-ink-muted">
                              —
                            </div>
                          )}
                          <span className="font-medium text-ink">{item.title}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">{item.qty}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-ink-muted">
                        {formatMoney(item.unit_price)}
                      </td>
                      <td className="py-3 text-right tabular-nums">{formatMoney(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3">
              <Field label="Subtotal">{formatMoney(order.subtotal)}</Field>
              <Field label="Shipping">{formatMoney(order.shipping_fee)}</Field>
              <Field label="Grand total">
                <span className="font-semibold">{formatMoney(order.grand_total)}</span>
              </Field>
            </dl>
          </Section>

          <Section title="Timeline" description="Packed is a step under processing — not a separate order status.">
            <ol className="space-y-3">
              {(order.timeline ?? []).map((step) => (
                <li key={step.key} className="flex items-start gap-3">
                  <span
                    className={[
                      'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                      step.done ? 'bg-success' : step.current ? 'bg-brand' : 'bg-border',
                    ].join(' ')}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {step.label}
                      {step.current ? (
                        <span className="ml-2 text-xs font-normal text-brand">Current</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-ink-muted">{step.at || '—'}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Payment notes" description="Admin-only. Not shown to shoppers.">
            <textarea
              value={notesValue}
              onChange={(e) => {
                setNotesDraft(e.target.value)
                setFlash('')
              }}
              rows={4}
              maxLength={2000}
              placeholder="Optional notes about payment / COD follow-up"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-ink-muted">{notesValue.length}/2000</p>
              <button
                type="button"
                disabled={notesMutation.isPending || !notesDirty}
                onClick={() => {
                  setFlash('')
                  notesMutation.mutate()
                }}
                className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-ink-inverse transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {notesMutation.isPending ? 'Saving…' : 'Save notes'}
              </button>
            </div>
          </Section>

          <ConfirmDialog
            open={confirmFulfilment}
            title={`Mark order ${fulfilmentLabel(nextStatus || '').toLowerCase()}?`}
            confirmLabel={`Mark ${fulfilmentLabel(nextStatus || '').toLowerCase()}`}
            busy={fulfilmentMutation.isPending}
            onConfirm={() => fulfilmentMutation.mutate()}
            onCancel={() => setConfirmFulfilment(false)}
          >
            Forward-only: {fulfilmentLabel(order.status)} → {fulfilmentLabel(nextStatus || '')}. Skips and
            regressions are rejected by the API.
          </ConfirmDialog>

          <ConfirmDialog
            open={confirmCod}
            title="Mark COD collected?"
            confirmLabel="Mark collected"
            busy={codMutation.isPending}
            onConfirm={() => codMutation.mutate()}
            onCancel={() => setConfirmCod(false)}
          >
            Marks this COD order as paid. If it was still awaiting payment, fulfilment status moves to
            processing.
          </ConfirmDialog>
        </>
      ) : null}
    </div>
  )
}
