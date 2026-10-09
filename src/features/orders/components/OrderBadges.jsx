import { fulfilmentLabel, paymentMethodLabel, paymentStatusLabel } from '../utils'

/**
 * @param {{ status: string }} props
 */
export function FulfilmentBadge({ status }) {
  const tone =
    status === 'delivered'
      ? 'success'
      : status === 'shipped'
        ? 'brand'
        : status === 'processing'
          ? 'warn'
          : status === 'failed' || status === 'cancelled'
            ? 'danger'
            : 'muted'

  return <Pill tone={tone}>{fulfilmentLabel(status)}</Pill>
}

/**
 * @param {{ status: string }} props
 */
export function PaymentStatusBadge({ status }) {
  const tone =
    status === 'paid' ? 'success' : status === 'failed' ? 'danger' : status === 'pending' ? 'warn' : 'muted'

  return <Pill tone={tone}>{paymentStatusLabel(status)}</Pill>
}

/**
 * @param {{ method: string }} props
 */
export function PaymentMethodBadge({ method }) {
  return <Pill tone="muted">{paymentMethodLabel(method)}</Pill>
}

/**
 * @param {{ tone: 'success' | 'brand' | 'warn' | 'danger' | 'muted', children: import('react').ReactNode }} props
 */
function Pill({ tone, children }) {
  const classes = {
    success: 'border-success/30 bg-success/10 text-success',
    brand: 'border-brand/30 bg-brand/10 text-brand',
    warn: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-red-200 bg-red-50 text-red-700',
    muted: 'border-border bg-surface-muted text-ink-muted',
  }

  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        classes[tone] || classes.muted,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
