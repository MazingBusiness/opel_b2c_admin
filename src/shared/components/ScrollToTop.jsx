import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * On client route change, scroll the window and the admin main overflow
 * container (if present) back to top. Mount once inside the router.
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('admin-main')?.scrollTo(0, 0)
  }, [pathname, search])

  return null
}
