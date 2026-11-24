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
  /** @param {string} number */
  allocation: (number) => `/api/v1/admin/orders/${encodeURIComponent(number)}/allocation`,
  /** @param {string} number */
  allocate: (number) => `/api/v1/admin/orders/${encodeURIComponent(number)}/allocate`,
  /** @param {string} number */
  cancelUnallocated: (number) => `/api/v1/admin/orders/${encodeURIComponent(number)}/cancel-unallocated`,
}
