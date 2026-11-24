import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getErrorMessage } from '../../../shared/api/client'
import { Alert } from '../../../shared/components/Alert'
import { fetchInvoice } from '../api'
import { Btn, Card, Field, PageHeader, formatDate } from '../components/ui'
import { InvoiceLines } from './ChallansPage'

export function InvoiceDetailPage() {
  const { id } = useParams()
  const query = useQuery({ queryKey: ['admin-invoice', id], queryFn: () => fetchInvoice(id) })

  if (query.isLoading) return <p className="text-sm text-ink-muted">Loading…</p>
  if (query.isError) return <Alert tone="error">{getErrorMessage(query.error)}</Alert>
  const inv = query.data

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: '/fulfilment/invoices', label: 'Invoices' }}
        title={inv.number}
        description={`Tax invoice · ${formatDate(inv.created_at)}`}
        actions={
          <Btn variant="outline" onClick={() => window.print()}>
            Print
          </Btn>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="From">
          <dl className="space-y-3">
            <Field label="Branch">{inv.branch_name}</Field>
            <Field label="State">{inv.branch_state}</Field>
            <Field label="Tax">{inv.intra_state ? 'CGST + SGST (same state)' : 'IGST (other state)'}</Field>
          </dl>
        </Card>
        <Card title="Bill to">
          <dl className="space-y-3">
            <Field label="Customer">
              {inv.billing_name}
              <div className="text-ink-muted">{inv.billing_phone}</div>
            </Field>
            <Field label="Address">
              {inv.billing_line1}
              {inv.billing_line2 ? `, ${inv.billing_line2}` : ''}
              <div>
                {inv.billing_city}, {inv.billing_state} {inv.billing_pincode}
              </div>
            </Field>
          </dl>
        </Card>
        <Card title="Challans">
          <ul className="space-y-2 text-sm">
            {inv.challans.map((c) => (
              <li key={c.id}>
                <Link to={`/fulfilment/challans/${c.id}`} className="text-brand hover:underline">
                  {c.number}
                </Link>
                <span className="text-ink-muted"> · order </span>
                <Link to={`/orders/${encodeURIComponent(c.order_number)}`} className="hover:text-brand">
                  {c.order_number}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card title="Lines">
        <InvoiceLines data={inv} />
        <p className="mt-4 text-xs text-ink-muted">Prices include GST. Tax is worked back from the price paid.</p>
      </Card>
    </div>
  )
}
