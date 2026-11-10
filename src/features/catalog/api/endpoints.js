/** Admin Catalog API endpoint paths (relative to VITE_API_BASE_URL). */

export const ADMIN_CATALOG_ENDPOINTS = {
  /** @param {'groups' | 'categories' | 'products'} entity */
  list: (entity) => `/api/v1/admin/catalog/${encodeURIComponent(entity)}`,
  /**
   * @param {'groups' | 'categories' | 'products' | 'variants'} entity
   * @param {number | string} id
   */
  item: (entity, id) => `/api/v1/admin/catalog/${encodeURIComponent(entity)}/${encodeURIComponent(String(id))}`,
  /**
   * @param {'groups' | 'categories' | 'products' | 'variants'} entity
   * @param {number | string} id
   */
  reset: (entity, id) =>
    `/api/v1/admin/catalog/${encodeURIComponent(entity)}/${encodeURIComponent(String(id))}/reset`,
}
