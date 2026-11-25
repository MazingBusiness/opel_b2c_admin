import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { HiOutlineClipboardList, HiOutlineCube, HiOutlineDocumentDuplicate, HiOutlineReceiptTax, HiOutlineCollection, HiOutlineGlobeAlt, HiOutlineTemplate, HiOutlineHome, HiOutlineLogout, HiOutlineShieldCheck, HiOutlineUserCircle, HiOutlineUsers } from 'react-icons/hi'
import { canUseModule, useAuthStore } from '../../features/auth/store/useAuthStore'
import { logoutRequest } from '../../features/auth/api/api'
import opelLogo from '../../assets/images/opelLogo.jpg'

const navLinkClass = ({ isActive }) =>
  [
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand text-ink-inverse'
      : 'text-ink-muted hover:bg-brand/10 hover:text-brand',
  ].join(' ')

export function AdminLayout() {
  const clearSession = useAuthStore((s) => s.clearSession)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const can = (module) => canUseModule(user, module)

  async function handleLogout() {
    await logoutRequest()
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <header className="border-b border-border bg-surface">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={opelLogo}
              alt="OPEL Tools"
              className="h-9 w-auto object-contain sm:h-10"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">B2C Admin</p>
              <p className="truncate text-xs text-ink-muted">{user?.is_super ? 'Super admin' : 'Admin console'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.email ? (
              <NavLink
                to="/profile"
                title="Your profile"
                className={({ isActive }) =>
                  [
                    'hidden max-w-48 truncate text-xs transition-colors hover:text-brand hover:underline sm:block',
                    isActive ? 'text-brand' : 'text-ink-muted',
                  ].join(' ')
                }
              >
                {user.email}
              </NavLink>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-brand hover:text-brand"
            >
              <HiOutlineLogout className="h-4 w-4" aria-hidden />
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface">
          <nav className="flex flex-1 flex-col gap-1 p-3">
            <NavLink to="/" end className={navLinkClass}>
              <HiOutlineHome className="h-4 w-4" aria-hidden />
              Dashboard
            </NavLink>
            {can('users') ? (
              <NavLink to="/users" className={navLinkClass}>
                <HiOutlineUsers className="h-4 w-4" aria-hidden />
                Users
              </NavLink>
            ) : null}
            {can('orders') ? (
              <NavLink to="/orders" className={navLinkClass}>
                <HiOutlineClipboardList className="h-4 w-4" aria-hidden />
                Orders
              </NavLink>
            ) : null}
            {can('fulfilment') ? (
              <>
                <p className="mt-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Fulfilment</p>
                <NavLink to="/fulfilment/sub-orders" className={navLinkClass}>
                  <HiOutlineCube className="h-4 w-4" aria-hidden />
                  Sub-orders
                </NavLink>
                <NavLink to="/fulfilment/challans" className={navLinkClass}>
                  <HiOutlineDocumentDuplicate className="h-4 w-4" aria-hidden />
                  Challans
                </NavLink>
                <NavLink to="/fulfilment/invoices" className={navLinkClass}>
                  <HiOutlineReceiptTax className="h-4 w-4" aria-hidden />
                  Invoices
                </NavLink>
              </>
            ) : null}
            <div className="mt-3 border-t border-border" />
            {can('catalog') ? (
              <NavLink to="/catalog" className={navLinkClass}>
                <HiOutlineCollection className="h-4 w-4" aria-hidden />
                Catalog
              </NavLink>
            ) : null}
            {can('homepage') ? (
              <NavLink to="/homepage" className={navLinkClass}>
                <HiOutlineTemplate className="h-4 w-4" aria-hidden />
                Homepage
              </NavLink>
            ) : null}
            {can('seo') ? (
              <NavLink to="/seo" className={navLinkClass}>
                <HiOutlineGlobeAlt className="h-4 w-4" aria-hidden />
                SEO
              </NavLink>
            ) : null}
            {user?.is_super ? (
              <NavLink to="/admins" className={navLinkClass}>
                <HiOutlineShieldCheck className="h-4 w-4" aria-hidden />
                Admins
              </NavLink>
            ) : null}
            <NavLink to="/profile" className={navLinkClass}>
              <HiOutlineUserCircle className="h-4 w-4" aria-hidden />
              Profile
            </NavLink>
          </nav>
        </aside>

        <main id="admin-main" className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
