/** Admin Users (shoppers) API endpoint paths (relative to VITE_API_BASE_URL). */

export const ADMIN_USERS_ENDPOINTS = {
  list: '/api/v1/admin/users',
  /** @param {string | number} id */
  detail: (id) => `/api/v1/admin/users/${encodeURIComponent(String(id))}`,
  /** @param {string | number} id */
  deactivate: (id) => `/api/v1/admin/users/${encodeURIComponent(String(id))}/deactivate`,
  /** @param {string | number} id */
  activate: (id) => `/api/v1/admin/users/${encodeURIComponent(String(id))}/activate`,
}
