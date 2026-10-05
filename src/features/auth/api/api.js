import { apiClient } from '../../../shared/api/client'
import { ADMIN_AUTH_ENDPOINTS } from './endpoints'

/**
 * @param {{ email: string, password: string }} payload
 */
export async function loginRequest(payload) {
  const { data } = await apiClient.post(ADMIN_AUTH_ENDPOINTS.login, payload)
  return data
}

export async function fetchMe() {
  const { data } = await apiClient.get(ADMIN_AUTH_ENDPOINTS.me)
  return data
}

/** Best-effort server logout; caller clears local session. */
export async function logoutRequest() {
  try {
    await apiClient.post(ADMIN_AUTH_ENDPOINTS.logout)
  } catch {
    // Network / already-invalid token — still clear locally.
  }
}
