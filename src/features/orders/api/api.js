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
