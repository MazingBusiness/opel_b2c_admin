import { apiClient } from '../../../shared/api/client'
import { ADMIN_ORDERS_ENDPOINTS } from './endpoints'

/**
 * @typedef {{ id: number, name: string | null, email: string | null, phone?: string | null }} AdminOrderUser
 *
 * @typedef {{
 *   number: string,
 *   status: string,
 *   payment_method: 'zoho' | 'cod' | string,
 *   payment_status: string,
 *   currency: string,
 *   item_count: number,
 *   grand_total: number,
 *   shipping_name: string,
 *   shipping_phone: string,
 *   placed_at: string | null,
 *   paid_at: string | null,
 *   user: AdminOrderUser | null,
 * }} AdminOrder
 *
 * @typedef {AdminOrder & {
 *   db_id: number,
 *   subtotal: number,
 *   shipping_fee: number,
 *   payment_notes: string | null,
 *   zoho_payment_id: string | null,
 *   b2b_order_id: string | null,
 *   handoff_status: string | null,
 *   shipping_address: {
 *     name: string, phone: string, line1: string, line2: string | null,
 *     city: string, state: string, pincode: string,
 *   },
 *   timeline: Array<{ key: string, label: string, at: string, done: boolean, current: boolean }>,
 *   items: Array<{
 *     id: number, product_id: number, variant_id: number | null, title: string,
 *     image_url: string | null, unit_price: number, qty: number, line_total: number,
 *   }>,
 *   updated_at: string | null,
 * }} AdminOrderDetail
 *
 * @typedef {{ current_page: number, last_page: number, per_page: number, total: number, from: number | null, to: number | null }} PageMeta
 */

/**
 * @param {{
 *   q?: string,
 *   payment_status?: string,
 *   payment_method?: string,
 *   status?: string,
 *   user_id?: string | number,
 *   page?: number,
 *   per_page?: number,
 * }} params
 * @returns {Promise<{ ok: boolean, data: AdminOrder[], meta: PageMeta }>}
 */
export async function fetchOrders(params = {}) {
  const query = {}
  if (params.q) query.q = params.q
  if (params.payment_status) query.payment_status = params.payment_status
  if (params.payment_method) query.payment_method = params.payment_method
  if (params.status) query.status = params.status
  if (params.user_id) query.user_id = params.user_id
  if (params.page && params.page > 1) query.page = params.page
  if (params.per_page) query.per_page = params.per_page

  const { data } = await apiClient.get(ADMIN_ORDERS_ENDPOINTS.list, { params: query })
  return data
}

/**
 * @param {string} number
 * @returns {Promise<{ ok: boolean, order: AdminOrderDetail }>}
 */
export async function fetchOrder(number) {
  const { data } = await apiClient.get(ADMIN_ORDERS_ENDPOINTS.detail(number))
  return data
}

/**
 * @param {string} number
 * @param {'shipped' | 'delivered'} status
 * @returns {Promise<{ ok: boolean, order: AdminOrderDetail }>}
 */
export async function updateOrderFulfilment(number, status) {
  const { data } = await apiClient.patch(ADMIN_ORDERS_ENDPOINTS.fulfilment(number), { status })
  return data
}

/**
 * @param {string} number
 * @returns {Promise<{ ok: boolean, order: AdminOrderDetail }>}
 */
export async function markCodCollected(number) {
  const { data } = await apiClient.post(ADMIN_ORDERS_ENDPOINTS.codCollected(number))
  return data
}

/**
 * @param {string} number
 * @param {string | null} paymentNotes
 * @returns {Promise<{ ok: boolean, order: AdminOrderDetail }>}
 */
export async function updatePaymentNotes(number, paymentNotes) {
  const { data } = await apiClient.patch(ADMIN_ORDERS_ENDPOINTS.paymentNotes(number), {
    payment_notes: paymentNotes,
  })
  return data
}

/**
 * @typedef {{ live: number | null, b2c_pending: number, left: number | null }} BranchStock
 * @typedef {{
 *   order_item_id: number, title: string, part_no: string | null, unit_price: string,
 *   ordered: number, allocated: number, cancelled: number, unallocated: number,
 *   allocatable: boolean, stock_available: boolean,
 *   stock_status: 'ok' | 'not_found' | 'unavailable' | null,
 *   stock: Record<string, BranchStock> | null,
 * }} AllocationLine
 * @typedef {{
 *   number: string, branch: string, created_at: string | null,
 *   items: Array<{ title: string | null, part_no: string, qty: number, qty_challaned: number, qty_cancelled: number }>,
 * }} SubOrderSummary
 * @typedef {{
 *   order_number: string, approval_status: string | null, allocation_version: number,
 *   blocked_reason: string | null, branches: Array<{ code: string, name: string, short: string }>,
 *   lines: AllocationLine[], sub_orders: SubOrderSummary[],
 * }} Allocation
 */

/** @param {string} number @returns {Promise<{ ok: boolean, allocation: Allocation }>} */
export async function fetchAllocation(number) {
  const { data } = await apiClient.get(ADMIN_ORDERS_ENDPOINTS.allocation(number))
  return data
}

/**
 * @param {string} number
 * @param {number} expectedVersion
 * @param {Array<{ order_item_id: number, branches: Record<string, number> }>} lines
 * @returns {Promise<{ ok: boolean, allocation: Allocation }>}
 */
export async function allocateOrder(number, expectedVersion, lines) {
  const { data } = await apiClient.post(ADMIN_ORDERS_ENDPOINTS.allocate(number), {
    expected_version: expectedVersion,
    lines,
  })
  return data
}

/**
 * @param {string} number
 * @param {number} expectedVersion
 * @param {Array<{ order_item_id: number, qty: number }>} lines
 * @returns {Promise<{ ok: boolean, allocation: Allocation }>}
 */
export async function cancelUnallocated(number, expectedVersion, lines) {
  const { data } = await apiClient.post(ADMIN_ORDERS_ENDPOINTS.cancelUnallocated(number), {
    expected_version: expectedVersion,
    lines,
  })
  return data
}
