import { formatDate, formatDateTime, formatPhone } from '../users/utils'

export { formatDate, formatDateTime, formatPhone }

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

/** @param {number | null | undefined} amount */
export function formatMoney(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—'
  return moneyFormatter.format(Number(amount))
}

/** @param {string | null | undefined} status */
export function fulfilmentLabel(status) {
  switch (status) {
    case 'pending_payment':
      return 'Pending payment'
    case 'processing':
      return 'Processing'
    case 'shipped':
      return 'Shipped'
    case 'delivered':
      return 'Delivered'
    case 'failed':
      return 'Failed'
    case 'cancelled':
      return 'Cancelled'
    case 'paid':
      return 'Paid'
    default:
      return status || '—'
  }
}

/** @param {string | null | undefined} status */
export function paymentStatusLabel(status) {
  switch (status) {
    case 'unpaid':
      return 'Unpaid'
    case 'pending':
      return 'Pending'
    case 'paid':
      return 'Paid'
    case 'failed':
      return 'Failed'
    default:
      return status || '—'
  }
}

/** @param {string | null | undefined} method */
export function paymentMethodLabel(method) {
  if (method === 'cod') return 'COD'
  if (method === 'zoho') return 'Zoho Pay'
  return method || '—'
}

/**
 * Next forward-only fulfilment status, or null if none.
 * @param {string | null | undefined} status
 * @returns {'shipped' | 'delivered' | null}
 */
export function nextFulfilmentStatus(status) {
  if (status === 'processing') return 'shipped'
  if (status === 'shipped') return 'delivered'
  return null
}
