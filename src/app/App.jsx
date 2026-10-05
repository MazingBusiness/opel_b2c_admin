import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './layouts/AdminLayout'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { AuthSessionBootstrap } from '../features/auth/components/AuthSessionBootstrap'
import { useAuthStore } from '../features/auth/store/useAuthStore'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'

function ProtectedRoute() {
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

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
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
      <AuthSessionBootstrap />
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
