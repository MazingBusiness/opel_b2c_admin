import { apiClient } from '../../../shared/api/client'
import { ADMIN_CATALOG_ENDPOINTS } from './endpoints'

/**
 * @typedef {'groups' | 'categories' | 'products'} CatalogListEntity
 * @typedef {CatalogListEntity | 'variants'} CatalogEntity
 * @typedef {'string' | 'text' | 'url' | 'urls' | 'int' | 'qty' | 'money' | 'stock' | 'bool' | 'sort'} FieldKind
 *
 * @typedef {{
 *   field: string, kind: FieldKind, b2b: unknown, override: unknown, effective: unknown, overridden: boolean,
 * }} CatalogFieldRow
 *
 * @typedef {{
 *   id: number, part_no: string, is_default: boolean, version: number, overridden_fields: string[],
 *   locked: Array<{ field: string, value: unknown }>, fields: CatalogFieldRow[],
 * }} CatalogVariant
 *
 * @typedef {{
 *   ok: boolean, entity: CatalogEntity, id: number, version: number, override_updated_at: string | null,
 *   overridden_fields: string[], item: Record<string, any>, locked: Array<{ field: string, value: unknown }>,
 *   fields: CatalogFieldRow[], seo: { type: string, key: string, admin_path: string } | null,
 *   variants?: CatalogVariant[],
 * }} CatalogDetail
 *
 * @typedef {{ current_page: number, last_page: number, per_page: number, total: number, from: number | null, to: number | null }} PageMeta
 */

/**
 * @param {CatalogListEntity} entity
 * @param {{ q?: string, filter?: string, level?: string, page?: number, per_page?: number }} params
 * @returns {Promise<{ ok: boolean, data: Array<Record<string, any>>, meta: PageMeta }>}
 */
export async function fetchCatalogList(entity, params = {}) {
  /** @type {Record<string, string | number>} */
  const query = {}
  if (params.q) query.q = params.q
  if (params.filter) query.filter = params.filter
  if (params.level) query.level = params.level
  if (params.page && params.page > 1) query.page = params.page
  if (params.per_page) query.per_page = params.per_page

  const { data } = await apiClient.get(ADMIN_CATALOG_ENDPOINTS.list(entity), { params: query })
  return data
}

/**
 * @param {CatalogEntity} entity
 * @param {number | string} id
 * @returns {Promise<CatalogDetail>}
 */
export async function fetchCatalogItem(entity, id) {
  const { data } = await apiClient.get(ADMIN_CATALOG_ENDPOINTS.item(entity, id))
  return data
}

/**
 * Version-guarded save. `fields`: present key = set override; null = reset that field to B2B.
 * @param {CatalogEntity} entity
 * @param {number | string} id
 * @param {{ expected_version: number, fields: Record<string, unknown> }} body
 * @returns {Promise<CatalogDetail>}
 */
export async function saveCatalogItem(entity, id, body) {
  const { data } = await apiClient.put(ADMIN_CATALOG_ENDPOINTS.item(entity, id), body)
  return data
}

/**
 * @param {CatalogEntity} entity
 * @param {number | string} id
 * @param {{ expected_version: number, fields?: string[] }} body
 * @returns {Promise<CatalogDetail>}
 */
export async function resetCatalogItem(entity, id, body) {
  const { data } = await apiClient.post(ADMIN_CATALOG_ENDPOINTS.reset(entity, id), body)
  return data
}
