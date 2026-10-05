import { useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuthStore, toAdminUser } from '../store/useAuthStore'
import { fetchMe } from '../api/api'

/**
 * After persist rehydrate, validate a stored Sanctum token via GET /admin/auth/me.
 */
export function AuthSessionBootstrap() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const token = useAuthStore((s) => s.token)
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)
  const markBootstrapped = useAuthStore((s) => s.markBootstrapped)
  const validatedTokenRef = useRef(/** @type {string | null} */ (null))

  useEffect(() => {
    if (!hasHydrated) return undefined

    if (!token) {
      validatedTokenRef.current = null
      markBootstrapped()
      return undefined
    }

    if (validatedTokenRef.current === token) {
      markBootstrapped()
      return undefined
    }

    let cancelled = false

    ;(async () => {
      try {
        const data = await fetchMe()
        if (cancelled) return
        setSession({
          token,
          user: toAdminUser(data.user),
        })
        validatedTokenRef.current = token
      } catch (error) {
        if (cancelled) return
        const status = axios.isAxiosError(error) ? error.response?.status : undefined
        if (status === 401 || status === 403) {
          validatedTokenRef.current = null
          clearSession()
        } else {
          markBootstrapped()
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [hasHydrated, token, setSession, clearSession, markBootstrapped])

  return null
}
