import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * @typedef {{
 *   id: string,
 *   name?: string,
 *   email?: string,
 *   is_staff?: boolean,
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
    is_staff: Boolean(apiUser.is_staff),
  }
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
