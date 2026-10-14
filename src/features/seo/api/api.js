import { apiClient } from '../../../shared/api/client'
import { ADMIN_SEO_ENDPOINTS } from './endpoints'

/**
 * @typedef {'page' | 'product' | 'category_group' | 'category'} SeoTargetType
 *
 * @typedef {{
 *   type: SeoTargetType, key: string, name: string, path: string, url: string,
 *   public: boolean, kind: string, thumbnail_img?: string | null,
 *   has_meta: boolean, seo_title: string | null, robots: 'index' | 'noindex',
 *   meta_updated_at: string | null,
 * }} SeoTargetRow
 *
 * @typedef {{ q: string, a: string }} FaqItem
 *
 * @typedef {{
 *   ok: boolean,
 *   target: {
 *     type: SeoTargetType, key: string, name: string, path: string, url: string, public: boolean,
 *     images: string[],
 *     defaults: { title: string | null, description: string | null, h1: string | null, og_image: string | null },
 *     breadcrumbs: Array<{ label: string, href: string }>,
 *   },
 *   meta: {
 *     seo_title: string | null, meta_description: string | null, h1: string | null, content: string | null,
 *     primary_keyword: string | null, secondary_keywords: string[], canonical_url: string | null,
 *     robots: 'index' | 'noindex', og_title: string | null, og_description: string | null, og_image: string | null,
 *     schema_jsonld: string | null, faq: FaqItem[], related_product_ids: number[],
 *     related_products: Array<{ id: number, name: string, thumbnail_img: string | null, published: boolean }>,
 *     image_alts: Record<string, string>, version: number, updated_at: string | null,
 *   },
 *   preview: { title: string, description: string, canonical_url: string, robots: string, h1: string | null },
 * }} SeoTargetDetail
 *
 * @typedef {{ current_page: number, last_page: number, per_page: number, total: number, from: number | null, to: number | null }} PageMeta
 */

/**
 * @param {{ type?: 'pages' | 'products' | 'categories', q?: string, page?: number, per_page?: number }} params
 * @returns {Promise<{ ok: boolean, data: SeoTargetRow[], meta: PageMeta }>}
 */
export async function fetchSeoTargets(params = {}) {
  const query = {}
  if (params.type) query.type = params.type
  if (params.q) query.q = params.q
  if (params.page && params.page > 1) query.page = params.page
  if (params.per_page) query.per_page = params.per_page

  const { data } = await apiClient.get(ADMIN_SEO_ENDPOINTS.targets, { params: query })
  return data
}

/**
 * @param {SeoTargetType} type
 * @param {string} key
 * @returns {Promise<SeoTargetDetail>}
 */
export async function fetchSeoTarget(type, key) {
  const { data } = await apiClient.get(ADMIN_SEO_ENDPOINTS.target(type, key))
  return data
}

/**
 * @param {SeoTargetType} type
 * @param {string} key
 * @param {Record<string, unknown>} body
 * @returns {Promise<SeoTargetDetail>}
 */
export async function saveSeoTarget(type, key, body) {
  const { data } = await apiClient.put(ADMIN_SEO_ENDPOINTS.target(type, key), body)
  return data
}
