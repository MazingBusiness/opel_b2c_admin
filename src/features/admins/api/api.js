import { apiClient } from '../../../shared/api/client'

const BASE = '/api/v1/admin/admins'
const one = (id) => `${BASE}/${encodeURIComponent(String(id))}`

/**
 * @typedef {{
 *   id: number, name: string, email: string, phone: string | null,
 *   is_super: boolean, modules: string[], branches: string[],
 *   must_change_password: boolean, disabled: boolean,
 *   last_login_at: string | null, created_at: string | null,
 * }} SubAdmin
 * @typedef {{ modules: string[], branches: Array<{ code: string, name: string }> }} AccessOptions
 * @typedef {{ action: string, changes: Record<string, unknown> | null, actor: string, at: string | null }} AuditEntry
 * @typedef {{ name: string, email: string, phone: string, modules: string[], branches: string[] }} SubAdminInput
 */

/** @returns {Promise<{ data: SubAdmin[], meta: { current_page: number, last_page: number, total: number }, options: AccessOptions }>} */
export async function fetchAdmins(params) {
  const query = {}
  if (params.q) query.q = params.q
  if (params.status && params.status !== 'all') query.status = params.status
  if (params.page > 1) query.page = params.page
  const { data } = await apiClient.get(BASE, { params: query })
  return data
}

/** @returns {Promise<{ admin: SubAdmin, audit: AuditEntry[], options: AccessOptions }>} */
export async function fetchAdmin(id) {
  const { data } = await apiClient.get(one(id))
  return data
}

/**
 * The temporary password is in this response only. Keep it in memory, never persist it.
 * @param {SubAdminInput} payload
 * @returns {Promise<{ admin: SubAdmin, temporary_password: string }>}
 */
export async function createAdmin(payload) {
  const { data } = await apiClient.post(BASE, payload)
  return data
}

/** @param {SubAdminInput} payload */
export async function updateAdmin(id, payload) {
  const { data } = await apiClient.put(one(id), payload)
  return data
}

/** @returns {Promise<{ admin: SubAdmin, temporary_password: string }>} */
export async function resetAdminPassword(id) {
  const { data } = await apiClient.post(`${one(id)}/reset-password`)
  return data
}

export async function setAdminDisabled(id, disabled) {
  const { data } = await apiClient.post(`${one(id)}/${disabled ? 'deactivate' : 'activate'}`)
  return data
}
