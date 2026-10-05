import axios from 'axios'
import { useAuthStore } from '../../features/auth/store/useAuthStore'

/** Public auth routes that must not send a stale Bearer token. */
const PUBLIC_AUTH_PATH_FRAGMENTS = ['/api/v1/admin/auth/login']

/**
 * @param {string | undefined} url
 */
export function isPublicAuthRequest(url) {
  if (!url) return false
  return PUBLIC_AUTH_PATH_FRAGMENTS.some((fragment) => url.includes(fragment))
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token && !isPublicAuthRequest(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  } else if (config.headers) {
    delete config.headers.Authorization
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url
    if (status === 401 && !isPublicAuthRequest(url)) {
      useAuthStore.getState().clearSession()
    }
    return Promise.reject(error)
  },
)

/**
 * Pull a human-readable message from a Laravel / axios error.
 * @param {unknown} error
 * @param {string} [fallback]
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error || typeof error !== 'object') return fallback
  const response = /** @type {{ response?: { data?: Record<string, unknown> } }} */ (error)
    .response
  const data = response?.data
  if (!data || typeof data !== 'object') return fallback

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message
  }

  const errors = data.errors
  if (errors && typeof errors === 'object') {
    const first = Object.values(/** @type {Record<string, unknown>} */ (errors))[0]
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
    if (typeof first === 'string') return first
  }

  return fallback
}
