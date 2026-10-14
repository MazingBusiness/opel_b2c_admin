/** Admin SEO API endpoint paths (relative to VITE_API_BASE_URL). */

export const ADMIN_SEO_ENDPOINTS = {
  targets: '/api/v1/admin/seo/targets',
  /**
   * @param {string} type page | product | category_group | category
   * @param {string} key
   */
  target: (type, key) =>
    `/api/v1/admin/seo/${encodeURIComponent(type)}/${encodeURIComponent(key)}`,
}
