import { apiClient } from '../../../shared/api/client'
import { ADMIN_HOME_ENDPOINT } from './endpoints'

/**
 * @typedef {{ image_url: string, link_url: string | null }} HeroSlide
 * @typedef {{
 *   eyebrow: string | null, title: string, subtitle: string | null, badge: string | null,
 *   cta_label: string | null, href: string, image_url: string, tone: string | null,
 * }} Banner
 * @typedef {{ id: string, type: 'hero', hidden: boolean, slides: HeroSlide[] }} HeroSection
 * @typedef {{
 *   id: string, type: 'category_band', hidden: boolean, group_id: number, title: string | null,
 *   product_limit: number, pinned_part_nos: string[],
 * }} BandSection
 * @typedef {{ id: string, type: 'banner_row', hidden: boolean, banners: Banner[] }} BannerRowSection
 * @typedef {HeroSection | BandSection | BannerRowSection} HomeSection
 * @typedef {{ id: number, name: string, slug: string, visible: boolean }} HomeGroup
 * @typedef {{
 *   version: number, is_default: boolean, updated_at: string | null, sections: HomeSection[],
 *   groups: HomeGroup[], tones: string[],
 * }} HomeLayout
 */

/** @returns {Promise<HomeLayout>} */
export async function fetchHomeLayout() {
  const { data } = await apiClient.get(ADMIN_HOME_ENDPOINT)
  return data
}

/**
 * Whole-layout save, version-guarded (409 when someone saved first).
 * @param {{ expected_version: number, sections: HomeSection[] }} body
 * @returns {Promise<HomeLayout>}
 */
export async function saveHomeLayout(body) {
  const { data } = await apiClient.put(ADMIN_HOME_ENDPOINT, body)
  return data
}
