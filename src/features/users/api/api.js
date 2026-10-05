import { apiClient } from '../../../shared/api/client'
import { ADMIN_USERS_ENDPOINTS } from './endpoints'

/**
 * @typedef {{
 *   id: number,
 *   name: string | null,
 *   email: string | null,
 *   phone: string | null,
 *   avatar: string | null,
 *   status: 'active' | 'disabled',
 *   disabled_at: string | null,
 *   profile_complete: boolean,
 *   google_linked: boolean,
 *   email_verified_at: string | null,
 *   phone_verified_at: string | null,
 *   orders_count?: number,
 *   created_at: string | null,
 *   updated_at: string | null,
 * }} AdminShopper
 *
 * @typedef {AdminShopper & { orders_count: number, addresses: Array<Record<string, unknown>> }} AdminShopperDetail
 *
 * @typedef {{ current_page: number, last_page: number, per_page: number, total: number, from: number | null, to: number | null }} PageMeta
 */

/**
 * @param {{ q?: string, status?: 'active' | 'disabled' | 'all', page?: number, dir?: 'asc' | 'desc', per_page?: number }} params
 * @returns {Promise<{ ok: boolean, data: AdminShopper[], meta: PageMeta }>}
 */
export async function fetchUsers(params) {
  const query = {}
  if (params.q) query.q = params.q
  if (params.status && params.status !== 'all') query.status = params.status
  if (params.page && params.page > 1) query.page = params.page
  if (params.dir) {
    query.sort = 'created_at'
    query.dir = params.dir
  }
  if (params.per_page) query.per_page = params.per_page

  const { data } = await apiClient.get(ADMIN_USERS_ENDPOINTS.list, { params: query })
  return data
}

/**
 * @param {string | number} id
 * @returns {Promise<{ ok: boolean, user: AdminShopperDetail }>}
 */
export async function fetchUser(id) {
  const { data } = await apiClient.get(ADMIN_USERS_ENDPOINTS.detail(id))
  return data
}

/**
 * @param {string | number} id
 * @returns {Promise<{ ok: boolean, user: AdminShopperDetail }>}
 */
export async function deactivateUser(id) {
  const { data } = await apiClient.post(ADMIN_USERS_ENDPOINTS.deactivate(id))
  return data
}

/**
 * @param {string | number} id
 * @returns {Promise<{ ok: boolean, user: AdminShopperDetail }>}
 */
export async function activateUser(id) {
  const { data } = await apiClient.post(ADMIN_USERS_ENDPOINTS.activate(id))
  return data
}
