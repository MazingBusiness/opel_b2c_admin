import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './layouts/AdminLayout'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { ChangeTemporaryPasswordPage } from '../features/auth/pages/ChangeTemporaryPasswordPage'
import { AuthSessionBootstrap } from '../features/auth/components/AuthSessionBootstrap'
import { canUseModule, useAuthStore } from '../features/auth/store/useAuthStore'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { UsersListPage } from '../features/users/pages/UsersListPage'
import { UserDetailPage } from '../features/users/pages/UserDetailPage'
import { OrdersListPage } from '../features/orders/pages/OrdersListPage'
import { OrderDetailPage } from '../features/orders/pages/OrderDetailPage'
import { ScrollToTop } from '../shared/components/ScrollToTop'
import { SeoListPage } from '../features/seo/pages/SeoListPage'
import { SeoEditPage } from '../features/seo/pages/SeoEditPage'
import { CatalogListPage } from '../features/catalog/pages/CatalogListPage'
import { CatalogDetailPage } from '../features/catalog/pages/CatalogDetailPage'
import { SubOrdersListPage } from '../features/fulfilment/pages/SubOrdersListPage'
import { SubOrderDetailPage } from '../features/fulfilment/pages/SubOrderDetailPage'
import { ChallansPage } from '../features/fulfilment/pages/ChallansPage'
import { ChallanDetailPage } from '../features/fulfilment/pages/ChallanDetailPage'
import { InvoicesPage } from '../features/fulfilment/pages/InvoicesPage'
import { InvoiceDetailPage } from '../features/fulfilment/pages/InvoiceDetailPage'
import { HomeLayoutPage } from '../features/home/pages/HomeLayoutPage'
import { AdminsListPage } from '../features/admins/pages/AdminsListPage'
import { AdminFormPage } from '../features/admins/pages/AdminFormPage'

function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const bootstrapped = useAuthStore((s) => s.bootstrapped)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)

  if (!hasHydrated || !bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted text-sm text-ink-muted">
        Loading…
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (user?.must_change_password) {
    return <ChangeTemporaryPasswordPage />
  }

  return <Outlet />
}

/** Hides sections the admin can't use. The API enforces the same rule. */
function RequireAccess({ module, superOnly = false }) {
  const user = useAuthStore((s) => s.user)
  const allowed = superOnly ? Boolean(user?.is_super) : canUseModule(user, module)
  return allowed ? <Outlet /> : <Navigate to="/" replace />
}

function PublicOnlyRoute() {
  const token = useAuthStore((s) => s.token)
  const bootstrapped = useAuthStore((s) => s.bootstrapped)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)

  if (!hasHydrated || !bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-muted text-sm text-ink-muted">
        Loading…
      </div>
    )
  }

  if (token) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthSessionBootstrap />
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route element={<RequireAccess module="users" />}>
              <Route path="/users" element={<UsersListPage />} />
              <Route path="/users/:id" element={<UserDetailPage />} />
            </Route>
            <Route element={<RequireAccess module="orders" />}>
              <Route path="/orders" element={<OrdersListPage />} />
              <Route path="/orders/:number" element={<OrderDetailPage />} />
            </Route>
            <Route element={<RequireAccess module="fulfilment" />}>
              <Route path="/fulfilment/sub-orders" element={<SubOrdersListPage />} />
              <Route path="/fulfilment/sub-orders/:id" element={<SubOrderDetailPage />} />
              <Route path="/fulfilment/challans" element={<ChallansPage />} />
              <Route path="/fulfilment/challans/:id" element={<ChallanDetailPage />} />
              <Route path="/fulfilment/invoices" element={<InvoicesPage />} />
              <Route path="/fulfilment/invoices/:id" element={<InvoiceDetailPage />} />
            </Route>
            <Route element={<RequireAccess module="catalog" />}>
              <Route path="/catalog" element={<CatalogListPage />} />
              <Route path="/catalog/:entity/:id" element={<CatalogDetailPage />} />
            </Route>
            <Route element={<RequireAccess module="homepage" />}>
              <Route path="/homepage" element={<HomeLayoutPage />} />
            </Route>
            <Route element={<RequireAccess module="seo" />}>
              <Route path="/seo" element={<SeoListPage />} />
              <Route path="/seo/:type/:key" element={<SeoEditPage />} />
            </Route>
            <Route element={<RequireAccess superOnly />}>
              <Route path="/admins" element={<AdminsListPage />} />
              <Route path="/admins/new" element={<AdminFormPage />} />
              <Route path="/admins/:id" element={<AdminFormPage />} />
            </Route>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
