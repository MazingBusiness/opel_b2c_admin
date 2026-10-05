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

/**
 * @param {{ name: string }} payload
 * @returns {Promise<{ ok: boolean, user: Record<string, unknown> }>}
 */
export async function updateProfileRequest(payload) {
  const { data } = await apiClient.patch(ADMIN_AUTH_ENDPOINTS.profile, payload)
  return data
}

/**
 * Change password for the signed-in admin. Current token stays valid.
 * @param {{ current_password: string, password: string, password_confirmation: string }} payload
 */
export async function updatePasswordRequest(payload) {
  const { data } = await apiClient.put(ADMIN_AUTH_ENDPOINTS.password, payload)
  return data
}

/**
 * Always resolves with a generic message for any well-formed email (no account enumeration).
 * @param {{ email: string }} payload
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export async function forgotPasswordRequest(payload) {
  const { data } = await apiClient.post(ADMIN_AUTH_ENDPOINTS.forgotPassword, payload)
  return data
}

/**
 * @param {{ email: string, token: string, password: string, password_confirmation: string }} payload
 */
export async function resetPasswordRequest(payload) {
  const { data } = await apiClient.post(ADMIN_AUTH_ENDPOINTS.resetPassword, payload)
  return data
}
