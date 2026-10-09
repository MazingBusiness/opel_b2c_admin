/** Admin Orders API endpoint paths (relative to VITE_API_BASE_URL). */

export const ADMIN_ORDERS_ENDPOINTS = {
  list: '/api/v1/admin/orders',
  /** @param {string} number */
  detail: (number) => `/api/v1/admin/orders/${encodeURIComponent(number)}`,
  /** @param {string} number */
  fulfilment: (number) => `/api/v1/admin/orders/${encodeURIComponent(number)}/fulfilment`,
  /** @param {string} number */
  codCollected: (number) => `/api/v1/admin/orders/${encodeURIComponent(number)}/cod-collected`,
  /** @param {string} number */
  paymentNotes: (number) => `/api/v1/admin/orders/${encodeURIComponent(number)}/payment-notes`,
}
