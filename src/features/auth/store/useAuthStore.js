import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Admin sections a sub-admin can be given. Mirrors backend AdminModules::ALL. */
export const ADMIN_MODULES = /** @type {const} */ (['orders', 'fulfilment', 'users', 'catalog', 'homepage', 'seo'])

/**
 * @typedef {typeof ADMIN_MODULES[number]} AdminModule
 * @typedef {{
 *   id: string,
 *   name: string,
 *   email: string,
 *   is_super: boolean,
 *   modules: string[],
 *   branches: string[],
 *   must_change_password: boolean,
 * }} AdminUser
 */

/**
 * @param {Record<string, unknown> | null | undefined} apiUser
 * @returns {AdminUser | null}
 */
export function toAdminUser(apiUser) {
  if (!apiUser) return null
  return {
    id: String(apiUser.id),
    name: apiUser.name ? String(apiUser.name) : '',
    email: apiUser.email ? String(apiUser.email) : '',
    is_super: Boolean(apiUser.is_super),
    modules: Array.isArray(apiUser.modules) ? apiUser.modules.map(String) : [],
    branches: Array.isArray(apiUser.branches) ? apiUser.branches.map(String) : [],
    must_change_password: Boolean(apiUser.must_change_password),
  }
}

/**
 * UI-only hint; the server enforces access on every route.
 * @param {AdminUser | null} user
 * @param {AdminModule} module
 */
export function canUseModule(user, module) {
  return Boolean(user && (user.is_super || user.modules.includes(module)))
}

export const useAuthStore = create(
  persist(
    (set) => ({
      /** @type {string | null} */
      token: null,
      /** @type {AdminUser | null} */
      user: null,
      hasHydrated: false,
      /** True after boot me finishes (success or no token). */
      bootstrapped: false,

      /**
       * @param {{ token: string, user: AdminUser | null }} session
       */
      setSession: ({ token, user }) =>
        set({
          token,
          user,
          hasHydrated: true,
          bootstrapped: true,
        }),

      clearSession: () =>
        set({
          token: null,
          user: null,
          bootstrapped: true,
        }),

      /**
       * Replace the signed-in user (e.g. after a profile update); token unchanged.
       * @param {AdminUser | null} user
       */
      setUser: (user) => set({ user }),

      /** The API refused a call until the temporary password is changed. */
      requirePasswordChange: () =>
        set((state) => (state.user ? { user: { ...state.user, must_change_password: true } } : {})),

      markBootstrapped: () => set({ bootstrapped: true }),
    }),
    {
      name: 'opel-admin-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
      onRehydrateStorage: () => {},
    },
  ),
)

function markAuthHydrated() {
  useAuthStore.setState({ hasHydrated: true })
}

if (useAuthStore.persist.hasHydrated()) {
  markAuthHydrated()
} else {
  useAuthStore.persist.onFinishHydration(markAuthHydrated)
}
