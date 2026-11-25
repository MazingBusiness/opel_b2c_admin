export const MODULE_LABELS = {
  orders: 'Orders & approval',
  fulfilment: 'Fulfilment (sub-orders, challans, invoices)',
  users: 'Users',
  catalog: 'Catalog',
  homepage: 'Homepage',
  seo: 'SEO',
}

export const AUDIT_LABELS = {
  created: 'Created',
  updated: 'Updated',
  password_reset: 'Password reset',
  deactivated: 'Deactivated',
  activated: 'Activated',
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}
